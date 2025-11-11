import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

// Middleware para verificar autenticación
async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || 
                req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Token no proporcionado');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as any;
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new Error('Usuario no encontrado o inactivo');
  }

  return user;
}

// GET - Obtener usuario por ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);

    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Preparar respuesta
    const userResponse: any = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      trainerId: user.trainerId?.toString()
    };

    // Incluir campos de información del gimnasio si existen
    if (user.age) userResponse.age = user.age;
    if (user.weight) userResponse.weight = user.weight;
    if (user.height) userResponse.height = user.height;
    if (user.gender) userResponse.gender = user.gender;
    if (user.phone) userResponse.phone = user.phone;
    if (user.goal) userResponse.goal = user.goal;
    if (user.activityLevel) userResponse.activityLevel = user.activityLevel;
    if (user.medicalConditions) userResponse.medicalConditions = user.medicalConditions;

    return NextResponse.json({ user: userResponse });

  } catch (error: any) {
    console.error('Error obteniendo usuario:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario', details: error.message },
      { status: 500 }
    );
  }
}

