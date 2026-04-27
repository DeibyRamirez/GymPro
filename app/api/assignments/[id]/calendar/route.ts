import Assignment from '@/lib/models/Assignment';
import User from '@/lib/models/User';
import connectDB from '@/lib/mongodb';
import jwt, { Secret } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET: Secret = process.env.JWT_SECRET;

// Función para verificar la autenticación del usuario a través del token JWT
async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Token no proporcionado');
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new Error('Usuario no encontrado o inactivo');
  return user;
}

function getWeekdayName(day: number) {
  return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day]
}

function getEventType(isRestDay: boolean) {
  return isRestDay ? 'rest' : 'workout'
}

// Definición de los filtros que se pueden aplicar al obtener las asignaciones
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');
    const referenceDate = monthParam ? new Date(monthParam) : new Date();

    // Obtener la asignación específica por su ID, y poblar los campos relacionados para obtener la información completa
    // de la asignación, incluyendo detalles del cliente, entrenador, rutina y plan alimenticio asociados, lo que permite al cliente 
    // o entrenador ver la información detallada de la asignación, 
    // y proyectar el calendario correspondiente con los eventos programados para cada día dentro del período de la asignación.
    const assignment = await Assignment.findById(id)
      .populate({ path: 'routineId', select: 'name description duration difficulty exercises trainingDaysPerWeek' })
      .populate('mealPlanId', 'name description calories duration meals');

    // Validar que la asignación exista, que pertenezca al mismo gimnasio que el usuario autenticado, 
    // y que el usuario tenga permisos para verla (sea el cliente o entrenador asignado, o un admin),
    // para garantizar que solo los usuarios autorizados puedan acceder a la información de la asignación, 
    // y evitar así posibles problemas de seguridad o privacidad al mostrar información sensible de la asignación a usuarios no autorizados.
    if (!assignment) return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });
    if (String(assignment.gymId || null) !== String(user.gymId || null)) return NextResponse.json({ error: 'No tienes permisos para ver este plan' }, { status: 403 });


    // Verificar que el usuario autenticado sea el cliente o entrenador asignado a la asignación, o tenga un rol de admin, para garantizar 
    // que solo los usuarios autorizados puedan acceder a la información de la asignación, y evitar así posibles problemas de seguridad 
    // o privacidad al mostrar información sensible de la asignación a usuarios no autorizados.
    const isOwner = assignment.clientId.toString() === user._id.toString() || assignment.trainerId.toString() === user._id.toString() || ['admin', 'superadmin'].includes(user.role);
    if (!isOwner) return NextResponse.json({ error: 'No tienes permisos para ver este plan' }, { status: 403 });

    // Proyectar el calendario de la asignación para el mes especificado (o el mes actual si no se especifica),
    // generando un evento para cada día dentro del período de la asignación, y determinando si es un día de descanso 
    // o un día de entrenamiento,
    // lo que permite al cliente o entrenador visualizar el calendario correspondiente a la asignación, 
    // con los eventos programados para cada día, 
    // facilitando así la planificación y seguimiento de las actividades programadas en la asignación.
    const start = new Date(assignment.startDate);
    const end = assignment.endDate ? new Date(assignment.endDate) : new Date(start);
    if (assignment.durationWeeks) end.setDate(start.getDate() + assignment.durationWeeks * 7);


    // Calcular el inicio y fin del mes a proyectar, y generar los eventos para cada día dentro de ese mes que esté dentro del período de la asignación,
    // determinando si cada día es un día de descanso o un día de entrenamiento según el cronograma semanal de la asignación, 
    // y asignando el tipo de evento correspondiente (descanso o entrenamiento) para cada día, lo que permite al cliente o entrenador visualizar el calendario con los eventos programados para cada día, facilitando así la planificación y seguimiento de las actividades programadas en la asignación.
    const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);

    const days: Array<Record<string, unknown>> = [];
    for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      if (date < start || date > end) continue;

      const weekday = date.getDay();
      const scheduleItem = assignment.weeklySchedule?.find((item: { dayOfWeek: number; }) => item.dayOfWeek === weekday);
      const isRestDay = scheduleItem?.isRestDay ?? !scheduleItem?.routineId;
      const eventType = getEventType(isRestDay);

      // Generar un evento para cada día dentro del mes que esté dentro del período de la asignación,
      // determinando si cada día es un día de descanso o un día de entrenamiento según el cronograma semanal de la asignación, 
      // y asignando el tipo de evento correspondiente (descanso o entrenamiento) para cada día, lo que permite al cliente o entrenador visualizar el calendario con los eventos programados para cada día, facilitando así la planificación y seguimiento de las actividades programadas en la asignación.
      days.push({
        id: `${assignment._id.toString()}-${date.toISOString().split('T')[0]}`,
        date: date.toISOString().split('T')[0],
        weekday,
        weekdayName: getWeekdayName(weekday),
        isRestDay,
        type: eventType,
        routine: scheduleItem?.routineId ? assignment.routineId : null,
        mealPlan: scheduleItem?.mealPlanId ? assignment.mealPlanId : assignment.mealPlanId,
        title: scheduleItem?.title || (isRestDay ? 'Descanso Activo' : 'Plan del Día'),
        notes: scheduleItem?.notes || '',
      });
    }

    // Retornar la respuesta con el calendario proyectado para la asignación, 
    // incluyendo los eventos programados para cada día dentro del período de la asignación, 
    // lo que permite al cliente o entrenador visualizar el calendario correspondiente a la asignación, 
    // facilitando así la planificación y seguimiento de las actividades programadas en la asignación.
    return NextResponse.json({
      plan_id: assignment._id.toString(),
      periodo: {
        inicio: start.toISOString().split('T')[0],
        fin: end.toISOString().split('T')[0],
      },
      cronograma_semanal: assignment.weeklySchedule || [],
      calendario: days,
      events: days,
    });
  } catch {
    return NextResponse.json({ error: 'Error al proyectar calendario' }, { status: 500 });
  }
}
