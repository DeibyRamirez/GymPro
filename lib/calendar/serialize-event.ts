import mongoose from 'mongoose';
import {
  canEditEvent,
  canRespondToEvent,
  getConfirmedCount,
  getInvitationStatus,
} from '@/lib/calendar/access';
import type { ICalendarEvent } from '@/lib/models/CalendarEvent';
import { normalizeUserIdList } from '@/lib/calendar/normalize-ids';

type AuthUser = {
  _id: mongoose.Types.ObjectId;
  role: string;
  gymId?: mongoose.Types.ObjectId | null;
};

export function serializeCalendarEvent(event: ICalendarEvent, user: AuthUser) {
  const plain = event.toObject ? event.toObject() : event;
  const confirmedCount = getConfirmedCount(plain as ICalendarEvent);

  return {
    ...plain,
    id: String(plain._id),
    bookedCount: confirmedCount,
    spotsRemaining: plain.capacity ? Math.max(0, plain.capacity - confirmedCount) : null,
    invitedUserIds: normalizeUserIdList(plain.invitedUserIds as unknown[]),
    confirmedUserIds: normalizeUserIdList(plain.confirmedUserIds as unknown[]),
    declinedUserIds: normalizeUserIdList(plain.declinedUserIds as unknown[]),
    invitationStatus: getInvitationStatus(user._id, plain as ICalendarEvent),
    canEdit: canEditEvent(user, plain as ICalendarEvent),
    canRespond: canRespondToEvent(user, plain as ICalendarEvent),
  };
}
