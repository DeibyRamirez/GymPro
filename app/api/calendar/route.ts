import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyAuth } from '@/lib/auth-server';
import { recordActivitySafe } from '@/lib/activity-log/record';
import connectDB from '@/lib/mongodb';
import CalendarEvent from '@/lib/models/CalendarEvent';
import User from '@/lib/models/User';
import { logApiError, logApiRequest } from '@/lib/api-debug';
import { buildPagination, parsePagination } from '@/lib/pagination';
import { serializeCalendarEvent } from '@/lib/calendar/serialize-event';
import { notifyInvitedUsers } from '@/lib/notifications/triggers';

type ValidationErrorLike = { name?: string; errors?: Record<string, { message: string }> };

function buildCalendarFilters(user: Awaited<ReturnType<typeof verifyAuth>>) {
  const filters: Record<string, unknown> = {};

  if (user.role === 'trainer') {
    filters.$or = [{ userId: user._id }, { trainerId: user._id }];
  } else if (user.role === 'admin' || user.role === 'superadmin') {
    // todos los eventos del gym (filtro gymId abajo)
  } else {
    filters.$or = [
      { userId: user._id },
      { invitedUserIds: user._id },
      { type: 'class', gymId: user.gymId || null, invitedUserIds: { $size: 0 } },
    ];
  }

  if (user.gymId) {
    filters.gymId = user.gymId;
  }

  return filters;
}

