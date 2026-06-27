import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Gym from '@/lib/models/Gym'
import { auditLog } from '@/lib/audit-log'
import { enforceRateLimit, getClientIp } from '@/lib/rate-limit'
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
} from '@/lib/auth/password-reset'
import { sendPasswordResetEmail } from '@/lib/notifications/send-password-reset-email'
import { isSendGridConfigured } from '@/lib/env'
import { logApiError, logApiRequest } from '@/lib/api-debug'

const GENERIC_SUCCESS_MESSAGE =
  'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.'

export async function POST(req: NextRequest) {
  try {
    const rateLimit = enforceRateLimit(req, 'auth:forgot-password', 5, 15 * 60 * 1000)
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
    const email = String(body.email || '').trim().toLowerCase()
    const gymSlug = body.gymSlug ? String(body.gymSlug).trim().toLowerCase() : null

    logApiRequest('/api/auth/forgot-password POST', { email, gymSlug })

    if (!email) {
      return NextResponse.json({ error: 'El correo electrónico es requerido' }, { status: 400 })
    }

    let gym = null
    if (gymSlug) {
      gym = await Gym.findOne({ slug: gymSlug, status: { $ne: 'suspended' } })
      if (!gym) {
        return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 })
      }
    }

    const user = await User.findOne({
      email,
      ...(gym ? { gymId: gym._id } : {}),
    }).select('+passwordResetTokenHash +passwordResetExpires name email isActive gymId role')

    let devResetUrl: string | undefined

    if (user && user.isActive) {
      const { token, hash, expiresAt } = createPasswordResetToken()
      user.passwordResetTokenHash = hash
      user.passwordResetExpires = expiresAt
      await user.save()

      let resolvedGymSlug = gymSlug
      if (!resolvedGymSlug && user.gymId) {
        const userGym = await Gym.findById(user.gymId).select('slug').lean<{ slug?: string }>()
        resolvedGymSlug = userGym?.slug || null
      }

      const resetUrl = buildPasswordResetUrl(token, resolvedGymSlug)

      if (isSendGridConfigured()) {
        await sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          resetUrl,
        })
      } else {
        console.warn('[password-reset] SendGrid no configurado. Enlace de desarrollo:', resetUrl)
        if (process.env.NODE_ENV !== 'production') {
          devResetUrl = resetUrl
        }
      }

      auditLog('auth.password_reset.request', {
        userId: user._id.toString(),
        role: user.role,
        ip: getClientIp(req),
        emailSent: isSendGridConfigured(),
      })
    } else {
      auditLog('auth.password_reset.request', {
        ip: getClientIp(req),
        email,
        matched: false,
      })
    }

    return NextResponse.json({
      message: GENERIC_SUCCESS_MESSAGE,
      ...(devResetUrl ? { devResetUrl } : {}),
    })
  } catch (error) {
    logApiError('/api/auth/forgot-password POST', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
