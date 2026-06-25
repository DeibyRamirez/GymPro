import mongoose from 'mongoose';
import { createNotification } from '@/lib/notifications/create';
import User from '@/lib/models/User';

function formatEventDate(date: Date): string {
  return date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export async function notifyClassCreated(params: {
  userId: mongoose.Types.ObjectId | string;
  gymId?: mongoose.Types.ObjectId | string | null;
  title: string;
  date: Date;
  eventId: string;
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    gymId: params.gymId,
    type: 'class_new',
    title: 'Nueva clase programada',
    body: `Se ha programado la clase "${params.title}" para el ${formatEventDate(params.date)}.`,
    metadata: { eventId: params.eventId },
  });
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
    title: 'Reserva confirmada',
    body: `Tu cupo para "${params.title}" el ${formatEventDate(params.date)} ha sido confirmado.`,
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
