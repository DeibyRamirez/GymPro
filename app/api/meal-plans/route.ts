import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MealPlan from '@/lib/models/MealPlan';
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

// GET - Obtener todos los planes alimenticios
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
    
    // Solo admins y trainers pueden ver todos los planes
    if (user.role === 'client') {
      // Los clientes solo ven planes asignados a ellos
      filters.$or = [
        { createdBy: user._id },
        // Aquí podrías agregar lógica para planes asignados
      ];
    } else if (user.role === 'trainer') {
      // Los trainers ven sus propios planes
      filters.createdBy = user._id;
    }
    // Los admins ven todos los planes (sin filtro adicional)

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

    const [mealPlans, total] = await Promise.all([
      MealPlan.find(filters)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MealPlan.countDocuments(filters)
    ]);

    return NextResponse.json({
      mealPlans,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error obteniendo planes alimenticios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo plan alimenticio
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    // Solo trainers y admins pueden crear planes
    if (user.role === 'client') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear planes alimenticios' },
        { status: 403 }
      );
    }

    const data = await req.json();
    const { name, description, calories, meals, duration, tags } = data;

    // Validar datos requeridos
    if (!name || !description || !calories || !meals || !duration) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser proporcionados' },
        { status: 400 }
      );
    }

    // Validar que las comidas sean válidas
    if (!Array.isArray(meals) || meals.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos una comida' },
        { status: 400 }
      );
    }

    // Crear el plan alimenticio
    const mealPlan = new MealPlan({
      name,
      description,
      calories,
      meals,
      duration,
      tags: tags || [],
      createdBy: user._id
    });

    await mealPlan.save();

    // Obtener el plan creado con los datos del creador
    const createdMealPlan = await MealPlan.findById(mealPlan._id)
      .populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Plan alimenticio creado exitosamente',
      mealPlan: createdMealPlan
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando plan alimenticio:', error);

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