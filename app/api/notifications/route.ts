import { NextRequest, NextResponse } from 'next/server';
import { handleAuthError, verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { buildPagination, parsePagination } from '@/lib/pagination';
import { logApiError, logApiRequest } from '@/lib/api-debug';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const { page, limit, skip } = parsePagination(searchParams, 30);

    logApiRequest('/api/notifications GET', {
      userId: user._id.toString(),
      unreadOnly,
      page,
      limit,
    });

    const filters: Record<string, unknown> = { userId: user._id };
    if (unreadOnly) {
      filters.readAt = null;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filters),
      Notification.countDocuments({ userId: user._id, readAt: null }),
    ]);

    return NextResponse.json({
      notifications: notifications.map((item) => ({
        id: String(item._id),
        type: item.type,
        title: item.title,
        body: item.body,
        readAt: item.readAt,
        channels: item.channels,
        metadata: item.metadata,
        createdAt: item.createdAt,
      })),
      unreadCount,
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    logApiError('/api/notifications GET', error);
    const authError = handleAuthError(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}
