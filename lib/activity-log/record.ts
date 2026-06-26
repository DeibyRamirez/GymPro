import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import ActivityLog from '@/lib/models/ActivityLog'
import {
  ACTIVITY_CATEGORY_BY_ACTION,
  type ActivityAction,
} from '@/lib/activity-log/types'

type RecordActivityInput = {
  gymId: string | mongoose.Types.ObjectId | null | undefined
  actorId?: string | mongoose.Types.ObjectId | null
  actorName: string
  actorAvatar?: string | null
  action: ActivityAction
  summary: string
  targetType?: string
  targetId?: string | mongoose.Types.ObjectId | null
  targetLabel?: string
  metadata?: Record<string, unknown>
}

export async function recordActivity(input: RecordActivityInput): Promise<void> {
  if (!input.gymId) return

  await connectDB()

  await ActivityLog.create({
    gymId: input.gymId,
    actorId: input.actorId || null,
    actorName: input.actorName,
    actorAvatar: input.actorAvatar || null,
    action: input.action,
    category: ACTIVITY_CATEGORY_BY_ACTION[input.action],
    summary: input.summary,
    targetType: input.targetType || null,
    targetId: input.targetId || null,
    targetLabel: input.targetLabel || null,
    metadata: input.metadata || {},
  })
}

/** No bloquea la respuesta HTTP si falla la bitácora. */
export function recordActivitySafe(input: RecordActivityInput): void {
  void recordActivity(input).catch((error) => {
    console.error('[activity-log]', error)
  })
}
