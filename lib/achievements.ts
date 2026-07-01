export type Achievement = {
  id: string
  title: string
  description: string
  unlocked: boolean
  category: 'measurement' | 'goal' | 'routine' | 'nutrition' | 'consistency'
  progressPercent?: number
}

export type RoutineExercise = {
  sets?: number
}

export type RoutineLike = {
  _id?: unknown
  id?: unknown
  name?: string
  exercises?: RoutineExercise[]
}

export type RoutineProgressItem = {
  routineId?: unknown
  exerciseId?: unknown
  setNumber?: number
}

export type DayCompletionItem = {
  dateKey?: string
  workoutCompleted?: boolean
  nutritionCompleted?: boolean
  dayCompleted?: boolean
}

export type MealPlanLike = {
  duration?: number
}

export type AssignmentLike = {
  _id?: unknown
  routineId?: RoutineLike | null
  mealPlanId?: MealPlanLike | null
  routineProgress?: RoutineProgressItem[]
  dayCompletions?: DayCompletionItem[]
  durationWeeks?: number
  status?: string
}

export type MeasurementLike = {
  date: Date | string
  weight?: number
}

export type UserGoalContext = {
  goal?: string | null
  weight?: number | null
  age?: number | null
  height?: number | null
  gender?: string | null
  activityLevel?: string | null
}

export type AchievementContext = {
  measurements: MeasurementLike[]
  workoutDates: Date[]
  user: UserGoalContext
  assignments: AssignmentLike[]
}

export type RoutineHistoryItem = {
  assignmentId: string
  routineName: string
  completedSets: number
  totalSets: number
  completionRate: number
  lastCompletedAt?: Date | null
}

const GOAL_LABELS: Record<string, string> = {
  perder_peso: 'perder peso',
  ganar_masa: 'ganar masa muscular',
  mantenimiento: 'mantenimiento',
  tonificar: 'tonificar',
  resistencia: 'mejorar resistencia',
  otro: 'tu objetivo personal',
}

function toId(value: unknown): string {
  return value == null ? '' : String(value)
}

export function uniqueDates(dates: Date[]): string[] {
  return [...new Set(dates.map((date) => new Date(date).toISOString().slice(0, 10)))].sort()
}

export function getLongestWorkoutStreak(dates: Date[]): number {
  const sorted = uniqueDates(dates)
  if (sorted.length === 0) return 0

  let longest = 1
  let streak = 1

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = new Date(`${sorted[index - 1]}T00:00:00.000Z`).getTime()
    const current = new Date(`${sorted[index]}T00:00:00.000Z`).getTime()
    const oneDay = 24 * 60 * 60 * 1000

    if (current - previous === oneDay) {
      streak += 1
      longest = Math.max(longest, streak)
    } else {
      streak = 1
    }
  }

  return longest
}

export function countCompletedRoutineSets(
  routine: RoutineLike | null | undefined,
  routineProgress: RoutineProgressItem[] = [],
): { completedSets: number; totalSets: number; completionRate: number } {
  const exercises = routine?.exercises || []
  const routineId = toId(routine?._id || routine?.id)
  const totalSets = exercises.reduce((sum, exercise) => sum + (exercise.sets || 0), 0)

  if (!routineId || totalSets === 0) {
    return { completedSets: 0, totalSets: 0, completionRate: 0 }
  }

  const completedKeys = new Set(
    routineProgress
      .filter((entry) => toId(entry.routineId) === routineId)
      .map((entry) => `${toId(entry.exerciseId)}-${entry.setNumber}`),
  )

  const completedSets = completedKeys.size
  const completionRate = Math.min(100, Math.round((completedSets / totalSets) * 100))

  return { completedSets, totalSets, completionRate }
}

export function getBestRoutineCompletionRate(assignments: AssignmentLike[]): number {
  const rates = assignments
    .filter((assignment) => assignment.routineId)
    .map((assignment) => countCompletedRoutineSets(assignment.routineId, assignment.routineProgress).completionRate)

  return rates.length ? Math.max(...rates) : 0
}

