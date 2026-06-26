import mongoose from 'mongoose'
import Exercise from '@/lib/models/Exercise'
import MealPlan from '@/lib/models/MealPlan'
import Routine from '@/lib/models/Routine'
import type { IUser } from '@/lib/models/User'

export type WeeklyScheduleInput = {
  dayOfWeek: number
  isRestDay?: boolean
  title?: string
  notes?: string
  /** Plantilla de rutina para este día (prioridad sobre defaultRoutineTemplateId). */
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

type PopulatedExercise = {
  _id: unknown
  name: string
  sets: number
  reps: string
  rest: string
  image: string
  instructions: string
  muscleGroups: string[]
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

async function cloneRoutineFromTemplate(
  templateId: string,
  user: IUser,
  gymId: mongoose.Types.ObjectId | null | undefined,
): Promise<string> {
  const sourceRoutine = await Routine.findById(templateId).populate('exercises.exercise')
  if (!sourceRoutine) {
    throw new Error('Rutina inválida')
  }
  if (String(sourceRoutine.gymId || null) !== String(gymId || null)) {
    throw new Error('Rutina inválida')
  }

  const sourceRoutineDoc = sourceRoutine.toObject() as {
    _id: unknown
    name: string
    description: string
    duration: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    trainingDaysPerWeek?: 4 | 5 | 6
    tags?: string[]
    exercises: Array<{
      exercise: PopulatedExercise
      sets: number
      reps: string
      rest: string
      instructions: string
      order: number
    }>
  }

  const clonedExercises = await Promise.all(
    sourceRoutineDoc.exercises.map(async (item) => {
      const sourceExercise = item.exercise
      const clonedExercise = await Exercise.create({
        name: sourceExercise.name,
        sets: sourceExercise.sets,
        reps: sourceExercise.reps,
        rest: sourceExercise.rest,
        image: sourceExercise.image,
        instructions: sourceExercise.instructions,
        muscleGroups: sourceExercise.muscleGroups,
        equipment: sourceExercise.equipment,
        difficulty: sourceExercise.difficulty,
        createdBy: user._id,
        sourceExerciseId: sourceExercise._id,
        isTemplate: false,
      })

      return {
        exercise: clonedExercise._id,
        sets: item.sets,
        reps: item.reps,
        rest: item.rest,
        instructions: item.instructions,
        order: item.order,
      }
    }),
  )

  const clonedRoutine = await Routine.create({
    name: sourceRoutineDoc.name,
    description: sourceRoutineDoc.description,
    duration: sourceRoutineDoc.duration,
    difficulty: sourceRoutineDoc.difficulty,
    trainingDaysPerWeek: sourceRoutineDoc.trainingDaysPerWeek || 5,
    exercises: clonedExercises,
    tags: sourceRoutineDoc.tags || [],
    createdBy: user._id,
    sourceRoutineId: sourceRoutineDoc._id,
    isTemplate: false,
    gymId: gymId || null,
  })

  return clonedRoutine._id.toString()
}

async function cloneMealPlanFromTemplate(
  templateId: string,
  user: IUser,
  gymId: mongoose.Types.ObjectId | null | undefined,
): Promise<string> {
  const sourceMealPlan = await MealPlan.findById(templateId)
  if (!sourceMealPlan) {
    throw new Error('Plan alimenticio inválido')
  }
  if (String(sourceMealPlan.gymId || null) !== String(gymId || null)) {
    throw new Error('Plan alimenticio inválido')
  }

  const doc = sourceMealPlan.toObject()
  const clonedMealPlan = await MealPlan.create({
    name: doc.name,
    description: doc.description,
    calories: doc.calories,
    meals: doc.meals,
    duration: doc.duration,
    tags: doc.tags || [],
    createdBy: user._id,
    sourceMealPlanId: sourceMealPlan._id,
    isTemplate: false,
    gymId: gymId || null,
  })

  return clonedMealPlan._id.toString()
}

export async function buildProgramFromTemplates(
  user: IUser,
  input: BuildProgramInput,
): Promise<BuiltProgram> {
  const routineCloneCache = new Map<string, string>()
  let mealPlanId: string | null = null

  if (input.mealPlanTemplateId) {
    mealPlanId = await cloneMealPlanFromTemplate(input.mealPlanTemplateId, user, user.gymId)
  }

  const resolveRoutineClone = async (templateId: string) => {
    if (routineCloneCache.has(templateId)) {
      return routineCloneCache.get(templateId)!
    }
    const clonedId = await cloneRoutineFromTemplate(templateId, user, user.gymId)
    routineCloneCache.set(templateId, clonedId)
    return clonedId
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
      routineId = await resolveRoutineClone(templateId)
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
