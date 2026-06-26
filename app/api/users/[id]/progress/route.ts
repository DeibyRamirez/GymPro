import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import { recordActivitySafe } from '@/lib/activity-log/record';
import connectDB from '@/lib/mongodb';
import BodyMeasurement from '@/lib/models/BodyMeasurement';
import CalendarEvent from '@/lib/models/CalendarEvent';
import Assignment from '@/lib/models/Assignment';
import User from '@/lib/models/User';
import { logApiError, logApiRequest } from '@/lib/api-debug';


type JwtPayload = { userId: string };

// El sistema de logros se basa en hitos comunes en el seguimiento de progreso físico, como el primer registro, 
// la constancia y las rachas de entrenamiento, lo que motiva a los usuarios a mantener su compromiso con sus objetivos de 
// fitness al celebrar sus logros y avances de manera tangible dentro de la aplicación.
type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

type RoutineHistoryItem = {
  assignmentId: string;
  routineName: string;
  completedSets: number;
  totalSets: number;
  completionRate: number;
  lastCompletedAt?: Date | null;
}

// La función isAuthorizedToAccess implementa una lógica de autorización basada en roles y relaciones entre usuarios, 
// asegurando que los clientes solo puedan acceder a su propio progreso, los entrenadores solo puedan acceder al progreso de 
// sus clientes asignados, y los administradores tengan acceso completo, lo que garantiza la privacidad y seguridad de los datos de 
// progreso de los usuarios dentro de la aplicación.
type MeasurementInput = {
  date?: string;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arm?: number;
  thigh?: number;
  notes?: string;
};


// permitiendo a los usuarios ver su progreso y logros de manera transparente y motivadora, lo que fomenta la continuidad en su viaje de fitness y el compromiso con sus objetivos de salud y bienestar.
function toIdString(value: unknown) {
  return value == null ? '' : String(value);
}

// La función uniqueDates extrae las fechas únicas de un conjunto de eventos, lo que es útil para calcular rachas de entrenamiento sin contar múltiples eventos en el mismo día, proporcionando una visión más precisa del compromiso del usuario con su rutina de ejercicios.
function isAuthorizedToAccess(currentUser: { _id: unknown; role: string }, targetUser: { _id: unknown; role: string; trainerId?: unknown | null }) {
  // Los clientes solo pueden ver y registrar su propio progreso.
  if (currentUser.role === 'client') {
    return toIdString(currentUser._id) === toIdString(targetUser._id);
  }

  // Los entrenadores solo pueden acceder a clientes que tengan asignados.
  if (currentUser.role === 'trainer') {
    return targetUser.role === 'client' && toIdString(targetUser.trainerId) === toIdString(currentUser._id);
  }

  return currentUser.role === 'admin' || currentUser.role === 'superadmin';
}

// La función getLongestWorkoutStreak calcula la racha más larga de días consecutivos con entrenamientos completados, lo que es un indicador clave de la consistencia del usuario en su rutina de ejercicios, motivándolo a mantener su compromiso para alcanzar sus objetivos de fitness a largo plazo.
function uniqueDates(dates: Date[]) {
  return [...new Set(dates.map((date) => date.toISOString().slice(0, 10)))].sort();
}

// La función getLongestWorkoutStreak calcula la racha más larga de días consecutivos con entrenamientos completados, lo que es un indicador clave de la consistencia del usuario en su rutina de ejercicios, motivándolo a mantener su compromiso para alcanzar sus objetivos de fitness a largo plazo.
function getLongestWorkoutStreak(dates: Date[]) {
  const sorted = uniqueDates(dates);
  if (sorted.length === 0) return 0;

  let longest = 1;
  let streak = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = new Date(`${sorted[index - 1]}T00:00:00.000Z`).getTime();
    const current = new Date(`${sorted[index]}T00:00:00.000Z`).getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (current - previous === oneDay) {
      streak += 1;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }

  return longest;
}

