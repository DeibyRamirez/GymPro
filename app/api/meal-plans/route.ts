import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import { recordActivitySafe } from '@/lib/activity-log/record';
import connectDB from '@/lib/mongodb';
import MealPlan from '@/lib/models/MealPlan';
import {
  buildMealPlanTemplateFilter,
  dedupeMealPlanTemplates,
  type MealPlanLike,
} from '@/lib/meal-plan/templates';
import { buildPagination, parsePagination } from '@/lib/pagination';
import { logApiError, logApiRequest } from '@/lib/api-debug';
import { normalizeImages } from '@/lib/images/constants';


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
    const andFilters: Record<string, unknown>[] = [];

    if (user.gymId) {
      filters.gymId = user.gymId;
    }
    
    if (user.role === 'client') {
      filters.createdBy = user._id;
    } else if (user.role === 'trainer') {
      filters.createdBy = user._id;
    }

    if (search) {
      andFilters.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (difficulty) {
      filters.difficulty = difficulty;
    }

    const templatesOnly = searchParams.get('templatesOnly') === 'true';

    if (templatesOnly) {
      andFilters.push(buildMealPlanTemplateFilter() as Record<string, unknown>);
    }

    filters.isActive = true;

    if (andFilters.length > 0) {
      filters.$and = andFilters;
    }

    let mealPlans = await MealPlan.find(filters)
      .populate('createdBy', 'name email')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(templatesOnly ? limit * 3 : limit)
      .lean<MealPlanLike[]>();

    if (templatesOnly) {
      mealPlans = dedupeMealPlanTemplates(mealPlans).slice(0, limit);
    }

    const total = templatesOnly
      ? dedupeMealPlanTemplates(
          await MealPlan.find(filters).populate('createdBy', 'name email').sort({ createdAt: 1 }).lean<MealPlanLike[]>(),
        ).length
      : await MealPlan.countDocuments(filters);

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

    const normalizedMeals = meals.map((meal: { images?: string[]; image?: string; [key: string]: unknown }) => ({
      ...meal,
      images: normalizeImages(meal.images, meal.image),
    }));

    // Crear el plan alimenticio
    const mealPlan = new MealPlan({
      name,
      description,
      calories,
      meals: normalizedMeals,
      duration,
      tags: tags || [],
      createdBy: user._id,
      gymId: user.gymId || null,
      isTemplate: true,
      sourceMealPlanId: null,
    });

    await mealPlan.save();

    recordActivitySafe({
      gymId: user.gymId,
      actorId: user._id,
      actorName: user.name,
      actorAvatar: user.avatar,
      action: 'meal_plan.create',
      summary: `creó el plan alimenticio "${mealPlan.name}"`,
      targetType: 'MealPlan',
      targetId: mealPlan._id,
      targetLabel: mealPlan.name,
    });

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
