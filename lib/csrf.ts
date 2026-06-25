/**
 * PROTECCIÓN CSRF (Cross-Site Request Forgery)
 * ============================================
 *
 * Escenario de ataque:
 * 1. Usuario logueado en GymPro (cookie auth-token activa)
 * 2. Visita sitio malicioso que hace POST a gympro.com/api/sales
 * 3. El navegador envía la cookie automáticamente → venta no autorizada
 *
 * Defensa en capas que aplicamos:
 * 1. sameSite: 'lax' en la cookie (ya en setAuthCookie)
 * 2. Verificar Origin/Referer en mutaciones críticas (este archivo)
 * 3. Bearer token sin cookie → no aplica CSRF (API móvil usa header, no cookie)
 *
 * Cuándo llamar assertCsrf(req):
 * - POST, PUT, PATCH, DELETE que cambian datos sensibles
 * - Especialmente si usan cookies para auth (nuestro caso web)
 */

import { NextRequest } from 'next/server'
import { AuthError } from '@/lib/auth-server'

/** Orígenes permitidos = el mismo host que recibió la petición. */
function getAllowedOrigins(req: NextRequest): string[] {
  const host = req.headers.get('host')
  if (!host) return []

  return [`http://${host}`, `https://${host}`]
}

/**
 * Devuelve true si la petición parece legítima.
 * Los formularios cross-site no pueden falsificar Origin/Referer desde otro dominio.
 */
export function verifyCsrf(req: NextRequest): boolean {
  // Clientes API con Bearer no dependen de cookies → CSRF no aplica
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return true
  }

  const allowedOrigins = getAllowedOrigins(req)
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  if (origin && allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
    return true
  }

  if (referer && allowedOrigins.some((allowed) => referer.startsWith(allowed))) {
    return true
  }

  // Fallback opcional: header custom que un sitio externo no enviaría por defecto
  if (req.headers.get('x-requested-with') === 'GymPro') {
    return true
  }

  return false
}

/** Versión estricta: lanza 403 si verifyCsrf falla. Usar al inicio de handlers POST/PUT/DELETE. */
export function assertCsrf(req: NextRequest): void {
  if (!verifyCsrf(req)) {
    throw new AuthError('Solicitud rechazada por protección CSRF', 403)
  }
}
