import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/lib/models/Product';
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

// Definición de los filtros que se pueden aplicar al obtener productos
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const products = await Product.find({ isActive: true, gymId: user.gymId || null }).sort({ createdAt: -1 });
    // El filtro de búsqueda se aplica a los campos name, location y description del gimnasio, permitiendo a los usuarios 
    // encontrar gimnasios relevantes de manera rápida y eficiente, mejorando así la experiencia de navegación y facilitando la
    // conexión entre los clientes y los gimnasios que mejor se adapten a sus necesidades e intereses.
    return NextResponse.json({
      products: products.map((product) => ({
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        image: product.image,
        lowStock: product.stock <= product.lowStockThreshold,
      })),
    });
  } catch {
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
    if (!name || !description || !category || price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
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
      gymId: user.gymId || null,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
