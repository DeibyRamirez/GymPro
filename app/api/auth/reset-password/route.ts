import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { auditLog } from '@/lib/audit-log'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'
import {
  hashPasswordResetToken,
  validateNewPassword,
} from '@/lib/auth/password-reset'
import { logApiError, logApiRequest } from '@/lib/api-debug'

async function findUserByResetToken(token: string) {
  const tokenHash = hashPasswordResetToken(token)
  return User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetTokenHash +passwordResetExpires')
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const token = new URL(req.url).searchParams.get('token')?.trim()

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const user = await findUserByResetToken(token)
    return NextResponse.json({ valid: Boolean(user) })
  } catch (error) {
    logApiError('/api/auth/reset-password GET', error)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = enforceRateLimit(req, 'auth:reset-password', 10, 15 * 60 * 1000)
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
    const token = String(body.token || '').trim()
    const password = String(body.password || '')
    const confirmPassword = String(body.confirmPassword || '')

    logApiRequest('/api/auth/reset-password POST', { hasToken: Boolean(token) })

    if (!token) {
      return NextResponse.json({ error: 'El enlace de recuperación no es válido' }, { status: 400 })
    }

    const passwordError = validateNewPassword(password)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 })
    }

    const user = await findUserByResetToken(token)
    if (!user) {
      auditLog('auth.password_reset.failed', {
        ip: getClientIp(req),
        reason: 'invalid_or_expired_token',
      })
      return NextResponse.json(
        { error: 'El enlace expiró o ya no es válido. Solicita uno nuevo.' },
        { status: 400 },
      )
    }

    user.password = password
    user.passwordResetTokenHash = null
    user.passwordResetExpires = null
    await user.save()

    auditLog('auth.password_reset.complete', {
      userId: user._id.toString(),
      role: user.role,
      ip: getClientIp(req),
    })

    return NextResponse.json({
      message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
    })
  } catch (error) {
    logApiError('/api/auth/reset-password POST', error)
    return NextResponse.json({ error: 'Error al restablecer la contraseña' }, { status: 500 })
  }
}
