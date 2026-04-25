import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import User from '@/lib/models/User';
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

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });

    if (user.role !== 'client' || assignment.clientId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar este progreso' }, { status: 403 });
    }

    const body = await req.json();
    const { routineId, exerciseId, setNumber } = body;

    if (!routineId || !exerciseId || !setNumber) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    assignment.routineProgress = assignment.routineProgress || [];
    const exists = assignment.routineProgress.some(
      (item) => item.routineId.toString() === routineId && item.exerciseId.toString() === exerciseId && item.setNumber === Number(setNumber)
    );

    if (!exists) {
      assignment.routineProgress.push({
        routineId,
        exerciseId,
        setNumber: Number(setNumber),
        completedAt: new Date(),
      });
      await assignment.save();
    }

    return NextResponse.json({ message: 'Serie marcada como completada', assignment });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el progreso' }, { status: 500 });
  }
}
