import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Exercise from '@/lib/models/Exercise';
import { buildPagination, parsePagination } from '@/lib/pagination';
import { logApiError, logApiRequest } from '@/lib/api-debug';




// GET - Obtener todos los ejercicios
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, 100);
    const search = searchParams.get('search') || '';
    const muscleGroup = searchParams.get('muscleGroup') || '';
    logApiRequest('/api/exercises GET', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, query: { page, limit, search, muscleGroup } });

    // Construir filtros
    const filters: Record<string, unknown> = user.gymId ? { gymId: user.gymId } : { gymId: null };

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (muscleGroup) {
      filters.muscleGroups = muscleGroup;
    }

    const [exercises, total] = await Promise.all([
      Exercise.find(filters)
        .populate('createdBy', 'name email')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Exercise.countDocuments(filters)
    ]);

    return NextResponse.json({
      exercises,
      pagination: buildPagination(page, limit, total),
    });

  } catch (error) {
    logApiError('/api/exercises GET', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo ejercicio
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    // Todos los usuarios autenticados pueden crear ejercicios
    const data = await req.json();
    const { name, sets, reps, rest, image, instructions, muscleGroups, equipment, difficulty } = data;
    logApiRequest('/api/exercises POST', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, name, sets, reps, rest, difficulty, muscleGroupsCount: Array.isArray(muscleGroups) ? muscleGroups.length : 0 });

    // Validar datos requeridos
    if (!name || !sets || !reps || !rest || !instructions || !muscleGroups) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser proporcionados' },
        { status: 400 }
      );
    }

    // Validar que muscleGroups sea un array
    if (!Array.isArray(muscleGroups) || muscleGroups.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un grupo muscular' },
        { status: 400 }
      );
    }

    // Crear el ejercicio
    const exercise = new Exercise({
      name,
      sets: parseInt(sets),
      reps,
      rest,
      image: image || '/default-exercise.png',
      instructions,
      muscleGroups,
      equipment: equipment || [],
      difficulty: difficulty || 'beginner',
      createdBy: user._id,
      gymId: user.gymId || null
    });

    await exercise.save();

    // Obtener el ejercicio creado con los datos del creador
    const createdExercise = await Exercise.findById(exercise._id)
      .populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Ejercicio creado exitosamente',
      exercise: createdExercise
    }, { status: 201 });

  } catch (error: unknown) {
    logApiError('/api/exercises POST', error);

    const validationError = error as { name?: string; errors?: Record<string, { message: string }> };
    if (validationError.name === 'ValidationError' && validationError.errors) {
      const errors = Object.values(validationError.errors).map((err) => err.message);
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

