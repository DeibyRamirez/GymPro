import mongoose from 'mongoose';
import type { ICalendarEvent } from '@/lib/models/CalendarEvent';
import { normalizeUserIdList, normalizeUserIdRef, userIdListIncludes } from '@/lib/calendar/normalize-ids';

type EventDoc = Pick<
  ICalendarEvent,
  'userId' | 'trainerId' | 'gymId' | 'type' | 'invitedUserIds' | 'confirmedUserIds' | 'declinedUserIds'
> & { _id?: mongoose.Types.ObjectId };

type AuthUser = {
  _id: mongoose.Types.ObjectId;
  role: string;
  gymId?: mongoose.Types.ObjectId | null;
};

function sameId(a: unknown, b: unknown): boolean {
  return normalizeUserIdRef(a) === normalizeUserIdRef(b);
}

export function isEventCreator(user: AuthUser, event: EventDoc): boolean {
  return sameId(event.userId, user._id) || (event.trainerId != null && sameId(event.trainerId, user._id));
}

export function isEventInvited(user: AuthUser, event: EventDoc): boolean {
  return userIdListIncludes(event.invitedUserIds as unknown[], user._id);
}

export function canViewEvent(user: AuthUser, event: EventDoc): boolean {
  if (user.role === 'superadmin') return true;
  if (event.gymId && user.gymId && !sameId(event.gymId, user.gymId)) {
    return false;
  }
  if (user.role === 'admin') return true;
  if (isEventCreator(user, event)) return true;
  if (sameId(event.userId, user._id)) return true;
  if (isEventInvited(user, event)) return true;
  if (
    event.type === 'class' &&
    event.gymId &&
    sameId(event.gymId, user.gymId) &&
    normalizeUserIdList(event.invitedUserIds as unknown[]).length === 0
  ) {
    return true;
  }
  return false;
}

export function canEditEvent(user: AuthUser, event: EventDoc): boolean {
  if (user.role === 'admin' || user.role === 'superadmin') return true;
  if (isEventCreator(user, event)) return true;
  if (sameId(event.userId, user._id) && event.type === 'appointment') return true;
  return false;
}

export function canRespondToEvent(user: AuthUser, event: EventDoc): boolean {
  if (event.type !== 'class') return false;
  if (user.role !== 'client') return false;
  if (isEventInvited(user, event)) return true;
  const invited = normalizeUserIdList(event.invitedUserIds as unknown[]);
  if (event.gymId && sameId(event.gymId, user.gymId) && invited.length === 0) {
    return true;
  }
  return false;
}

export function getInvitationStatus(
  userId: mongoose.Types.ObjectId,
  event: Pick<ICalendarEvent, 'invitedUserIds' | 'confirmedUserIds' | 'declinedUserIds'>,
): 'none' | 'pending' | 'confirmed' | 'declined' {
  const id = normalizeUserIdRef(userId);
  const invited = normalizeUserIdList(event.invitedUserIds as unknown[]);
  if (invited.length > 0 && !invited.includes(id)) return 'none';
  if (userIdListIncludes(event.confirmedUserIds as unknown[], userId)) return 'confirmed';
  if (userIdListIncludes(event.declinedUserIds as unknown[], userId)) return 'declined';
  if (invited.includes(id) || invited.length === 0) return 'pending';
  return 'none';
}

export function getConfirmedCount(event: Pick<ICalendarEvent, 'confirmedUserIds' | 'bookedCount'>): number {
  const confirmed = normalizeUserIdList(event.confirmedUserIds as unknown[]);
  if (confirmed.length > 0) return confirmed.length;
  return event.bookedCount || 0;
}
