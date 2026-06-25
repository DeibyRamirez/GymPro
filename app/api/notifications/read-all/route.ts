import { NextRequest, NextResponse } from 'next/server';
import { handleAuthError, verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import { logApiError, logApiRequest } from '@/lib/api-debug';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    logApiRequest('/api/notifications/read-all POST', {
      userId: user._id.toString(),
    });

    const result = await Notification.updateMany(
      { userId: user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return NextResponse.json({
      message: 'Notificaciones marcadas como leídas',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logApiError('/api/notifications/read-all POST', error);
    const authError = handleAuthError(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }
    return NextResponse.json({ error: 'Error al marcar notificaciones' }, { status: 500 });
  }
}
