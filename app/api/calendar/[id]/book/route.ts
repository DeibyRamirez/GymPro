import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import CalendarEvent from '@/lib/models/CalendarEvent';
import { logApiError, logApiRequest } from '@/lib/api-debug';
import { notifyClassBooking } from '@/lib/notifications/triggers';



export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;
    logApiRequest('/api/calendar/[id]/book POST', {
      userId: user._id.toString(),
      role: user.role,
      gymId: user.gymId?.toString() || null,
      eventId: id,
    });

    const event = await CalendarEvent.findById(id);
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    if (event.type !== 'class') return NextResponse.json({ error: 'Solo aplica para clases' }, { status: 400 });
    if (String(event.gymId || null) !== String(user.gymId || null)) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });

    const capacity = event.capacity || 0;
    const bookedCount = event.bookedCount || 0;
    if (!capacity || bookedCount >= capacity) {
      return NextResponse.json({ error: 'No hay cupos disponibles' }, { status: 400 });
    }

    event.bookedCount = bookedCount + 1;
    await event.save();

    await notifyClassBooking({
      userId: user._id,
      gymId: user.gymId,
      title: event.title,
      date: event.date,
      eventId: String(event._id),
    }).catch((err) => console.error('[notifications] booking:', err));

    return NextResponse.json({ message: 'Reserva confirmada', event });
  } catch (error) {
    logApiError('/api/calendar/[id]/book POST', error);
    return NextResponse.json({ error: 'Error al reservar cupo' }, { status: 500 });
  }
}
