import { NextRequest, NextResponse } from 'next/server'
import { auditLog } from '@/lib/audit-log'
import { handleAuthError, verifyAuth } from '@/lib/auth-server'
import { validateNewPassword } from '@/lib/auth/password-reset'
import { assertCsrf } from '@/lib/csrf'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'
import { logApiError, logApiRequest } from '@/lib/api-debug'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function PATCH(req: NextRequest) {
  try {
    assertCsrf(req)

    const rateLimit = enforceRateLimit(req, 'auth:change-password', 10, 15 * 60 * 1000)
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
    const sessionUser = await verifyAuth(req)
    const body = await req.json()
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')
    const confirmPassword = String(body.confirmPassword || '')

    logApiRequest('/api/users/profile/password PATCH', {
      userId: sessionUser._id.toString(),
      role: sessionUser.role,
    })

    if (!currentPassword) {
      return NextResponse.json({ error: 'La contraseña actual es requerida' }, { status: 400 })
    }

    const passwordError = validateNewPassword(newPassword)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Las contraseñas no coinciden' }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe ser diferente a la actual' },
        { status: 400 },
      )
    }

    const user = await User.findById(sessionUser._id).select(
      '+password +passwordResetTokenHash +passwordResetExpires',
    )

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const isCurrentValid = await user.comparePassword(currentPassword)
    if (!isCurrentValid) {
      auditLog('auth.password_change', {
        userId: user._id.toString(),
        ip: getClientIp(req),
        success: false,
        reason: 'invalid_current_password',
      })
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 })
    }

    user.password = newPassword
    user.passwordResetTokenHash = null
    user.passwordResetExpires = null
    await user.save()

    auditLog('auth.password_change', {
      userId: user._id.toString(),
      role: user.role,
      ip: getClientIp(req),
      success: true,
    })

    return NextResponse.json({
      message: 'Contraseña actualizada correctamente',
    })
  } catch (error) {
    logApiError('/api/users/profile/password PATCH', error)
    const authError = handleAuthError(error)
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status })
    }
    return NextResponse.json({ error: 'Error al actualizar la contraseña' }, { status: 500 })
  }
}
