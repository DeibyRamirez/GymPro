import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exercise from '@/lib/models/Exercise';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

// Middleware para verificar autenticación
async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || 
                req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Token no proporcionado');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as any;
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new Error('Usuario no encontrado o inactivo');
  }

  return user;
}

// GET - Obtener todos los ejercicios
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const muscleGroup = searchParams.get('muscleGroup') || '';

    // Construir filtros
    const filters: any = {};

    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }

    if (muscleGroup) {
      filters.muscleGroups = muscleGroup;
    }

    const skip = (page - 1) * limit;

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
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error obteniendo ejercicios:', error);
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
      createdBy: user._id
    });

    await exercise.save();

    // Obtener el ejercicio creado con los datos del creador
    const createdExercise = await Exercise.findById(exercise._id)
      .populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Ejercicio creado exitosamente',
      exercise: createdExercise
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creando ejercicio:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
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

