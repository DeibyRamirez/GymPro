import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Routine from '@/lib/models/Routine';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import Exercise from '@/lib/models/Exercise';

const JWT_SECRET = process.env.JWT_SECRET!;

// Middleware para verificar autenticación
async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Token no proporcionado');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new Error('Usuario no encontrado o inactivo');
  }

  return user;
}

// GET - Obtener rutina por ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectDB();
    const user = await verifyAuth(req);

    const routine = await Routine.findById(id)
      .populate("createdBy", "name email")
      .populate("exercises.exercise", "name image muscleGroups equipment");

    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
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

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {

  try {
    const { id } = await context.params;
    await connectDB();
    const user = await verifyAuth(req);
    const body = await req.json();

    const exercisesWithIds: Array<{
      exercise: unknown
      sets: unknown
      reps: unknown
      rest: unknown
      instructions: string
      order: number
    }> = [];

    // Recorremos los ejercicios del body
    for (const ex of body.exercises) {
      let exerciseId = ex._id || ex.exercise;

      // Si no tiene ID, creamos un nuevo ejercicio
      if (!exerciseId) {
        const newExercise = await Exercise.create({
          name: ex.name || "Ejercicio sin nombre",
          instructions: ex.instructions || "Sin instrucciones",
          sets: ex.sets || 1,
          reps: ex.reps || "1",
          rest: ex.rest || "0s",
          image: ex.image || "",
          muscleGroups: ex.muscleGroups || [],
          equipment: ex.equipment || [],
          createdBy: user._id,
        });
        exerciseId = newExercise._id;
      }

      exercisesWithIds.push({
        exercise: exerciseId,
        sets: ex.sets,
        reps: ex.reps,
        rest: ex.rest,
        instructions: ex.instructions || "",
        order: ex.order || 0,
      });
    }

    const updatedRoutine = await Routine.findByIdAndUpdate(
      id,
      {
        name: body.name,
        description: body.description,
        duration: body.duration,
        difficulty: body.difficulty,
        exercises: exercisesWithIds,
      },
      { new: true }
    )
      .populate("exercises.exercise", "name image muscleGroups equipment");

    if (!updatedRoutine) {
      return NextResponse.json(
        { error: "Rutina no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRoutine);
  } catch (error) {
    console.error("❌ Error actualizando rutina:", error);
    return NextResponse.json(
      { error: "Error al actualizar la rutina" },
      { status: 400 }
    );
  }
}


// DELETE - Eliminar rutina (soft delete)
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectDB();
    const user = await verifyAuth(req);

    const routine = await Routine.findById(id);
    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }


    // Verificar permisos (solo el creador o admin puede eliminar)
    if (user.role !== 'admin' && routine.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta rutina' },
        { status: 403 }
      );
    }

    // Soft delete - marcar como inactivo
    await Routine.findByIdAndUpdate(id, { isActive: false });

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
