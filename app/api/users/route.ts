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

type UsersFilters = {
  isActive: boolean
  role?: string
  trainerId?: string
  $or?: Array<Record<string, unknown>>
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const trainerId = searchParams.get('trainerId');

    const filters: UsersFilters = { isActive: true };

    if (role) filters.role = role;
    if (trainerId) filters.trainerId = trainerId;

    if (currentUser.role === 'trainer') {
      filters.$or = [{ trainerId: currentUser._id }, { _id: currentUser._id }];
    }

    const users = await User.find(filters).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        trainerId: user.trainerId?.toString(),
        isActive: user.isActive,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}
