import mongoose, { Document, Schema } from 'mongoose';

type PlainDoc = { _id?: unknown; __v?: unknown };

export interface IBodyMeasurement extends Document {
  userId: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId | null;
  date: Date;
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arm?: number;
  thigh?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BodyMeasurementSchema = new Schema<IBodyMeasurement>(
  {
    // Cada registro queda ligado al cliente para conservar su historial a lo largo del tiempo.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El cliente es requerido'],
    },
    // La asignación es opcional para no bloquear registros históricos o manuales.
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'La fecha es requerida'],
      default: Date.now,
    },
    weight: {
      type: Number,
      min: [1, 'El peso debe ser mayor a 0'],
      max: [500, 'El peso debe ser menor a 500 kg'],
    },
    bodyFat: {
      type: Number,
      min: [0, 'El porcentaje de grasa no puede ser negativo'],
      max: [100, 'El porcentaje de grasa no puede superar 100'],
    },
    chest: {
      type: Number,
      min: [0, 'El perímetro debe ser válido'],
    },
    waist: {
      type: Number,
      min: [0, 'El perímetro debe ser válido'],
    },
    hips: {
      type: Number,
      min: [0, 'El perímetro debe ser válido'],
    },
    arm: {
      type: Number,
      min: [0, 'El perímetro debe ser válido'],
    },
    thigh: {
      type: Number,
      min: [0, 'El perímetro debe ser válido'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        // Convertimos el documento de Mongo a un objeto simple para el frontend.
        ret.id = ret._id;
        const plain = ret as PlainDoc;
        delete plain._id;
        delete plain.__v;
        return ret;
      },
    },
  }
);

// Un cliente puede tener muchos registros, ordenados por fecha para facilitar la gráfica.
BodyMeasurementSchema.index({ userId: 1, date: -1 });

const BodyMeasurement = mongoose.models.BodyMeasurement || mongoose.model<IBodyMeasurement>('BodyMeasurement', BodyMeasurementSchema);

export default BodyMeasurement;
