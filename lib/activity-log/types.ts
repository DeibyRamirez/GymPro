/** Acciones alineadas con `lib/audit-log.ts` y la bitácora del admin. */
export type ActivityAction =
  | 'auth.register'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'routine.create'
  | 'routine.update'
  | 'meal_plan.create'
  | 'meal_plan.update'
  | 'assignment.create'
  | 'sale.create'
  | 'calendar.event_create'
  | 'progress.record'
  | 'product.create'
  | 'equipment.create'
  | 'notification.broadcast'

export type ActivityCategory =
  | 'user'
  | 'routine'
  | 'meal_plan'
  | 'assignment'
  | 'sale'
  | 'calendar'
  | 'progress'
  | 'inventory'
  | 'system'

export const ACTIVITY_CATEGORY_BY_ACTION: Record<ActivityAction, ActivityCategory> = {
  'auth.register': 'user',
  'user.create': 'user',
  'user.update': 'user',
  'user.delete': 'user',
  'routine.create': 'routine',
  'routine.update': 'routine',
  'meal_plan.create': 'meal_plan',
  'meal_plan.update': 'meal_plan',
  'assignment.create': 'assignment',
  'sale.create': 'sale',
  'calendar.event_create': 'calendar',
  'progress.record': 'progress',
  'product.create': 'inventory',
  'equipment.create': 'inventory',
  'notification.broadcast': 'system',
}

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
  user: 'Usuario',
  routine: 'Rutina',
  meal_plan: 'Plan alimenticio',
  assignment: 'Asignación',
  sale: 'Venta',
  calendar: 'Calendario',
  progress: 'Progreso',
  inventory: 'Inventario',
  system: 'Sistema',
}
