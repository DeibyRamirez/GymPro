import mongoose from 'mongoose';
import Notification, {
  type INotification,
  type NotificationChannel,
  type NotificationType,
} from '@/lib/models/Notification';
import User from '@/lib/models/User';
import { sendNotificationEmail } from '@/lib/notifications/send-email';

export type CreateNotificationInput = {
  userId: mongoose.Types.ObjectId | string;
  gymId?: mongoose.Types.ObjectId | string | null;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: INotification['metadata'];
  sendEmail?: boolean;
};

function toObjectId(value: mongoose.Types.ObjectId | string): mongoose.Types.ObjectId {
  return typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;
}

/**
 * Crea una notificación in-app y, opcionalmente, envía email con SendGrid.
 */
export async function createNotification(input: CreateNotificationInput): Promise<INotification> {
  const userId = toObjectId(input.userId);
  const gymId = input.gymId != null ? toObjectId(input.gymId) : null;
  const channels: NotificationChannel[] = ['in_app'];

  const notification = await Notification.create({
    userId,
    gymId,
    type: input.type,
    title: input.title,
    body: input.body,
    metadata: input.metadata || {},
    channels,
  });

  if (input.sendEmail !== false) {
    const user = await User.findById(userId).select('email name').lean<{ email: string; name: string } | null>();
    if (user?.email) {
      try {
        const sent = await sendNotificationEmail({
          to: user.email,
          subject: input.title,
          text: `${input.body}\n\n— GymPro`,
          html: buildEmailHtml(user.name, input.title, input.body, input.metadata?.link),
        });
        if (sent) {
          notification.channels = ['in_app', 'email'];
          notification.emailSentAt = new Date();
          await notification.save();
        }
      } catch (error) {
        console.error('[notifications] Error al enviar email:', error);
      }
    }
  }

  return notification;
}

function buildEmailHtml(name: string, title: string, body: string, link?: string | null): string {
  const cta = link
    ? `<p style="margin-top:24px"><a href="${link}" style="background:#16a34a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Ver en GymPro</a></p>`
    : '';

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111">
      <p>Hola ${name},</p>
      <h2 style="font-size:18px;margin:16px 0">${title}</h2>
      <p style="line-height:1.6;color:#444">${body.replace(/\n/g, '<br/>')}</p>
      ${cta}
      <p style="margin-top:32px;font-size:12px;color:#888">GymPro — gestión de tu gimnasio</p>
    </div>
  `;
}
