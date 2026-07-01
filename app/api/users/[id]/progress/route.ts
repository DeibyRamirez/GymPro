import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-server';
import { recordActivitySafe } from '@/lib/activity-log/record';
import connectDB from '@/lib/mongodb';
import BodyMeasurement from '@/lib/models/BodyMeasurement';
import CalendarEvent from '@/lib/models/CalendarEvent';
import Assignment from '@/lib/models/Assignment';
import User from '@/lib/models/User';
import { logApiError, logApiRequest } from '@/lib/api-debug';
import {
  buildAchievements,
  buildRoutineHistory,
  getLongestWorkoutStreak,
  getMealPlanCompletionRate,
} from '@/lib/achievements';

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

function toIdString(value: unknown) {
  return value == null ? '' : String(value);
}

function isAuthorizedToAccess(currentUser: { _id: unknown; role: string }, targetUser: { _id: unknown; role: string; trainerId?: unknown | null }) {
  if (currentUser.role === 'client') {
    return toIdString(currentUser._id) === toIdString(targetUser._id);
  }

  if (currentUser.role === 'trainer') {
    return targetUser.role === 'client' && toIdString(targetUser.trainerId) === toIdString(currentUser._id);
  }

  return currentUser.role === 'admin' || currentUser.role === 'superadmin';
}

async function loadProgressContext(userId: string) {
  const measurements = await BodyMeasurement.find({ userId }).sort({ date: 1 });
  const workoutEvents = await CalendarEvent.find({
    userId,
    type: 'workout',
    completed: true,
  }).select('date');
  const assignments = await Assignment.find({ clientId: userId })
    .populate('routineId', 'name exercises')
    .populate('mealPlanId', 'name duration')
    .select('routineId mealPlanId routineProgress dayCompletions durationWeeks startDate endDate status weeklySchedule');

  return { measurements, workoutEvents, assignments };
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    const { id } = await context.params;
    logApiRequest('/api/users/[id]/progress GET', { currentUserId: currentUser._id.toString(), targetUserId: id });
    const targetUser = await User.findById(id).select(
      'name email role trainerId isActive goal weight age height gender activityLevel',
    );

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!isAuthorizedToAccess(currentUser, targetUser)) {
      return NextResponse.json({ error: 'No tienes permisos para ver este progreso' }, { status: 403 });
    }

    const { measurements, workoutEvents, assignments } = await loadProgressContext(id);
    const workoutDates = workoutEvents.map((event) => event.date);
    const achievements = buildAchievements({
      measurements,
      workoutDates,
      user: {
        goal: targetUser.goal,
        weight: targetUser.weight,
        age: targetUser.age,
        height: targetUser.height,
        gender: targetUser.gender,
        activityLevel: targetUser.activityLevel,
      },
      assignments,
    });
    const routineHistory = buildRoutineHistory(assignments);

    return NextResponse.json({
      measurements,
      achievements,
      routineHistory,
      summary: {
        totalMeasurements: measurements.length,
        latestMeasurement: measurements.at(-1) || null,
        longestWorkoutStreak: getLongestWorkoutStreak(workoutDates),
        routineCompletionRate: Math.max(
          ...routineHistory.map((item) => item.completionRate),
          0,
        ),
        nutritionCompletionRate: getMealPlanCompletionRate(assignments),
        unlockedAchievements: achievements.filter((item) => item.unlocked).length,
        totalAchievements: achievements.length,
      },
    });
  } catch (error) {
    logApiError('/api/users/[id]/progress GET', error);
    return NextResponse.json({ error: 'Error al obtener el progreso' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const currentUser = await verifyAuth(req);
    const { id } = await context.params;
    logApiRequest('/api/users/[id]/progress POST', { currentUserId: currentUser._id.toString(), targetUserId: id });
    const targetUser = await User.findById(id).select(
      'role trainerId isActive name gymId goal weight age height gender activityLevel',
    );

    if (!targetUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!isAuthorizedToAccess(currentUser, targetUser)) {
      return NextResponse.json({ error: 'No tienes permisos para registrar este progreso' }, { status: 403 });
    }

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

    const { measurements, workoutEvents, assignments } = await loadProgressContext(id);
    const workoutDates = workoutEvents.map((event) => event.date);

    return NextResponse.json({
      measurement,
      achievements: buildAchievements({
        measurements,
        workoutDates,
        user: {
          goal: targetUser.goal,
          weight: targetUser.weight,
          age: targetUser.age,
          height: targetUser.height,
          gender: targetUser.gender,
          activityLevel: targetUser.activityLevel,
        },
        assignments,
      }),
      routineHistory: buildRoutineHistory(assignments),
    }, { status: 201 });
  } catch (error) {
    logApiError('/api/users/[id]/progress POST', error);
    return NextResponse.json({ error: 'Error al guardar el progreso' }, { status: 500 });
  }
}
