export type DayCompletionRecord = {
  dateKey: string
  workoutCompleted: boolean
  nutritionCompleted: boolean
  dayCompleted: boolean
  completedAt?: Date | string | null
  note?: string | null
}

/** Fecha local → clave YYYY-MM-DD (sin desfase UTC). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function computeDayCompleted(
  isRestDay: boolean,
  hasMealPlan: boolean,
  workoutCompleted: boolean,
  nutritionCompleted: boolean,
): boolean {
  if (isRestDay) {
    return hasMealPlan ? nutritionCompleted : workoutCompleted
  }
  if (hasMealPlan) {
    return workoutCompleted && nutritionCompleted
  }
  return workoutCompleted
}

export function normalizeDayCompletion(raw: {
  dateKey?: string
  date?: Date | string
  workoutCompleted?: boolean
  nutritionCompleted?: boolean
  dayCompleted?: boolean
  completedAt?: Date | string | null
  note?: string | null
}): DayCompletionRecord | null {
  const dateKey =
    raw.dateKey ||
    (raw.date ? toDateKey(typeof raw.date === 'string' ? parseDateKey(raw.date.slice(0, 10)) : raw.date) : null)

  if (!dateKey) return null

  return {
    dateKey,
    workoutCompleted: Boolean(raw.workoutCompleted),
    nutritionCompleted: Boolean(raw.nutritionCompleted),
    dayCompleted: Boolean(raw.dayCompleted),
    completedAt: raw.completedAt ?? null,
    note: raw.note ?? null,
  }
}

export function buildCompletionMap(
  records: Array<{
    dateKey?: string
    date?: Date | string
    workoutCompleted?: boolean
    nutritionCompleted?: boolean
    dayCompleted?: boolean
    completedAt?: Date | string | null
    note?: string | null
  }>,
): Map<string, DayCompletionRecord> {
  const map = new Map<string, DayCompletionRecord>()
  for (const record of records) {
    const normalized = normalizeDayCompletion(record)
    if (normalized) map.set(normalized.dateKey, normalized)
  }
  return map
}

export function calculateStreak(
  completionMap: Map<string, DayCompletionRecord>,
  referenceDate: Date = new Date(),
): { current: number; longest: number } {
  let current = 0
  const cursor = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())

  while (true) {
    const key = toDateKey(cursor)
    if (!completionMap.get(key)?.dayCompleted) break
    current += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  const completedKeys = Array.from(completionMap.values())
    .filter((v) => v.dayCompleted)
    .map((v) => v.dateKey)
    .sort()

  let longest = 0
  let run = 0
  let prevKey: string | null = null

  for (const key of completedKeys) {
    if (!prevKey) {
      run = 1
    } else {
      const nextOfPrev = parseDateKey(prevKey)
      nextOfPrev.setDate(nextOfPrev.getDate() + 1)
      run = toDateKey(nextOfPrev) === key ? run + 1 : 1
    }
    longest = Math.max(longest, run)
    prevKey = key
  }

  return { current, longest }
}
