import mongoose, { Document, Schema } from 'mongoose';

export interface IRoutine extends Document {
  name: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: {
    exercise: mongoose.Types.ObjectId;
    sets: number;
    reps: string;
    rest: string;
    order: number;
  }[];
  tags: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema = new Schema<IRoutine>({
  name: {
    type: String,
    required: [true, 'El nombre de la rutina es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  duration: {
    type: String,
    required: [true, 'La duración es requerida'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'La dificultad debe ser beginner, intermediate o advanced'
    },
    default: 'beginner'
  },
  exercises: [{
    exercise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    sets: {
      type: Number,
      required: true,
      min: 1
    },
    reps: {
      type: String,
      required: true,
      trim: true
    },
    rest: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El creador de la rutina es requerido']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Índices
RoutineSchema.index({ name: 1 });
RoutineSchema.index({ difficulty: 1 });
RoutineSchema.index({ createdBy: 1 });
RoutineSchema.index({ tags: 1 });
RoutineSchema.index({ isActive: 1 });

const Routine = mongoose.models.Routine || mongoose.model<IRoutine>('Routine', RoutineSchema);

export default Routine;