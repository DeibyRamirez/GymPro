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

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 });

    const event = await CalendarEvent.findOne({ attendanceCode: code, type: 'class' });
    if (!event) return NextResponse.json({ error: 'Código inválido' }, { status: 400 });

    return NextResponse.json({ message: 'Check-in validado', user: user.name, event: event.title });
  } catch {
    return NextResponse.json({ error: 'Error al validar check-in' }, { status: 500 });
  }
}
