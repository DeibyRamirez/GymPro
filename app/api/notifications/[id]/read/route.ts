import { NextRequest, NextResponse } from 'next/server';
import { handleAuthError, verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { logApiError, logApiRequest } from '@/lib/api-debug';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;

    logApiRequest('/api/notifications/[id]/read PATCH', {
      userId: user._id.toString(),
      notificationId: id,
    });

    const notification = await Notification.findOne({ _id: id, userId: user._id });
    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    return NextResponse.json({
      message: 'Notificación marcada como leída',
      notification: {
        id: String(notification._id),
        readAt: notification.readAt,
      },
    });
  } catch (error) {
    logApiError('/api/notifications/[id]/read PATCH', error);
    const authError = handleAuthError(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }
    return NextResponse.json({ error: 'Error al marcar notificación' }, { status: 500 });
  }
}