export function getMealPlanCompletionRate(assignments: AssignmentLike[]): number {
  const activeAssignments = assignments.filter((assignment) => assignment.mealPlanId)
  if (!activeAssignments.length) return 0

  const rates = activeAssignments.map((assignment) => {
    const duration =
      assignment.mealPlanId?.duration ||
      (assignment.durationWeeks ? assignment.durationWeeks * 7 : 0) ||
      28
    const nutritionDays = (assignment.dayCompletions || []).filter((day) => day.nutritionCompleted).length
    return Math.min(100, Math.round((nutritionDays / duration) * 100))
  })

  return Math.max(...rates)
}

function hasProfileBasics(user: UserGoalContext): boolean {
  return Boolean(user.goal && user.age && user.weight && user.height && user.gender && user.activityLevel)
}

function isGoalAchieved(
  user: UserGoalContext,
  measurements: MeasurementLike[],
  longestWorkoutStreak: number,
  routineRate: number,
): boolean {
  if (!user.goal) return false

  const weights = measurements
    .map((item) => item.weight)
    .filter((value): value is number => typeof value === 'number' && value > 0)

  if (weights.length < 2) {
    return user.goal === 'mantenimiento' && measurements.length >= 5
  }

  const firstWeight = weights[0]
  const latestWeight = weights.at(-1)!

  switch (user.goal) {
    case 'perder_peso':
      return latestWeight < firstWeight
    case 'ganar_masa':
      return latestWeight > firstWeight
    case 'mantenimiento':
      return measurements.length >= 5
    case 'tonificar':
      return measurements.length >= 8 && routineRate >= 50
    case 'resistencia':
      return longestWorkoutStreak >= 7
    default:
      return measurements.length >= 5
  }
}

function milestoneAchievements(
  prefix: 'routine' | 'nutrition',
  rate: number,
  category: Achievement['category'],
  labels: { item: string; completeTitle: string },
): Achievement[] {
  const thresholds = [25, 50, 75, 100]

  return thresholds.map((threshold) => ({
    id: `${prefix}-${threshold}`,
    title:
      threshold === 100
        ? labels.completeTitle
        : `${labels.item} al ${threshold}%`,
    description:
      threshold === 100
        ? `Completaste el 100% de tu ${labels.item.toLowerCase()}.`
        : `Alcanza el ${threshold}% de avance en tu ${labels.item.toLowerCase()}.`,
    unlocked: rate >= threshold,
    category,
    progressPercent: rate,
  }))
}

export function buildRoutineHistory(assignments: AssignmentLike[]): RoutineHistoryItem[] {
  return assignments
    .filter((assignment) => assignment.routineId)
    .map((assignment) => {
      const { completedSets, totalSets, completionRate } = countCompletedRoutineSets(
        assignment.routineId,
        assignment.routineProgress,
      )

      const lastCompletedAt =
        assignment.routineProgress
          ?.map((entry) => (entry as RoutineProgressItem & { completedAt?: Date }).completedAt)
          .filter(Boolean)
          .at(-1) || null

      return {
        assignmentId: toId(assignment._id),
        routineName: assignment.routineId?.name || 'Rutina asignada',
        completedSets,
        totalSets,
        completionRate,
        lastCompletedAt,
      }
    })
}

