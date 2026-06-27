import { sendNotificationEmail } from '@/lib/notifications/send-email'

type SendPasswordResetEmailInput = {
  to: string
  name: string
  resetUrl: string
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<boolean> {
  const subject = 'Restablece tu contraseña — GymPro'
  const text = [
    `Hola ${input.name},`,
    '',
    'Recibimos una solicitud para restablecer tu contraseña en GymPro.',
    'Si fuiste tú, abre este enlace (válido por 1 hora):',
    input.resetUrl,
    '',
    'Si no solicitaste este cambio, ignora este correo. Tu contraseña actual seguirá funcionando.',
  ].join('\n')

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:520px">
      <p>Hola <strong>${input.name}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en GymPro.</p>
      <p>Si fuiste tú, usa el botón siguiente (válido por 1 hora):</p>
      <p style="margin:24px 0">
        <a href="${input.resetUrl}" style="background:#16a34a;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
          Restablecer contraseña
        </a>
      </p>
      <p style="font-size:12px;color:#666">Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>${input.resetUrl}</p>
      <p style="font-size:12px;color:#666">Si no solicitaste este cambio, ignora este correo.</p>
    </div>
  `

  return sendNotificationEmail({
    to: input.to,
    subject,
    text,
    html,
  })
}
