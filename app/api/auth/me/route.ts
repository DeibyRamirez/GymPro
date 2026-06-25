/**
 * GET /api/auth/me
 *
 * Restaura la sesión del frontend al recargar la página.
 * Usa verifyAuth centralizado: si el token expiró o el user está inactivo → 401.
 */
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Gym from '@/lib/models/Gym'
import { logApiError, logApiRequest } from '@/lib/api-debug'
import { handleAuthError, toPublicUser, verifyAuth } from '@/lib/auth-server'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    logApiRequest('/api/auth/me GET', { hasToken: !!req.cookies.get('auth-token')?.value })

    const user = await verifyAuth(req)
    const gym = user.gymId ? await Gym.findById(user.gymId).select('slug name') : null

    return NextResponse.json({ user: toPublicUser(user, gym) })
  } catch (error) {
    logApiError('/api/auth/me GET', error)
    const authError = handleAuthError(error)
    return NextResponse.json({ user: null }, { status: authError.status })
  }
}
