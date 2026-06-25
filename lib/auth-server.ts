/**
 * AUTENTICACIÓN Y AUTORIZACIÓN DEL SERVIDOR
 * ==========================================
 *
 * ¿Por qué existe este archivo?
 * Antes, cada ruta API (`app/api/*`) tenía su propia copia de `verifyAuth`.
 * Eso genera bugs: un endpoint valida distinto a otro, y un fix de seguridad
 * hay que repetirlo en 25 archivos. Este módulo centraliza toda la lógica.
 *
 * Patrón que aprendes aquí: "Single Source of Truth" para seguridad.
 * En otros proyectos (Express, Fastify, NestJS) el concepto es el mismo:
 * un middleware o guard reutilizable, no lógica duplicada por ruta.
 *
 * Flujo típico en un endpoint protegido:
 *   1. verifyAuth(req)     → ¿Quién es? (autenticación)
 *   2. requireRoles(...)   → ¿Puede hacer esto? (autorización por rol)
 *   3. assertSameGym(...)  → ¿Le pertenece el dato? (aislamiento multi-tenant)
 *   4. assertCsrf(req)     → ¿Viene del frontend legítimo? (ver lib/csrf.ts)
 */

import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User, { IUser } from '@/lib/models/User'
import type { UserRole } from '@/lib/auth'
import { getJwtSecret } from '@/lib/env'

/**
 * Errores tipados con código HTTP.
 * En lugar de `throw new Error('...')` genérico, usamos clases que llevan
 * el status (401, 403). Así `handleAuthError` puede responder correctamente
 * sin que cada ruta tenga un if/else enorme en el catch.
 */
export class AuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

/** 403 = autenticado pero sin permiso (distinto de 401 = no autenticado). */
export class ForbiddenError extends AuthError {
  constructor(message = 'Acceso denegado') {
    super(message, 403)
  }
}

/**
 * Verifica que la petición traiga un JWT válido y devuelve el usuario de BD.
 *
 * Estrategia dual (patrón Strategy):
 * - Cookie `auth-token` → navegador web (HTTP-only, no accesible desde JS)
 * - Header `Authorization: Bearer` → clientes móviles o integraciones API
 *
 * Importante: siempre re-consultamos la BD después de verificar el JWT.
 * El token puede ser válido pero el usuario desactivado → rechazamos igual.
 */
export async function verifyAuth(req: NextRequest): Promise<IUser> {
  await connectDB()

  const token =
    req.cookies.get('auth-token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new AuthError('Token no proporcionado', 401)
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string }
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive) {
      throw new AuthError('Usuario no encontrado o inactivo', 401)
    }

    return user
  } catch (error) {
    if (error instanceof AuthError) throw error
    // jwt.verify lanza si el token expiró o fue alterado
    throw new AuthError('Token inválido o expirado', 401)
  }
}

/**
 * RBAC (Role-Based Access Control): lista blanca de roles permitidos.
 * Uso: requireRoles(user, ['admin', 'superadmin'])
 */
export function requireRoles(user: IUser, roles: UserRole[]): void {
  if (!roles.includes(user.role as UserRole)) {
    throw new ForbiddenError('No tienes permisos para realizar esta acción')
  }
}

/**
 * Aislamiento multi-tenant: un admin de "Gym A" no puede tocar datos de "Gym B".
 * Superadmin es la excepción (acceso global).
 *
 * Úsalo siempre que accedas a un recurso que tenga `gymId` (usuarios, ventas, rutinas…).
 */
export function assertSameGym(
  user: IUser,
  resourceGymId: { toString(): string } | string | null | undefined,
): void {
  if (user.role === 'superadmin') return

  if (!user.gymId || !resourceGymId) {
    throw new ForbiddenError('Recurso no pertenece a tu gimnasio')
  }

  if (user.gymId.toString() !== resourceGymId.toString()) {
    throw new ForbiddenError('Recurso no pertenece a tu gimnasio')
  }
}

/** Convierte AuthError/ForbiddenError en respuesta JSON con el status correcto. */
export function handleAuthError(error: unknown): { message: string; status: number } {
  if (error instanceof AuthError) {
    return { message: error.message, status: error.status }
  }

  return { message: 'Error de autenticación', status: 500 }
}

/** Genera el JWT. Payload mínimo: solo IDs y rol, nunca contraseñas. */
export function signAuthToken(user: IUser): string {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' },
  )
}

/**
 * Cookie de sesión segura.
 * - httpOnly: JavaScript del navegador no puede leerla (mitiga XSS)
 * - secure: solo HTTPS en producción
 * - sameSite: 'lax' reduce riesgo CSRF en navegación normal
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días en segundos
  })
}

/** Formato estándar de usuario para el frontend (sin password ni campos internos). */
export function toPublicUser(
  user: IUser,
  gym?: { slug?: string; name?: string } | null,
) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    trainerId: user.trainerId?.toString(),
    gymId: user.gymId?.toString(),
    gymSlug: gym?.slug || null,
    gymName: gym?.name || null,
    membershipPlan: user.membershipPlan || null,
  }
}
