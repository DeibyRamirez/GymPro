import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  gymId?: mongoose.Types.ObjectId | null;
  assignmentId?: mongoose.Types.ObjectId | null;
  content: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', default: null },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
  content: { type: String, required: true, trim: true, maxlength: [2000, 'El mensaje no puede exceder 2000 caracteres'] },
  readAt: { type: Date, default: null },
}, { timestamps: true });

MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ gymId: 1, createdAt: -1 });

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
