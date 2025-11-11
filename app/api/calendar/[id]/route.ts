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

interface Props {
  params: { id: string };
}

// GET - Obtener evento por ID
export async function GET(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const event = await CalendarEvent.findById(params.id)
      .populate('userId', 'name email')
      .populate('trainerId', 'name email')
      .populate('routineId', 'name description')
      .populate('mealPlanId', 'name description');

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const canView = 
      user.role === 'admin' ||
      event.userId._id.toString() === user._id.toString() ||
      (event.trainerId && event.trainerId._id.toString() === user._id.toString());

    if (!canView) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este evento' },
        { status: 403 }
      );
    }

    return NextResponse.json({ event });

  } catch (error) {
    console.error('Error obteniendo evento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar evento
export async function PUT(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const event = await CalendarEvent.findById(params.id);

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const canEdit = 
      user.role === 'admin' ||
      event.userId.toString() === user._id.toString() ||
      (event.trainerId && event.trainerId.toString() === user._id.toString());

    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este evento' },
        { status: 403 }
      );
    }

    const data = await req.json();
    const updateData = { ...data };
    
    // No permitir cambiar el userId del evento
    delete updateData.userId;

    // Actualizar el evento
    const updatedEvent = await CalendarEvent.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email')
     .populate('trainerId', 'name email')
     .populate('routineId', 'name description')
     .populate('mealPlanId', 'name description');

    return NextResponse.json({
      message: 'Evento actualizado exitosamente',
      event: updatedEvent
    });

  } catch (error) {
    console.error('Error actualizando evento:', error);

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

// DELETE - Eliminar evento
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const event = await CalendarEvent.findById(params.id);

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const canDelete = 
      user.role === 'admin' ||
      event.userId.toString() === user._id.toString() ||
      (event.trainerId && event.trainerId.toString() === user._id.toString());

    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este evento' },
        { status: 403 }
      );
    }

    // Eliminar el evento
    await CalendarEvent.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'Evento eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando evento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Marcar evento como completado/no completado
export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const event = await CalendarEvent.findById(params.id);

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const canUpdate = 
      user.role === 'admin' ||
      event.userId.toString() === user._id.toString() ||
      (event.trainerId && event.trainerId.toString() === user._id.toString());

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este evento' },
        { status: 403 }
      );
    }

    const { completed } = await req.json();

    // Actualizar solo el estado de completado
    const updatedEvent = await CalendarEvent.findByIdAndUpdate(
      params.id,
      { completed: !!completed },
      { new: true }
    ).populate('userId', 'name email')
     .populate('trainerId', 'name email')
     .populate('routineId', 'name description')
     .populate('mealPlanId', 'name description');

    return NextResponse.json({
      message: `Evento marcado como ${completed ? 'completado' : 'no completado'}`,
      event: updatedEvent
    });

  } catch (error) {
    console.error('Error actualizando estado del evento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}