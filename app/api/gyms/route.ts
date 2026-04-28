import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Gym from '@/lib/models/Gym';
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

// Función para generar un slug a partir del nombre del gimnasio, asegurando que sea único y fácil de usar en URLs.
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    logApiRequest('/api/gyms GET', { query });

    const gyms = await Gym.find({ status: { $ne: 'suspended' } }).sort({ createdAt: -1 });
    const filteredGyms = query
      ? gyms.filter((gym) => `${gym.name} ${gym.location} ${gym.description || ''}`.toLowerCase().includes(query))
      : gyms;

    // El filtro de búsqueda se aplica a los campos name, location y description del gimnasio, permitiendo a los usuarios 
    // encontrar gimnasios relevantes de manera rápida y eficiente, mejorando así la experiencia de navegación y facilitando la
    // conexión entre los clientes y los gimnasios que mejor se adapten a sus necesidades e intereses.
    return NextResponse.json({
      gyms: filteredGyms.map((gym) => ({
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
      })),
    });
  } catch (error) {
    logApiError('/api/gyms GET', error);
    return NextResponse.json({ error: 'Error al obtener gimnasios' }, { status: 500 });
  }
}

// Definición de los filtros que se pueden aplicar al crear un gimnasio
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const name = String(body.name || '').trim();
    const location = String(body.location || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const adminEmail = String(body.adminEmail || '').trim().toLowerCase();
    const adminPassword = String(body.adminPassword || '').trim();
    const phone = String(body.phone || '').trim();
    const description = String(body.description || '').trim();
    const hours = String(body.hours || '').trim();
    const rawSlug = String(body.slug || name);
    const slug = slugify(rawSlug);
    logApiRequest('/api/gyms POST', { name, location, email, adminEmail, slug });

    if (!name || !location || !email || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Nombre, ubicación, correo de contacto, correo admin y contraseña admin son requeridos' }, { status: 400 });
    }

    if (adminPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña del admin debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const exists = await Gym.findOne({ slug });
    if (exists) {
      return NextResponse.json({ error: 'El subdominio ya existe' }, { status: 400 });
    }

    const adminExists = await User.findOne({ email: adminEmail });
    if (adminExists) {
      return NextResponse.json({ error: 'El correo del admin ya está registrado' }, { status: 400 });
    }

    // Creamos primero el usuario admin para enlazarlo al gimnasio.
    // El modelo User ya hashea la contraseña antes de guardar, así que enviamos el valor plano.
    const adminUser = await User.create({
      name: `${name} Admin`,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true,
      gymId: null,
    });

    const gym = await Gym.create({
      name,
      slug,
      location,
      email,
      adminEmail,
      adminUserId: adminUser._id,
      phone,
      description,
      hours,
      status: body.status || 'active',
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
      plans: Array.isArray(body.plans) && body.plans.length > 0 ? body.plans : [
        { name: 'Mensual', price: 29.9, description: 'Acceso estándar al gimnasio', featured: true },
        { name: 'Trimestral', price: 79.9, description: 'Ahorro por permanencia', featured: false },
      ],
      machines: Array.isArray(body.machines) ? body.machines : [],
      products: Array.isArray(body.products) ? body.products : [
        { name: 'Whey Protein', price: 29.9, image: '/placeholder.jpg', description: 'Proteína de suero' },
        { name: 'Creatina', price: 19.9, image: '/placeholder-logo.png', description: 'Creatina monohidratada' },
      ],
      logo: body.logo || '/placeholder-logo.svg',
      coverImage: body.coverImage || '/athletic-trainer.png',
    });

    adminUser.gymId = gym._id;
    await adminUser.save();

    return NextResponse.json({ gym }, { status: 201 });
  } catch (error) {
    logApiError('/api/gyms POST', error);
    return NextResponse.json({ error: 'Error al crear gimnasio' }, { status: 500 });
  }
}
// Definición de los filtros que se pueden aplicar al actualizar un gimnasio
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'No tienes permisos para editar gimnasios' }, { status: 403 });
    }

    const body = await req.json();
    const { slug, ...update } = body;
    logApiRequest('/api/gyms PUT', { currentUserId: currentUser._id.toString(), role: currentUser.role, slug, keys: Object.keys(update || {}) });
    if (!slug) {
      return NextResponse.json({ error: 'El slug del gimnasio es requerido' }, { status: 400 });
    }

    const gym = await Gym.findOneAndUpdate({ slug }, update, { new: true });
    if (!gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ gym });
  } catch (error) {
    logApiError('/api/gyms PUT', error);
    return NextResponse.json({ error: 'Error al actualizar gimnasio' }, { status: 500 });
  }
}
// Definición de los filtros que se pueden aplicar al eliminar un gimnasio
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar gimnasios' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    logApiRequest('/api/gyms DELETE', { currentUserId: currentUser._id.toString(), role: currentUser.role, slug });
    if (!slug) {
      return NextResponse.json({ error: 'El slug del gimnasio es requerido' }, { status: 400 });
    }

    const gym = await Gym.findOneAndDelete({ slug });
    if (!gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Gimnasio eliminado correctamente' });
  } catch (error) {
    logApiError('/api/gyms DELETE', error);
    return NextResponse.json({ error: 'Error al eliminar gimnasio' }, { status: 500 });
  }
}
