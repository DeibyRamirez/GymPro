import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Gym from '@/lib/models/Gym';
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

// Función para generar un slug a partir del nombre del gimnasio, asegurando que sea único y fácil de usar en URLs.
export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();
    const { slug } = await context.params;
    const gym = await Gym.findOne({ slug, status: { $ne: 'suspended' } });

    if (!gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 });
    }
    // El filtro de búsqueda se aplica a los campos name, location y description del gimnasio, permitiendo a los usuarios 
    // encontrar gimnasios relevantes de manera rápida y eficiente, mejorando así la experiencia de navegación y facilitando la
    // conexión entre los clientes y los gimnasios que mejor se adapten a sus necesidades e intereses.
    return NextResponse.json({
      gym: {
        id: gym._id.toString(),
        name: gym.name,
        slug: gym.slug,
        location: gym.location,
        description: gym.description,
        email: gym.email,
        phone: gym.phone,
        hours: gym.hours,
        status: gym.status,
        logo: gym.logo,
        coverImage: gym.coverImage,
        gallery: gym.gallery,
        plans: gym.plans,
        machines: gym.machines,
        products: gym.products,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error al obtener gimnasio' }, { status: 500 });
  }
}
// Definición de los filtros que se pueden aplicar al actualizar un gimnasio
export async function PUT(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'No tienes permisos para editar gimnasios' }, { status: 403 });
    }

    const { slug } = await context.params;
    const body = await req.json();
    const gym = await Gym.findOneAndUpdate({ slug }, body, { new: true });

    if (!gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ gym });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar gimnasio' }, { status: 500 });
  }
}
// Definición de los filtros que se pueden aplicar al eliminar un gimnasio
export async function DELETE(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar gimnasios' }, { status: 403 });
    }

    const { slug } = await context.params;
    const gym = await Gym.findOneAndDelete({ slug });

    if (!gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Gimnasio eliminado correctamente' });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar gimnasio' }, { status: 500 });
  }
}
