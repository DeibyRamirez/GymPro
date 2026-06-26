import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import CalendarEvent from '@/lib/models/CalendarEvent';
import User from '@/lib/models/User';
import { canEditEvent, canViewEvent, getConfirmedCount } from '@/lib/calendar/access';
import { serializeCalendarEvent } from '@/lib/calendar/serialize-event';
import { notifyInvitedUsers } from '@/lib/notifications/triggers';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await verifyAuth(req);

    const event = await CalendarEvent.findById(id)
      .populate('userId', 'name email')
      .populate('trainerId', 'name email')
      .populate('invitedUserIds', 'name email')
      .populate('confirmedUserIds', 'name email')
      .populate('routineId', 'name description')
      .populate('mealPlanId', 'name description');

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }
    if (!canViewEvent(user, event)) {
      return NextResponse.json({ error: 'No tienes permisos para ver este evento' }, { status: 403 });
    }

    return NextResponse.json({ event: serializeCalendarEvent(event, user) });
  } catch (error) {
    console.error('Error obteniendo evento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await verifyAuth(req);
    const event = await CalendarEvent.findById(id);

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }
    if (!canEditEvent(user, event)) {
      return NextResponse.json({ error: 'No tienes permisos para editar este evento' }, { status: 403 });
    }

    const data = await req.json();
    const updateData: Record<string, unknown> = { ...data };
    delete updateData.userId;
    delete updateData.bookedCount;
    delete updateData.confirmedUserIds;

    if (updateData.capacity != null) {
      const capacity = Number(updateData.capacity);
      const confirmedCount = getConfirmedCount(event);
      if (capacity < confirmedCount) {
        return NextResponse.json(
          { error: `El cupo no puede ser menor que las confirmaciones actuales (${confirmedCount})` },
          { status: 400 },
        );
      }
      updateData.capacity = capacity;
    }

    if (Array.isArray(updateData.invitedUserIds)) {
      const invitedUserIds = updateData.invitedUserIds.map(String).filter(Boolean);
      const clients = await User.find({
        _id: { $in: invitedUserIds },
        role: 'client',
        gymId: event.gymId || null,
        isActive: true,
      }).select('_id');

      if (clients.length !== invitedUserIds.length) {
        return NextResponse.json({ error: 'Invitados inválidos' }, { status: 400 });
      }

      const previous = new Set((event.invitedUserIds || []).map(String));
      const nextIds = clients.map((client) => client._id);
      updateData.invitedUserIds = nextIds;

      const newInvitees = nextIds.filter((clientId) => !previous.has(String(clientId))).map(String);
      if (newInvitees.length > 0) {
        await notifyInvitedUsers({
          invitedUserIds: newInvitees,
          gymId: event.gymId,
          title: String(updateData.title || event.title),
          date: updateData.date ? new Date(String(updateData.date)) : event.date,
          eventId: String(event._id),
          capacity: updateData.capacity != null ? Number(updateData.capacity) : event.capacity,
        }).catch((err) => console.error('[notifications] invite update:', err));
      }
    }

    if (updateData.date) {
      updateData.date = new Date(String(updateData.date));
    }

    const updatedEvent = await CalendarEvent.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('userId', 'name email')
      .populate('trainerId', 'name email')
      .populate('invitedUserIds', 'name email')
      .populate('confirmedUserIds', 'name email')
      .populate('routineId', 'name description')
      .populate('mealPlanId', 'name description');

    return NextResponse.json({
      message: 'Evento actualizado exitosamente',
      event: updatedEvent ? serializeCalendarEvent(updatedEvent, user) : null,
    });
  } catch (error: unknown) {
    console.error('Error actualizando evento:', error);
    const validationError = error as { name?: string; errors?: Record<string, { message: string }> };
    if (validationError.name === 'ValidationError' && validationError.errors) {
      const errors = Object.values(validationError.errors).map((err) => err.message);
      return NextResponse.json({ error: 'Error de validación', details: errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await verifyAuth(req);
    const event = await CalendarEvent.findById(id);

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }
    if (!canEditEvent(user, event)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este evento' }, { status: 403 });
    }

    await CalendarEvent.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    await connectDB();
    const user = await verifyAuth(req);
    const event = await CalendarEvent.findById(id);

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }
    if (!canEditEvent(user, event) && String(event.userId) !== String(user._id)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar este evento' }, { status: 403 });
    }

    const { completed } = await req.json();
    const updatedEvent = await CalendarEvent.findByIdAndUpdate(
      id,
      { completed: !!completed },
      { new: true },
    )
      .populate('userId', 'name email')
      .populate('trainerId', 'name email')
      .populate('invitedUserIds', 'name email')
      .populate('confirmedUserIds', 'name email')
      .populate('routineId', 'name description')
      .populate('mealPlanId', 'name description');

    return NextResponse.json({
      message: `Evento marcado como ${completed ? 'completado' : 'no completado'}`,
      event: updatedEvent ? serializeCalendarEvent(updatedEvent, user) : null,
    });
  } catch (error) {
    console.error('Error actualizando estado del evento:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
