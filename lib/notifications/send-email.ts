import sgMail from '@sendgrid/mail';
import { getSendGridConfig, isSendGridConfigured } from '@/lib/env';

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type SendGridError = {
  response?: { body?: unknown };
  message?: string;
};

/**
 * Envía un correo vía SendGrid.
 * Si no hay credenciales configuradas, no lanza error (modo degradado).
 */
export async function sendNotificationEmail(input: SendEmailInput): Promise<boolean> {
  if (!isSendGridConfigured()) {
    console.warn('[sendgrid] SENDGRID_API_KEY o SENDGRID_FROM_EMAIL no configurados — email omitido');
    return false;
  }

  const { apiKey, fromEmail, fromName } = getSendGridConfig();
  sgMail.setApiKey(apiKey);

  try {
    await sgMail.send({
      to: input.to,
      from: { email: fromEmail, name: fromName },
      subject: input.subject,
      text: input.text,
      html: input.html || `<p>${input.text.replace(/\n/g, '<br/>')}</p>`,
    });
    return true;
  } catch (error) {
    const sgError = error as SendGridError;
    console.error('[sendgrid] Error al enviar:', sgError.response?.body || sgError.message || error);
    throw error;
  }
}
