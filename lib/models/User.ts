import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'trainer' | 'client';
  avatar?: string;
  trainerId?: mongoose.Types.ObjectId; // Para clientes, ID del entrenador asignado
  isActive: boolean;
  // Campos de información del gimnasio
  age?: number; // Edad en años
  weight?: number; // Peso en kg
  height?: number; // Estatura en cm
  gender?: 'masculino' | 'femenino' | 'otro'; // Género
  phone?: string; // Teléfono de contacto
  goal?: 'perder_peso' | 'ganar_masa' | 'mantenimiento' | 'tonificar' | 'resistencia' | 'otro'; // Objetivo
  activityLevel?: 'principiante' | 'intermedio' | 'avanzado'; // Nivel de actividad
  medicalConditions?: string; // Condiciones médicas o lesiones
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un correo electrónico válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir password por defecto en las consultas
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'trainer', 'client'],
      message: 'El rol debe ser admin, trainer o client'
    },
    required: [true, 'El rol es requerido'],
    default: 'client'
  },
  avatar: {
    type: String,
    default: '/placeholder-user.jpg'
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    validate: {
      validator: function(this: IUser, trainerId: mongoose.Types.ObjectId) {
        // Solo los clientes pueden tener un trainerId
        if (trainerId && this.role !== 'client') {
          return false;
        }
        return true;
      },
      message: 'Solo los clientes pueden tener un entrenador asignado'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Campos de información del gimnasio
  age: {
    type: Number,
    min: [1, 'La edad debe ser mayor a 0'],
    max: [150, 'La edad debe ser menor a 150']
  },
  weight: {
    type: Number,
    min: [1, 'El peso debe ser mayor a 0'],
    max: [500, 'El peso debe ser menor a 500 kg']
  },
  height: {
    type: Number,
    min: [50, 'La estatura debe ser mayor a 50 cm'],
    max: [300, 'La estatura debe ser menor a 300 cm']
  },
  gender: {
    type: String,
    enum: {
      values: ['masculino', 'femenino', 'otro'],
      message: 'El género debe ser masculino, femenino u otro'
    }
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\d\s\-\+\(\)]+$/, 'Por favor ingrese un teléfono válido']
  },
  goal: {
    type: String,
    enum: {
      values: ['perder_peso', 'ganar_masa', 'mantenimiento', 'tonificar', 'resistencia', 'otro'],
      message: 'El objetivo debe ser uno de los valores permitidos'
    }
  },
  activityLevel: {
    type: String,
    enum: {
      values: ['principiante', 'intermedio', 'avanzado'],
      message: 'El nivel de actividad debe ser principiante, intermedio o avanzado'
    }
  },
  medicalConditions: {
    type: String,
    trim: true,
    maxlength: [500, 'Las condiciones médicas no pueden exceder 500 caracteres']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      delete (ret as any).password; // Nunca devolver la contraseña
      return ret;
    }
  }
});

// Hash de contraseña antes de guardar
UserSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Índices
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ trainerId: 1 });
UserSchema.index({ isActive: 1 });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

