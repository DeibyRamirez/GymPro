import crypto from 'crypto'
import { getAppUrl } from '@/lib/env'

export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000 // 1 hora
export const MIN_PASSWORD_LENGTH = 6

export function hashPasswordResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function createPasswordResetToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex')
  return {
    token,
    hash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS),
  }
}

export function buildPasswordResetUrl(token: string, gymSlug?: string | null): string {
  const baseUrl = getAppUrl()
  const params = new URLSearchParams({ token })

  if (gymSlug) {
    return `${baseUrl}/portal/${encodeURIComponent(gymSlug)}/reset-password?${params.toString()}`
  }

  return `${baseUrl}/reset-password?${params.toString()}`
}

export function validateNewPassword(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
  }
  return null
}
