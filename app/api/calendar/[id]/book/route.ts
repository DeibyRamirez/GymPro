import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CalendarEvent from '@/lib/models/CalendarEvent';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Token no proporcionado');
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');
  return user;
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    await verifyAuth(req);
    const { id } = await context.params;

    const event = await CalendarEvent.findById(id);
    if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    if (event.type !== 'class') return NextResponse.json({ error: 'Solo aplica para clases' }, { status: 400 });

    const capacity = event.capacity || 0;
    const bookedCount = event.bookedCount || 0;
    if (!capacity || bookedCount >= capacity) {
      return NextResponse.json({ error: 'No hay cupos disponibles' }, { status: 400 });
    }

    event.bookedCount = bookedCount + 1;
    await event.save();

    return NextResponse.json({ message: 'Reserva confirmada', event });
  } catch {
    return NextResponse.json({ error: 'Error al reservar cupo' }, { status: 500 });
  }
}
