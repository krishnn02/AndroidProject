import mongoose, { Schema, Document } from 'mongoose';

export enum SectionType {
  ABOUT = 'ABOUT',
  OBJECTIVES = 'OBJECTIVES',
  HIGHLIGHTS = 'HIGHLIGHTS',
  WINNERS = 'WINNERS',
  CONCLUSION = 'CONCLUSION',
  GALLERY = 'GALLERY',
  BUDGET = 'BUDGET',
  CUSTOM = 'CUSTOM',
}

export enum ImageLayout {
  FULL_WIDTH = 'FULL_WIDTH',
  SIDE_BY_SIDE = 'SIDE_BY_SIDE',
  GRID = 'GRID',
  AUTO = 'AUTO',
}

export enum ImageFrame {
  CIRCLE = 'CIRCLE',
  OVAL = 'OVAL',
  ROUNDED_RECTANGLE = 'ROUNDED_RECTANGLE',
  NONE = 'NONE',
}

export interface ISectionContent {
  paragraphs?: string[];
  bullets?: string[];
  richText?: string;
}

export interface IReportSection extends Document {
  _id: mongoose.Types.ObjectId;
  report: mongoose.Types.ObjectId;
  type: SectionType;
  heading: string;
  content: ISectionContent;
  sortOrder: number;
  imageLayout: ImageLayout;
  imageFrame: ImageFrame;
  createdAt: Date;
  updatedAt: Date;
}

const reportSectionSchema = new Schema<IReportSection>(
  {
    report: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
    type: { type: String, enum: Object.values(SectionType), required: true },
    heading: { type: String, required: true, trim: true },
    content: {
      paragraphs: [{ type: String }],
      bullets: [{ type: String }],
      richText: { type: String },
    },
    sortOrder: { type: Number, required: true, default: 0 },
    imageLayout: { type: String, enum: Object.values(ImageLayout), default: ImageLayout.AUTO },
    imageFrame: { type: String, enum: Object.values(ImageFrame), default: ImageFrame.ROUNDED_RECTANGLE },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for images
reportSectionSchema.virtual('images', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'section',
  options: { sort: { sortOrder: 1 } },
});

reportSectionSchema.index({ report: 1, sortOrder: 1 });

export const ReportSection = mongoose.model<IReportSection>('ReportSection', reportSectionSchema);
