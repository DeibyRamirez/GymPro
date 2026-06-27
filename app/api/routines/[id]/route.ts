import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Routine from '@/lib/models/Routine';
import User from '@/lib/models/User';
import Exercise from '@/lib/models/Exercise';
import { normalizeImages, primaryImage } from '@/lib/images/constants';




// GET - Obtener rutina por ID
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await connectDB();
    const user = await verifyAuth(req);

    const routine = await Routine.findById(id)
      .populate("createdBy", "name email")
      .populate("exercises.exercise", "name image images muscleGroups equipment");

    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }
    if (String(routine.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para ver esta rutina' }, { status: 403 });
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

    const routine = await Routine.findById(id);
    if (!routine) {
      return NextResponse.json({ error: "Rutina no encontrada" }, { status: 404 });
    }
    if (String(routine.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para editar esta rutina' }, { status: 403 });
    }
    if (user.role === 'trainer' && routine.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No tienes permisos para editar esta rutina' }, { status: 403 });
    }

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
      const exName = String(ex.name || "").trim();
      let exerciseId = ex.exercise || ex._id;
      const exerciseImages = normalizeImages(ex.images, ex.image);

      if (!exerciseId && exName) {
        const existingExercise = await Exercise.findOne({
          name: { $regex: `^${exName}$`, $options: 'i' },
          createdBy: user._id,
        });
        if (existingExercise) {
          exerciseId = existingExercise._id;
        }
      }

      if (!exerciseId) {
          const newExercise = await Exercise.create({
          name: exName || "Ejercicio sin nombre",
          instructions: ex.instructions || "Sin instrucciones",
          sets: ex.sets || 1,
          reps: ex.reps || "1",
          rest: ex.rest || "0s",
          images: exerciseImages,
          image: primaryImage(exerciseImages, ex.image, '/default-exercise.png'),
            muscleGroups: ex.muscleGroups || [],
            equipment: ex.equipment || [],
            createdBy: user._id,
            gymId: user.gymId || null,
          });
          exerciseId = newExercise._id;
      } else if (exerciseImages.length > 0) {
          await Exercise.findByIdAndUpdate(exerciseId, {
            images: exerciseImages,
            image: primaryImage(exerciseImages, ex.image, '/default-exercise.png'),
          });
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
      .populate("exercises.exercise", "name image images muscleGroups equipment");

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
    if (String(routine.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar esta rutina' }, { status: 403 });
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
