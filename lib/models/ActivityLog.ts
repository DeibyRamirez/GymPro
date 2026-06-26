import mongoose, { Document, Schema } from 'mongoose'
import type { ActivityAction, ActivityCategory } from '@/lib/activity-log/types'

export interface IActivityLog extends Document {
  gymId: mongoose.Types.ObjectId
  actorId?: mongoose.Types.ObjectId | null
  actorName: string
  actorAvatar?: string | null
  action: ActivityAction
  category: ActivityCategory
  summary: string
  targetType?: string | null
  targetId?: mongoose.Types.ObjectId | null
  targetLabel?: string | null
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorName: { type: String, required: true, trim: true },
    actorAvatar: { type: String, default: null },
    action: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['user', 'routine', 'meal_plan', 'assignment', 'sale', 'calendar', 'progress', 'inventory', 'system'],
      required: true,
      index: true,
    },
    summary: { type: String, required: true, trim: true },
    targetType: { type: String, default: null },
    targetId: { type: Schema.Types.ObjectId, default: null },
    targetLabel: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  },
)

ActivityLogSchema.index({ gymId: 1, createdAt: -1 })
ActivityLogSchema.index({ gymId: 1, category: 1, createdAt: -1 })

export default mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema)
