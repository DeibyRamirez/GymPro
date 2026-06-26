import mongoose from 'mongoose';
import { createEventInviteToken } from '@/lib/calendar/event-invite-token';
import { getAppUrl } from '@/lib/env';
import { createNotification } from '@/lib/notifications/create';
import User from '@/lib/models/User';

function formatEventDate(date: Date): string {
  return date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export async function notifyEventInvitation(params: {
  userId: mongoose.Types.ObjectId | string;
  gymId?: mongoose.Types.ObjectId | string | null;
  title: string;
  date: Date;
  eventId: string;
  capacity?: number;
}): Promise<void> {
  const token = createEventInviteToken(params.eventId, String(params.userId));
  const confirmLink = `${getAppUrl()}/api/calendar/invite/confirm?token=${encodeURIComponent(token)}`;
  const capacityText = params.capacity ? ` Cupos disponibles: ${params.capacity}.` : '';

  await createNotification({
    userId: params.userId,
    gymId: params.gymId,
    type: 'class_new',
    title: 'Invitación a evento',
    body: `Has sido invitado a "${params.title}" el ${formatEventDate(params.date)}.${capacityText} Confirma tu asistencia desde el calendario o el enlace del correo.`,
    metadata: { eventId: params.eventId, link: confirmLink },
  });
}

export async function notifyClassCreated(params: {
  userId: mongoose.Types.ObjectId | string;
  gymId?: mongoose.Types.ObjectId | string | null;
  title: string;
  date: Date;
  eventId: string;
  capacity?: number;
}): Promise<void> {
  await notifyEventInvitation(params);
}

export async function notifyClassBooking(params: {
  userId: mongoose.Types.ObjectId | string;
  gymId?: mongoose.Types.ObjectId | string | null;
  title: string;
  date: Date;
  eventId: string;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    gymId: params.gymId,
    type: 'class_booking',
    title: 'Asistencia confirmada',
    body: `Confirmaste tu asistencia a "${params.title}" el ${formatEventDate(params.date)}.`,
    metadata: { eventId: params.eventId },
  });
}

export async function notifyAssignmentCreated(params: {
  clientId: mongoose.Types.ObjectId | string;
  gymId?: mongoose.Types.ObjectId | string | null;
  trainerName: string;
  assignmentId: string;
  hasRoutine: boolean;
  hasMealPlan: boolean;
}): Promise<void> {
  const parts: string[] = [];
  if (params.hasRoutine) parts.push('una rutina');
  if (params.hasMealPlan) parts.push('un plan alimenticio');
  const content = parts.length > 0 ? parts.join(' y ') : 'nuevo contenido';

  await createNotification({
    userId: params.clientId,
    gymId: params.gymId,
    type: 'assignment',
    title: 'Nueva asignación de tu entrenador',
    body: `${params.trainerName} te ha asignado ${content}. Revisa tu panel para comenzar.`,
    metadata: { assignmentId: params.assignmentId },
  });
}

export async function notifyGymBroadcast(params: {
  gymId: mongoose.Types.ObjectId | string;
  title: string;
  body: string;
  roles?: Array<'client' | 'trainer' | 'admin'>;
}): Promise<number> {
  const roles = params.roles?.length ? params.roles : ['client', 'trainer'];
  const users = await User.find({
    gymId: params.gymId,
    role: { $in: roles },
    isActive: true,
  }).select('_id');

  let count = 0;
  for (const user of users) {
    await createNotification({
      userId: user._id,
      gymId: params.gymId,
      type: 'broadcast',
      title: params.title,
      body: params.body,
    });
    count += 1;
  }
  return count;
}

export async function notifyInvitedUsers(params: {
  invitedUserIds: string[];
  gymId?: mongoose.Types.ObjectId | string | null;
  title: string;
  date: Date;
  eventId: string;
  capacity?: number;
}): Promise<void> {
  await Promise.all(
    params.invitedUserIds.map((userId) =>
      notifyEventInvitation({
        userId,
        gymId: params.gymId,
        title: params.title,
        date: params.date,
        eventId: params.eventId,
        capacity: params.capacity,
      }),
    ),
  );
}
