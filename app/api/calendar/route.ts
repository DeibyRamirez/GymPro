import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import CalendarEvent from '@/lib/models/CalendarEvent';
import User from '@/lib/models/User';
import { logApiError, logApiRequest } from '@/lib/api-debug';
import { buildPagination, parsePagination } from '@/lib/pagination';
import { notifyClassCreated } from '@/lib/notifications/triggers';


type JwtPayload = { userId: string }
type ValidationErrorLike = { name?: string; errors?: Record<string, { message: string }> }



// GET - Obtener eventos del calendario
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

    // Construir filtros
    const filters: Record<string, unknown> = {};

    // Los usuarios solo ven sus propios eventos
    if (user.role === 'trainer') {
      // Los trainers ven sus eventos y los de sus clientes
      filters.$or = [
        { userId: user._id },
        { trainerId: user._id }
      ];
    } else if (user.role === 'admin') {
      // Los admins ven todos los eventos (sin filtro de usuario)
    } else {
      // Los clientes ven sus propios eventos y las clases grupales del gimnasio
      filters.$or = [
        { userId: user._id },
        { type: 'class', gymId: user.gymId || null },
      ];
    }

    if (user.gymId) {
      filters.gymId = user.gymId;
    }

    // Filtros de fecha
    if (startDate && endDate) {
      filters.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filters.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filters.date = { $lte: new Date(endDate) };
    }

    // Filtros adicionales
    if (type) {
      filters.type = type;
    }

    if (completed !== null && completed !== undefined) {
      filters.completed = completed === 'true';
    }

    const [events, total] = await Promise.all([
      CalendarEvent.find(filters)
        .populate('userId', 'name email')
        .populate('trainerId', 'name email')
        .populate('routineId', 'name description')
        .populate('mealPlanId', 'name description')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit),
      CalendarEvent.countDocuments(filters),
    ]);

    return NextResponse.json({
      events,
      pagination: buildPagination(page, limit, total),
    });

  } catch (error) {
    logApiError('/api/calendar GET', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo evento
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
      source
    } = data;

    logApiRequest('/api/calendar POST', {
      userId: user._id.toString(),
      role: user.role,
      gymId: user.gymId?.toString() || null,
      payload: { title, description, date, type, userId, trainerId, routineId, mealPlanId, assignmentId, capacity, attendanceCode, duration, source },
    });

    // Validar datos requeridos
    if (!title || !date || !type) {
      return NextResponse.json(
        { error: 'Título, fecha y tipo son requeridos' },
        { status: 400 }
      );
    }

    // Determinar el userId del evento
    let eventUserId = userId;
    if (!eventUserId) {
      eventUserId = user._id; // Por defecto, el evento es para el usuario actual
    }

    const isPrivateClientEvent = user.role === 'client' && String(eventUserId) === String(user._id);
    if (user.role === 'client' && !isPrivateClientEvent) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear eventos para otros usuarios' },
        { status: 403 }
      );
    }

    // Verificar permisos para crear eventos para otros usuarios
    if (String(eventUserId) !== String(user._id)) {
      
      // Verificar que el usuario objetivo existe
      const targetUser = await User.findById(eventUserId);
      if (!targetUser) {
        return NextResponse.json(
          { error: 'Usuario objetivo no encontrado' },
          { status: 404 }
        );
      }
    }

    // Crear el evento
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
      capacity: capacity || null,
      bookedCount: 0,
      attendanceCode: attendanceCode || null,
      duration: duration || null,
      reminder: reminder || { enabled: false },
      source: isPrivateClientEvent ? 'manual' : source || 'calendar',
    });

    await event.save();

    // Obtener el evento creado con los datos poblados
    const createdEvent = await CalendarEvent.findById(event._id)
      .populate('userId', 'name email')
      .populate('trainerId', 'name email')
      .populate({ path: 'routineId', populate: { path: 'exercises.exercise', select: 'name image muscleGroups equipment' } })
      .populate('mealPlanId', 'name description');

    if (!createdEvent) {
      return NextResponse.json({ error: 'No se pudo crear el evento' }, { status: 500 });
    }

    if (type === 'class' && eventUserId) {
      await notifyClassCreated({
        userId: eventUserId,
        gymId: user.gymId,
        title,
        date: new Date(date),
        eventId: String(createdEvent._id),
      }).catch((err) => console.error('[notifications] class_new:', err));
    }

    return NextResponse.json({
      message: 'Evento creado exitosamente',
      event: {
        ...createdEvent.toObject(),
        exercises: Array.isArray((createdEvent.routineId as unknown as { exercises?: Array<{ exercise?: { name?: string }; sets?: number; reps?: string; rest?: string; instructions?: string }> } | undefined)?.exercises)
          ? (createdEvent.routineId as unknown as { exercises?: Array<{ exercise?: { name?: string }; sets?: number; reps?: string; rest?: string; instructions?: string }> }).exercises?.map((exercise, index) => ({
              name: exercise.exercise?.name || `Ejercicio ${index + 1}`,
              sets: exercise.sets,
              reps: exercise.reps,
              rest: exercise.rest,
              instructions: exercise.instructions,
            }))
          : [],
      }
    }, { status: 201 });

  } catch (error: unknown) {
    logApiError('/api/calendar POST', error);

    const validationError = error as ValidationErrorLike;
    if (validationError.name === 'ValidationError' && validationError.errors) {
      const errors = Object.values(validationError.errors).map((err) => err.message);
      return NextResponse.json(
        { error: 'Error de validación', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
