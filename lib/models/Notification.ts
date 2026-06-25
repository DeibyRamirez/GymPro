import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'class_new'
  | 'class_booking'
  | 'assignment'
  | 'broadcast'
  | 'system';

export type NotificationChannel = 'in_app' | 'email';

export interface INotificationMetadata {
  eventId?: string;
  assignmentId?: string;
  link?: string;
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  gymId?: mongoose.Types.ObjectId | null;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: Date | null;
  channels: NotificationChannel[];
  emailSentAt?: Date | null;
  metadata?: INotificationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gymId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['class_new', 'class_booking', 'assignment', 'broadcast', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'El título no puede exceder 200 caracteres'],
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'El cuerpo no puede exceder 2000 caracteres'],
    },
    readAt: {
      type: Date,
      default: null,
    },
    channels: {
      type: [String],
      enum: ['in_app', 'email'],
      default: ['in_app'],
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    metadata: {
      eventId: { type: String, default: null },
      assignmentId: { type: String, default: null },
      link: { type: String, default: null },
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });

const Notification =
  (mongoose.models.Notification as mongoose.Model<INotification> | undefined) ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
