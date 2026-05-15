import mongoose, { Schema, Document } from 'mongoose';
import { ThemeType } from './Event.js';

export interface ITemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: ThemeType;
  htmlContent: string;
  cssContent: string;
  thumbnail?: string;
  isActive: boolean;
  createdAt: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(ThemeType), required: true },
    htmlContent: { type: String, required: true },
    cssContent: { type: String, required: true },
    thumbnail: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

templateSchema.index({ type: 1, isActive: 1 });

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
