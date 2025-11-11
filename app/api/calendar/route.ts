import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CalendarEvent from '@/lib/models/CalendarEvent';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// Middleware para verificar autenticación
async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || 
                req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Token no proporcionado');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as any;
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new Error('Usuario no encontrado o inactivo');
  }

  return user;
}

// GET - Obtener eventos del calendario
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const completed = searchParams.get('completed');

    // Construir filtros
    const filters: any = {};

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
      // Los clientes solo ven sus propios eventos
      filters.userId = user._id;
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

    const events = await CalendarEvent.find(filters)
      .populate('userId', 'name email')
      .populate('trainerId', 'name email')
      .populate('routineId', 'name description')
      .populate('mealPlanId', 'name description')
      .sort({ date: 1 });

    return NextResponse.json({ events });

  } catch (error) {
    console.error('Error obteniendo eventos del calendario:', error);
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
      duration,
      reminder
    } = data;

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

    // Verificar permisos para crear eventos para otros usuarios
    if (eventUserId !== user._id.toString()) {
      if (user.role === 'client') {
        return NextResponse.json(
          { error: 'No tienes permisos para crear eventos para otros usuarios' },
          { status: 403 }
        );
      }
      
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
      trainerId: trainerId || (user.role === 'trainer' ? user._id : null),
      routineId: routineId || null,
      mealPlanId: mealPlanId || null,
      assignmentId: assignmentId || null,
      duration: duration || null,
      reminder: reminder || { enabled: false }
    });

    await event.save();

    // Obtener el evento creado con los datos poblados
    const createdEvent = await CalendarEvent.findById(event._id)
      .populate('userId', 'name email')
      .populate('trainerId', 'name email')
      .populate('routineId', 'name description')
      .populate('mealPlanId', 'name description');

    return NextResponse.json({
      message: 'Evento creado exitosamente',
      event: createdEvent
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando evento:', error);

    if ((error as any).name === 'ValidationError') {
      const errors = Object.values((error as any).errors).map((err: any) => err.message);
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