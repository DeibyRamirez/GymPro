import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageEntry {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  senderRole?: string;
  receiverRole?: string;
  content: string;
  readAt?: Date | null;
  createdAt: Date;
}

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  gymId?: mongoose.Types.ObjectId | null;
  assignmentId?: mongoose.Types.ObjectId | null;
  content: IMessageEntry[];
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageEntrySchema = new Schema<IMessageEntry>({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, default: null },
  receiverRole: { type: String, default: null },
  content: { type: String, required: true, trim: true, maxlength: [2000, 'El mensaje no puede exceder 2000 caracteres'] },
  readAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const MessageSchema = new Schema<IMessage>({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', default: null },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', default: null },
  content: { type: [MessageEntrySchema], default: [] },
  readAt: { type: Date, default: null },
}, { timestamps: true });

MessageSchema.index({ senderId: 1, receiverId: 1, updatedAt: -1 });
MessageSchema.index({ receiverId: 1, updatedAt: -1 });
MessageSchema.index({ gymId: 1, updatedAt: -1 });

const existingMessageModel = mongoose.models.Message as mongoose.Model<IMessage> | undefined;
const Message = existingMessageModel && existingMessageModel.schema.path('content')?.instance === 'Array'
  ? existingMessageModel
  : (() => {
      if (mongoose.models.Message) {
        delete mongoose.models.Message;
      }
      return mongoose.model<IMessage>('Message', MessageSchema, 'messages');
    })();

export default Message;
