import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Assignment from '@/lib/models/Assignment';
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

function getWeekdayName(day: number) {
  return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][day]
}

function getEventType(isRestDay: boolean) {
  return isRestDay ? 'rest' : 'workout'
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get('month');
    const referenceDate = monthParam ? new Date(monthParam) : new Date();

    const assignment = await Assignment.findById(id)
      .populate({ path: 'routineId', select: 'name description duration difficulty exercises trainingDaysPerWeek' })
      .populate('mealPlanId', 'name description calories duration meals');

    if (!assignment) return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 });

    const isOwner = assignment.clientId.toString() === user._id.toString() || assignment.trainerId.toString() === user._id.toString() || ['admin', 'superadmin'].includes(user.role);
    if (!isOwner) return NextResponse.json({ error: 'No tienes permisos para ver este plan' }, { status: 403 });

    const start = new Date(assignment.startDate);
    const end = assignment.endDate ? new Date(assignment.endDate) : new Date(start);
    if (assignment.durationWeeks) end.setDate(start.getDate() + assignment.durationWeeks * 7);

    const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
    const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);

    const days: Array<Record<string, unknown>> = [];
    for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
      if (date < start || date > end) continue;

      const weekday = date.getDay();
      const scheduleItem = assignment.weeklySchedule?.find((item) => item.dayOfWeek === weekday);
      const isRestDay = scheduleItem?.isRestDay ?? !scheduleItem?.routineId;
      const eventType = getEventType(isRestDay);

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
