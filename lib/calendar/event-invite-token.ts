import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/env';

export type EventInviteTokenPayload = {
  eventId: string;
  userId: string;
  type: 'event_invite';
};

export function createEventInviteToken(eventId: string, userId: string): string {
  return jwt.sign({ eventId, userId, type: 'event_invite' } satisfies EventInviteTokenPayload, getJwtSecret(), {
    expiresIn: '7d',
  });
}

export function verifyEventInviteToken(token: string): EventInviteTokenPayload {
  const payload = jwt.verify(token, getJwtSecret()) as EventInviteTokenPayload;
  if (payload.type !== 'event_invite' || !payload.eventId || !payload.userId) {
    throw new Error('Token de invitación inválido');
  }
  return payload;
}
