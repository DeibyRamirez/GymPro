import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Assignment from '@/lib/models/Assignment';
import CalendarEvent from '@/lib/models/CalendarEvent';
import Routine from '@/lib/models/Routine';
import MealPlan from '@/lib/models/MealPlan';
import jwt from 'jsonwebtoken';
import { logApiError, logApiRequest } from '@/lib/api-debug';

const JWT_SECRET = process.env.JWT_SECRET!;

type JwtPayload = { userId: string }

// Middleware para verificar autenticación
async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value || 
                req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Token no proporcionado');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) {
    throw new Error('Usuario no encontrado o inactivo');
  }

  return user;
}

// GET - Obtener estadísticas del dashboard
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await verifyAuth(req);
    logApiRequest('/api/dashboard/stats GET', { userId: user._id.toString(), role: user.role, gymId: user.gymId?.toString() || null });

    let stats: Record<string, unknown> = {};

    if (user.role === 'admin' || user.role === 'superadmin') {
      const gymFilter = user.gymId ? { gymId: user.gymId } : { gymId: null };
      // Estadísticas para administradores
      const [
        totalUsers,
        totalTrainers,
        totalClients,
        totalRoutines,
        totalMealPlans,
        totalAssignments,
        recentUsers
      ] = await Promise.all([
        User.countDocuments({ ...gymFilter, isActive: true }),
        User.countDocuments({ ...gymFilter, role: 'trainer', isActive: true }),
        User.countDocuments({ ...gymFilter, role: 'client', isActive: true }),
        Routine.countDocuments({ ...gymFilter, isActive: true }),
        MealPlan.countDocuments({ ...gymFilter, isActive: true }),
        Assignment.countDocuments({ ...gymFilter, status: 'active' }),
        User.find({ ...gymFilter, isActive: true })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name email role createdAt')
      ]);

      stats = {
        totalUsers,
        totalTrainers,
        totalClients,
        totalRoutines,
        totalMealPlans,
        totalAssignments,
        recentUsers,
        userGrowth: await getUserGrowthData(user.gymId ? user.gymId.toString() : null),
        activeAssignments: await getActiveAssignmentsData(user.gymId ? user.gymId.toString() : null)
      };

    } else if (user.role === 'trainer') {
      const gymFilter = user.gymId ? { gymId: user.gymId } : { gymId: null };
      // Estadísticas para entrenadores
      const [
        myClients,
        myRoutines,
        myMealPlans,
        myAssignments,
        recentEvents
      ] = await Promise.all([
        User.countDocuments({ ...gymFilter, trainerId: user._id, isActive: true }),
        Routine.countDocuments({ ...gymFilter, createdBy: user._id, isActive: true }),
        MealPlan.countDocuments({ ...gymFilter, createdBy: user._id, isActive: true }),
        Assignment.countDocuments({ ...gymFilter, trainerId: user._id, status: 'active' }),
        CalendarEvent.find({
          ...gymFilter,
          $or: [{ userId: user._id }, { trainerId: user._id }]
        })
          .sort({ date: -1 })
          .limit(5)
          .populate('userId', 'name')
      ]);

      const clientsList = await User.find({ ...gymFilter, trainerId: user._id, isActive: true })
        .select('name email createdAt')
        .sort({ createdAt: -1 })
        .limit(10);

      stats = {
        myClients,
        myRoutines,
        myMealPlans,
        myAssignments,
        recentEvents,
        clientsList,
        clientProgress: await getClientProgressData(user._id, user.gymId ? user.gymId.toString() : null)
      };

    } else {
      const gymFilter = user.gymId ? { gymId: user.gymId } : { gymId: null };
      // Estadísticas para clientes
      const [
        myAssignments,
        completedEvents,
        upcomingEvents,
        totalEvents,
        trainer
      ] = await Promise.all([
        Assignment.find({ ...gymFilter, clientId: user._id })
          .populate('routineId', 'name description')
          .populate('mealPlanId', 'name description')
          .populate('trainerId', 'name email'),
        CalendarEvent.countDocuments({ 
          ...gymFilter,
          userId: user._id, 
          completed: true,
          date: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) }
        }),
        CalendarEvent.find({
          ...gymFilter,
          userId: user._id,
          completed: false,
          date: { $gte: new Date() }
        })
          .sort({ date: 1 })
          .limit(5),
        CalendarEvent.countDocuments({ ...gymFilter, userId: user._id }),
        user.trainerId ? User.findById(user.trainerId).select('name email') : null
      ]);

      stats = {
        myAssignments,
        completedEvents,
        upcomingEvents,
        totalEvents,
        trainer,
        weeklyProgress: await getWeeklyProgressData(user._id, user.gymId ? user.gymId.toString() : null),
        monthlyStats: await getMonthlyStatsData(user._id, user.gymId ? user.gymId.toString() : null)
      };
    }

    return NextResponse.json({ stats });

  } catch (error) {
    logApiError('/api/dashboard/stats GET', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para obtener datos de crecimiento de usuarios
async function getUserGrowthData(gymId: string | null) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const gymFilter = gymId ? { gymId } : { gymId: null };

  const [lastMonthUsers, thisMonthUsers] = await Promise.all([
    User.countDocuments({
      ...gymFilter,
      createdAt: { $gte: lastMonth, $lt: thisMonth },
      isActive: true
    }),
    User.countDocuments({
      ...gymFilter,
      createdAt: { $gte: thisMonth },
      isActive: true
    })
  ]);

  return {
    lastMonth: lastMonthUsers,
    thisMonth: thisMonthUsers,
    growth: lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0
  };
}

// Función auxiliar para obtener datos de asignaciones activas
async function getActiveAssignmentsData(gymId: string | null) {
  const gymFilter = gymId ? { gymId } : { gymId: null };
  const assignments = await Assignment.aggregate([
    { $match: { ...gymFilter, status: 'active' } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  return assignments;
}

// Función auxiliar para obtener progreso de clientes
async function getClientProgressData(trainerId: string, gymId: string | null) {
  const gymFilter = gymId ? { 'client.gymId': gymId } : {};
  const clientsProgress = await Assignment.aggregate([
    { $match: { trainerId: trainerId, status: 'active' } },
    {
      $lookup: {
        from: 'users',
        localField: 'clientId',
        foreignField: '_id',
        as: 'client'
      }
    },
    { $unwind: '$client' },
    {
      $lookup: {
        from: 'bodymeasurements',
        localField: 'client._id',
        foreignField: 'userId',
        as: 'measurements'
      }
    },
    {
      $project: {
        clientId: '$client._id',
        clientName: '$client.name',
        clientEmail: '$client.email',
        progressCount: { $size: '$measurements' },
        latestMeasurement: { $arrayElemAt: ['$measurements', -1] }
      }
    },
    ...(Object.keys(gymFilter).length ? [{ $match: gymFilter }] : [])
  ]);

  return clientsProgress;
}

// Función auxiliar para obtener progreso semanal del cliente
async function getWeeklyProgressData(userId: string, gymId: string | null) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const gymFilter = gymId ? { gymId } : { gymId: null };

  const events = await CalendarEvent.aggregate([
    {
      $match: {
        ...gymFilter,
        userId: userId,
        date: { $gte: oneWeekAgo }
      }
    },
    {
      $group: {
        _id: {
          day: { $dayOfWeek: '$date' },
          completed: '$completed'
        },
        count: { $sum: 1 }
      }
    }
  ]);

  return events;
}

// Función auxiliar para obtener estadísticas mensuales del cliente
async function getMonthlyStatsData(userId: string, gymId: string | null) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const gymFilter = gymId ? { gymId } : { gymId: null };

  const [workoutEvents, mealEvents, completionRate] = await Promise.all([
    CalendarEvent.countDocuments({
      ...gymFilter,
      userId: userId,
      type: 'workout',
      date: { $gte: oneMonthAgo }
    }),
    CalendarEvent.countDocuments({
      ...gymFilter,
      userId: userId,
      type: 'meal',
      date: { $gte: oneMonthAgo }
    }),
    CalendarEvent.aggregate([
      {
        $match: {
          ...gymFilter,
          userId: userId,
          date: { $gte: oneMonthAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: ['$completed', 1, 0] }
          }
        }
      }
    ])
  ]);

  const rate = completionRate.length > 0 ? 
    (completionRate[0].completed / completionRate[0].total) * 100 : 0;

  return {
    workoutEvents,
    mealEvents,
    completionRate: Math.round(rate)
  };
}