export function buildAchievements(context: AchievementContext): Achievement[] {
  const { measurements, workoutDates, user, assignments } = context
  const firstMeasurement = measurements[0]
  const firstMeasurementAgeDays = firstMeasurement
    ? Math.floor((Date.now() - new Date(firstMeasurement.date).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const longestWorkoutStreak = getLongestWorkoutStreak(workoutDates)
  const routineRate = getBestRoutineCompletionRate(assignments)
  const nutritionRate = getMealPlanCompletionRate(assignments)
  const hasAssignment = assignments.some((assignment) => assignment.status === 'active')
  const hasWorkoutDay = assignments.some((assignment) =>
    (assignment.dayCompletions || []).some((day) => day.workoutCompleted),
  )
  const hasNutritionDay = assignments.some((assignment) =>
    (assignment.dayCompletions || []).some((day) => day.nutritionCompleted),
  )
  const hasFullDay = assignments.some((assignment) =>
    (assignment.dayCompletions || []).some((day) => day.dayCompleted),
  )
  const goalLabel = user.goal ? GOAL_LABELS[user.goal] || GOAL_LABELS.otro : 'tu objetivo'

  const achievements: Achievement[] = [
    {
      id: 'first-measurement',
      title: 'Primer registro antropométrico',
      description: 'Guardaste tu primera medición corporal.',
      unlocked: measurements.length >= 1,
      category: 'measurement',
      progressPercent: measurements.length >= 1 ? 100 : 0,
    },
    {
      id: 'ten-measurements',
      title: 'Seguimiento constante',
      description: 'Acumulaste 10 registros corporales.',
      unlocked: measurements.length >= 10,
      category: 'measurement',
      progressPercent: Math.min(100, Math.round((measurements.length / 10) * 100)),
    },
    {
      id: 'first-month',
      title: 'Primer mes cumplido',
      description: 'Pasaron 30 días desde tu primera medición.',
      unlocked: firstMeasurementAgeDays >= 30,
      category: 'measurement',
      progressPercent: firstMeasurement ? Math.min(100, Math.round((firstMeasurementAgeDays / 30) * 100)) : 0,
    },
    {
      id: 'goal-defined',
      title: 'Objetivo definido',
      description: 'Registraste tu meta al unirte al gimnasio.',
      unlocked: Boolean(user.goal),
      category: 'goal',
      progressPercent: user.goal ? 100 : 0,
    },
    {
      id: 'profile-complete',
      title: 'Perfil completo',
      description: 'Completaste tu información antropométrica y de objetivos.',
      unlocked: hasProfileBasics(user),
      category: 'goal',
      progressPercent: hasProfileBasics(user) ? 100 : 0,
    },
    {
      id: 'goal-achieved',
      title: 'Meta alcanzada',
      description: `Demostraste avance real hacia tu objetivo de ${goalLabel}.`,
      unlocked: isGoalAchieved(user, measurements, longestWorkoutStreak, routineRate),
      category: 'goal',
    },
    {
      id: 'program-assigned',
      title: 'Programa activo',
      description: 'Tienes una rutina o plan asignado por tu entrenador.',
      unlocked: hasAssignment,
      category: 'routine',
      progressPercent: hasAssignment ? 100 : 0,
    },
    {
      id: 'first-workout-set',
      title: 'Primer paso en la rutina',
      description: 'Marcaste tu primera serie como completada.',
      unlocked: routineRate > 0,
      category: 'routine',
      progressPercent: routineRate,
    },
    {
      id: 'first-workout-day',
      title: 'Primer entrenamiento del día',
      description: 'Completaste un día de entrenamiento en tu calendario.',
      unlocked: hasWorkoutDay,
      category: 'routine',
    },
    {
      id: 'first-nutrition-day',
      title: 'Primer día de nutrición',
      description: 'Cumpliste tu plan alimenticio por primera vez.',
      unlocked: hasNutritionDay,
      category: 'nutrition',
      progressPercent: nutritionRate,
    },
    {
      id: 'full-day-complete',
      title: 'Día perfecto',
      description: 'Completaste entrenamiento y nutrición en el mismo día.',
      unlocked: hasFullDay,
      category: 'consistency',
    },
    ...milestoneAchievements('routine', routineRate, 'routine', {
      item: 'Rutina',
      completeTitle: 'Rutina completada',
    }),
    ...milestoneAchievements('nutrition', nutritionRate, 'nutrition', {
      item: 'Plan alimenticio',
      completeTitle: 'Plan alimenticio completado',
    }),
    {
      id: 'seven-day-streak',
      title: 'Semana consistente',
      description: 'Entrenaste 7 días seguidos.',
      unlocked: longestWorkoutStreak >= 7,
      category: 'consistency',
      progressPercent: Math.min(100, Math.round((longestWorkoutStreak / 7) * 100)),
    },
    {
      id: 'ten-day-streak',
      title: '10 días seguidos de entreno',
      description: 'Alcanzaste una racha de 10 días con entrenamientos completados.',
      unlocked: longestWorkoutStreak >= 10,
      category: 'consistency',
      progressPercent: Math.min(100, Math.round((longestWorkoutStreak / 10) * 100)),
    },
  ]

  return achievements
}