// La función buildAchievements calcula el estado de los logros del usuario en función de sus mediciones corporales y eventos de entrenamiento,
// permitiendo a los usuarios ver su progreso y logros de manera transparente y motivadora, lo que fomenta la continuidad en su viaje de fitness y 
// el compromiso con sus objetivos de salud y bienestar.
function buildAchievements(measurements: Array<{ date: Date }>, workoutDates: Date[]): Achievement[] {
  // Las medallas se calculan desde los datos reales para no duplicar estados.
  const firstMeasurement = measurements[0];
  const firstMeasurementAgeDays = firstMeasurement ? Math.floor((Date.now() - new Date(firstMeasurement.date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const longestWorkoutStreak = getLongestWorkoutStreak(workoutDates);

  return [
    {
      id: 'first-record',
      title: 'Primer registro',
      description: 'Ya guardaste tu primera medición corporal.',
      unlocked: measurements.length >= 1,
    },
    {
      id: 'first-month',
      title: 'Primer mes cumplido',
      description: 'Pasaron 30 días desde tu primera medición.',
      unlocked: firstMeasurementAgeDays >= 30,
    },
    {
      id: 'ten-records',
      title: 'Seguimiento constante',
      description: 'Acumulaste 10 registros corporales.',
      unlocked: measurements.length >= 10,
    },
    {
      id: 'ten-day-streak',
      title: '10 días seguidos de entreno',
      description: 'Alcanzaste una racha de 10 días con entrenamientos completados.',
      unlocked: longestWorkoutStreak >= 10,
    },
  ];
}

function buildRoutineHistory(assignments: Array<{ _id: unknown; routineId?: { name?: string } | null; routineProgress?: Array<{ completedAt: Date }> }>) {
  return assignments.map((assignment) => {
    const completedSets = assignment.routineProgress?.length || 0;
    const totalSets = Math.max(completedSets, 1);
    return {
      assignmentId: String(assignment._id),
      routineName: assignment.routineId?.name || 'Rutina asignada',
      completedSets,
      totalSets,
      completionRate: Math.round((completedSets / totalSets) * 100),
      lastCompletedAt: assignment.routineProgress?.at(-1)?.completedAt || null,
    } satisfies RoutineHistoryItem;
  });
}
// La función buildAchievements calcula el estado de los logros del usuario en función de sus mediciones corporales y eventos de entrenamiento,
// permitiendo a los usuarios ver su progreso y logros de manera transparente y motivadora, lo que fomenta la continuidad en su viaje de fitness 
// y el compromiso con sus objetivos de salud y bienestar.
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    const { id } = await context.params;
    logApiRequest('/api/users/[id]/progress GET', { currentUserId: currentUser._id.toString(), targetUserId: id });
    const targetUser = await User.findById(id).select('name email role trainerId isActive');

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!isAuthorizedToAccess(currentUser, targetUser)) {
      return NextResponse.json({ error: 'No tienes permisos para ver este progreso' }, { status: 403 });
    }
    // La función buildAchievements calcula el estado de los logros del usuario en función de sus mediciones corporales   y eventos de entrenamiento,
    const measurements = await BodyMeasurement.find({ userId: id }).sort({ date: 1 });
    const workoutEvents = await CalendarEvent.find({
      userId: id,
      type: 'workout',
      completed: true,
    }).select('date');
    const assignments = await Assignment.find({ clientId: id })
      .populate('routineId', 'name')
      .select('routineId routineProgress');

    const achievements = buildAchievements(measurements, workoutEvents.map((event) => event.date));
    const routineHistory = buildRoutineHistory(assignments);

    return NextResponse.json({
      measurements,
      achievements,
      routineHistory,
      summary: {
        totalMeasurements: measurements.length,
        latestMeasurement: measurements.at(-1) || null,
        longestWorkoutStreak: getLongestWorkoutStreak(workoutEvents.map((event) => event.date)),
      },
    });
  } catch (error) {
    logApiError('/api/users/[id]/progress GET', error);
    return NextResponse.json({ error: 'Error al obtener el progreso' }, { status: 500 });
  }
}

// La función buildAchievements calcula el estado de los logros del usuario en función de sus mediciones corporales y eventos de entrenamiento,
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    const { id } = await context.params;
    logApiRequest('/api/users/[id]/progress POST', { currentUserId: currentUser._id.toString(), targetUserId: id });
    const targetUser = await User.findById(id).select('role trainerId isActive name gymId');

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!isAuthorizedToAccess(currentUser, targetUser)) {
      return NextResponse.json({ error: 'No tienes permisos para registrar este progreso' }, { status: 403 });
    }

    // La función buildAchievements calcula el estado de los logros del usuario en función de sus mediciones corporales y eventos de entrenamiento, 
    // permitiendo a los usuarios ver su progreso y logros de manera transparente y motivadora, lo que fomenta la continuidad en su viaje de fitness
    //  y el compromiso con sus objetivos de salud y bienestar.
    const body = (await req.json()) as MeasurementInput;
    const measurement = await BodyMeasurement.create({
      userId: id,
      date: body.date || new Date(),
      weight: body.weight,
      bodyFat: body.bodyFat,
      chest: body.chest,
      waist: body.waist,
      hips: body.hips,
      arm: body.arm,
      thigh: body.thigh,
      notes: body.notes,
    });

    recordActivitySafe({
      gymId: targetUser.gymId,
      actorId: currentUser._id,
      actorName: currentUser.name,
      actorAvatar: currentUser.avatar,
      action: 'progress.record',
      summary: `registró progreso corporal de ${targetUser.name}`,
      targetType: 'BodyMeasurement',
      targetId: measurement._id,
      targetLabel: targetUser.name,
    });

    const measurements = await BodyMeasurement.find({ userId: id }).sort({ date: 1 });
    const workoutEvents = await CalendarEvent.find({
      userId: id,
      type: 'workout',
      completed: true,
    }).select('date');
    const assignments = await Assignment.find({ clientId: id }).populate('routineId', 'name').select('routineId routineProgress');

    // La función buildAchievements calcula el estado de los logros del usuario en función de sus mediciones corporales y eventos de entrenamiento,
    return NextResponse.json({
      measurement,
      achievements: buildAchievements(measurements, workoutEvents.map((event) => event.date)),
      routineHistory: buildRoutineHistory(assignments),
    }, { status: 201 });
  } catch (error) {
    logApiError('/api/users/[id]/progress POST', error);
    return NextResponse.json({ error: 'Error al guardar el progreso' }, { status: 500 });
  }
}
