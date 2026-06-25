/**
 * POST /api/auth/login
 *
 * Orden de defensas (de afuera hacia adentro):
 * 1. Rate limit → frena fuerza bruta por IP
 * 2. Validación de input → email/password requeridos
 * 3. Consulta BD → credenciales + usuario activo
 * 4. Audit log → éxito o fallo (sin guardar la contraseña)
 * 5. JWT + cookie HTTP-only → sesión segura
 *
 * Eliminamos el "bypass de admin" hardcodeado: todo usuario debe existir en MongoDB.
 */
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Gym from '@/lib/models/Gym'
import { auditLog } from '@/lib/audit-log'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'
import {
  handleAuthError,
  setAuthCookie,
  signAuthToken,
  toPublicUser,
} from '@/lib/auth-server'

export async function POST(req: NextRequest) {
  try {
    const rateLimit = enforceRateLimit(req, 'auth:login', 10, 15 * 60 * 1000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfter || 60) },
        },
      )
    }

    await connectDB()

    const body = await req.json()
    const { email, password, gymSlug } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo electrónico y contraseña son requeridos' },
        { status: 400 },
      )
    }

    const gym = gymSlug ? await Gym.findOne({ slug: String(gymSlug).toLowerCase() }) : null
    if (gymSlug && !gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 })
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      ...(gym ? { gymId: gym._id } : {}),
    }).select('+password')

    if (!user) {
      auditLog('auth.login.failed', {
        email: String(email).toLowerCase(),
        ip: getClientIp(req),
        reason: 'invalid_credentials',
      })
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (!user.isActive) {
      auditLog('auth.login.failed', {
        userId: user._id.toString(),
        ip: getClientIp(req),
        reason: 'inactive_account',
      })
      return NextResponse.json(
        { error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' },
        { status: 403 },
      )
    }

    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      auditLog('auth.login.failed', {
        userId: user._id.toString(),
        ip: getClientIp(req),
        reason: 'invalid_credentials',
      })
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const token = signAuthToken(user)
    const userResponse = toPublicUser(user, gym)

    auditLog('auth.login.success', {
      userId: user._id.toString(),
      role: user.role,
      ip: getClientIp(req),
    })

    const response = NextResponse.json(
      {
        message: 'Inicio de sesión exitoso',
        user: userResponse,
        token,
      },
      { status: 200 },
    )

    setAuthCookie(response, token)
    return response
  } catch (error: unknown) {
    const authError = handleAuthError(error)
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status })
    }

    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión', details: message },
      { status: 500 },
    )
  }
}
