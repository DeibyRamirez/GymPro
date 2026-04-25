import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
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

type UserUpdateBody = Partial<{
  name: string
  email: string
  role: 'admin' | 'trainer' | 'client'
  avatar: string
  trainerId: string
  age: number
  weight: number
  height: number
  gender: 'masculino' | 'femenino' | 'otro'
  phone: string
  goal: 'perder_peso' | 'ganar_masa' | 'mantenimiento' | 'tonificar' | 'resistencia' | 'otro'
  activityLevel: 'principiante' | 'intermedio' | 'avanzado'
  medicalConditions: string
  isActive: boolean
}>

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    await verifyAuth(req);
    const { id } = await context.params;

    const user = await User.findById(id).select('-password');
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        trainerId: user.trainerId?.toString(),
        age: user.age,
        weight: user.weight,
        height: user.height,
        gender: user.gender,
        phone: user.phone,
        goal: user.goal,
        activityLevel: user.activityLevel,
        medicalConditions: user.medicalConditions,
        isActive: user.isActive,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    const { id } = await context.params;

    if (currentUser.role !== 'admin' && currentUser._id.toString() !== id) {
      return NextResponse.json({ error: 'No tienes permisos para editar este usuario' }, { status: 403 });
    }

    const body = (await req.json()) as UserUpdateBody;
    const updateData: UserUpdateBody = {};

    for (const key of ['name', 'email', 'role', 'avatar', 'trainerId', 'age', 'weight', 'height', 'gender', 'phone', 'goal', 'activityLevel', 'medicalConditions', 'isActive']) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
    if (!updatedUser) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    return NextResponse.json({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        trainerId: updatedUser.trainerId?.toString(),
        isActive: updatedUser.isActive,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    const { id } = await context.params;

    if (currentUser.role !== 'admin' && currentUser._id.toString() !== id) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este usuario' }, { status: 403 });
    }

    await User.findByIdAndUpdate(id, { isActive: false });
    return NextResponse.json({ message: 'Usuario desactivado exitosamente' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
