import mongoose, { Document, Schema } from 'mongoose';

type PlainDoc = { _id?: unknown; __v?: unknown };

export interface IGym extends Document {
  name: string;
  slug: string;
  location: string;
  description?: string;
  email: string;
  adminEmail: string;
  adminUserId?: mongoose.Types.ObjectId | null;
  phone?: string;
  hours?: string;
  status: 'draft' | 'active' | 'suspended';
  logo?: string;
  coverImage?: string;
  gallery: string[];
  plans: {
    name: string;
    price?: number;
    description?: string;
    featured?: boolean;
  }[];
  machines: {
    name: string;
    image?: string;
    description?: string;
  }[];
  products: {
    name: string;
    price: number;
    image?: string;
    description?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const GymSchema = new Schema<IGym>(
  {
    // Cada gimnasio representa un tenant con su propio portal público y dashboard.
    name: {
      type: String,
      required: [true, 'El nombre del gimnasio es requerido'],
      trim: true,
      maxlength: [120, 'El nombre no puede exceder 120 caracteres'],
    },
    slug: {
      type: String,
      required: [true, 'El subdominio es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones'],
    },
    location: {
      type: String,
      required: [true, 'La ubicación es requerida'],
      trim: true,
      maxlength: [200, 'La ubicación no puede exceder 200 caracteres'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'La descripción no puede exceder 1000 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El correo de contacto es requerido'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un correo válido'],
    },
    adminEmail: {
      type: String,
      required: [true, 'El correo del admin es requerido'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un correo válido'],
    },
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [50, 'El teléfono no puede exceder 50 caracteres'],
    },
    hours: {
      type: String,
      trim: true,
      maxlength: [120, 'El horario no puede exceder 120 caracteres'],
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'active', 'suspended'],
        message: 'El estado debe ser draft, active o suspended',
      },
      default: 'draft',
    },
    logo: {
      type: String,
      default: '/placeholder-logo.svg',
    },
    coverImage: {
      type: String,
      default: '/athletic-trainer.png',
    },
    gallery: {
      type: [String],
      default: [],
    },
    plans: [{
      name: { type: String, required: true, trim: true },
      price: { type: Number, min: 0 },
      description: { type: String, trim: true },
      featured: { type: Boolean, default: false },
    }],
    machines: [{
      name: { type: String, required: true, trim: true },
      image: { type: String, trim: true },
      description: { type: String, trim: true },
    }],
    products: [{
      name: { type: String, required: true, trim: true },
      price: { type: Number, required: true, min: 0 },
      image: { type: String, trim: true },
      description: { type: String, trim: true },
    }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        // El frontend consume objetos planos, así que limpiamos el documento de Mongoose.
        ret.id = ret._id;
        const plain = ret as PlainDoc;
        delete plain._id;
        delete plain.__v;
        return ret;
      },
    },
  }
);

GymSchema.index({ slug: 1 }, { unique: true });
GymSchema.index({ status: 1 });

const Gym = mongoose.models.Gym || mongoose.model<IGym>('Gym', GymSchema);

export default Gym;