async function validateInvitedClients(
  invitedUserIds: string[],
  gymId: mongoose.Types.ObjectId | null | undefined,
  trainerId?: mongoose.Types.ObjectId,
) {
  const clients = await User.find({
    _id: { $in: invitedUserIds },
    role: 'client',
    isActive: true,
    gymId: gymId || null,
  }).select('_id trainerId');

  if (clients.length !== invitedUserIds.length) {
    return { ok: false as const, error: 'Uno o más clientes invitados no son válidos' };
  }

  if (trainerId) {
    const allBelongToTrainer = clients.every(
      (client) => client.trainerId?.toString() === trainerId.toString(),
    );
    if (!allBelongToTrainer) {
      return { ok: false as const, error: 'Solo puedes invitar a tus clientes asignados' };
    }
  }

  return { ok: true as const, ids: clients.map((client) => client._id) };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    logApiRequest('/api/calendar GET', {
      userId: user._id.toString(),
      role: user.role,
      gymId: user.gymId?.toString() || null,
      query: Object.fromEntries(searchParams.entries()),
    });

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const completed = searchParams.get('completed');
    const { page, limit, skip } = parsePagination(searchParams, 100);

    const filters = buildCalendarFilters(user);

    if (startDate && endDate) {
      filters.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      filters.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filters.date = { $lte: new Date(endDate) };
    }

    if (type) filters.type = type;
    if (completed !== null && completed !== undefined) {
      filters.completed = completed === 'true';
    }

    const [events, total] = await Promise.all([
      CalendarEvent.find(filters)
        .populate('userId', 'name email')
        .populate('trainerId', 'name email')
        .populate('invitedUserIds', 'name email')
        .populate('confirmedUserIds', 'name email')
        .populate('routineId', 'name description')
        .populate('mealPlanId', 'name description')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit),
      CalendarEvent.countDocuments(filters),
    ]);

    return NextResponse.json({
      events: events.map((event) => serializeCalendarEvent(event, user)),
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    logApiError('/api/calendar GET', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const data = await req.json();
    const {
      title,
      description,
      date,
      type,
      userId,
      trainerId,
      routineId,
      mealPlanId,
      assignmentId,
      capacity,
      attendanceCode,
      duration,
      reminder,
      source,
      invitedUserIds: rawInvitedUserIds,
    } = data;

    logApiRequest('/api/calendar POST', {
      userId: user._id.toString(),
      role: user.role,
      gymId: user.gymId?.toString() || null,
      payload: { title, date, type, capacity, invitedCount: rawInvitedUserIds?.length || 0 },
    });

    if (!title || !date || !type) {
      return NextResponse.json({ error: 'Título, fecha y tipo son requeridos' }, { status: 400 });
    }

    const invitedUserIds = Array.isArray(rawInvitedUserIds)
      ? rawInvitedUserIds.map(String).filter(Boolean)
      : [];

    const isGroupClass = type === 'class' && invitedUserIds.length > 0;

    if (isGroupClass && user.role === 'client') {
      return NextResponse.json({ error: 'No tienes permisos para crear eventos grupales' }, { status: 403 });
    }

    if (isGroupClass && (!capacity || Number(capacity) < 1)) {
      return NextResponse.json({ error: 'Debes indicar el cupo máximo del evento' }, { status: 400 });
    }

    if (isGroupClass && invitedUserIds.length > Number(capacity)) {
      return NextResponse.json(
        { error: 'Los invitados no pueden superar el cupo máximo del evento' },
        { status: 400 },
      );
    }

    let eventUserId = userId || user._id;
    let validatedInvitedIds: mongoose.Types.ObjectId[] = [];

    if (isGroupClass) {
      const validation = await validateInvitedClients(
        invitedUserIds,
        user.gymId,
        user.role === 'trainer' ? user._id : undefined,
      );
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      validatedInvitedIds = validation.ids;
      eventUserId = user._id;
    } else {
      const isPrivateClientEvent = user.role === 'client' && String(eventUserId) === String(user._id);
      if (user.role === 'client' && !isPrivateClientEvent) {
        return NextResponse.json({ error: 'No tienes permisos para crear eventos para otros usuarios' }, { status: 403 });
      }
      if (String(eventUserId) !== String(user._id)) {
        const targetUser = await User.findById(eventUserId);
        if (!targetUser) {
          return NextResponse.json({ error: 'Usuario objetivo no encontrado' }, { status: 404 });
        }
      }
    }

    const isPrivateClientEvent = user.role === 'client' && String(eventUserId) === String(user._id);

    const event = new CalendarEvent({
      title,
      description,
      date: new Date(date),
      type,
      userId: eventUserId,
      gymId: user.gymId || null,
      trainerId: trainerId || (user.role === 'trainer' ? user._id : null),
      routineId: routineId || null,
      mealPlanId: mealPlanId || null,
      assignmentId: assignmentId || null,
      capacity: isGroupClass ? Number(capacity) : capacity || null,
      bookedCount: 0,
      invitedUserIds: validatedInvitedIds,
      confirmedUserIds: [],
      declinedUserIds: [],
      attendanceCode: attendanceCode || null,
      duration: duration || null,
      reminder: reminder || { enabled: false },
      source: isPrivateClientEvent ? 'manual' : source || 'calendar',
    });

    await event.save();

    if (user.role !== 'client' && user.gymId) {
      recordActivitySafe({
        gymId: user.gymId,
        actorId: user._id,
        actorName: user.name,
        actorAvatar: user.avatar,
        action: 'calendar.event_create',
        summary: `creó el evento "${title}" (${type})`,
        targetType: 'CalendarEvent',
        targetId: event._id,
        targetLabel: title,
        metadata: { type, isGroupClass },
      })
    }

    const createdEvent = await CalendarEvent.findById(event._id)
      .populate('userId', 'name email')
      .populate('trainerId', 'name email')
      .populate('invitedUserIds', 'name email')
      .populate('confirmedUserIds', 'name email')
      .populate({ path: 'routineId', populate: { path: 'exercises.exercise', select: 'name image muscleGroups equipment' } })
      .populate('mealPlanId', 'name description');

    if (!createdEvent) {
      return NextResponse.json({ error: 'No se pudo crear el evento' }, { status: 500 });
    }

    if (isGroupClass) {
      await notifyInvitedUsers({
        invitedUserIds: validatedInvitedIds.map(String),
        gymId: user.gymId,
        title,
        date: new Date(date),
        eventId: String(createdEvent._id),
        capacity: Number(capacity),
      }).catch((err) => console.error('[notifications] invite:', err));
    } else if (type === 'class' && eventUserId) {
      const { notifyClassCreated } = await import('@/lib/notifications/triggers');
      await notifyClassCreated({
        userId: eventUserId,
        gymId: user.gymId,
        title,
        date: new Date(date),
        eventId: String(createdEvent._id),
        capacity: capacity ? Number(capacity) : undefined,
      }).catch((err) => console.error('[notifications] class_new:', err));
    }

    const serialized = serializeCalendarEvent(createdEvent, user);

    return NextResponse.json(
      {
        message: 'Evento creado exitosamente',
        event: {
          ...serialized,
          exercises: Array.isArray(
            (createdEvent.routineId as unknown as {
              exercises?: Array<{
                exercise?: { name?: string };
                sets?: number;
                reps?: string;
                rest?: string;
                instructions?: string;
              }>;
            })?.exercises,
          )
            ? (
                createdEvent.routineId as unknown as {
                  exercises?: Array<{
                    exercise?: { name?: string };
                    sets?: number;
                    reps?: string;
                    rest?: string;
                    instructions?: string;
                  }>;
                }
              ).exercises?.map((exercise, index) => ({
                name: exercise.exercise?.name || `Ejercicio ${index + 1}`,
                sets: exercise.sets,
                reps: exercise.reps,
                rest: exercise.rest,
                instructions: exercise.instructions,
              }))
            : [],
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    logApiError('/api/calendar POST', error);
    const validationError = error as ValidationErrorLike;
    if (validationError.name === 'ValidationError' && validationError.errors) {
      const errors = Object.values(validationError.errors).map((err) => err.message);
      return NextResponse.json({ error: 'Error de validación', details: errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
