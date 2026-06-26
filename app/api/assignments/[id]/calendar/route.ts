import Assignment from '@/lib/models/Assignment';
import Routine from '@/lib/models/Routine';
import { verifyAuth } from '@/lib/auth-server';
import {
  buildCompletionMap,
  calculateStreak,
  toDateKey,
} from '@/lib/assignment/day-completion';
import { mapRoutineExercises } from '@/lib/assignment/program-service';
import { extractRefId } from '@/lib/assignment/ref-id';
import connectDB from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { logApiError, logApiRequest } from '@/lib/api-debug';




function getWeekdayName(day: number) {
  return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day]
}

function getEventType(isRestDay: boolean) {
  return isRestDay ? 'rest' : 'workout'
}

type RoutineDoc = {
  _id?: { toString(): string }
  name?: string
  description?: string
  duration?: string
  difficulty?: string
  exercises?: Array<{
    exercise?: { _id?: { toString(): string }; name?: string }
    sets?: number
    reps?: string
    rest?: string
    instructions?: string
  }>
}

// Definición de los filtros que se pueden aplicar al obtener las asignaciones
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');
    const referenceDate = monthParam ? new Date(monthParam) : new Date();
    logApiRequest('/api/assignments/[id]/calendar GET', {
      userId: user._id.toString(),
      role: user.role,
      gymId: user.gymId?.toString() || null,
      assignmentId: id,
      month: monthParam,
    });

    // Obtener la asignación específica por su ID, y poblar los campos relacionados para obtener la información completa
    // de la asignación, incluyendo detalles del cliente, entrenador, rutina y plan alimenticio asociados, lo que permite al cliente 
    // o entrenador ver la información detallada de la asignación, 
    // y proyectar el calendario correspondiente con los eventos programados para cada día dentro del período de la asignación.
    const assignment = await Assignment.findById(id)
      .populate({ path: 'routineId', select: 'name description duration difficulty exercises trainingDaysPerWeek', populate: { path: 'exercises.exercise', select: 'name image muscleGroups equipment' } })
      .populate('mealPlanId', 'name description calories duration meals');

    // Validar que la asignación exista, que pertenezca al mismo gimnasio que el usuario autenticado, 
    // y que el usuario tenga permisos para verla (sea el cliente o entrenador asignado, o un admin),
    // para garantizar que solo los usuarios autorizados puedan acceder a la información de la asignación, 
    // y evitar así posibles problemas de seguridad o privacidad al mostrar información sensible de la asignación a usuarios no autorizados.
    if (!assignment) return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    if (String(assignment.gymId || null) !== String(user.gymId || null)) return NextResponse.json({ error: 'No tienes permisos para ver este plan' }, { status: 403 });


    // Verificar que el usuario autenticado sea el cliente o entrenador asignado a la asignación, o tenga un rol de admin, para garantizar 
    // que solo los usuarios autorizados puedan acceder a la información de la asignación, y evitar así posibles problemas de seguridad 
    // o privacidad al mostrar información sensible de la asignación a usuarios no autorizados.
    const isOwner = assignment.clientId.toString() === user._id.toString() || assignment.trainerId.toString() === user._id.toString() || ['admin', 'superadmin'].includes(user.role);
    if (!isOwner) return NextResponse.json({ error: 'No tienes permisos para ver este plan' }, { status: 403 });

    // Proyectar el calendario de la asignación para el mes especificado (o el mes actual si no se especifica),
    // generando un evento para cada día dentro del período de la asignación, y determinando si es un día de descanso 
    // o un día de entrenamiento,
    // lo que permite al cliente o entrenador visualizar el calendario correspondiente a la asignación, 
    // con los eventos programados para cada día, 
    // facilitando así la planificación y seguimiento de las actividades programadas en la asignación.
    const start = new Date(assignment.startDate);
    const end = assignment.endDate ? new Date(assignment.endDate) : new Date(start);
    if (assignment.durationWeeks) end.setDate(start.getDate() + assignment.durationWeeks * 7);


    // Calcular el inicio y fin del mes a proyectar, y generar los eventos para cada día dentro de ese mes que esté dentro del período de la asignación,
    // determinando si cada día es un día de descanso o un día de entrenamiento según el cronograma semanal de la asignación, 
    // y asignando el tipo de evento correspondiente (descanso o entrenamiento) para cada día, lo que permite al cliente o entrenador visualizar el calendario con los eventos programados para cada día, facilitando así la planificación y seguimiento de las actividades programadas en la asignación.
    const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
    const hasMealPlan = Boolean(assignment.mealPlanId);
    const completionMap = buildCompletionMap(assignment.dayCompletions || []);

    const scheduleRoutineIds = new Set<string>();
    const embeddedRoutines = new Map<string, RoutineDoc>();

    const registerRoutineRef = (value: unknown) => {
      if (value && typeof value === 'object' && 'exercises' in (value as object)) {
        const doc = value as RoutineDoc;
        const id = extractRefId(doc._id) || extractRefId(doc);
        if (id) embeddedRoutines.set(id, doc);
        return;
      }
      const id = extractRefId(value);
      if (id) scheduleRoutineIds.add(id);
    };

    for (const item of assignment.weeklySchedule || []) {
      registerRoutineRef(item.routineId);
    }
    registerRoutineRef(assignment.routineId);

    const primaryRoutineId = extractRefId(assignment.routineId);

    const idsToFetch = Array.from(scheduleRoutineIds).filter((id) => !embeddedRoutines.has(id));
    const routineDocs = idsToFetch.length
      ? await Routine.find({ _id: { $in: idsToFetch } })
          .select('name description duration difficulty exercises')
          .populate('exercises.exercise', 'name image muscleGroups equipment instructions')
      : [];

    const routineById = new Map<string, RoutineDoc>(
      routineDocs.map((doc) => [doc._id.toString(), doc.toObject() as RoutineDoc]),
    );
    for (const [id, doc] of embeddedRoutines) {
      routineById.set(id, doc);
    }

    const resolveDayRoutine = (scheduleItem: { routineId?: unknown; isRestDay?: boolean } | undefined) => {
      if (!scheduleItem || scheduleItem.isRestDay) return null;
      const rid = extractRefId(scheduleItem.routineId) || primaryRoutineId;
      return rid ? routineById.get(rid) || null : null;
    };

    const days: Array<Record<string, unknown>> = [];
    for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      if (date < start || date > end) continue;

      const dateKey = toDateKey(date);
      const weekday = date.getDay();
      const scheduleItem = assignment.weeklySchedule?.find((item: { dayOfWeek: number; }) => item.dayOfWeek === weekday);
      const isRestDay = scheduleItem?.isRestDay ?? !scheduleItem?.routineId;
      const eventType = getEventType(isRestDay);
      const dayCompletion = completionMap.get(dateKey) || null;
      const dayRoutine = resolveDayRoutine(scheduleItem);
      const dayRoutineId = extractRefId(dayRoutine?._id) || extractRefId(dayRoutine) || null;
      const mealPlanDoc =
        hasMealPlan && assignment.mealPlanId && typeof assignment.mealPlanId === 'object'
          ? (assignment.mealPlanId as {
              name?: string
              calories?: number
              meals?: Array<{
                name: string
                time: string
                foods: string[]
                calories: number
                macros?: { protein?: number; carbs?: number; fats?: number }
              }>
            })
          : null;

      days.push({
        id: `${assignment._id.toString()}-${dateKey}`,
        date: dateKey,
        weekday,
        weekdayName: getWeekdayName(weekday),
        isRestDay,
        hasMealPlan,
        type: eventType,
        completed: Boolean(dayCompletion?.dayCompleted),
        dayCompletion,
        routineId: dayRoutineId,
        routine: dayRoutine
          ? {
              id: dayRoutineId,
              name: dayRoutine.name,
              description: dayRoutine.description,
              duration: dayRoutine.duration,
              difficulty: dayRoutine.difficulty,
            }
          : null,
        mealPlan: hasMealPlan ? assignment.mealPlanId : null,
        mealsToday: mealPlanDoc?.meals || [],
        title: scheduleItem?.title || (isRestDay ? 'Descanso Activo' : 'Plan del Día'),
        notes: scheduleItem?.notes || '',
        source: 'assignment',
        assignmentId: assignment._id.toString(),
        trainerId: assignment.trainerId.toString(),
        gymId: assignment.gymId?.toString?.() || null,
        exercises: !isRestDay ? mapRoutineExercises(dayRoutine) : [],
        metadata: {
          weeklySchedule: scheduleItem || null,
          routineName: dayRoutine?.name ?? null,
          routineId: dayRoutineId,
          mealPlanName: assignment.mealPlanId && typeof assignment.mealPlanId === 'object' && 'name' in assignment.mealPlanId ? (assignment.mealPlanId as { name?: string }).name : null,
          mealPlanCalories: mealPlanDoc?.calories ?? null,
        },
      });
    }

    return NextResponse.json({
      plan_id: assignment._id.toString(),
      periodo: {
        inicio: start.toISOString().split('T')[0],
        fin: end.toISOString().split('T')[0],
      },
      cronograma_semanal: assignment.weeklySchedule || [],
      streak: calculateStreak(completionMap),
      calendario: days,
      events: days,
    });
  } catch (error) {
    logApiError('/api/assignments/[id]/calendar GET', error);
    return NextResponse.json({ error: 'Error al proyectar calendario' }, { status: 500 });
  }
}
