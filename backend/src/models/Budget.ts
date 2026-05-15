import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  report: mongoose.Types.ObjectId;
  item: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  category?: string;
  createdAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    report: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
    item: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Auto-calculate totalCost
budgetSchema.pre('save', function (next) {
  this.totalCost = this.quantity * this.unitCost;
  next();
});

budgetSchema.index({ report: 1 });

export const Budget = mongoose.model<IBudget>('Budget', budgetSchema);
