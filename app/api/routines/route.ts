import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Routine from '@/lib/models/Routine';
import Exercise from '@/lib/models/Exercise';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

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

// GET - Obtener todas las rutinas
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';

    // Construir filtros
    const filters: any = {};
    
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

    const skip = (page - 1) * limit;

    const [routines, total] = await Promise.all([
      Routine.find(filters)
        .populate('createdBy', 'name email')
        .populate('exercises.exercise', 'name image muscleGroups equipment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Routine.countDocuments(filters)
    ]);

    return NextResponse.json({
      routines,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error obteniendo rutinas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva rutina
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    // Todos los usuarios autenticados pueden crear rutinas (clientes, trainers y admins)

    const data = await req.json();
    const { name, description, duration, difficulty, exercises, tags } = data;

    // Validar datos requeridos
    if (!name || !description || !duration || !exercises) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser proporcionados' },
        { status: 400 }
      );
    }

    // Validar que los ejercicios sean válidos
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un ejercicio' },
        { status: 400 }
      );
    }

    // Verificar que todos los ejercicios existan
    const exerciseIds = exercises.map(ex => ex.exercise);
    const existingExercises = await Exercise.find({ _id: { $in: exerciseIds } });
    
    if (existingExercises.length !== exerciseIds.length) {
      return NextResponse.json(
        { error: 'Algunos ejercicios no existen' },
        { status: 400 }
      );
    }

    // Crear la rutina
    const routine = new Routine({
      name,
      description,
      duration,
      difficulty: difficulty || 'beginner',
      exercises,
      tags: tags || [],
      createdBy: user._id
    });

    await routine.save();

    // Obtener la rutina creada con los datos poblados
    const createdRoutine = await Routine.findById(routine._id)
      .populate('createdBy', 'name email')
      .populate('exercises.exercise', 'name image muscleGroups equipment');

    return NextResponse.json({
      message: 'Rutina creada exitosamente',
      routine: createdRoutine
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando rutina:', error);

    if ((error as any).name === 'ValidationError') {
      const errors = Object.values((error as any).errors).map((err: any) => err.message);
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