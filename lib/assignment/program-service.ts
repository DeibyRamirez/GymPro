import mongoose from 'mongoose'
import MealPlan from '@/lib/models/MealPlan'
import Routine from '@/lib/models/Routine'
import type { IUser } from '@/lib/models/User'

export type WeeklyScheduleInput = {
  dayOfWeek: number
  isRestDay?: boolean
  title?: string
  notes?: string
  /** Rutina del calendario (referencia directa, sin clonar). */
  routineTemplateId?: string | null
}

export type BuildProgramInput = {
  defaultRoutineTemplateId?: string | null
  mealPlanTemplateId?: string | null
  weeklySchedule: WeeklyScheduleInput[]
}

export type BuiltProgram = {
  routineId: string | null
  mealPlanId: string | null
  weeklySchedule: Array<{
    dayOfWeek: number
    isRestDay: boolean
    title?: string
    notes?: string
    routineId: mongoose.Types.ObjectId | null
    mealPlanId: mongoose.Types.ObjectId | null
  }>
}

async function resolveRoutineReference(
  routineId: string,
  user: IUser,
): Promise<string> {
  const routine = await Routine.findOne({
    _id: routineId,
    isActive: true,
    ...(user.gymId ? { gymId: user.gymId } : { gymId: null }),
  })

  if (!routine) {
    throw new Error('Rutina inválida')
  }

  if (user.role === 'trainer' && routine.createdBy.toString() !== user._id.toString()) {
    throw new Error('Rutina inválida')
  }

  return routine._id.toString()
}

async function resolveMealPlanReference(
  mealPlanId: string,
  user: IUser,
): Promise<string> {
  const mealPlan = await MealPlan.findOne({
    _id: mealPlanId,
    isActive: true,
    ...(user.gymId ? { gymId: user.gymId } : { gymId: null }),
  })

  if (!mealPlan) {
    throw new Error('Plan alimenticio inválido')
  }

  if (user.role === 'trainer' && mealPlan.createdBy.toString() !== user._id.toString()) {
    throw new Error('Plan alimenticio inválido')
  }

  return mealPlan._id.toString()
}

/** Asigna referencias directas a rutinas y planes (sin clonar documentos). */
export async function buildProgramFromTemplates(
  user: IUser,
  input: BuildProgramInput,
): Promise<BuiltProgram> {
  let mealPlanId: string | null = null

  if (input.mealPlanTemplateId) {
    mealPlanId = await resolveMealPlanReference(input.mealPlanTemplateId, user)
  }

  const weeklySchedule: BuiltProgram['weeklySchedule'] = []

  for (const item of input.weeklySchedule) {
    const isRestDay = Boolean(item.isRestDay)
    let routineId: string | null = null

    if (!isRestDay) {
      const templateId = item.routineTemplateId || input.defaultRoutineTemplateId
      if (!templateId) {
        throw new Error('Cada día activo debe tener una rutina asignada')
      }
      routineId = await resolveRoutineReference(templateId, user)
    }

    weeklySchedule.push({
      dayOfWeek: item.dayOfWeek,
      isRestDay,
      title: item.title,
      notes: item.notes,
      routineId: routineId ? new mongoose.Types.ObjectId(routineId) : null,
      mealPlanId: mealPlanId ? new mongoose.Types.ObjectId(mealPlanId) : null,
    })
  }

  const primaryRoutineId =
    weeklySchedule.find((day) => !day.isRestDay && day.routineId)?.routineId?.toString() || null

  return {
    routineId: primaryRoutineId,
    mealPlanId,
    weeklySchedule,
  }
}

export type RoutineExerciseView = {
  exerciseId: string
  name: string
  sets?: number
  reps?: string
  rest?: string
  instructions?: string
}

export function mapRoutineExercises(
  routine: {
    exercises?: Array<{
      exercise?: { _id?: { toString(): string }; name?: string }
      sets?: number
      reps?: string
      rest?: string
      instructions?: string
    }>
  } | null,
): RoutineExerciseView[] {
  return (routine?.exercises || []).map((item, index) => ({
    exerciseId: item.exercise?._id?.toString() || `ex-${index}`,
    name: item.exercise?.name || `Ejercicio ${index + 1}`,
    sets: item.sets,
    reps: item.reps,
    rest: item.rest,
    instructions: item.instructions,
  }))
}
