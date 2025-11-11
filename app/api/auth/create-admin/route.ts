import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

// Endpoint para crear el administrador inicial
// IMPORTANTE: En producción, proteger este endpoint con una clave secreta o deshabilitarlo después de crear el admin
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, password, secretKey } = body;

    // Validar clave secreta (en producción, usar una variable de entorno)
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'crear-admin-secreto-2024';
    
    if (secretKey !== ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Clave secreta inválida' },
        { status: 403 }
      );
    }

    // Validaciones
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, correo electrónico y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un admin con este email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Ya existe un administrador en el sistema. Si necesitas crear otro, contacta al administrador actual.' },
        { status: 400 }
      );
    }

    // Crear el administrador
    const admin = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });

    await admin.save();

    return NextResponse.json(
      {
        message: 'Administrador creado exitosamente',
        user: {
          id: admin._id.toString(),
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creando administrador:', error);
    return NextResponse.json(
      { error: 'Error al crear administrador', details: error.message },
      { status: 500 }
    );
  }
}

