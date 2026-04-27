import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

type RoutineProgressItem = {
  routineId: { toString: () => string }
  exerciseId: { toString: () => string }
  setNumber: number
}

// Función para verificar la autenticación del usuario a través del token JWT
async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Token no proporcionado');

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');
  return user;
}

// Definición de los filtros que se pueden aplicar al obtener las asignaciones
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;

    // Verificar que la asignación exista y que el usuario autenticado tenga permisos para actualizar su progreso,
    // lo que garantiza que solo los clientes asignados puedan actualizar su progreso, 
    // y que no se puedan modificar asignaciones de otros clientes o asignaciones que no pertenezcan al mismo gimnasio, 
    // asegurando así la integridad y seguridad de los datos de progreso de cada cliente.
    const assignment = await Assignment.findById(id);
    if (!assignment) return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    if (String(assignment.gymId || null) !== String(user.gymId || null)) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar este progreso' }, { status: 403 });
    }

    // Verificar que el usuario autenticado sea el cliente asignado a la asignación, para garantizar que solo 
    // el cliente correspondiente pueda actualizar su progreso, 
    // evitando así que otros usuarios puedan modificar el progreso de clientes que no les corresponden, 
    // y asegurando la privacidad y seguridad de los datos de progreso de cada cliente.
    if (user.role !== 'client' || assignment.clientId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'No tienes permisos para actualizar este progreso' }, { status: 403 });
    }

    // Obtener los datos de progreso enviados en la solicitud, y actualizar el progreso de la rutina en la asignación correspondiente,
    // lo que permite al cliente marcar las series de ejercicios como completadas, 
    // y asegurando que el progreso se actualice de manera coherente con los datos proporcionados, 
    // facilitando así el seguimiento del progreso de cada cliente de manera precisa y segura.
    const body = await req.json();
    const { routineId, exerciseId, setNumber } = body;

    if (!routineId || !exerciseId || !setNumber) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // Verificar que la serie de ejercicio especificada no haya sido marcada como completada previamente, 
    // para evitar registros duplicados de progreso, 
    // y asegurar que el progreso refleje únicamente las series de ejercicios que realmente han sido completadas por el cliente, 
    // manteniendo así la integridad y precisión de los datos de progreso de cada cliente.
    assignment.routineProgress = assignment.routineProgress || [];
    const exists = assignment.routineProgress.some(
      (item: RoutineProgressItem) => item.routineId.toString() === routineId && item.exerciseId.toString() === exerciseId && item.setNumber === Number(setNumber)
    );

    // Si la serie de ejercicio no ha sido marcada como completada previamente, agregar un nuevo registro de progreso para esa serie,
    // lo que permite al cliente marcar la serie como completada, y asegurando que el progreso se actualice de manera coherente con los datos proporcionados, 
    // facilitando así el seguimiento del progreso de cada cliente de manera precisa y segura.
    if (!exists) {
      assignment.routineProgress.push({
        routineId,
        exerciseId,
        setNumber: Number(setNumber),
        completedAt: new Date(),
      });
      await assignment.save();
    }

    return NextResponse.json({ message: 'Serie marcada como completada', assignment });
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el progreso' }, { status: 500 });
  }
}
