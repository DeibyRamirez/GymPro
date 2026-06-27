import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI?.trim() ||
  (process.env.NODE_ENV !== 'production' ? 'mongodb://localhost:27017/fitpro' : '')

if (!MONGODB_URI) {
  throw new Error('Define MONGODB_URI en las variables de entorno (Vercel → Settings → Environment Variables).')
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Usar caché global para evitar múltiples conexiones en desarrollo
declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ Conectado a MongoDB');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

