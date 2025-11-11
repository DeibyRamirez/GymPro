import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Routine from '@/lib/models/Routine';
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

// GET - Obtener rutina por ID
export async function GET(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const routine = await Routine.findById(params.id)
      .populate('createdBy', 'name email')
      .populate('exercises.exercise', 'name image muscleGroups equipment instructions');

    if (!routine) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (user.role === 'client' && routine.createdBy._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta rutina' },
        { status: 403 }
      );
    }

    if (user.role === 'trainer' && routine.createdBy._id.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta rutina' },
        { status: 403 }
      );
    }

    return NextResponse.json({ routine });

  } catch (error) {
    console.error('Error obteniendo rutina:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar rutina
export async function PUT(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const routine = await Routine.findById(params.id);

    if (!routine) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos (solo el creador o admin puede editar)
    if (user.role !== 'admin' && routine.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta rutina' },
        { status: 403 }
      );
    }

    const data = await req.json();
    const updateData = { ...data };
    delete updateData.createdBy; // No permitir cambiar el creador

    // Actualizar la rutina
    const updatedRoutine = await Routine.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('exercises.exercise', 'name image muscleGroups equipment');

    return NextResponse.json({
      message: 'Rutina actualizada exitosamente',
      routine: updatedRoutine
    });

  } catch (error) {
    console.error('Error actualizando rutina:', error);

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

// DELETE - Eliminar rutina (soft delete)
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const routine = await Routine.findById(params.id);

    if (!routine) {
      return NextResponse.json(
        { error: 'Rutina no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos (solo el creador o admin puede eliminar)
    if (user.role !== 'admin' && routine.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta rutina' },
        { status: 403 }
      );
    }

    // Soft delete - marcar como inactivo
    await Routine.findByIdAndUpdate(params.id, { isActive: false });

    return NextResponse.json({
      message: 'Rutina eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando rutina:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}