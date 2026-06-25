import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import MealPlan from '@/lib/models/MealPlan';
import { buildPagination, parsePagination } from '@/lib/pagination';
import { logApiError, logApiRequest } from '@/lib/api-debug';


type JwtPayload = { userId: string }
type ValidationErrorLike = { name?: string; errors?: Record<string, { message: string }> }
type ApiErrorLike = { message?: string }



// GET - Obtener todos los planes alimenticios
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams, 10);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    logApiRequest('/api/meal-plans GET', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, query: { page, limit, search, difficulty } });

    // Construir filtros
    const filters: Record<string, unknown> = {};
    if (user.gymId) {
      filters.gymId = user.gymId;
    }
    
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
      pagination: buildPagination(page, limit, total),
    });

  } catch (error) {
    logApiError('/api/meal-plans GET', error);
    const err = error as ApiErrorLike;
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
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
    logApiRequest('/api/meal-plans POST', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, name, calories, duration, mealsCount: Array.isArray(meals) ? meals.length : 0 });

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
      createdBy: user._id,
      gymId: user.gymId || null,
    });

    await mealPlan.save();

    // Obtener el plan creado con los datos del creador
    const createdMealPlan = await MealPlan.findById(mealPlan._id)
      .populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Plan alimenticio creado exitosamente',
      mealPlan: createdMealPlan
    }, { status: 201 });

  } catch (error: unknown) {
    logApiError('/api/meal-plans POST', error);

    const validationError = error as ValidationErrorLike;
    if (validationError.name === 'ValidationError' && validationError.errors) {
      const errors = Object.values(validationError.errors).map((err) => err.message);
      return NextResponse.json(
        { error: 'Error de validación', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: (error as ApiErrorLike).message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
