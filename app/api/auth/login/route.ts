import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Correo electrónico y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar usuario e incluir la contraseña para comparación
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' },
        { status: 403 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Preparar respuesta sin contraseña
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      trainerId: user.trainerId?.toString()
    };

    // Crear respuesta con cookie
    const response = NextResponse.json(
      {
        message: 'Inicio de sesión exitoso',
        user: userResponse,
        token
      },
      { status: 200 }
    );

    // Establecer cookie de autenticación
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    return response;

  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión', details: error.message },
      { status: 500 }
    );
  }
}

