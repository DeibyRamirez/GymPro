/**
 * RATE LIMITING (LÍMITE DE PETICIONES)
 * ====================================
 *
 * Protege endpoints sensibles contra fuerza bruta (login) y abuso (registro).
 *
 * Implementación: ventana fija en memoria (Map).
 * - Clave: "auth:login:192.168.1.1" (scope + IP)
 * - Ventana: ej. 15 minutos, máximo 10 intentos
 *
 * LIMITACIÓN: al reiniciar el servidor se resetea el contador.
 * En producción a escala, usa Redis (Upstash, etc.) para compartir
 * el contador entre instancias/serverless.
 *
 * Uso en una ruta:
 *   const result = enforceRateLimit(req, 'auth:login', 10, 15 * 60 * 1000)
 *   if (!result.success) return NextResponse.json({ error: '...' }, { status: 429 })
 */

import { NextRequest } from 'next/server'

type RateLimitEntry = {
  count: number
  resetAt: number // timestamp (ms) cuando expira la ventana
}

/** Almacén en memoria. En multi-instancia, cada servidor tiene su propio Map. */
const store = new Map<string, RateLimitEntry>()

export type RateLimitResult = {
  success: boolean
  retryAfter?: number // segundos hasta que el cliente puede reintentar
}

/**
 * Obtiene la IP real del cliente.
 * Detrás de proxy/CDN (Vercel, Cloudflare), `req.ip` puede no ser fiable;
 * se usa `x-forwarded-for` (primera IP de la cadena).
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/** Lógica core: incrementa contador o rechaza si se superó el límite. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  // Primera petición o ventana expirada → reiniciar contador
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true }
  }

  if (entry.count >= limit) {
    return {
      success: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count += 1
  return { success: true }
}

/** Atajo: combina scope + IP del request en una sola llamada. */
export function enforceRateLimit(
  req: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const ip = getClientIp(req)
  return checkRateLimit(`${scope}:${ip}`, limit, windowMs)
}
