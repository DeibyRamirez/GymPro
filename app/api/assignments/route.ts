import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import User from '@/lib/models/User';
import Routine from '@/lib/models/Routine';
import MealPlan from '@/lib/models/MealPlan';
import Exercise from '@/lib/models/Exercise';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

// Función para verificar la autenticación del usuario a través del token JWT
async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Token no proporcionado');

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);
  // Verificar que el usuario exista y esté activo
  if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');
  return user;
}

// Definición de los filtros que se pueden aplicar al obtener las asignaciones
type AssignmentFilters = Record<string, unknown>

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const trainerId = searchParams.get('trainerId');

    // Construir los filtros para la consulta de asignaciones según el rol del usuario y los parámetros proporcionados.
    const filters: AssignmentFilters = {};
    if (user.gymId) filters.gymId = user.gymId;
    if (user.role === 'trainer') filters.trainerId = user._id;
    else if (trainerId) filters.trainerId = trainerId;

    // Obtener las asignaciones aplicando los filtros correspondientes, 
    // y poblar los campos relacionados para obtener la información completa de cada asignación, 
    // incluyendo detalles del cliente, entrenador, rutina y plan alimenticio asociados.
    const assignments = await Assignment.find(filters)
      .populate('clientId', 'name email avatar role trainerId')
      .populate('trainerId', 'name email avatar role')
      .populate({ path: 'routineId', select: 'name description duration difficulty exercises tags createdBy isTemplate sourceRoutineId', populate: { path: 'exercises.exercise', select: 'name image muscleGroups equipment instructions sets reps rest difficulty isTemplate sourceExerciseId' } })
      .populate('mealPlanId', 'name description calories duration')
      .sort({ createdAt: -1 });

    return NextResponse.json({ assignments });
  } catch {
    return NextResponse.json({ error: 'Error al obtener asignaciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    if (user.role === 'client') {
      return NextResponse.json({ error: 'No tienes permisos para crear asignaciones' }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, trainerId, routineId, mealPlanId, startDate, endDate, notes, durationWeeks, weeklySchedule } = body;

    if (!clientId || !trainerId || (!routineId && !mealPlanId) || !startDate) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const client = await User.findById(clientId);
    const trainer = await User.findById(trainerId);
    if (!client || client.role !== 'client') return NextResponse.json({ error: 'Cliente inválido' }, { status: 400 });
    if (!trainer || trainer.role !== 'trainer') return NextResponse.json({ error: 'Entrenador inválido' }, { status: 400 });

    // Validar que la rutina y el plan alimenticio (si se proporcionan) existan y pertenezcan al mismo gimnasio que el usuario autenticado, 
    // para garantizar que el cliente reciba asignaciones válidas y coherentes con los recursos disponibles en su gimnasio, 
    // evitando así posibles errores o inconsistencias en la creación de la asignación.
    const sourceRoutine = routineId ? await Routine.findById(routineId).populate('exercises.exercise') : null;
    if (routineId && !sourceRoutine) return NextResponse.json({ error: 'Rutina inválida' }, { status: 400 });
    if (sourceRoutine && String(sourceRoutine.gymId || null) !== String(user.gymId || null)) return NextResponse.json({ error: 'Rutina inválida' }, { status: 400 });
    const sourceMealPlan = mealPlanId ? await MealPlan.findById(mealPlanId) : null;
    if (mealPlanId && !sourceMealPlan) return NextResponse.json({ error: 'Plan alimenticio inválido' }, { status: 400 });
    if (sourceMealPlan && String(sourceMealPlan.gymId || null) !== String(user.gymId || null)) return NextResponse.json({ error: 'Plan alimenticio inválido' }, { status: 400 });

    // Clonar la rutina si se proporciona una rutina fuente, para crear una nueva rutina personalizada para el cliente, 
    // lo que permite al entrenador modificar la rutina sin afectar la plantilla original, y asegurando que cada cliente tenga su propia versión de la rutina asignada, 
    // facilitando así la personalización y el seguimiento del progreso de cada cliente de manera independiente.
    let clonedRoutineId: string | null = null;

    if (sourceRoutine) {
      const sourceRoutineDoc = sourceRoutine.toObject() as {
        _id: unknown
        name: string
        description: string
        duration: string
        difficulty: 'beginner' | 'intermediate' | 'advanced'
        tags?: string[]
        exercises: Array<{
          exercise: { _id: unknown; name: string; sets: number; reps: string; rest: string; image: string; instructions: string; muscleGroups: string[]; equipment: string[]; difficulty: 'beginner' | 'intermediate' | 'advanced' }
          sets: number
          reps: string
          rest: string
          instructions: string
          order: number
        }>
        createdBy: unknown
      };

      // Clonar cada ejercicio de la rutina fuente, creando nuevos documentos de ejercicio para cada uno, 
      // y asociándolos a la nueva rutina clonada, lo que permite al entrenador modificar los ejercicios de la rutina personalizada 
      // sin afectar los ejercicios originales de la plantilla, 
      // y asegurando que cada cliente tenga su propia versión de los ejercicios asignados, facilitando así la personalización y 
      // el seguimiento del progreso de cada cliente de manera independiente.
      const clonedExercises = await Promise.all(
        sourceRoutineDoc.exercises.map(async (item) => {
          const sourceExercise = item.exercise;
          const clonedExercise = await Exercise.create({
            name: sourceExercise.name,
            sets: sourceExercise.sets,
            reps: sourceExercise.reps,
            rest: sourceExercise.rest,
            image: sourceExercise.image,
            instructions: sourceExercise.instructions,
            muscleGroups: sourceExercise.muscleGroups,
            equipment: sourceExercise.equipment,
            difficulty: sourceExercise.difficulty,
            createdBy: user._id,
            sourceExerciseId: sourceExercise._id,
            isTemplate: false,
          });

          return {
            exercise: clonedExercise._id,
            sets: item.sets,
            reps: item.reps,
            rest: item.rest,
            instructions: item.instructions,
            order: item.order,
          };
        })
      );

      // Crear la nueva rutina clonada utilizando los datos de la rutina fuente y los ejercicios clonados, 
      // y asociándola al cliente y al entrenador correspondientes, lo que permite al entrenador asignar 
      // una rutina personalizada a cada cliente basada en una plantilla existente, 
      // y asegurando que cada cliente tenga su propia versión de la rutina asignada, facilitando así la personalización y 
      // el seguimiento del progreso de cada cliente de manera independiente.
      const clonedRoutine = await Routine.create({
        name: sourceRoutineDoc.name,
        description: sourceRoutineDoc.description,
        duration: sourceRoutineDoc.duration,
        difficulty: sourceRoutineDoc.difficulty,
        exercises: clonedExercises,
        tags: sourceRoutineDoc.tags || [],
        createdBy: user._id,
        sourceRoutineId: sourceRoutineDoc._id,
        isTemplate: false,
      });

      clonedRoutineId = clonedRoutine._id.toString();
    }

    // Crear la nueva asignación utilizando los datos proporcionados en la solicitud, y asociándola al cliente,
    // entrenador, rutina clonada (si se creó) y plan alimenticio correspondientes, 
    // lo que permite al entrenador asignar una rutina personalizada y un plan alimenticio a cada cliente, 
    // y asegurando que cada cliente tenga su propia versión de la asignación con los recursos correspondientes, 
    // facilitando así la personalización y el seguimiento del progreso de cada cliente de manera independiente.
    const assignment = await Assignment.create({
      clientId,
      trainerId,
      gymId: user.gymId || null,
      routineId: clonedRoutineId || routineId || null,
      mealPlanId: mealPlanId || null,
      startDate,
      endDate: endDate || undefined,
      notes,
      durationWeeks: durationWeeks || 4,
      weeklySchedule: Array.isArray(weeklySchedule) ? weeklySchedule : [],
      status: 'active',
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear asignación' }, { status: 500 });
  }
}
