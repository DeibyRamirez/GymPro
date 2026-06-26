import mongoose from 'mongoose';
import CalendarEvent, { type ICalendarEvent } from '@/lib/models/CalendarEvent';
import { canRespondToEvent, getConfirmedCount } from '@/lib/calendar/access';

export type RespondAction = 'accept' | 'decline';

export type RespondResult =
  | { ok: true; event: ICalendarEvent; alreadyConfirmed?: boolean }
  | { ok: false; status: number; error: string };

type RespondUser = {
  _id: mongoose.Types.ObjectId;
  role: string;
  gymId?: mongoose.Types.ObjectId | null;
};

function pullUserId(ids: mongoose.Types.ObjectId[], userId: mongoose.Types.ObjectId): mongoose.Types.ObjectId[] {
  return ids.filter((id) => String(id) !== String(userId));
}

function pushUnique(ids: mongoose.Types.ObjectId[], userId: mongoose.Types.ObjectId): mongoose.Types.ObjectId[] {
  if (ids.some((id) => String(id) === String(userId))) return ids;
  return [...ids, userId];
}

export async function respondToCalendarEvent(
  eventId: string,
  user: RespondUser,
  action: RespondAction,
): Promise<RespondResult> {
  const event = await CalendarEvent.findById(eventId);
  if (!event) return { ok: false, status: 404, error: 'Evento no encontrado' };
  if (event.type !== 'class') return { ok: false, status: 400, error: 'Solo aplica para eventos grupales' };
  if (String(event.gymId || null) !== String(user.gymId || null)) {
    return { ok: false, status: 404, error: 'Evento no encontrado' };
  }
  if (!canRespondToEvent(user, event)) {
    return { ok: false, status: 403, error: 'No estás invitado a este evento' };
  }

  const userId = user._id;
  event.invitedUserIds = event.invitedUserIds || [];
  event.confirmedUserIds = event.confirmedUserIds || [];
  event.declinedUserIds = event.declinedUserIds || [];

  const alreadyConfirmed = event.confirmedUserIds.some((id: mongoose.Types.ObjectId) => String(id) === String(userId));
  if (action === 'accept') {
    if (alreadyConfirmed) {
      return { ok: true, event, alreadyConfirmed: true };
    }

    const capacity = event.capacity || 0;
    const confirmedCount = getConfirmedCount(event);
    if (capacity > 0 && confirmedCount >= capacity) {
      return { ok: false, status: 400, error: 'No hay cupos disponibles' };
    }

    event.confirmedUserIds = pushUnique(event.confirmedUserIds, userId);
    event.declinedUserIds = pullUserId(event.declinedUserIds, userId);
    event.bookedCount = event.confirmedUserIds.length;
    await event.save();
    return { ok: true, event };
  }

  event.declinedUserIds = pushUnique(event.declinedUserIds, userId);
  event.confirmedUserIds = pullUserId(event.confirmedUserIds, userId);
  event.bookedCount = event.confirmedUserIds.length;
  await event.save();
  return { ok: true, event };
}
