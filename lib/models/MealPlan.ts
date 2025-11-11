import mongoose, { Document, Schema } from 'mongoose';

export interface IMeal {
  name: string;
  time: string;
  foods: string[];
  calories: number;
  macros?: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface IMealPlan extends Document {
  name: string;
  description: string;
  calories: number;
  meals: IMeal[];
  duration: number; // días
  tags: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MealSchema = new Schema<IMeal>({
  name: {
    type: String,
    required: [true, 'El nombre de la comida es requerido'],
    trim: true
  },
  time: {
    type: String,
    required: [true, 'La hora es requerida'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
  },
  foods: [{
    type: String,
    required: true,
    trim: true
  }],
  calories: {
    type: Number,
    required: [true, 'Las calorías son requeridas'],
    min: [0, 'Las calorías no pueden ser negativas']
  },
  macros: {
    protein: {
      type: Number,
      min: 0,
      default: 0
    },
    carbs: {
      type: Number,
      min: 0,
      default: 0
    },
    fats: {
      type: Number,
      min: 0,
      default: 0
    }
  }
}, { _id: false });

const MealPlanSchema = new Schema<IMealPlan>({
  name: {
    type: String,
    required: [true, 'El nombre del plan alimenticio es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  calories: {
    type: Number,
    required: [true, 'Las calorías totales son requeridas'],
    min: [800, 'Las calorías mínimas son 800'],
    max: [5000, 'Las calorías máximas son 5000']
  },
  meals: {
    type: [MealSchema],
    required: [true, 'Al menos una comida es requerida'],
    validate: {
      validator: function(meals: IMeal[]) {
        return meals.length >= 1;
      },
      message: 'Debe haber al menos una comida'
    }
  },
  duration: {
    type: Number,
    required: [true, 'La duración en días es requerida'],
    min: [1, 'La duración mínima es 1 día'],
    max: [365, 'La duración máxima es 365 días']
  },
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
    required: [true, 'El creador del plan es requerido']
  }
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

// Índices
MealPlanSchema.index({ name: 1 });
MealPlanSchema.index({ calories: 1 });
MealPlanSchema.index({ createdBy: 1 });
MealPlanSchema.index({ tags: 1 });
MealPlanSchema.index({ isActive: 1 });

const MealPlan = mongoose.models.MealPlan || mongoose.model<IMealPlan>('MealPlan', MealPlanSchema);

export default MealPlan;