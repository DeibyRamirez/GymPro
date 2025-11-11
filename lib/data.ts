export interface Routine {
  id: string
  name: string
  description: string
  duration: string
  difficulty: "beginner" | "intermediate" | "advanced"
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
  instructions: string
}

export interface MealPlan {
  id: string
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
}

export interface Assignment {
  id: string
  clientId: string
  trainerId: string
  routineId?: string
  mealPlanId?: string
  startDate: string
  endDate?: string
  status: "active" | "completed" | "pending"
}

export const mockRoutines: Routine[] = [
  {
    id: "r1",
    name: "Fuerza Total",
    description: "Rutina completa de fuerza para todo el cuerpo",
    duration: "60 min",
    difficulty: "intermediate",
    exercises: [
      {
        id: "e1",
        name: "Sentadillas",
        sets: 4,
        reps: "8-12",
        rest: "90s",
        image: "/person-doing-squats.png",
        instructions:
          "Mantén la espalda recta, baja hasta que los muslos estén paralelos al suelo. Empuja con los talones para volver a la posición inicial.",
      },
      {
        id: "e2",
        name: "Press de Banca",
        sets: 4,
        reps: "8-10",
        rest: "120s",
        image: "/bench-press-exercise.png",
        instructions:
          "Baja la barra hasta el pecho de forma controlada, empuja con fuerza manteniendo control. Mantén los pies firmes en el suelo.",
      },
      {
        id: "e3",
        name: "Peso Muerto",
        sets: 3,
        reps: "6-8",
        rest: "180s",
        image: "/person-deadlift.png",
        instructions:
          "Mantén la espalda neutral durante todo el movimiento. Levanta con las piernas y glúteos, no con la espalda. Controla el descenso.",
      },
    ],
    createdBy: "2",
  },
  {
    id: "r2",
    name: "Cardio HIIT",
    description: "Entrenamiento de alta intensidad para quemar grasa",
    duration: "30 min",
    difficulty: "advanced",
    exercises: [
      {
        id: "e4",
        name: "Burpees",
        sets: 5,
        reps: "15",
        rest: "30s",
        image: "/person-doing-burpees.jpg",
        instructions:
          "Movimiento explosivo completo: baja a plancha, haz una flexión, salta hacia adelante y salta verticalmente. Mantén el core activado.",
      },
      {
        id: "e5",
        name: "Mountain Climbers",
        sets: 5,
        reps: "30s",
        rest: "30s",
        image: "/person-doing-mountain-climbers.jpg",
        instructions:
          "Desde posición de plancha, alterna rodillas al pecho rápidamente. Mantén las caderas bajas y el core contraído.",
      },
    ],
    createdBy: "2",
  },
]

export const mockMealPlans: MealPlan[] = [
  {
    id: "m1",
    name: "Plan Definición",
    description: "Plan bajo en calorías para definición muscular",
    calories: 2000,
    meals: [
      {
        id: "meal1",
        name: "Desayuno",
        time: "08:00",
        foods: ["3 claras de huevo", "Avena 50g", "Plátano", "Café"],
        calories: 400,
      },
      {
        id: "meal2",
        name: "Almuerzo",
        time: "13:00",
        foods: ["Pechuga de pollo 200g", "Arroz integral 100g", "Brócoli", "Ensalada"],
        calories: 600,
      },
      {
        id: "meal3",
        name: "Merienda",
        time: "17:00",
        foods: ["Yogur griego", "Almendras 30g", "Manzana"],
        calories: 300,
      },
      {
        id: "meal4",
        name: "Cena",
        time: "20:00",
        foods: ["Salmón 150g", "Batata 150g", "Espárragos", "Aceite de oliva"],
        calories: 700,
      },
    ],
    createdBy: "2",
  },
  {
    id: "m2",
    name: "Plan Volumen",
    description: "Plan alto en calorías para ganancia muscular",
    calories: 3000,
    meals: [
      {
        id: "meal5",
        name: "Desayuno",
        time: "07:30",
        foods: ["4 huevos enteros", "Avena 80g", "2 plátanos", "Mantequilla de maní"],
        calories: 700,
      },
      {
        id: "meal6",
        name: "Almuerzo",
        time: "12:30",
        foods: ["Carne roja 250g", "Arroz blanco 150g", "Aguacate", "Verduras"],
        calories: 900,
      },
      {
        id: "meal7",
        name: "Merienda Pre-Entreno",
        time: "16:00",
        foods: ["Batido de proteína", "Plátano", "Avena 40g"],
        calories: 400,
      },
      {
        id: "meal8",
        name: "Cena",
        time: "20:30",
        foods: ["Pollo 200g", "Pasta 150g", "Queso", "Ensalada con aceite"],
        calories: 1000,
      },
    ],
    createdBy: "2",
  },
]

export const mockAssignments: Assignment[] = [
  {
    id: "a1",
    clientId: "3",
    trainerId: "2",
    routineId: "r1",
    mealPlanId: "m1",
    startDate: "2025-01-01",
    status: "active",
  },
  {
    id: "a2",
    clientId: "4",
    trainerId: "2",
    routineId: "r2",
    mealPlanId: "m2",
    startDate: "2025-01-05",
    status: "active",
  },
]
