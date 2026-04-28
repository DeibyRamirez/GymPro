import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { logApiError, logApiRequest } from '@/lib/api-debug';

const JWT_SECRET = process.env.JWT_SECRET!;

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Token no proporcionado');

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');
  return user;
}
// Definimos un tipo para el cuerpo de la solicitud de actualización, con campos opcionales para permitir actualizaciones parciales
type UserUpdateBody = Partial<{
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'trainer' | 'client'
  avatar: string
  trainerId: string | null
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
// Campos que se pueden actualizar, definidos como una tupla de literales para mantener la tipificación estricta
const updatableFields = ['name', 'email', 'role', 'avatar', 'trainerId', 'age', 'weight', 'height', 'gender', 'phone', 'goal', 'activityLevel', 'medicalConditions', 'isActive'] as const

// GET para obtener detalles de un usuario
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    await verifyAuth(req);
    const { id } = await context.params;
    logApiRequest('/api/users/[id] GET', { userId: id });

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
  } catch (error) {
    logApiError('/api/users/[id] GET', error);
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
  }
}
// PUT para actualizar usuario
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    const { id } = await context.params;
    logApiRequest('/api/users/[id] PUT', { currentUserId: currentUser._id.toString(), targetUserId: id });

    if (!['admin', 'superadmin'].includes(currentUser.role) && currentUser._id.toString() !== id) {
      return NextResponse.json({ error: 'No tienes permisos para editar este usuario' }, { status: 403 });
    }

    const body = (await req.json()) as UserUpdateBody;
    const updateData: Record<string, unknown> = {};

    for (const key of updatableFields) {
      const value = body[key];
      if (value !== undefined) updateData[key] = value;
    }

    if (updateData.role && updateData.role !== 'client' && body.trainerId === undefined) {
      updateData.trainerId = null;
    }

    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    Object.entries(updateData).forEach(([key, value]) => {
      user.set(key, value);
    });

    await user.save();

    const updatedUser = await User.findById(id).select('-password');
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
  } catch (error) {
    logApiError('/api/users/[id] PUT', error);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}
// Para eliminar un usuario, en lugar de borrarlo físicamente, lo marcamos como inactivo
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    const { id } = await context.params;
    logApiRequest('/api/users/[id] DELETE', { currentUserId: currentUser._id.toString(), targetUserId: id });

    if (!['admin', 'superadmin'].includes(currentUser.role) && currentUser._id.toString() !== id) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este usuario' }, { status: 403 });
    }

    await User.findByIdAndUpdate(id, { isActive: false });
    return NextResponse.json({ message: 'Usuario desactivado exitosamente' });
  } catch (error) {
    logApiError('/api/users/[id] DELETE', error);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}
