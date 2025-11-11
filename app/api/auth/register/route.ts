import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-cambiar-en-produccion';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { 
      name, 
      email, 
      password, 
      role, 
      trainerId,
      // Campos de información del gimnasio
      age,
      weight,
      height,
      gender,
      phone,
      goal,
      activityLevel,
      medicalConditions
    } = body;

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

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este correo electrónico ya está registrado' },
        { status: 400 }
      );
    }

    // Validar rol - solo permitir trainer o client
    const validRoles = ['trainer', 'client'];
    const userRole = role && validRoles.includes(role) ? role : 'client';
    
    // No permitir crear administradores desde el registro
    if (role === 'admin') {
      return NextResponse.json(
        { error: 'No se puede crear una cuenta de administrador desde el registro' },
        { status: 403 }
      );
    }

    // Si es cliente y tiene trainerId, verificar que el entrenador existe
    if (userRole === 'client' && trainerId) {
      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== 'trainer') {
        return NextResponse.json(
          { error: 'El entrenador especificado no existe o no es válido' },
          { status: 400 }
        );
      }
    }

    // Crear nuevo usuario
    const userData: any = {
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      trainerId: userRole === 'client' && trainerId ? trainerId : undefined
    };

    // Agregar campos de información del gimnasio solo para clientes
    if (userRole === 'client') {
      if (age) userData.age = parseInt(age);
      if (weight) userData.weight = parseFloat(weight);
      if (height) userData.height = parseFloat(height);
      if (gender) userData.gender = gender;
      if (phone) userData.phone = phone;
      if (goal) userData.goal = goal;
      if (activityLevel) userData.activityLevel = activityLevel;
      if (medicalConditions) userData.medicalConditions = medicalConditions;
    }

    const newUser = new User(userData);

    await newUser.save();

    // Generar token JWT
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Preparar respuesta sin contraseña
    const userResponse: any = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      trainerId: newUser.trainerId?.toString()
    };

    // Incluir campos de información del gimnasio en la respuesta si existen
    if (newUser.age) userResponse.age = newUser.age;
    if (newUser.weight) userResponse.weight = newUser.weight;
    if (newUser.height) userResponse.height = newUser.height;
    if (newUser.gender) userResponse.gender = newUser.gender;
    if (newUser.phone) userResponse.phone = newUser.phone;
    if (newUser.goal) userResponse.goal = newUser.goal;
    if (newUser.activityLevel) userResponse.activityLevel = newUser.activityLevel;
    if (newUser.medicalConditions) userResponse.medicalConditions = newUser.medicalConditions;

    // Crear respuesta con cookie
    const response = NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: userResponse,
        token
      },
      { status: 201 }
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
    console.error('Error en registro:', error);
    return NextResponse.json(
      { error: 'Error al registrar usuario', details: error.message },
      { status: 500 }
    );
  }
}

