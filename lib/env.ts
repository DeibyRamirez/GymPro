/**
 * VALIDACIÓN DE VARIABLES DE ENTORNO (SECRETS)
 * =============================================
 *
 * Nunca confíes en que `.env` esté bien configurado.
 * Este módulo falla rápido (fail-fast) si falta un secret crítico,
 * en lugar de descubrirlo en producción con tokens inválidos.
 *
 * Regla de oro: los secrets NUNCA van en el código fuente.
 * Van en `.env` (local) o en el panel del hosting (Vercel, AWS Secrets Manager…).
 */

/** Valor de ejemplo del .env.example — rechazado en producción. */
const PLACEHOLDER_JWT = 'your-jwt-secret'

/**
 * Secret para firmar/verificar JWT.
 * Si alguien obtiene este valor, puede falsificar sesiones de cualquier usuario.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()

  if (!secret) {
    throw new Error('JWT_SECRET no está configurado. Define la variable en .env')
  }

  // Evita desplegar a producción con el placeholder del tutorial
  if (process.env.NODE_ENV === 'production' && secret === PLACEHOLDER_JWT) {
    throw new Error('JWT_SECRET no puede usar el valor por defecto en producción')
  }

  return secret
}

/** Clave opcional para el endpoint de bootstrap del primer admin. */
export function getAdminSecretKey(): string | null {
  const key = process.env.ADMIN_SECRET_KEY?.trim()
  if (!key) return null
  return key
}

/**
 * Obliga a tener ADMIN_SECRET_KEY configurada.
 * Usado en POST /api/auth/create-admin para evitar que cualquiera cree admins.
 */
export function requireAdminSecretKey(): string {
  const key = getAdminSecretKey()

  if (!key) {
    throw new Error('ADMIN_SECRET_KEY no está configurado')
  }

  return key
}

/** SendGrid — opcional; sin configurar, las notificaciones solo se guardan in-app. */
export function isSendGridConfigured(): boolean {
  return Boolean(process.env.SENDGRID_API_KEY?.trim() && process.env.SENDGRID_FROM_EMAIL?.trim())
}

export function getSendGridConfig(): { apiKey: string; fromEmail: string; fromName: string } {
  const apiKey = process.env.SENDGRID_API_KEY?.trim()
  const fromEmail = process.env.SENDGRID_FROM_EMAIL?.trim()

  if (!apiKey || !fromEmail) {
    throw new Error('SendGrid no está configurado (SENDGRID_API_KEY y SENDGRID_FROM_EMAIL)')
  }

  return {
    apiKey,
    fromEmail,
    fromName: process.env.SENDGRID_FROM_NAME?.trim() || 'GymPro',
  }
}

/** URL base de la app (links en emails de invitación). */
export function getAppUrl(): string {
  const url =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  return url.replace(/\/$/, '')
}
