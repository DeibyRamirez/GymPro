import sgMail from '@sendgrid/mail';
import { getSendGridConfig, isSendGridConfigured } from '@/lib/env';

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Envía un correo vía SendGrid.
 * Si no hay credenciales configuradas, no lanza error (modo degradado).
 */
export async function sendNotificationEmail(input: SendEmailInput): Promise<boolean> {
  if (!isSendGridConfigured()) {
    return false;
  }

  const { apiKey, fromEmail, fromName } = getSendGridConfig();
  sgMail.setApiKey(apiKey);

  await sgMail.send({
    to: input.to,
    from: { email: fromEmail, name: fromName },
    subject: input.subject,
    text: input.text,
    html: input.html || `<p>${input.text.replace(/\n/g, '<br/>')}</p>`,
  });

  return true;
}
