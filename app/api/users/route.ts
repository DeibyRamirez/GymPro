import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Gym from '@/lib/models/Gym';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';
// Middleware para verificar autenticación y obtener el usuario actual
async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) throw new Error('Token no proporcionado');

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');

  return user;
}
// Definimos un tipo para el cuerpo de la solicitud de actualización, con campos opcionales para permitir actualizaciones parciales
type UsersFilters = {
  isActive: boolean
  role?: string
  trainerId?: string
  gymId?: string | null
  $or?: Array<Record<string, unknown>>
}

// Campos que se pueden actualizar, definidos como una tupla de literales para mantener la tipificación estricta
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

    if (currentUser.role !== 'superadmin' && currentUser.gymId) {
      filters.gymId = currentUser.gymId.toString();
    }

    if (currentUser.role === 'trainer') {
      filters.$or = [{ trainerId: currentUser._id }, { _id: currentUser._id }];
    }

    // Si el usuario es un cliente, solo puede ver su propio perfil
    const users = await User.find(filters).select('-password').sort({ createdAt: -1 });
    const gyms = users.length > 0 ? await Gym.find({ _id: { $in: users.map((user) => user.gymId).filter(Boolean) } }).select('slug name') : [];
    const gymMap = new Map(gyms.map((gym) => [gym._id.toString(), gym]));

    // Construimos la respuesta incluyendo el slug del gimnasio si está disponible
    return NextResponse.json({
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        trainerId: user.trainerId?.toString(),
        gymId: user.gymId?.toString(),
        gymSlug: user.gymId ? gymMap.get(user.gymId.toString())?.slug || null : null,
        isActive: user.isActive,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}
