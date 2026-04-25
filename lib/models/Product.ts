import mongoose, { Document, Schema } from 'mongoose';

type PlainDoc = { _id?: unknown; __v?: unknown }

export interface IProduct extends Document {
  name: string;
  description: string;
  category: 'suplemento' | 'accesorio' | 'bebida';
  price: number;
  stock: number;
  lowStockThreshold: number;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, enum: ['suplemento', 'accesorio', 'bebida'], required: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
  image: { type: String, default: '/placeholder.svg' },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      const plain = ret as PlainDoc;
      delete plain._id;
      delete plain.__v;
      return ret;
    }
  }
});

ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ stock: 1 });

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
