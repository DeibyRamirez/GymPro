import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Routine from '@/lib/models/Routine';
import Exercise from '@/lib/models/Exercise';
import { buildPagination, parsePagination } from '@/lib/pagination';


type JwtPayload = { userId: string }
type ValidationErrorLike = { name?: string; errors?: Record<string, { message: string }>; message?: string }
type ExerciseInput = {
  name: string
  sets: string | number
  reps: string
  rest: string
  instructions: string
  image?: string
  muscleGroups?: string[]
}

type RoutineExerciseLike = {
  _id?: { toString: () => string }
  toObject: () => Record<string, unknown>
  exercise?: {
    _id?: { toString: () => string }
    toObject?: () => Record<string, unknown>
  } | null
}



// GET - Obtener todas las rutinas
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, 10);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';

    // Construir filtros
    const filters: Record<string, unknown> = {};
    if (user.gymId) {
      filters.gymId = user.gymId;
    }

    // Solo admins y trainers pueden ver todas las rutinas
    if (user.role === 'client') {
      // Los clientes solo ven rutinas asignadas a ellos
      filters.$or = [
        { createdBy: user._id },
        // Aquí podrías agregar lógica para rutinas asignadas
      ];
    } else if (user.role === 'trainer') {
      // Los trainers ven sus propias rutinas
      filters.createdBy = user._id;
    }
    // Los admins ven todas las rutinas (sin filtro adicional)

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (difficulty) {
      filters.difficulty = difficulty;
    }

    filters.isActive = true;

    const [routines, total] = await Promise.all([
      Routine.find(filters)
        .populate('createdBy', 'name email')
        .populate('exercises.exercise', 'name image muscleGroups equipment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Routine.countDocuments(filters)
    ]);

    // Convertir ObjectIds a strings para evitar problemas en el frontend
    const formattedRoutines = routines.map(routine => ({
      ...routine.toObject(),
      _id: routine._id.toString(),
      createdBy: routine.createdBy?._id?.toString
        ? {
          ...routine.createdBy.toObject(),
          _id: routine.createdBy._id.toString(),
        }
        : routine.createdBy,
      exercises: routine.exercises.map((ex: RoutineExerciseLike) => ({
        ...ex.toObject(),
        _id: ex._id?.toString(),
        exercise: ex.exercise?._id?.toString
          ? {
            ...(ex.exercise?.toObject ? ex.exercise.toObject() : {}),
            _id: ex.exercise?._id?.toString(),
          }
          : ex.exercise,
      })),
    }));

    // El filtro de búsqueda se aplica a los campos name, location y description del gimnasio, permitiendo a los usuarios
    return NextResponse.json({
      routines: formattedRoutines,
      pagination: buildPagination(page, limit, total),
    });


  } catch (error) {
    console.error('Error obteniendo rutinas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva rutina (con creación automática de ejercicios si no existen)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const data = await req.json();
    const { name, description, duration, difficulty, exercises: rawExercises, tags } = data;

    // Validar campos básicos
    if (!name || !description || !duration || !Array.isArray(rawExercises) || rawExercises.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos o ejercicios' },
        { status: 400 }
      );
    }

    // Procesar cada ejercicio: buscar o crear
    const processedExercises = await Promise.all(
      rawExercises.map(async (ex: ExerciseInput, index: number) => {
        const { name: exName, sets, reps, rest, instructions, image } = ex;

        if (!exName || !sets || !reps || !rest || !instructions) {
          throw new Error(`Faltan datos en el ejercicio ${index + 1}`);
        }

        // Convertir sets a número (si es rango como "8-12", toma el primero)
        const setsNumber = (() => {
          const num = typeof sets === 'number' ? sets : parseInt(sets, 10);
          return isNaN(num) ? 3 : num; // default 3 si no es número
        })();

        // Buscar ejercicio por nombre (case insensitive)
        let exercise = await Exercise.findOne({
          name: { $regex: `^${exName}$`, $options: 'i' },
          createdBy: user._id // opcional: solo del usuario
        });

        // Si no existe, crearlo
        if (!exercise) {
          exercise = new Exercise({
            name: exName.trim(),
            sets: setsNumber,
            reps: reps.trim(),
            rest: rest.trim(),
            image: image?.trim() || '/default-exercise.png',
            instructions: instructions.trim(),
            muscleGroups: ex.muscleGroups || ['legs'],
            equipment: [],
            difficulty: difficulty || 'intermediate',
            createdBy: user._id
          });

          await exercise.save();
        }

        // Devolver para la rutina
        return {
          exercise: exercise._id,
          sets: setsNumber,
          reps: reps.trim(),
          rest: rest.trim(),
          instructions: instructions.trim(),
          order: index + 1
        };
      })
    );

    // Crear la rutina
    const routine = new Routine({
      name: name.trim(),
      description: description.trim(),
      duration: duration.trim(),
      difficulty: difficulty || 'intermediate',
      exercises: processedExercises,
      tags: tags || [],
      createdBy: user._id
      ,gymId: user.gymId || null
    });

    await routine.save();

    // Poblar para respuesta
    const populatedRoutine = await Routine.findById(routine._id)
      .populate('createdBy', 'name email')
      .populate('exercises.exercise', 'name image muscleGroups equipment instructions');

    return NextResponse.json(
      {
        message: 'Rutina creada exitosamente',
        routine: populatedRoutine
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    const err = error as ValidationErrorLike;
    console.error('Error creando rutina:', error);

    if (err.message?.includes('ejercicio')) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    if (err.name === 'ValidationError' && err.errors) {
      const errors = Object.values(err.errors).map((item) => item.message);
      return NextResponse.json(
        { error: 'Error de validación', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
