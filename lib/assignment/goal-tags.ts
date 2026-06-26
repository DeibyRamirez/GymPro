export const GOAL_LABELS: Record<string, string> = {
  perder_peso: 'Perder peso',
  ganar_masa: 'Ganar masa muscular',
  mantenimiento: 'Mantenimiento',
  tonificar: 'Tonificar',
  resistencia: 'Resistencia',
  otro: 'Otro',
}

/** Tags sugeridos en plantillas según la meta del cliente. */
export const GOAL_TAG_HINTS: Record<string, string[]> = {
  perder_peso: ['perder_peso', 'deficit', 'cardio', 'definicion', 'bajar'],
  ganar_masa: ['ganar_masa', 'hipertrofia', 'fuerza', 'volumen', 'masa'],
  mantenimiento: ['mantenimiento', 'salud'],
  tonificar: ['tonificar', 'definicion', 'funcional'],
  resistencia: ['resistencia', 'cardio', 'endurance'],
  otro: [],
}

export function tagsMatchGoal(tags: string[] | undefined, goal: string | undefined): boolean {
  if (!goal || goal === 'otro') return true
  const hints = GOAL_TAG_HINTS[goal] || []
  if (hints.length === 0) return true

  const normalizedTags = (tags || []).map((tag) => tag.toLowerCase().trim())
  return hints.some((hint) =>
    normalizedTags.some((tag) => tag.includes(hint) || hint.includes(tag)),
  )
}
