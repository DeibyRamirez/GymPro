import { NextRequest, NextResponse } from 'next/server'
import {
  assertSameGym,
  handleAuthError,
  requireRoles,
  verifyAuth,
} from '@/lib/auth-server'
import {
  ACTIVITY_CATEGORY_LABELS,
  type ActivityCategory,
} from '@/lib/activity-log/types'
import connectDB from '@/lib/mongodb'
import ActivityLog from '@/lib/models/ActivityLog'
import Gym from '@/lib/models/Gym'
import { buildPagination, parsePagination } from '@/lib/pagination'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const user = await verifyAuth(req)
    requireRoles(user, ['superadmin', 'admin'])

    const { searchParams } = new URL(req.url)
    const { page, limit, skip } = parsePagination(searchParams, 30)
    const gymSlug = searchParams.get('gymSlug')?.trim()
    const gymIdParam = searchParams.get('gymId')?.trim()
    const category = searchParams.get('category')?.trim() as ActivityCategory | undefined

    let gymId = user.gymId?.toString() || null

    if (user.role === 'superadmin') {
      if (gymIdParam) {
        gymId = gymIdParam
      } else if (gymSlug) {
        const gym = await Gym.findOne({ slug: gymSlug }).select('_id').lean()
        if (!gym) {
          return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 })
        }
        gymId = String(gym._id)
      }
    }

    if (!gymId) {
      return NextResponse.json({ error: 'Debes indicar un gimnasio' }, { status: 400 })
    }

    if (user.role === 'admin') {
      assertSameGym(user, gymId)
    }

    const filters: Record<string, unknown> = { gymId }
    if (category && category in ACTIVITY_CATEGORY_LABELS) {
      filters.category = category
    }

    const [items, total] = await Promise.all([
      ActivityLog.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ActivityLog.countDocuments(filters),
    ])

    return NextResponse.json({
      activities: items.map((item) => ({
        id: String(item._id),
        gymId: String(item.gymId),
        actor: {
          id: item.actorId ? String(item.actorId) : null,
          name: item.actorName,
          avatar: item.actorAvatar || null,
        },
        action: item.action,
        category: item.category,
        categoryLabel: ACTIVITY_CATEGORY_LABELS[item.category as ActivityCategory],
        summary: item.summary,
        targetType: item.targetType || null,
        targetId: item.targetId ? String(item.targetId) : null,
        targetLabel: item.targetLabel || null,
        createdAt: item.createdAt,
      })),
      pagination: buildPagination(page, limit, total),
    })
  } catch (error) {
    const authError = handleAuthError(error)
    return NextResponse.json({ error: authError.message }, { status: authError.status })
  }
}
