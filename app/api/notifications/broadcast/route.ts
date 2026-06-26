import { NextRequest, NextResponse } from 'next/server';
import { assertSameGym, handleAuthError, requireRoles, verifyAuth } from '@/lib/auth-server';
import { assertCsrf } from '@/lib/csrf';
import connectDB from '@/lib/mongodb';
import { notifyGymBroadcast } from '@/lib/notifications/triggers';
import { auditLog } from '@/lib/audit-log';
import { recordActivitySafe } from '@/lib/activity-log/record';
import { logApiError, logApiRequest } from '@/lib/api-debug';

export async function POST(req: NextRequest) {
  try {
    assertCsrf(req);
    await connectDB();
    const actor = await verifyAuth(req);
    requireRoles(actor, ['admin', 'trainer', 'superadmin']);

    const body = await req.json();
    const { title, body: messageBody, gymId, roles } = body as {
      title?: string;
      body?: string;
      gymId?: string;
      roles?: Array<'client' | 'trainer' | 'admin'>;
    };

    if (!title?.trim() || !messageBody?.trim()) {
      return NextResponse.json({ error: 'Título y mensaje son requeridos' }, { status: 400 });
    }

    const targetGymId = gymId || actor.gymId;
    if (!targetGymId) {
      return NextResponse.json({ error: 'Gym no especificado' }, { status: 400 });
    }

    assertSameGym(actor, targetGymId);

    logApiRequest('/api/notifications/broadcast POST', {
      userId: actor._id.toString(),
      gymId: String(targetGymId),
      title,
    });

    const sentCount = await notifyGymBroadcast({
      gymId: targetGymId,
      title: title.trim(),
      body: messageBody.trim(),
      roles,
    });

    auditLog('notification.broadcast', {
      actorId: actor._id.toString(),
      gymId: String(targetGymId),
      sentCount,
      title: title.trim(),
    });

    recordActivitySafe({
      gymId: targetGymId,
      actorId: actor._id,
      actorName: actor.name,
      actorAvatar: actor.avatar,
      action: 'notification.broadcast',
      summary: `envió un comunicado: "${title.trim()}"`,
      metadata: { sentCount, roles },
    });

    return NextResponse.json({
      message: 'Comunicado enviado',
      sentCount,
    });
  } catch (error) {
    logApiError('/api/notifications/broadcast POST', error);
    const authError = handleAuthError(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }
    return NextResponse.json({ error: 'Error al enviar comunicado' }, { status: 500 });
  }
}
