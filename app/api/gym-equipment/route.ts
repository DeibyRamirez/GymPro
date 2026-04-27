import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Gym from '@/lib/models/Gym';
import GymEquipment from '@/lib/models/GymEquipment';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

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
    const gymSlug = searchParams.get('gymSlug');

    let gymId = user.gymId || null;
    if (gymSlug && user.role === 'superadmin') {
      const gym = await Gym.findOne({ slug: gymSlug, status: { $ne: 'suspended' } }).select('_id');
      gymId = gym?._id || null;
    }

    const equipment = await GymEquipment.find({ gymId, isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json({ equipment });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al obtener inventario' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear inventario' }, { status: 403 });
    }

    const body = await req.json();
    const { gymSlug, name, category, description, image, quantity } = body;
    if (!name || !category) {
      return NextResponse.json({ error: 'Nombre y categoría son requeridos' }, { status: 400 });
    }

    const gym = gymSlug ? await Gym.findOne({ slug: gymSlug, status: { $ne: 'suspended' } }) : null;
    const gymId = gym?._id || user.gymId || null;

    if (!gymId) {
      return NextResponse.json({ error: 'No se pudo determinar el gimnasio destino' }, { status: 400 });
    }

    const equipment = await GymEquipment.create({
      gymId,
      name,
      category,
      description,
      image,
      quantity: Number(quantity) || 1,
      isActive: true,
    });

    return NextResponse.json({ equipment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error al crear inventario' }, { status: 500 });
  }
}
