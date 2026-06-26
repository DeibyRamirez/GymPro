import { NextRequest, NextResponse } from 'next/server'
import {
  handleAuthError,
  requireRoles,
  verifyAuth,
} from '@/lib/auth-server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Gym from '@/lib/models/Gym'
import { buildPagination, parsePagination } from '@/lib/pagination'
import { logApiError, logApiRequest } from '@/lib/api-debug'

type UsersFilters = {
  isActive: boolean
  role?: string
  trainerId?: string
  gymId?: string | null
  _id?: unknown
  $or?: Array<Record<string, unknown>>
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const currentUser = await verifyAuth(req)
    requireRoles(currentUser, ['superadmin', 'admin', 'trainer'])

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = parsePagination(searchParams, 100)
    const role = searchParams.get('role')
    const trainerId = searchParams.get('trainerId')
    logApiRequest('/api/users GET', {
      currentUserId: currentUser._id.toString(),
      role: currentUser.role,
      gymId: currentUser.gymId?.toString() || null,
      query: { role, trainerId, page, limit },
    })

    const filters: UsersFilters = { isActive: true }

    if (role) filters.role = role
    if (trainerId) filters.trainerId = trainerId

    if (currentUser.role !== 'superadmin' && currentUser.gymId) {
      filters.gymId = currentUser.gymId.toString()
    }

    if (currentUser.role === 'trainer') {
      filters.$or = [{ trainerId: currentUser._id }, { _id: currentUser._id }]
    }

    const [users, total] = await Promise.all([
      User.find(filters).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filters),
    ])

    const gymIds = users.map((user) => user.gymId).filter(Boolean)
    const gyms =
      gymIds.length > 0
        ? await Gym.find({ _id: { $in: gymIds } }).select('slug name').lean()
        : []
    const gymMap = new Map(gyms.map((gym) => [String(gym._id), gym]))

    return NextResponse.json({
      users: users.map((user) => ({
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        trainerId: user.trainerId?.toString(),
        gymId: user.gymId?.toString(),
        gymSlug: user.gymId ? gymMap.get(String(user.gymId))?.slug || null : null,
        isActive: user.isActive,
        goal: user.goal || null,
        membershipPlan: user.membershipPlan || null,
      })),
      pagination: buildPagination(page, limit, total),
    })
  } catch (error) {
    logApiError('/api/users GET', error)
    const authError = handleAuthError(error)
    return NextResponse.json({ error: authError.message }, { status: authError.status })
  }
}

