import { NextRequest, NextResponse } from 'next/server';
import { handleAuthError, verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { logApiError, logApiRequest } from '@/lib/api-debug';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    logApiRequest('/api/notifications/unread-count GET', {
      userId: user._id.toString(),
    });

    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      readAt: null,
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    logApiError('/api/notifications/unread-count GET', error);
    const authError = handleAuthError(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }
    return NextResponse.json({ error: 'Error al obtener contador' }, { status: 500 });
  }
}
