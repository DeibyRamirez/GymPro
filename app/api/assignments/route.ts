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

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const trainerId = searchParams.get('trainerId');

    const filters: any = {};
    if (user.role === 'trainer') filters.trainerId = user._id;
    else if (trainerId) filters.trainerId = trainerId;

    const assignments = await Assignment.find(filters)
      .populate('clientId', 'name email avatar role trainerId')
      .populate('trainerId', 'name email avatar role')
      .populate('routineId', 'name description duration difficulty')
      .populate('mealPlanId', 'name description calories duration')
      .sort({ createdAt: -1 });

    return NextResponse.json({ assignments });
  } catch {
    return NextResponse.json({ error: 'Error al obtener asignaciones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    if (user.role === 'client') {
      return NextResponse.json({ error: 'No tienes permisos para crear asignaciones' }, { status: 403 });
    }

    const body = await req.json();
    const { clientId, trainerId, routineId, mealPlanId, startDate, endDate, notes } = body;

    if (!clientId || !trainerId || (!routineId && !mealPlanId) || !startDate) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const client = await User.findById(clientId);
    const trainer = await User.findById(trainerId);
    if (!client || client.role !== 'client') return NextResponse.json({ error: 'Cliente inválido' }, { status: 400 });
    if (!trainer || trainer.role !== 'trainer') return NextResponse.json({ error: 'Entrenador inválido' }, { status: 400 });

    if (routineId && !(await Routine.findById(routineId))) return NextResponse.json({ error: 'Rutina inválida' }, { status: 400 });
    if (mealPlanId && !(await MealPlan.findById(mealPlanId))) return NextResponse.json({ error: 'Plan alimenticio inválido' }, { status: 400 });

    const assignment = await Assignment.create({
      clientId,
      trainerId,
      routineId: routineId || null,
      mealPlanId: mealPlanId || null,
      startDate,
      endDate: endDate || undefined,
      notes,
      status: 'active',
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear asignación' }, { status: 500 });
  }
}
