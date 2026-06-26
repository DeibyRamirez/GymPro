import { NextRequest, NextResponse } from 'next/server';
import { handleAuthError, requireRoles, verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import { isSendGridConfigured } from '@/lib/env';
import { sendNotificationEmail } from '@/lib/notifications/send-email';
import { logApiError } from '@/lib/api-debug';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    requireRoles(user, ['admin', 'trainer', 'superadmin', 'client']);

    if (!isSendGridConfigured()) {
      return NextResponse.json(
        {
          error: 'SendGrid no está configurado',
          missing: ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'],
        },
        { status: 503 },
      );
    }

    await sendNotificationEmail({
      to: user.email,
      subject: 'Prueba de correo — GymPro',
      text: 'Si recibes este mensaje, SendGrid está configurado correctamente en GymPro.',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
          <h2>SendGrid funciona correctamente</h2>
          <p>Hola ${user.name}, este es un correo de prueba enviado desde GymPro.</p>
          <p style="color:#666;font-size:13px">Puedes eliminar este endpoint en producción si lo deseas.</p>
        </div>
      `,
    });

    return NextResponse.json({
      message: 'Correo de prueba enviado',
      to: user.email,
    });
  } catch (error) {
    logApiError('/api/notifications/test-email POST', error);
    const authError = handleAuthError(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }
    return NextResponse.json({ error: 'Error al enviar correo de prueba' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
