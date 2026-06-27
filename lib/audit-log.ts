/**
 * AUDITORÍA (AUDIT LOG)
 * =====================
 *
 * Registra acciones sensibles para trazabilidad y forense.
 * No sustituye un SIEM empresarial, pero es la base correcta.
 *
 * Por ahora escribe JSON a consola (stdout).
 * En producción puedes redirigir stdout a:
 * - Datadog, CloudWatch, Logtail, etc.
 * - O persistir en colección MongoDB `AuditLog`
 *
 * Buenas prácticas:
 * - Registrar QUIÉN (userId), QUÉ (action), CUÁNDO (timestamp)
 * - NO registrar contraseñas, tokens ni datos PCI
 * - Usar acciones tipadas (union type) para evitar strings sueltos
 */

export type AuditAction =
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'auth.register'
  | 'auth.logout'
  | 'auth.create_admin'
  | 'auth.password_reset.request'
  | 'auth.password_reset.complete'
  | 'auth.password_reset.failed'
  | 'auth.password_change'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'sale.create'
  | 'assignment.create'
  | 'assignment.update'
  | 'notification.broadcast'
  | 'access.denied'

type AuditDetails = Record<string, unknown>

/**
 * Emite un evento de auditoría estructurado.
 *
 * Ejemplo de salida:
 * {"type":"audit","action":"auth.login.failed","timestamp":"...","ip":"...","reason":"invalid_credentials"}
 */
export function auditLog(action: AuditAction, details: AuditDetails = {}) {
  console.log(
    JSON.stringify({
      type: 'audit',
      action,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  )
}
