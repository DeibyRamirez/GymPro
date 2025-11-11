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

interface Props {
  params: { id: string };
}

// GET - Obtener plan alimenticio por ID
export async function GET(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const mealPlan = await MealPlan.findById(params.id)
      .populate('createdBy', 'name email');

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Plan alimenticio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (user.role === 'client' && mealPlan.createdBy._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este plan' },
        { status: 403 }
      );
    }

    if (user.role === 'trainer' && mealPlan.createdBy._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este plan' },
        { status: 403 }
      );
    }

    return NextResponse.json({ mealPlan });

  } catch (error) {
    console.error('Error obteniendo plan alimenticio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar plan alimenticio
export async function PUT(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const mealPlan = await MealPlan.findById(params.id);

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Plan alimenticio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos (solo el creador o admin puede editar)
    if (user.role !== 'admin' && mealPlan.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este plan' },
        { status: 403 }
      );
    }

    const data = await req.json();
    const updateData = { ...data };
    delete updateData.createdBy; // No permitir cambiar el creador

    // Actualizar el plan
    const updatedMealPlan = await MealPlan.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    return NextResponse.json({
      message: 'Plan alimenticio actualizado exitosamente',
      mealPlan: updatedMealPlan
    });

  } catch (error) {
    console.error('Error actualizando plan alimenticio:', error);

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

// DELETE - Eliminar plan alimenticio (soft delete)
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const mealPlan = await MealPlan.findById(params.id);

    if (!mealPlan) {
      return NextResponse.json(
        { error: 'Plan alimenticio no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos (solo el creador o admin puede eliminar)
    if (user.role !== 'admin' && mealPlan.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este plan' },
        { status: 403 }
      );
    }

    // Soft delete - marcar como inactivo
    await MealPlan.findByIdAndUpdate(params.id, { isActive: false });

    return NextResponse.json({
      message: 'Plan alimenticio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando plan alimenticio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}