import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Message from '@/lib/models/Message';
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

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('otherUserId');

    const filters: Record<string, unknown> = { gymId: user.gymId || null };
    if (otherUserId) {
      filters.$or = [
        { senderId: user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user._id },
      ];
    } else {
      filters.$or = [{ senderId: user._id }, { receiverId: user._id }];
    }

    const messages = await Message.find(filters)
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role')
      .sort({ createdAt: 1 });

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener mensajes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const body = await req.json();
    const { receiverId, content, assignmentId } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return NextResponse.json({ error: 'Destinatario inválido' }, { status: 400 });

    const message = await Message.create({
      senderId: user._id,
      receiverId,
      assignmentId: assignmentId || null,
      gymId: user.gymId || null,
      content,
    });

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role');

    return NextResponse.json({ message: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al enviar mensaje' }, { status: 500 });
  }
}
