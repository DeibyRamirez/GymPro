import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  clientId: mongoose.Types.ObjectId;
  trainerId: mongoose.Types.ObjectId;
  gymId?: mongoose.Types.ObjectId | null;
  routineId?: mongoose.Types.ObjectId;
  mealPlanId?: mongoose.Types.ObjectId;
  durationWeeks?: number;
  weeklySchedule?: {
    dayOfWeek: number;
    isRestDay: boolean;
    routineId?: mongoose.Types.ObjectId | null;
    mealPlanId?: mongoose.Types.ObjectId | null;
    title?: string;
    notes?: string;
  }[];
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  notes?: string;
  progress?: {
    date: Date;
    completion: number; // porcentaje 0-100
    notes?: string;
  }[];
  routineProgress?: {
    routineId: mongoose.Types.ObjectId;
    exerciseId: mongoose.Types.ObjectId;
    setNumber: number;
    dateKey?: string;
    completedAt: Date;
  }[];
  dayCompletions?: {
    dateKey: string;
    workoutCompleted: boolean;
    nutritionCompleted: boolean;
    dayCompleted: boolean;
    completedAt?: Date | null;
    note?: string | null;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El cliente es requerido']
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El entrenador es requerido']
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    default: null
  },
  routineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Routine',
    default: null
  },
  mealPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan',
    default: null
  },
  durationWeeks: {
    type: Number,
    min: [1, 'La duración mínima es 1 semana'],
    max: [52, 'La duración máxima es 52 semanas'],
    default: 4
  },
  weeklySchedule: [{
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: true
    },
    isRestDay: {
      type: Boolean,
      default: false
    },
    routineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Routine',
      default: null
    },
    mealPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
      default: null
    },
    title: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  startDate: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida'],
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(this: IAssignment, endDate: Date) {
        return !endDate || endDate > this.startDate;
      },
      message: 'La fecha de fin debe ser posterior a la fecha de inicio'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'completed', 'pending', 'cancelled'],
      message: 'El estado debe ser active, completed, pending o cancelled'
    },
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres']
  },
  progress: [{
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    completion: {
      type: Number,
      required: true,
      min: [0, 'El porcentaje mínimo es 0'],
      max: [100, 'El porcentaje máximo es 100']
    },
    notes: {
      type: String,
      maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
    }
  }]
  ,  routineProgress: [{
    routineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Routine',
      required: true
    },
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true
    },
    setNumber: {
      type: Number,
      required: true,
      min: 1
    },
    dateKey: {
      type: String,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'],
      default: null,
    },
    completedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  }],
  dayCompletions: [{
    dateKey: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'],
    },
    workoutCompleted: { type: Boolean, default: false },
    nutritionCompleted: { type: Boolean, default: false },
    dayCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    note: { type: String, maxlength: 500, default: null },
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      const transformed = ret as {
        _id?: unknown;
        __v?: unknown;
        id?: unknown;
        [key: string]: unknown;
      };

      transformed.id = transformed._id;
      delete transformed._id;
      delete transformed.__v;
      return transformed;
    }
  }
});

// Validación: al menos una rutina o plan alimenticio debe estar asignado
AssignmentSchema.pre('save', function(next) {
  if (!this.routineId && !this.mealPlanId) {
    next(new Error('Debe asignar al menos una rutina o un plan alimenticio'));
  } else {
    next();
  }
});

// Índices
AssignmentSchema.index({ clientId: 1 });
AssignmentSchema.index({ trainerId: 1 });
AssignmentSchema.index({ gymId: 1 });
AssignmentSchema.index({ status: 1 });
AssignmentSchema.index({ startDate: 1 });
AssignmentSchema.index({ endDate: 1 });
AssignmentSchema.index({ 'dayCompletions.dateKey': 1 });

const Assignment = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;
