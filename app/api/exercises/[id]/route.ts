import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Exercise from '@/lib/models/Exercise';
import User from '@/lib/models/User';


// Definición de los filtros que se pueden aplicar al obtener los ejercicios
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;

    const exercise = await Exercise.findById(id).populate('createdBy', 'name email');
    if (!exercise) return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    if (String(exercise.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para ver este ejercicio' }, { status: 403 });
    }

    return NextResponse.json({ exercise });
  } catch {
    return NextResponse.json({ error: 'Error al obtener ejercicio' }, { status: 500 });
  }
}

// Definición de los filtros que se pueden aplicar al actualizar un ejercicio
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;

    const exercise = await Exercise.findById(id);
    if (!exercise) return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    if (String(exercise.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para editar este ejercicio' }, { status: 403 });
    }

    if (user.role !== 'admin' && exercise.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No tienes permisos para editar este ejercicio' }, { status: 403 });
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(id, await req.json(), { new: true, runValidators: true }).populate('createdBy', 'name email');
    return NextResponse.json({ message: 'Ejercicio actualizado exitosamente', exercise: updatedExercise });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar ejercicio' }, { status: 500 });
  }
}

// Definición de los filtros que se pueden aplicar al eliminar un ejercicio
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;

    const exercise = await Exercise.findById(id);
    if (!exercise) return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
    if (String(exercise.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este ejercicio' }, { status: 403 });
    }

    if (user.role !== 'admin' && exercise.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este ejercicio' }, { status: 403 });
    }

    await Exercise.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Ejercicio eliminado exitosamente' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar ejercicio' }, { status: 500 });
  }
}
