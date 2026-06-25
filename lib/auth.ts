/**
 * Tipos compartidos entre frontend y backend.
 *
 * IMPORTANTE: este archivo ya NO tiene datos mock (mockUsers eliminado).
 * Toda la data de usuarios viene de la API → MongoDB.
 * Mantener solo interfaces/types aquí evita confundir datos fake con reales.
 */
export type UserRole = 'superadmin' | 'admin' | 'trainer' | 'client'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  trainerId?: string
  gymId?: string
  gymSlug?: string | null
  gymName?: string | null
  age?: number
  weight?: number
  height?: number
  gender?: string
  phone?: string
  goal?: string
  activityLevel?: string
  medicalConditions?: string
  membershipPlan?: {
    name: string
    price?: number
    description?: string
    featured?: boolean
  }
}
