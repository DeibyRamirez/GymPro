import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Gym from '@/lib/models/Gym';
import { logApiError, logApiRequest } from '@/lib/api-debug';



// Función para generar un slug a partir del nombre del gimnasio, asegurando que sea único y fácil de usar en URLs.
export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB();
    const { slug } = await context.params;
    logApiRequest('/api/gyms/[slug] GET', { slug });
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
  } catch (error) {
    logApiError('/api/gyms/[slug] GET', error);
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
    logApiRequest('/api/gyms/[slug] PUT', { currentUserId: currentUser._id.toString(), role: currentUser.role, slug, keys: Object.keys(body || {}) });

    const existingGym = await Gym.findOne({ slug });
    if (!existingGym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 });
    }

    if (
      currentUser.role === 'admin' &&
      currentUser.gymId?.toString() !== existingGym._id.toString()
    ) {
      return NextResponse.json({ error: 'Solo puedes editar tu propio gimnasio' }, { status: 403 });
    }

    const gym = await Gym.findOneAndUpdate({ slug }, body, { new: true });

    if (!gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ gym });
  } catch (error) {
    logApiError('/api/gyms/[slug] PUT', error);
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
    logApiRequest('/api/gyms/[slug] DELETE', { currentUserId: currentUser._id.toString(), role: currentUser.role, slug });

    if (!gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Gimnasio eliminado correctamente' });
  } catch (error) {
    logApiError('/api/gyms/[slug] DELETE', error);
    return NextResponse.json({ error: 'Error al eliminar gimnasio' }, { status: 500 });
  }
}
