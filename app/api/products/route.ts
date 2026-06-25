import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Gym from '@/lib/models/Gym';
import { buildPagination, parsePagination } from '@/lib/pagination';
import { logApiError, logApiRequest } from '@/lib/api-debug';



// Definición de los filtros que se pueden aplicar al obtener productos
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const gymSlug = searchParams.get('gymSlug');
    const { page, limit, skip } = parsePagination(searchParams, 100);
    logApiRequest('/api/products GET', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, gymSlug, page, limit });
    let gymId = user.gymId || null;
    if (gymSlug && user.role === 'superadmin') {
      const gym = await Gym.findOne({ slug: gymSlug, status: { $ne: 'suspended' } }).select('_id');
      gymId = gym?._id || null;
    }

    const [products, total] = await Promise.all([
      Product.find({ isActive: true, gymId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments({ isActive: true, gymId }),
    ]);

    return NextResponse.json({
      products: products.map((product) => ({
        id: String(product._id),
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        image: product.image,
        lowStock: product.stock <= product.lowStockThreshold,
      })),
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    logApiError('/api/products GET', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}
// Definición de los filtros que se pueden aplicar al obtener productos
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    if (!['admin', 'superadmin'].includes(user.role)) {
      return NextResponse.json({ error: 'No tienes permisos para crear productos' }, { status: 403 });
    }

    const body = await req.json();
    // El filtro de búsqueda se aplica a los campos name, location y description del gimnasio, permitiendo a los usuarios 
    // encontrar gimnasios relevantes de manera rápida y eficiente, mejorando así la experiencia de navegación y facilitando la
    // conexión entre los clientes y los gimnasios que mejor se adapten a sus necesidades e intereses.
    const { name, description, category, price, stock, lowStockThreshold, image } = body;
    logApiRequest('/api/products POST', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, gymSlug: body.gymSlug || null, name, category, price, stock });
    if (!name || !description || !category || price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const gymSlug = String(body.gymSlug || '').trim();
    let gymId = user.gymId || null;
    if (gymSlug && user.role === 'superadmin') {
      const gym = await Gym.findOne({ slug: gymSlug, status: { $ne: 'suspended' } }).select('_id');
      gymId = gym?._id || null;
    }

    // El filtro de búsqueda se aplica a los campos name, location y description del gimnasio, permitiendo a los usuarios 
    // encontrar gimnasios relevantes de manera rápida y eficiente, mejorando así la experiencia de navegación y facilitando la
    // conexión entre los clientes y los gimnasios que mejor se adapten a sus necesidades e intereses.
    const product = await Product.create({
      name,
      description,
      category,
      price,
      stock,
      lowStockThreshold: lowStockThreshold ?? 5,
      image,
      gymId,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    logApiError('/api/products POST', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
