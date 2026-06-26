import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import { verifyEventInviteToken } from '@/lib/calendar/event-invite-token';
import { respondToCalendarEvent } from '@/lib/calendar/respond-to-event';
import { notifyClassBooking } from '@/lib/notifications/triggers';
import { getAppUrl } from '@/lib/env';

export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get('token');
    if (!token) {
      return NextResponse.redirect(`${getAppUrl()}/?invite=missing-token`);
    }

    const payload = verifyEventInviteToken(token);
    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.redirect(`${getAppUrl()}/?invite=user-not-found`);
    }

    const result = await respondToCalendarEvent(payload.eventId, user, 'accept');
    if (!result.ok) {
      const reason = encodeURIComponent(result.error);
      return NextResponse.redirect(`${getAppUrl()}/?invite=error&reason=${reason}`);
    }

    if (!result.alreadyConfirmed) {
      await notifyClassBooking({
        userId: user._id,
        gymId: user.gymId,
        title: result.event.title,
        date: result.event.date,
        eventId: String(result.event._id),
      }).catch((err) => console.error('[notifications] booking:', err));
    }

    const success = encodeURIComponent(result.event.title);
    return NextResponse.redirect(`${getAppUrl()}/?invite=confirmed&event=${success}`);
  } catch (error) {
    console.error('[calendar/invite/confirm]', error);
    return NextResponse.redirect(`${getAppUrl()}/?invite=invalid-token`);
  }
}
