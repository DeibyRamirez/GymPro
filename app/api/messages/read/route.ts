import { verifyAuth } from '@/lib/auth-server';
import { markThreadEntriesRead, threadHasUnreadForUser } from '@/lib/messages/unread';
import connectDB from '@/lib/mongodb';
import Message from '@/lib/models/Message';
import { logApiError, logApiRequest } from '@/lib/api-debug';
import { NextRequest, NextResponse } from 'next/server';

type ReadBody = {
  otherUserId?: string
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const body = (await req.json().catch(() => ({}))) as ReadBody;
    const otherUserId = body.otherUserId?.trim();

    logApiRequest('/api/messages/read POST', {
      userId: user._id.toString(),
      otherUserId: otherUserId || null,
    });

    const filter: Record<string, unknown> = {
      gymId: user.gymId || null,
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    };

    if (otherUserId) {
      filter.$or = [
        { senderId: user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: user._id },
      ];
    }

    const threads = await Message.find(filter);
    const readAt = new Date();
    let markedCount = 0;

    for (const thread of threads) {
      if (!threadHasUnreadForUser(thread, user._id.toString())) continue

      thread.content = markThreadEntriesRead(
        thread.content || [],
        user._id.toString(),
        readAt,
      );
      thread.readAt = readAt;
      await thread.save();
      markedCount += 1;
    }

    return NextResponse.json({ markedThreads: markedCount, readAt });
  } catch (error) {
    logApiError('/api/messages/read POST', error);
    return NextResponse.json({ error: 'Error al marcar mensajes como leídos' }, { status: 500 });
  }
}
