import mongoose from 'mongoose';
import Message from '@/lib/models/Message';
import User from '@/lib/models/User';
import connectDB from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Token no proporcionado');
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');
  return user;
}

function threadParticipants(thread: { senderId: unknown; receiverId: unknown }) {
  return [String(thread.senderId), String(thread.receiverId)];
}

function normalizeThreadMessages(thread: { content?: Array<unknown> }) {
  if (!Array.isArray(thread.content)) {
    thread.content = [];
  }
}

function getThreadMessages(thread: { content?: Array<{ senderId?: unknown; receiverId?: unknown; content?: string; readAt?: Date | null; createdAt?: Date }>; messages?: Array<{ senderId?: unknown; receiverId?: unknown; content?: string; readAt?: Date | null; createdAt?: Date }> }) {
  if (Array.isArray(thread.content)) return thread.content;
  if (Array.isArray(thread.messages)) return thread.messages;
  return [];
}

type MessageEntryPayload = {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  senderRole?: string | null;
  receiverRole?: string | null;
  content: string;
  readAt: null;
  createdAt: Date;
};

function resolveEntryRoles(entry: { senderId?: unknown; receiverId?: unknown; senderRole?: string | null; receiverRole?: string | null }, threadSenderRole?: string | null, threadReceiverRole?: string | null) {
  return {
    ...entry,
    senderRole: entry.senderRole || threadSenderRole || null,
    receiverRole: entry.receiverRole || threadReceiverRole || null,
  };
}

function enrichThreadPayload(thread: { senderId?: { _id?: unknown; id?: unknown; role?: string }; receiverId?: { _id?: unknown; id?: unknown; role?: string }; content?: Array<{ senderId?: unknown; receiverId?: unknown; senderRole?: string | null; receiverRole?: string | null; content?: string; readAt?: Date | null; createdAt?: Date }>; messages?: Array<{ senderId?: unknown; receiverId?: unknown; senderRole?: string | null; receiverRole?: string | null; content?: string; readAt?: Date | null; createdAt?: Date }> }) {
  const items = getThreadMessages(thread).map((entry) => {
    const senderMatchesThreadSender = String(entry.senderId) === String(thread.senderId?._id || thread.senderId?.id);
    const senderRole = senderMatchesThreadSender
      ? thread.senderId?.role
      : thread.receiverId?.role;
    const receiverRole = senderMatchesThreadSender
      ? thread.receiverId?.role
      : thread.senderId?.role;
    return resolveEntryRoles(entry, senderRole, receiverRole);
  });

  return { ...thread, content: items, messages: items };
}

function withRoles(entry: MessageEntryPayload, senderRole?: string | null, receiverRole?: string | null): MessageEntryPayload {
  return {
    ...entry,
    senderRole: senderRole || null,
    receiverRole: receiverRole || null,
  };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('otherUserId');
    const inboxOnly = searchParams.get('inboxOnly') === 'true';

    const threadFilter: Record<string, unknown> = { gymId: user.gymId || null };

    if (inboxOnly && user.role === 'trainer') {
      const clientIds = await User.distinct('_id', { trainerId: user._id, role: 'client', isActive: true });
      threadFilter.$or = [
        { senderId: { $in: clientIds }, receiverId: user._id },
        { senderId: user._id, receiverId: { $in: clientIds } },
      ];
    } else if (otherUserId) {
      threadFilter.$or = [
        { senderId: user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user._id },
      ];
    } else {
      threadFilter.$or = [{ senderId: user._id }, { receiverId: user._id }];
    }

    const messages = await Message.find(threadFilter)
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role')
      .sort({ updatedAt: -1 });

    const normalized = messages.map((thread) => {
      const plain = thread.toObject();
      return enrichThreadPayload(plain as never);
    });

    return NextResponse.json({ messages: normalized });
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

    const existing = await Message.findOne({
      gymId: user.gymId || null,
      $or: [
        { senderId: user._id, receiverId },
        { senderId: receiverId, receiverId: user._id },
      ],
    });

    const entry: MessageEntryPayload = {
      senderId: user._id as mongoose.Types.ObjectId,
      receiverId: receiverId as mongoose.Types.ObjectId,
      content,
      readAt: null,
      createdAt: new Date(),
    };
    const detailedEntry = withRoles(entry, user.role, receiver.role);

    let thread;
    if (existing) {
      normalizeThreadMessages(existing);
      (existing.content as unknown as MessageEntryPayload[]).push(detailedEntry);
      existing.senderId = user._id;
      existing.receiverId = receiverId;
      existing.readAt = null;
      thread = await existing.save();
    } else {
      thread = await Message.create({
        senderId: user._id,
        receiverId,
        assignmentId: assignmentId || null,
        gymId: user.gymId || null,
        content: [detailedEntry],
        readAt: null,
      });
    }

    const populated = await Message.findById(thread._id)
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role');

    const plain = populated?.toObject();
    return NextResponse.json({ message: enrichThreadPayload(plain as never) }, { status: existing ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al enviar mensaje' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const body = await req.json();
    const { threadId, content } = body;

    if (!threadId || !content) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const thread = await Message.findById(threadId);
    if (!thread) {
      return NextResponse.json({ error: 'Hilo no encontrado' }, { status: 404 });
    }

    normalizeThreadMessages(thread);
    if (!threadParticipants(thread).includes(String(user._id))) {
      return NextResponse.json({ error: 'No tienes permisos para responder este hilo' }, { status: 403 });
    }

    const receiverUser = await User.findById(String(thread.senderId) === String(user._id) ? thread.receiverId : thread.senderId).select('role');
    const receiverId = String(thread.senderId) === String(user._id) ? thread.receiverId : thread.senderId;
    (thread.content as unknown as MessageEntryPayload[]).push(withRoles({
      senderId: user._id as mongoose.Types.ObjectId,
      receiverId: receiverId as mongoose.Types.ObjectId,
      content,
      readAt: null,
      createdAt: new Date(),
    }, user.role, receiverUser?.role));
    thread.senderId = user._id;
    thread.receiverId = receiverId;
    thread.readAt = null;

    await thread.save();

    const populated = await Message.findById(thread._id)
      .populate('senderId', 'name avatar role')
      .populate('receiverId', 'name avatar role');

    const plain = populated?.toObject();
    return NextResponse.json({ message: enrichThreadPayload(plain as never) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al actualizar el hilo' }, { status: 500 });
  }
}
