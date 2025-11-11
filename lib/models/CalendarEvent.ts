import mongoose, { Document, Schema } from 'mongoose';

export interface ICalendarEvent extends Document {
  title: string;
  description?: string;
  date: Date;
  type: 'workout' | 'meal' | 'rest' | 'assessment' | 'appointment' | 'reminder';
  completed: boolean;
  userId: mongoose.Types.ObjectId;
  trainerId?: mongoose.Types.ObjectId;
  routineId?: mongoose.Types.ObjectId;
  mealPlanId?: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  duration?: number; // en minutos
  reminder?: {
    enabled: boolean;
    minutes: number; // minutos antes del evento
  };
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>({
  title: {
    type: String,
    required: [true, 'El título del evento es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  description: {
    type: String,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'La fecha del evento es requerida']
  },
  type: {
    type: String,
    enum: {
      values: ['workout', 'meal', 'rest', 'assessment', 'appointment', 'reminder'],
      message: 'El tipo debe ser workout, meal, rest, assessment, appointment o reminder'
    },
    required: [true, 'El tipo de evento es requerido']
  },
  completed: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    default: null
  },
  duration: {
    type: Number,
    min: [1, 'La duración mínima es 1 minuto'],
    max: [480, 'La duración máxima es 480 minutos (8 horas)']
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    minutes: {
      type: Number,
      min: [1, 'El recordatorio mínimo es 1 minuto'],
      max: [1440, 'El recordatorio máximo es 1440 minutos (24 horas)'],
      default: 15
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Índices
CalendarEventSchema.index({ userId: 1, date: 1 });
CalendarEventSchema.index({ trainerId: 1, date: 1 });
CalendarEventSchema.index({ type: 1 });
CalendarEventSchema.index({ completed: 1 });
CalendarEventSchema.index({ date: 1 });

const CalendarEvent = mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);

export default CalendarEvent;