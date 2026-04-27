import mongoose, { Document, Schema } from 'mongoose';

type PlainDoc = { _id?: unknown; __v?: unknown }

export interface IGymEquipment extends Document {
  gymId?: mongoose.Types.ObjectId | null;
  name: string;
  category: 'cardio' | 'fuerza' | 'funcional' | 'accesorio' | 'otro';
  description?: string;
  image?: string;
  quantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GymEquipmentSchema = new Schema<IGymEquipment>({
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', default: null, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ['cardio', 'fuerza', 'funcional', 'accesorio', 'otro'], required: true, default: 'otro' },
  description: { type: String, trim: true },
  image: { type: String, default: '/placeholder.svg' },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: {
    transform: function (_doc, ret) {
      ret.id = ret._id;
      const plain = ret as PlainDoc;
      delete plain._id;
      delete plain.__v;
      return ret;
    }
  }
});

GymEquipmentSchema.index({ gymId: 1, category: 1 });
GymEquipmentSchema.index({ gymId: 1, isActive: 1 });

const GymEquipment = mongoose.models.GymEquipment || mongoose.model<IGymEquipment>('GymEquipment', GymEquipmentSchema);

export default GymEquipment;
