import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import { respondToCalendarEvent } from '@/lib/calendar/respond-to-event';
import { serializeCalendarEvent } from '@/lib/calendar/serialize-event';
import { notifyClassBooking } from '@/lib/notifications/triggers';
import { logApiError, logApiRequest } from '@/lib/api-debug';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const action = body.action === 'decline' ? 'decline' : 'accept';

    logApiRequest('/api/calendar/[id]/respond POST', {
      userId: user._id.toString(),
      eventId: id,
      action,
    });

    const result = await respondToCalendarEvent(id, user, action);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (action === 'accept' && !result.alreadyConfirmed) {
      await notifyClassBooking({
        userId: user._id,
        gymId: user.gymId,
        title: result.event.title,
        date: result.event.date,
        eventId: String(result.event._id),
      }).catch((err) => console.error('[notifications] booking:', err));
    }

    return NextResponse.json({
      message: action === 'accept' ? 'Asistencia confirmada' : 'Invitación rechazada',
      event: serializeCalendarEvent(result.event, user),
    });
  } catch (error) {
    logApiError('/api/calendar/[id]/respond POST', error);
    return NextResponse.json({ error: 'Error al responder invitación' }, { status: 500 });
  }
}
