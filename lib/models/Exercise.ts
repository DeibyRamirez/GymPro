import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  image: string;
  instructions: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExerciseSchema = new Schema<IExercise>({
  name: {
    type: String,
    required: [true, 'El nombre del ejercicio es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  sets: {
    type: Number,
    required: [true, 'El número de series es requerido'],
    min: [1, 'Debe tener al menos 1 serie']
  },
  reps: {
    type: String,
    required: [true, 'Las repeticiones son requeridas'],
    trim: true
  },
  rest: {
    type: String,
    required: [true, 'El tiempo de descanso es requerido'],
    trim: true
  },
  image: {
    type: String,
    default: '/default-exercise.png'
  },
  instructions: {
    type: String,
    required: [true, 'Las instrucciones son requeridas'],
    maxlength: [1000, 'Las instrucciones no pueden exceder 1000 caracteres']
  },
  muscleGroups: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'cardio'],
    required: true
  }],
  equipment: [{
    type: String,
    enum: ['barbell', 'dumbbell', 'bodyweight', 'machine', 'cable', 'kettlebell', 'resistance-band', 'none']
  }],
  difficulty: {
    type: String,
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'La dificultad debe ser beginner, intermediate o advanced'
    },
    default: 'beginner'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El creador del ejercicio es requerido']
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
ExerciseSchema.index({ name: 1 });
ExerciseSchema.index({ muscleGroups: 1 });
ExerciseSchema.index({ difficulty: 1 });
ExerciseSchema.index({ createdBy: 1 });

const Exercise = mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;