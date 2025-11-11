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

// GET - Obtener perfil del usuario actual
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

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
    console.error('Error obteniendo perfil:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar perfil del usuario actual
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);

    const body = await req.json();
    const {
      name,
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

    // Preparar datos de actualización
    const updateData: any = {};

    if (name) updateData.name = name;

    // Solo permitir actualizar campos de gimnasio si es cliente
    if (user.role === 'client') {
      if (age !== undefined) updateData.age = parseInt(age);
      if (weight !== undefined) updateData.weight = parseFloat(weight);
      if (height !== undefined) updateData.height = parseFloat(height);
      if (gender) updateData.gender = gender;
      if (phone !== undefined) updateData.phone = phone;
      if (goal) updateData.goal = goal;
      if (activityLevel) updateData.activityLevel = activityLevel;
      if (medicalConditions !== undefined) updateData.medicalConditions = medicalConditions;
    }

    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Preparar respuesta
    const userResponse: any = {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      trainerId: updatedUser.trainerId?.toString()
    };

    // Incluir campos de información del gimnasio si existen
    if (updatedUser.age) userResponse.age = updatedUser.age;
    if (updatedUser.weight) userResponse.weight = updatedUser.weight;
    if (updatedUser.height) userResponse.height = updatedUser.height;
    if (updatedUser.gender) userResponse.gender = updatedUser.gender;
    if (updatedUser.phone) userResponse.phone = updatedUser.phone;
    if (updatedUser.goal) userResponse.goal = updatedUser.goal;
    if (updatedUser.activityLevel) userResponse.activityLevel = updatedUser.activityLevel;
    if (updatedUser.medicalConditions) userResponse.medicalConditions = updatedUser.medicalConditions;

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: userResponse
    });

  } catch (error: any) {
    console.error('Error actualizando perfil:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Error de validación', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar perfil', details: error.message },
      { status: 500 }
    );
  }
}

