/**
 * GET/POST /api/assignments — Asignaciones trainer → client
 *
 * GET filtra por rol:
 * - client  → solo sus asignaciones (clientId = user._id)
 * - trainer → solo las que él creó/gestiona
 * - admin   → todas del gym
 *
 * POST valida que client y trainer pertenezcan al gym del actor
 * y que un trainer no asigne a clientes de otro trainer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { assertSameGym, handleAuthError, verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import User from '@/lib/models/User';
import { assertCsrf } from '@/lib/csrf';
import { auditLog } from '@/lib/audit-log';
import { recordActivitySafe } from '@/lib/activity-log/record';
import { buildPagination, parsePagination } from '@/lib/pagination';
import { notifyAssignmentCreated } from '@/lib/notifications/triggers';
import { buildProgramFromTemplates, type WeeklyScheduleInput } from '@/lib/assignment/program-service';

type ApiErrorLike = { message?: string; name?: string; errors?: Record<string, { message: string }> }



// Definición de los filtros que se pueden aplicar al obtener las asignaciones
type AssignmentFilters = Record<string, unknown>

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const trainerId = searchParams.get('trainerId');
    const { page, limit, skip } = parsePagination(searchParams, 50);

    // Construir los filtros para la consulta de asignaciones según el rol del usuario y los parámetros proporcionados.
    const filters: AssignmentFilters = {};
    if (user.gymId) filters.gymId = user.gymId;
    if (user.role === 'client') filters.clientId = user._id;
    else if (user.role === 'trainer') filters.trainerId = user._id;
    else if (trainerId) filters.trainerId = trainerId;

    const [assignments, total] = await Promise.all([
      Assignment.find(filters)
        .populate('clientId', 'name email avatar role trainerId')
        .populate('trainerId', 'name email avatar role')
        .populate({ path: 'routineId', select: 'name description duration difficulty exercises tags createdBy isTemplate sourceRoutineId', populate: { path: 'exercises.exercise', select: 'name image images muscleGroups equipment instructions sets reps rest difficulty isTemplate sourceExerciseId' } })
        .populate('mealPlanId', 'name description calories duration meals')
        .populate({ path: 'weeklySchedule.routineId', select: 'name sourceRoutineId isTemplate' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Assignment.countDocuments(filters),
    ]);

    return NextResponse.json({
      assignments,
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    const authError = handleAuthError(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }
    const err = error as ApiErrorLike;
    return NextResponse.json({ error: err.message || 'Error al obtener asignaciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    assertCsrf(req);
    await connectDB();
    const user = await verifyAuth(req);

    if (user.role === 'client') {
      return NextResponse.json({ error: 'No tienes permisos para crear asignaciones' }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, trainerId, routineId, mealPlanId, startDate, endDate, notes, durationWeeks, weeklySchedule } = body;

    if (!clientId || !trainerId || (!routineId && !mealPlanId) || !startDate) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const client = await User.findById(clientId);
    const trainer = await User.findById(trainerId);
    if (!client || client.role !== 'client') return NextResponse.json({ error: 'Cliente inválido' }, { status: 400 });
    if (!trainer || trainer.role !== 'trainer') return NextResponse.json({ error: 'Entrenador inválido' }, { status: 400 });

    assertSameGym(user, client.gymId);
    assertSameGym(user, trainer.gymId);

    if (user.role === 'trainer' && client.trainerId?.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No puedes asignar contenido a este cliente' }, { status: 403 });
    }

    const existingActive = await Assignment.findOne({
      clientId,
      gymId: user.gymId || null,
      status: 'active',
    }).select('_id');

    if (existingActive) {
      return NextResponse.json(
        {
          error: 'Este cliente ya tiene un programa activo. Usa actualizar programa.',
          assignmentId: existingActive._id.toString(),
        },
        { status: 409 },
      );
    }

    if (!Array.isArray(weeklySchedule) || weeklySchedule.length === 0) {
      return NextResponse.json({ error: 'Debes enviar el calendario semanal' }, { status: 400 });
    }

    let built;
    try {
      built = await buildProgramFromTemplates(user, {
        defaultRoutineTemplateId: routineId || null,
        mealPlanTemplateId: mealPlanId || null,
        weeklySchedule: weeklySchedule as WeeklyScheduleInput[],
      });
    } catch (programError) {
      const message = programError instanceof Error ? programError.message : 'Programa inválido';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!built.routineId && !built.mealPlanId) {
      return NextResponse.json({ error: 'Debe asignar al menos una rutina o un plan alimenticio' }, { status: 400 });
    }

    const assignment = await Assignment.create({
      clientId,
      trainerId,
      gymId: user.gymId || null,
      routineId: built.routineId,
      mealPlanId: built.mealPlanId,
      startDate,
      endDate: endDate || undefined,
      notes,
      durationWeeks: durationWeeks || 4,
      weeklySchedule: built.weeklySchedule,
      status: 'active',
    });

    auditLog('assignment.create', {
      actorId: user._id.toString(),
      assignmentId: assignment._id.toString(),
      clientId,
      trainerId,
    });

    const assignmentParts: string[] = []
    if (built.routineId) assignmentParts.push('rutina')
    if (built.mealPlanId) assignmentParts.push('plan alimenticio')

    recordActivitySafe({
      gymId: user.gymId,
      actorId: user._id,
      actorName: user.name,
      actorAvatar: user.avatar,
      action: 'assignment.create',
      summary: `asignó ${assignmentParts.join(' y ') || 'contenido'} a ${client.name}`,
      targetType: 'Assignment',
      targetId: assignment._id,
      targetLabel: client.name,
      metadata: { clientId, trainerId },
    });

    await notifyAssignmentCreated({
      clientId,
      gymId: user.gymId,
      trainerName: trainer.name,
      assignmentId: assignment._id.toString(),
      hasRoutine: Boolean(built.routineId),
      hasMealPlan: Boolean(built.mealPlanId),
    }).catch((err) => console.error('[notifications] assignment:', err));

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Error al crear asignación:', error);
    const authError = handleAuthError(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }
    const err = error as ApiErrorLike;

    if (err.name === 'ValidationError' && err.errors) {
      return NextResponse.json(
        { error: 'Error de validación', details: Object.values(err.errors).map((item) => item.message) },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: err.message || 'Error al crear asignación' }, { status: 500 });
  }
}
