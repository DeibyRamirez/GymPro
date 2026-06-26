import { NextRequest, NextResponse } from 'next/server'
import { handleAuthError, verifyAuth } from '@/lib/auth-server'
import { buildProgramFromTemplates, type WeeklyScheduleInput } from '@/lib/assignment/program-service'
import { recordActivitySafe } from '@/lib/activity-log/record'
import { assertCsrf } from '@/lib/csrf'
import connectDB from '@/lib/mongodb'
import Assignment from '@/lib/models/Assignment'
import { logApiError, logApiRequest } from '@/lib/api-debug'

type ProgramBody = {
  routineId?: string
  mealPlanId?: string
  durationWeeks?: number
  startDate?: string
  weeklySchedule?: WeeklyScheduleInput[]
  resetProgress?: boolean
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertCsrf(req)
    await connectDB()
    const user = await verifyAuth(req)
    const { id } = await context.params
    const body = (await req.json()) as ProgramBody

    logApiRequest('/api/assignments/[id]/program PUT', {
      userId: user._id.toString(),
      assignmentId: id,
    })

    const assignment = await Assignment.findById(id)
    if (!assignment) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 })
    }
    if (String(assignment.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para editar esta asignación' }, { status: 403 })
    }
    if (user.role !== 'admin' && assignment.trainerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No tienes permisos para editar esta asignación' }, { status: 403 })
    }

    if (!Array.isArray(body.weeklySchedule) || body.weeklySchedule.length === 0) {
      return NextResponse.json({ error: 'Debes enviar el calendario semanal' }, { status: 400 })
    }

    const hasActiveDay = body.weeklySchedule.some((day) => !day.isRestDay)
    if (!hasActiveDay) {
      return NextResponse.json({ error: 'Debe haber al menos un día de entrenamiento' }, { status: 400 })
    }

    if (!body.routineId && !body.weeklySchedule.some((day) => !day.isRestDay && day.routineTemplateId)) {
      return NextResponse.json({ error: 'Debes seleccionar al menos una rutina' }, { status: 400 })
    }

    const built = await buildProgramFromTemplates(user, {
      defaultRoutineTemplateId: body.routineId || null,
      mealPlanTemplateId: body.mealPlanId || null,
      weeklySchedule: body.weeklySchedule,
    })

    assignment.routineId = built.routineId as unknown as typeof assignment.routineId
    if (body.mealPlanId) {
      assignment.mealPlanId = built.mealPlanId as unknown as typeof assignment.mealPlanId
    }

    const resolvedMealPlanId = body.mealPlanId ? built.mealPlanId : assignment.mealPlanId
    assignment.weeklySchedule = built.weeklySchedule.map((day) => ({
      ...day,
      mealPlanId: resolvedMealPlanId as typeof day.mealPlanId,
    }))
    assignment.durationWeeks = body.durationWeeks || assignment.durationWeeks || 4

    if (body.startDate) {
      assignment.startDate = new Date(body.startDate)
    }

    if (body.resetProgress) {
      assignment.routineProgress = []
      assignment.dayCompletions = []
      assignment.progress = []
    }

    assignment.status = 'active'
    await assignment.save()

    const populated = await Assignment.findById(assignment._id)
      .populate('clientId', 'name email avatar role trainerId')
      .populate('trainerId', 'name email avatar role')
      .populate({ path: 'routineId', select: 'name description duration difficulty sourceRoutineId', populate: { path: 'exercises.exercise', select: 'name image instructions' } })
      .populate('mealPlanId', 'name description calories duration meals')

    recordActivitySafe({
      gymId: user.gymId,
      actorId: user._id,
      actorName: user.name,
      actorAvatar: user.avatar,
      action: 'assignment.create',
      summary: `actualizó el programa de ${(populated?.clientId as { name?: string })?.name || 'cliente'}`,
      targetType: 'Assignment',
      targetId: assignment._id,
      targetLabel: (populated?.clientId as { name?: string })?.name,
    })

    return NextResponse.json({
      message: 'Programa actualizado exitosamente',
      assignment: populated,
    })
  } catch (error) {
    logApiError('/api/assignments/[id]/program PUT', error)
    const authError = handleAuthError(error)
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status })
    }
    const message = error instanceof Error ? error.message : 'Error al actualizar el programa'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
