import type { FilterQuery } from 'mongoose'

type MealPlanLike = {
  _id?: unknown
  id?: unknown
  name: string
  calories: number
  createdBy?: unknown
  createdAt?: Date | string
  isTemplate?: boolean
  sourceMealPlanId?: unknown
}

export type { MealPlanLike }

/** Filtro MongoDB para listar solo plantillas (no clones de asignación). */
export function buildMealPlanTemplateFilter(): FilterQuery<unknown> {
  return {
    isTemplate: { $ne: false },
    $or: [{ sourceMealPlanId: { $exists: false } }, { sourceMealPlanId: null }],
  }
}

function templatePriority(plan: MealPlanLike): number {
  if (plan.isTemplate === false) return 0
  if (plan.sourceMealPlanId) return 0
  return 2
}

function createdByKey(createdBy: unknown): string {
  if (!createdBy) return ''
  if (typeof createdBy === 'string') return createdBy
  if (typeof createdBy === 'object' && createdBy !== null) {
    const ref = createdBy as { _id?: unknown; id?: unknown }
    return String(ref._id || ref.id || '')
  }
  return String(createdBy)
}

/** Deja una sola plantilla por nombre+calorías+creador solo si hay duplicados reales. */
export function dedupeMealPlanTemplates<T extends MealPlanLike>(plans: T[]): T[] {
  const byKey = new Map<string, T[]>()

  for (const plan of plans) {
    const key = `${plan.name.trim().toLowerCase()}|${plan.calories}|${createdByKey(plan.createdBy)}`
    const group = byKey.get(key) || []
    group.push(plan)
    byKey.set(key, group)
  }

  const result: T[] = []
  for (const group of byKey.values()) {
    if (group.length === 1) {
      result.push(group[0])
      continue
    }

    const sorted = [...group].sort((a, b) => {
      const priorityDiff = templatePriority(b) - templatePriority(a)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    })
    result.push(sorted[0])
  }

  return result.sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
  )
}
