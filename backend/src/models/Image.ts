import mongoose, { Schema, Document } from 'mongoose';

export interface IImage extends Document {
  _id: mongoose.Types.ObjectId;
  section: mongoose.Types.ObjectId;
  url: string;
  publicId: string;
  caption?: string;
  sortOrder: number;
  width?: number;
  height?: number;
  createdAt: Date;
}

const imageSchema = new Schema<IImage>(
  {
    section: { type: Schema.Types.ObjectId, ref: 'ReportSection', required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String, trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
    width: Number,
    height: Number,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

imageSchema.index({ section: 1, sortOrder: 1 });

export const Image = mongoose.model<IImage>('Image', imageSchema);
