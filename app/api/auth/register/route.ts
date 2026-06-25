/**
 * POST /api/auth/register
 *
 * Registro público por portal de gimnasio (gymSlug obligatorio).
 * - Solo roles trainer/client (admin/superadmin se crean por otros flujos)
 * - Cliente debe elegir membresía válida del gym
 * - Trainer asignado debe pertenecer al mismo gymId
 */
import Gym from '@/lib/models/Gym'
import User from '@/lib/models/User'
import connectDB from '@/lib/mongodb'
import { NextRequest, NextResponse } from 'next/server'
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
    const rateLimit = enforceRateLimit(req, 'auth:register', 5, 60 * 60 * 1000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
        { status: 429 },
      )
    }

    await connectDB()

    const body = await req.json()
    const {
      name,
      email,
      password,
      role,
      gymSlug,
      membershipPlan,
      trainerId,
      age,
      weight,
      height,
      gender,
      phone,
      goal,
      activityLevel,
      medicalConditions,
    } = body

    if (!name || !email || !password || !gymSlug) {
      return NextResponse.json(
        { error: 'Nombre, correo electrónico, contraseña y gimnasio son requeridos' },
        { status: 400 },
      )
    }

    const gym = await Gym.findOne({ slug: String(gymSlug).toLowerCase() })
    if (!gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 })
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 },
      )
    }

    const existingUser = await User.findOne({ email: email.toLowerCase(), gymId: gym._id })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está registrado' },
        { status: 400 },
      )
    }

    const validRoles = ['trainer', 'client']
    const userRole = role && validRoles.includes(role) ? role : 'client'

    if (role === 'admin' || role === 'superadmin') {
      return NextResponse.json(
        { error: 'No se puede crear una cuenta de administrador desde el registro' },
        { status: 403 },
      )
    }

    const selectedPlanName = String(membershipPlan?.name || '').trim()
    const selectedPlan = selectedPlanName
      ? gym.plans.find((plan: { name: string }) => plan.name.toLowerCase() === selectedPlanName.toLowerCase())
      : null

    if (userRole === 'client') {
      if (!selectedPlanName) {
        return NextResponse.json(
          { error: 'Debes seleccionar una membresía para continuar' },
          { status: 400 },
        )
      }

      if (!selectedPlan) {
        return NextResponse.json(
          { error: 'La membresía seleccionada no existe en este gimnasio' },
          { status: 400 },
        )
      }
    }

    if (userRole === 'client' && trainerId) {
      const trainer = await User.findById(trainerId)
      if (!trainer || trainer.role !== 'trainer') {
        return NextResponse.json(
          { error: 'El entrenador especificado no existe o no es válido' },
          { status: 400 },
        )
      }

      if (trainer.gymId?.toString() !== gym._id.toString()) {
        return NextResponse.json(
          { error: 'El entrenador no pertenece a este gimnasio' },
          { status: 400 },
        )
      }
    }

    const userData: Record<string, unknown> = {
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      gymId: gym._id,
      trainerId: userRole === 'client' && trainerId ? trainerId : undefined,
    }

    if (userRole === 'client' && selectedPlan) {
      userData.membershipPlan = {
        name: selectedPlan.name,
        price: selectedPlan.price,
        description: selectedPlan.description,
        featured: selectedPlan.featured,
      }
    }

    if (userRole === 'client') {
      if (age) userData.age = parseInt(age)
      if (weight) userData.weight = parseFloat(weight)
      if (height) userData.height = parseFloat(height)
      if (gender) userData.gender = gender
      if (phone) userData.phone = phone
      if (goal) userData.goal = goal
      if (activityLevel) userData.activityLevel = activityLevel
      if (medicalConditions) userData.medicalConditions = medicalConditions
    }

    const newUser = new User(userData)
    await newUser.save()

    const token = signAuthToken(newUser)
    const userResponse = toPublicUser(newUser, gym)

    auditLog('auth.register', {
      userId: newUser._id.toString(),
      role: newUser.role,
      gymId: gym._id.toString(),
      ip: getClientIp(req),
    })

    const response = NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: userResponse,
        token,
      },
      { status: 201 },
    )

    setAuthCookie(response, token)
    return response
  } catch (error: unknown) {
    console.error('Error en registro:', error)
    const authError = handleAuthError(error)
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status })
    }

    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { error: 'Error al registrar usuario', details: message },
      { status: 500 },
    )
  }
}
