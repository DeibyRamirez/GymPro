/**
 * POST /api/auth/create-admin
 *
 * Bootstrap del PRIMER administrador del sistema.
 * Protegido por ADMIN_SECRET_KEY (variable de entorno, no va en el código).
 *
 * Flujo recomendado en un proyecto nuevo:
 * 1. Desplegar con ADMIN_SECRET_KEY en el hosting
 * 2. Llamar este endpoint UNA vez con secretKey correcta
 * 3. Rotar o eliminar la clave si ya no hace falta
 */
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { logApiError, logApiRequest } from '@/lib/api-debug'
import { auditLog } from '@/lib/audit-log'
import { enforceRateLimit } from '@/lib/rate-limit'
import { assertCsrf } from '@/lib/csrf'
import { requireAdminSecretKey } from '@/lib/env'
import { handleAuthError } from '@/lib/auth-server'

export async function POST(req: NextRequest) {
  try {
    const rateLimit = enforceRateLimit(req, 'auth:create-admin', 5, 60 * 60 * 1000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
        { status: 429 },
      )
    }

    assertCsrf(req)
    await connectDB()

    const body = await req.json()
    const { name, email, password, secretKey } = body
    logApiRequest('/api/auth/create-admin POST', { name, email })

    if (secretKey !== requireAdminSecretKey()) {
      auditLog('access.denied', { route: '/api/auth/create-admin', reason: 'invalid_secret' })
      return NextResponse.json({ error: 'Clave secreta inválida' }, { status: 403 })
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, correo electrónico y contraseña son requeridos' },
        { status: 400 },
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 },
      )
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está registrado' },
        { status: 400 },
      )
    }

    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      return NextResponse.json(
        {
          error:
            'Ya existe un administrador en el sistema. Si necesitas crear otro, contacta al administrador actual.',
        },
        { status: 400 },
      )
    }

    const admin = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
    })

    await admin.save()

    auditLog('auth.create_admin', {
      userId: admin._id.toString(),
      email: admin.email,
    })

    return NextResponse.json(
      {
        message: 'Administrador creado exitosamente',
        user: {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 201 },
    )
  } catch (error: unknown) {
    logApiError('/api/auth/create-admin POST', error)
    const authError = handleAuthError(error)
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status })
    }

    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { error: 'Error al crear administrador', details: message },
      { status: 500 },
    )
  }
}
