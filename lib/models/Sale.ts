import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ISale extends Document {
  clientId?: mongoose.Types.ObjectId | null;
  adminId: mongoose.Types.ObjectId;
  gymId?: mongoose.Types.ObjectId | null;
  items: ISaleItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gymId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', default: null },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  }],
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer'], default: 'cash' },
}, { timestamps: true });

SaleSchema.index({ gymId: 1 });

const Sale = mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);

export default Sale;
