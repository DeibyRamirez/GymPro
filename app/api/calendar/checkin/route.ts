import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import CalendarEvent from '@/lib/models/CalendarEvent';
import { logApiError, logApiRequest } from '@/lib/api-debug';



export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { code } = await req.json();
    logApiRequest('/api/calendar/checkin POST', {
      userId: user._id.toString(),
      role: user.role,
      gymId: user.gymId?.toString() || null,
      code,
    });
    if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 });

    const event = await CalendarEvent.findOne({ attendanceCode: code, type: 'class' });
    if (!event) return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    if (String(event.gymId || null) !== String(user.gymId || null)) return NextResponse.json({ error: 'Código inválido' }, { status: 400 });

    return NextResponse.json({ message: 'Check-in validado', user: user.name, event: event.title });
  } catch (error) {
    logApiError('/api/calendar/checkin POST', error);
    return NextResponse.json({ error: 'Error al validar check-in' }, { status: 500 });
  }
}
