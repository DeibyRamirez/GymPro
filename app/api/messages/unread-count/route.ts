import { verifyAuth } from '@/lib/auth-server';
import { countUnreadMessages } from '@/lib/messages/unread';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import { logApiError, logApiRequest } from '@/lib/api-debug';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    logApiRequest('/api/messages/unread-count GET', { userId: user._id.toString(), role: user.role });

    const threads = await Message.find({
      gymId: user.gymId || null,
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    }).select('content');

    const unreadCount = countUnreadMessages(threads, user._id.toString());

    return NextResponse.json({ unreadCount });
  } catch (error) {
    logApiError('/api/messages/unread-count GET', error);
    return NextResponse.json({ error: 'Error al obtener mensajes no leídos' }, { status: 500 });
  }
}
