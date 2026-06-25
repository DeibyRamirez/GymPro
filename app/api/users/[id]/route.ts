/**
 * GET/PUT/DELETE /api/users/[id]
 *
 * Ejemplo completo del pilar Seguridad aplicado a un CRUD:
 *
 * GET  → verifyAuth + canAccessUser + assertSameGym
 * PUT  → assertCsrf + verifyAuth + permisos por rol + validateAvatarUrl + auditLog
 * DELETE → assertCsrf + requireRoles(admin) + assertSameGym + auditLog
 *
 * canAccessUser(): lógica de negocio que no cabe en requireRoles genérico
 * (trainer solo ve SUS clientes, no todos los del gym).
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  assertSameGym,
  handleAuthError,
  requireRoles,
  verifyAuth,
} from '@/lib/auth-server'
import connectDB from '@/lib/mongodb'
import User, { IUser } from '@/lib/models/User'
import { logApiError, logApiRequest } from '@/lib/api-debug'
import { assertCsrf } from '@/lib/csrf'
import { auditLog } from '@/lib/audit-log'
import { validateAvatarUrl } from '@/lib/file-validation'

type UserUpdateBody = Partial<{
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'trainer' | 'client'
  avatar: string
  trainerId: string | null
  age: number
  weight: number
  height: number
  gender: 'masculino' | 'femenino' | 'otro'
  phone: string
  goal: 'perder_peso' | 'ganar_masa' | 'mantenimiento' | 'tonificar' | 'resistencia' | 'otro'
  activityLevel: 'principiante' | 'intermedio' | 'avanzado'
  medicalConditions: string
  isActive: boolean
}>

const updatableFields = [
  'name',
  'email',
  'role',
  'avatar',
  'trainerId',
  'age',
  'weight',
  'height',
  'gender',
  'phone',
  'goal',
  'activityLevel',
  'medicalConditions',
  'isActive',
] as const

/**
 * Reglas de acceso granulares por rol.
 * requireRoles() solo dice "¿es admin/trainer/client?".
 * canAccessUser() responde "¿puede ver/editar ESTE usuario concreto?"
 */
function canAccessUser(currentUser: IUser, targetUser: IUser | null): boolean {
  if (!targetUser) return false
  if (currentUser.role === 'superadmin') return true
  if (currentUser._id.toString() === targetUser._id.toString()) return true
  if (currentUser.role === 'admin') {
    return currentUser.gymId?.toString() === targetUser.gymId?.toString()
  }
  if (currentUser.role === 'trainer') {
    return (
      currentUser.gymId?.toString() === targetUser.gymId?.toString() &&
      (targetUser.trainerId?.toString() === currentUser._id.toString() ||
        targetUser._id.toString() === currentUser._id.toString())
    )
  }
  return false
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const currentUser = await verifyAuth(req)
    const { id } = await context.params
    logApiRequest('/api/users/[id] GET', { userId: id })

    const user = await User.findById(id).select('-password')
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    if (!canAccessUser(currentUser, user)) {
      auditLog('access.denied', {
        route: '/api/users/[id] GET',
        userId: currentUser._id.toString(),
        targetUserId: id,
      })
      return NextResponse.json({ error: 'No tienes permisos para ver este usuario' }, { status: 403 })
    }

    assertSameGym(currentUser, user.gymId)

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        trainerId: user.trainerId?.toString(),
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        phone: user.phone,
        goal: user.goal,
        activityLevel: user.activityLevel,
        medicalConditions: user.medicalConditions,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    logApiError('/api/users/[id] GET', error)
    const authError = handleAuthError(error)
    return NextResponse.json({ error: authError.message }, { status: authError.status })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertCsrf(req)
    await connectDB()
    const currentUser = await verifyAuth(req)
    const { id } = await context.params
    logApiRequest('/api/users/[id] PUT', {
      currentUserId: currentUser._id.toString(),
      targetUserId: id,
    })

    const user = await User.findById(id)
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    if (!canAccessUser(currentUser, user)) {
      return NextResponse.json({ error: 'No tienes permisos para editar este usuario' }, { status: 403 })
    }

    assertSameGym(currentUser, user.gymId)

    const body = (await req.json()) as UserUpdateBody
    const updateData: Record<string, unknown> = {}

    for (const key of updatableFields) {
      const value = body[key]
      if (value !== undefined) updateData[key] = value
    }

    if (currentUser.role === 'client') {
      delete updateData.role
      delete updateData.isActive
      delete updateData.trainerId
    }

    if (currentUser.role === 'trainer') {
      delete updateData.role
      delete updateData.isActive
    }

    if (currentUser.role === 'admin') {
      delete updateData.role
    }

    if (updateData.avatar !== undefined && !validateAvatarUrl(updateData.avatar)) {
      return NextResponse.json({ error: 'URL de avatar inválida' }, { status: 400 })
    }

    if (updateData.role && updateData.role !== 'client' && body.trainerId === undefined) {
      updateData.trainerId = null
    }

    Object.entries(updateData).forEach(([key, value]) => {
      user.set(key, value)
    })

    await user.save()

    auditLog('user.update', {
      actorId: currentUser._id.toString(),
      targetUserId: id,
      fields: Object.keys(updateData),
    })

    const updatedUser = await User.findById(id).select('-password')
    if (!updatedUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        trainerId: updatedUser.trainerId?.toString(),
        isActive: updatedUser.isActive,
      },
    })
  } catch (error) {
    logApiError('/api/users/[id] PUT', error)
    const authError = handleAuthError(error)
    return NextResponse.json({ error: authError.message }, { status: authError.status })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertCsrf(req)
    await connectDB()
    const currentUser = await verifyAuth(req)
    const { id } = await context.params
    logApiRequest('/api/users/[id] DELETE', {
      currentUserId: currentUser._id.toString(),
      targetUserId: id,
    })

    requireRoles(currentUser, ['admin', 'superadmin'])

    const user = await User.findById(id)
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    assertSameGym(currentUser, user.gymId)

    await User.findByIdAndUpdate(id, { isActive: false })

    auditLog('user.delete', {
      actorId: currentUser._id.toString(),
      targetUserId: id,
    })

    return NextResponse.json({ message: 'Usuario desactivado exitosamente' })
  } catch (error) {
    logApiError('/api/users/[id] DELETE', error)
    const authError = handleAuthError(error)
    return NextResponse.json({ error: authError.message }, { status: authError.status })
  }
}
