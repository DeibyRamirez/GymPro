import {
  buildAchievements,
  countCompletedRoutineSets,
  getBestRoutineCompletionRate,
  getLongestWorkoutStreak,
  getMealPlanCompletionRate,
} from '@/lib/achievements'

describe('achievements', () => {
  it('calculates routine completion by unique completed sets', () => {
    const result = countCompletedRoutineSets(
      {
        id: 'routine-1',
        exercises: [{ sets: 3 }, { sets: 2 }],
      },
      [
        { routineId: 'routine-1', exerciseId: 'ex-1', setNumber: 1 },
        { routineId: 'routine-1', exerciseId: 'ex-1', setNumber: 2 },
        { routineId: 'routine-1', exerciseId: 'ex-2', setNumber: 1 },
      ],
    )

    expect(result.totalSets).toBe(5)
    expect(result.completedSets).toBe(3)
    expect(result.completionRate).toBe(60)
  })

  it('unlocks quarter milestones for routines and meal plans', () => {
    const achievements = buildAchievements({
      measurements: [{ date: new Date(), weight: 80 }],
      workoutDates: [],
      user: { goal: 'perder_peso', age: 28, weight: 80, height: 175, gender: 'masculino', activityLevel: 'intermedio' },
      assignments: [
        {
          _id: 'a1',
          status: 'active',
          routineId: { id: 'r1', exercises: [{ sets: 4 }] },
          mealPlanId: { duration: 4 },
          routineProgress: [{ routineId: 'r1', exerciseId: 'ex-1', setNumber: 1 }],
          dayCompletions: [{ nutritionCompleted: true }],
        },
      ],
    })

    expect(achievements.find((item) => item.id === 'first-measurement')?.unlocked).toBe(true)
    expect(achievements.find((item) => item.id === 'goal-defined')?.unlocked).toBe(true)
    expect(achievements.find((item) => item.id === 'routine-25')?.unlocked).toBe(true)
    expect(achievements.find((item) => item.id === 'routine-50')?.unlocked).toBe(false)
    expect(achievements.find((item) => item.id === 'nutrition-25')?.unlocked).toBe(true)
  })

  it('detects goal achievement for weight loss', () => {
    const achievements = buildAchievements({
      measurements: [
        { date: '2026-01-01', weight: 85 },
        { date: '2026-02-01', weight: 82 },
      ],
      workoutDates: [],
      user: { goal: 'perder_peso' },
      assignments: [],
    })

    expect(achievements.find((item) => item.id === 'goal-achieved')?.unlocked).toBe(true)
  })

  it('computes meal plan completion from nutrition days', () => {
    const rate = getMealPlanCompletionRate([
      {
        mealPlanId: { duration: 8 },
        dayCompletions: [
          { nutritionCompleted: true },
          { nutritionCompleted: true },
        ],
      },
    ])

    expect(rate).toBe(25)
  })

  it('computes longest workout streak', () => {
    expect(
      getLongestWorkoutStreak([
        new Date('2026-06-01'),
        new Date('2026-06-02'),
        new Date('2026-06-03'),
        new Date('2026-06-05'),
      ]),
    ).toBe(3)
  })

  it('uses best routine rate across assignments', () => {
    const rate = getBestRoutineCompletionRate([
      {
        routineId: { id: 'r1', exercises: [{ sets: 4 }] },
        routineProgress: [{ routineId: 'r1', exerciseId: 'ex-1', setNumber: 1 }],
      },
      {
        routineId: { id: 'r2', exercises: [{ sets: 4 }] },
        routineProgress: [
          { routineId: 'r2', exerciseId: 'ex-2', setNumber: 1 },
          { routineId: 'r2', exerciseId: 'ex-2', setNumber: 2 },
          { routineId: 'r2', exerciseId: 'ex-2', setNumber: 3 },
          { routineId: 'r2', exerciseId: 'ex-2', setNumber: 4 },
        ],
      },
    ])

    expect(rate).toBe(100)
  })
})
