import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Exercise from '@/lib/models/Exercise';
import Routine from '@/lib/models/Routine';
import MealPlan from '@/lib/models/MealPlan';
import Assignment from '@/lib/models/Assignment';
import CalendarEvent from '@/lib/models/CalendarEvent';

// Solo permitir en desarrollo
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Solo disponible en desarrollo' },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    console.log('🌱 Iniciando proceso de siembra de datos...');

    // Limpiar todas las colecciones
    await Promise.all([
      User.deleteMany({}),
      Exercise.deleteMany({}),
      Routine.deleteMany({}),
      MealPlan.deleteMany({}),
      Assignment.deleteMany({}),
      CalendarEvent.deleteMany({})
    ]);
    console.log('🧹 Base de datos limpiada');

    // 1. Crear usuarios
    const users = [
      {
        name: 'Admin Principal',
        email: 'admin@fitpro.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'Carlos Martínez',
        email: 'carlos@fitpro.com',
        password: 'trainer123',
        role: 'trainer'
      },
      {
        name: 'María González',
        email: 'maria@fitpro.com',
        password: 'trainer123',
        role: 'trainer'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('👥 Usuarios creados');

    // Obtener IDs de usuarios
    const admin = createdUsers.find(user => user.role === 'admin');
    const trainer1 = createdUsers.find(user => user.email === 'carlos@fitpro.com');
    const trainer2 = createdUsers.find(user => user.email === 'maria@fitpro.com');

    // Crear clientes asignados a los trainers
    const clients = [
      {
        name: 'Ana García',
        email: 'ana@cliente.com',
        password: 'client123',
        role: 'client',
        trainerId: trainer1?._id
      },
      {
        name: 'Luis Rodríguez',
        email: 'luis@cliente.com',
        password: 'client123',
        role: 'client',
        trainerId: trainer1?._id
      },
      {
        name: 'Carmen López',
        email: 'carmen@cliente.com',
        password: 'client123',
        role: 'client',
        trainerId: trainer2?._id
      },
      {
        name: 'Pedro Martín',
        email: 'pedro@cliente.com',
        password: 'client123',
        role: 'client',
        trainerId: trainer2?._id
      }
    ];

    const createdClients = await User.insertMany(clients);
    console.log('👨‍👩‍👧‍👦 Clientes creados');

    // 2. Crear ejercicios
    const exercises = [
      {
        name: 'Sentadillas',
        sets: 4,
        reps: '8-12',
        rest: '90s',
        image: '/person-doing-squats.png',
        instructions: 'Mantén la espalda recta, baja hasta que los muslos estén paralelos al suelo.',
        muscleGroups: ['legs', 'glutes'],
        equipment: ['bodyweight'],
        difficulty: 'beginner',
        createdBy: trainer1?._id
      },
      {
        name: 'Press de Banca',
        sets: 4,
        reps: '8-10',
        rest: '120s',
        image: '/bench-press-exercise.png',
        instructions: 'Baja la barra hasta el pecho de forma controlada, empuja con fuerza.',
        muscleGroups: ['chest', 'arms'],
        equipment: ['barbell'],
        difficulty: 'intermediate',
        createdBy: trainer1?._id
      },
      {
        name: 'Peso Muerto',
        sets: 3,
        reps: '6-8',
        rest: '180s',
        image: '/person-deadlift.png',
        instructions: 'Mantén la espalda neutral durante todo el movimiento.',
        muscleGroups: ['back', 'legs', 'glutes'],
        equipment: ['barbell'],
        difficulty: 'advanced',
        createdBy: trainer1?._id
      },
      {
        name: 'Burpees',
        sets: 5,
        reps: '15',
        rest: '30s',
        image: '/person-doing-burpees.jpg',
        instructions: 'Movimiento explosivo completo: plancha, flexión, salto.',
        muscleGroups: ['cardio', 'core'],
        equipment: ['bodyweight'],
        difficulty: 'advanced',
        createdBy: trainer2?._id
      },
      {
        name: 'Flexiones',
        sets: 3,
        reps: '10-15',
        rest: '60s',
        image: '/push-ups.png',
        instructions: 'Mantén el cuerpo recto, baja hasta casi tocar el suelo.',
        muscleGroups: ['chest', 'arms', 'core'],
        equipment: ['bodyweight'],
        difficulty: 'beginner',
        createdBy: trainer2?._id
      }
    ];

    const createdExercises = await Exercise.insertMany(exercises);
    console.log('💪 Ejercicios creados');

    // 3. Crear rutinas
    const routines = [
      {
        name: 'Fuerza Total',
        description: 'Rutina completa de fuerza para todo el cuerpo',
        duration: '60 min',
        difficulty: 'intermediate',
        exercises: [
          {
            exercise: createdExercises[0]._id, // Sentadillas
            sets: 4,
            reps: '8-12',
            rest: '90s',
            order: 1
          },
          {
            exercise: createdExercises[1]._id, // Press de Banca
            sets: 4,
            reps: '8-10',
            rest: '120s',
            order: 2
          },
          {
            exercise: createdExercises[2]._id, // Peso Muerto
            sets: 3,
            reps: '6-8',
            rest: '180s',
            order: 3
          }
        ],
        tags: ['fuerza', 'fullbody'],
        createdBy: trainer1?._id
      },
      {
        name: 'Cardio HIIT',
        description: 'Entrenamiento de alta intensidad para quemar grasa',
        duration: '30 min',
        difficulty: 'advanced',
        exercises: [
          {
            exercise: createdExercises[3]._id, // Burpees
            sets: 5,
            reps: '15',
            rest: '30s',
            order: 1
          },
          {
            exercise: createdExercises[4]._id, // Flexiones
            sets: 4,
            reps: '12',
            rest: '45s',
            order: 2
          }
        ],
        tags: ['cardio', 'hiit', 'quema-grasa'],
        createdBy: trainer2?._id
      }
    ];

    const createdRoutines = await Routine.insertMany(routines);
    console.log('🏃‍♀️ Rutinas creadas');

    // 4. Crear planes alimenticios
    const mealPlans = [
      {
        name: 'Plan Definición',
        description: 'Plan bajo en calorías para definición muscular',
        calories: 2000,
        duration: 30,
        meals: [
          {
            name: 'Desayuno',
            time: '08:00',
            foods: ['3 claras de huevo', 'Avena 50g', 'Plátano', 'Café'],
            calories: 400
          },
          {
            name: 'Almuerzo',
            time: '13:00',
            foods: ['Pechuga de pollo 200g', 'Arroz integral 100g', 'Brócoli', 'Ensalada'],
            calories: 600
          },
          {
            name: 'Cena',
            time: '20:00',
            foods: ['Salmón 150g', 'Batata 150g', 'Espárragos', 'Aceite de oliva'],
            calories: 700
          }
        ],
        tags: ['definicion', 'bajo-calorias'],
        createdBy: trainer1?._id
      },
      {
        name: 'Plan Volumen',
        description: 'Plan alto en calorías para ganancia muscular',
        calories: 3000,
        duration: 60,
        meals: [
          {
            name: 'Desayuno',
            time: '07:30',
            foods: ['4 huevos enteros', 'Avena 80g', '2 plátanos', 'Mantequilla de maní'],
            calories: 700
          },
          {
            name: 'Almuerzo',
            time: '12:30',
            foods: ['Carne roja 250g', 'Arroz blanco 150g', 'Aguacate', 'Verduras'],
            calories: 900
          },
          {
            name: 'Cena',
            time: '20:30',
            foods: ['Pollo 200g', 'Pasta 150g', 'Queso', 'Ensalada con aceite'],
            calories: 1000
          }
        ],
        tags: ['volumen', 'alto-calorias'],
        createdBy: trainer2?._id
      }
    ];

    const createdMealPlans = await MealPlan.insertMany(mealPlans);
    console.log('🍽️ Planes alimenticios creados');

    // 5. Crear asignaciones
    const assignments = [
      {
        clientId: createdClients[0]._id, // Ana
        trainerId: trainer1?._id,
        routineId: createdRoutines[0]._id,
        mealPlanId: createdMealPlans[0]._id,
        startDate: new Date('2025-01-01'),
        status: 'active'
      },
      {
        clientId: createdClients[1]._id, // Luis
        trainerId: trainer1?._id,
        routineId: createdRoutines[1]._id,
        mealPlanId: createdMealPlans[1]._id,
        startDate: new Date('2025-01-05'),
        status: 'active'
      },
      {
        clientId: createdClients[2]._id, // Carmen
        trainerId: trainer2?._id,
        routineId: createdRoutines[1]._id,
        mealPlanId: createdMealPlans[0]._id,
        startDate: new Date('2025-01-10'),
        status: 'active'
      }
    ];

    const createdAssignments = await Assignment.insertMany(assignments);
    console.log('📋 Asignaciones creadas');

    // 6. Crear eventos de calendario
    const calendarEvents = [
      // Eventos para Ana
      {
        title: 'Entrenamiento de Fuerza',
        date: new Date('2025-01-15T10:00:00'),
        type: 'workout',
        completed: true,
        userId: createdClients[0]._id,
        trainerId: trainer1?._id,
        routineId: createdRoutines[0]._id,
        duration: 60
      },
      {
        title: 'Plan Alimenticio',
        date: new Date('2025-01-15T08:00:00'),
        type: 'meal',
        completed: true,
        userId: createdClients[0]._id,
        mealPlanId: createdMealPlans[0]._id
      },
      // Eventos para Luis
      {
        title: 'Entrenamiento HIIT',
        date: new Date('2025-01-16T16:00:00'),
        type: 'workout',
        completed: false,
        userId: createdClients[1]._id,
        trainerId: trainer1?._id,
        routineId: createdRoutines[1]._id,
        duration: 30
      },
      // Eventos futuros
      {
        title: 'Evaluación Mensual',
        date: new Date('2025-01-30T09:00:00'),
        type: 'assessment',
        completed: false,
        userId: createdClients[0]._id,
        trainerId: trainer1?._id,
        duration: 30
      }
    ];

    await CalendarEvent.insertMany(calendarEvents);
    console.log('📅 Eventos de calendario creados');

    // Obtener todos los datos creados para la respuesta
    const allUsers = await User.find({}).select('-password');
    const stats = {
      users: allUsers.length,
      exercises: createdExercises.length,
      routines: createdRoutines.length,
      mealPlans: createdMealPlans.length,
      assignments: createdAssignments.length,
      events: calendarEvents.length
    };

    console.log('✅ Proceso de siembra completado exitosamente');

    return NextResponse.json({
      message: 'Base de datos sembrada exitosamente',
      stats,
      credentials: {
        admin: { email: 'admin@fitpro.com', password: 'admin123' },
        trainer1: { email: 'carlos@fitpro.com', password: 'trainer123' },
        trainer2: { email: 'maria@fitpro.com', password: 'trainer123' },
        client1: { email: 'ana@cliente.com', password: 'client123' },
        client2: { email: 'luis@cliente.com', password: 'client123' },
        client3: { email: 'carmen@cliente.com', password: 'client123' },
        client4: { email: 'pedro@cliente.com', password: 'client123' }
      }
    });

  } catch (error) {
    console.error('❌ Error sembrando base de datos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}