import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import User from '@/lib/models/User';
import Routine from '@/lib/models/Routine';
import MealPlan from '@/lib/models/MealPlan';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Token no proporcionado');

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');
  return user;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    await verifyAuth(req);
    const { id } = await context.params;

    const assignment = await Assignment.findById(id)
      .populate('clientId', 'name email avatar role trainerId')
      .populate('trainerId', 'name email avatar role')
      .populate({ path: 'routineId', select: 'name description duration difficulty exercises tags createdBy isTemplate sourceRoutineId', populate: { path: 'exercises.exercise', select: 'name image muscleGroups equipment instructions sets reps rest difficulty isTemplate sourceExerciseId' } })
      .populate('mealPlanId', 'name description calories duration');

    if (!assignment) return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    return NextResponse.json({ assignment });
  } catch {
    return NextResponse.json({ error: 'Error al obtener asignación' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });

    if (user.role !== 'admin' && assignment.trainerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No tienes permisos para editar esta asignación' }, { status: 403 });
    }

    const body = await req.json();
    if (body.routineId && !(await Routine.findById(body.routineId))) return NextResponse.json({ error: 'Rutina inválida' }, { status: 400 });
    if (body.mealPlanId && !(await MealPlan.findById(body.mealPlanId))) return NextResponse.json({ error: 'Plan alimenticio inválido' }, { status: 400 });

    const updatedAssignment = await Assignment.findByIdAndUpdate(id, body, { new: true, runValidators: true })
      .populate('clientId', 'name email avatar role trainerId')
      .populate('trainerId', 'name email avatar role')
      .populate('routineId', 'name description duration difficulty')
      .populate('mealPlanId', 'name description calories duration');

    return NextResponse.json({ message: 'Asignación actualizada exitosamente', assignment: updatedAssignment });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar asignación' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });

    if (user.role !== 'admin' && assignment.trainerId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar esta asignación' }, { status: 403 });
    }

    await Assignment.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Asignación eliminada exitosamente' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar asignación' }, { status: 500 });
  }
}
