import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth-server'
import {
  buildCompletionMap,
  calculateStreak,
  computeDayCompleted,
} from '@/lib/assignment/day-completion'
import connectDB from '@/lib/mongodb'
import Assignment from '@/lib/models/Assignment'
import { logApiError, logApiRequest } from '@/lib/api-debug'

type DayCompleteBody = {
  date?: string
  workoutCompleted?: boolean
  nutritionCompleted?: boolean
  markDayComplete?: boolean
  note?: string
}

function getAssignmentEnd(start: Date, durationWeeks?: number, endDate?: Date | null): Date {
  if (endDate) return new Date(endDate)
  const end = new Date(start)
  end.setDate(end.getDate() + (durationWeeks || 4) * 7)
  return end
}

function resolveDayContext(
  assignment: {
    weeklySchedule?: Array<{ dayOfWeek: number; isRestDay?: boolean; routineId?: unknown }>
    mealPlanId?: unknown
  },
  dateKey: string,
) {
  const weekday = new Date(`${dateKey}T12:00:00`).getDay()
  const scheduleItem = assignment.weeklySchedule?.find((item) => item.dayOfWeek === weekday)
  const isRestDay = scheduleItem?.isRestDay ?? !scheduleItem?.routineId
  const hasMealPlan = Boolean(assignment.mealPlanId)
  return { isRestDay, hasMealPlan }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const user = await verifyAuth(req)
    const { id } = await context.params
    const body = (await req.json()) as DayCompleteBody

    logApiRequest('/api/assignments/[id]/day-complete POST', {
      userId: user._id.toString(),
      assignmentId: id,
      date: body.date,
    })

    const assignment = await Assignment.findById(id)
    if (!assignment) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 })
    }
    if (String(assignment.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar este progreso' }, { status: 403 })
    }
    if (user.role !== 'client' || assignment.clientId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar este progreso' }, { status: 403 })
    }

    const dateKey = body.date?.slice(0, 10)
    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json({ error: 'Fecha inválida (YYYY-MM-DD)' }, { status: 400 })
    }

    const start = new Date(assignment.startDate)
    start.setHours(0, 0, 0, 0)
    const end = getAssignmentEnd(start, assignment.durationWeeks, assignment.endDate)
    end.setHours(23, 59, 59, 999)
    const target = new Date(`${dateKey}T12:00:00`)

    if (target < start || target > end) {
      return NextResponse.json({ error: 'La fecha está fuera del período de la asignación' }, { status: 400 })
    }

    const { isRestDay, hasMealPlan } = resolveDayContext(assignment, dateKey)
    const existing = assignment.dayCompletions?.find((item) => item.dateKey === dateKey)

    let workoutCompleted = existing?.workoutCompleted ?? false
    let nutritionCompleted = existing?.nutritionCompleted ?? false

    if (body.markDayComplete) {
      workoutCompleted = true
      if (hasMealPlan) nutritionCompleted = true
    } else {
      if (typeof body.workoutCompleted === 'boolean') workoutCompleted = body.workoutCompleted
      if (typeof body.nutritionCompleted === 'boolean') nutritionCompleted = body.nutritionCompleted
    }

    const dayCompleted = computeDayCompleted(isRestDay, hasMealPlan, workoutCompleted, nutritionCompleted)
    const completedAt = dayCompleted ? new Date() : null

    const nextEntry = {
      dateKey,
      workoutCompleted,
      nutritionCompleted,
      dayCompleted,
      completedAt,
      note: body.note?.trim() || existing?.note || null,
    }

    assignment.dayCompletions = assignment.dayCompletions || []
    const index = assignment.dayCompletions.findIndex((item) => item.dateKey === dateKey)
    if (index >= 0) {
      assignment.dayCompletions[index] = nextEntry
    } else {
      assignment.dayCompletions.push(nextEntry)
    }

    await assignment.save()

    return NextResponse.json({
      message: dayCompleted ? 'Día marcado como completado' : 'Progreso del día actualizado',
      dayCompletion: nextEntry,
      isRestDay,
      hasMealPlan,
    })
  } catch (error) {
    logApiError('/api/assignments/[id]/day-complete POST', error)
    return NextResponse.json({ error: 'Error al guardar el progreso del día' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const user = await verifyAuth(req)
    const { id } = await context.params

    const assignment = await Assignment.findById(id).select('dayCompletions clientId trainerId gymId')
    if (!assignment) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 })
    }
    if (String(assignment.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const isOwner =
      assignment.clientId.toString() === user._id.toString() ||
      assignment.trainerId.toString() === user._id.toString() ||
      ['admin', 'superadmin'].includes(user.role)

    if (!isOwner) {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const map = buildCompletionMap(assignment.dayCompletions || [])

    return NextResponse.json({
      dayCompletions: assignment.dayCompletions || [],
      streak: calculateStreak(map),
    })
  } catch (error) {
    logApiError('/api/assignments/[id]/day-complete GET', error)
    return NextResponse.json({ error: 'Error al obtener completitud' }, { status: 500 })
  }
}
