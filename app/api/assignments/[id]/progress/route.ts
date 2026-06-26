import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import { toDateKey } from '@/lib/assignment/day-completion';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
import { logApiError, logApiRequest } from '@/lib/api-debug';


type RoutineProgressItem = {
  routineId: { toString: () => string }
  exerciseId: { toString: () => string }
  setNumber: number
  dateKey?: string | null
}



// Definición de los filtros que se pueden aplicar al obtener las asignaciones
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;
    logApiRequest('/api/assignments/[id]/progress POST', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null, assignmentId: id });

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
    const { routineId, exerciseId, setNumber, date } = body;

    if (!routineId || !exerciseId || !setNumber) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const dateKey =
      typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.slice(0, 10))
        ? date.slice(0, 10)
        : toDateKey(new Date());

    assignment.routineProgress = assignment.routineProgress || [];
    const exists = assignment.routineProgress.some(
      (item: RoutineProgressItem) =>
        item.routineId.toString() === routineId &&
        item.exerciseId.toString() === exerciseId &&
        item.setNumber === Number(setNumber) &&
        (item.dateKey || null) === dateKey,
    );

    if (!exists) {
      assignment.routineProgress.push({
        routineId,
        exerciseId,
        setNumber: Number(setNumber),
        dateKey,
        completedAt: new Date(),
      });
      await assignment.save();
    }

    return NextResponse.json({ message: 'Serie marcada como completada', assignment });
  } catch (error) {
    logApiError('/api/assignments/[id]/progress POST', error);
    return NextResponse.json({ error: 'Error al actualizar el progreso' }, { status: 500 });
  }
}
