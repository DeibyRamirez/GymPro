import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  clientId: mongoose.Types.ObjectId;
  trainerId: mongoose.Types.ObjectId;
  routineId?: mongoose.Types.ObjectId;
  mealPlanId?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  notes?: string;
  progress?: {
    date: Date;
    completion: number; // porcentaje 0-100
    notes?: string;
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
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
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
AssignmentSchema.index({ status: 1 });
AssignmentSchema.index({ startDate: 1 });
AssignmentSchema.index({ endDate: 1 });

const Assignment = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;