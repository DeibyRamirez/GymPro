export interface Routine {
  _id?: string
  name: string
  description: string
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  exercises: Exercise[]
  createdBy: string
}

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  rest: string
  image: string
  images?: string[]
  instructions: string
}

export interface MealPlan {
  _id?: string
  id?: string
  name: string
  description: string
  calories: number
  meals: Meal[]
  createdBy: string
}

export interface Meal {
  id: string
  name: string
  time: string
  foods: string[]
  calories: number
  image?: string
  images?: string[]
  macros?: {
    protein: number
    carbs: number
    fats: number
  }
}

export interface Assignment {
  id: string
  clientId: string
  trainerId: string
  routineId?: string
  mealPlanId?: string
  startDate: string
  endDate?: string
  status: 'active' | 'completed' | 'pending'
}
