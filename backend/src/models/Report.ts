import mongoose, { Schema, Document } from 'mongoose';

export enum ReportStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IFrontPage {
  logos?: string[];
  heroBanner?: string;
  institutionName?: string;
  departmentName?: string;
  eventTitle?: string;
  eventSubtitle?: string;
  eventDetails?: Array<{ key: string; value: string }>;
  qrCode?: string;
  socialLinks?: Record<string, string>;
}

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  status: ReportStatus;
  template?: mongoose.Types.ObjectId;
  frontPage: IFrontPage;
  pdfUrl?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionNote?: string;
  lastAutoSaved?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const frontPageSchema = new Schema<IFrontPage>(
  {
    logos: [{ type: String }],
    heroBanner: String,
    institutionName: String,
    departmentName: String,
    eventTitle: String,
    eventSubtitle: String,
    eventDetails: [{
      key: { type: String, required: true },
      value: { type: String, default: '' },
    }],
    qrCode: String,
    socialLinks: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const reportSchema = new Schema<IReport>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: Object.values(ReportStatus), default: ReportStatus.DRAFT },
    template: { type: Schema.Types.ObjectId, ref: 'Template' },
    frontPage: { type: frontPageSchema, default: {} },
    pdfUrl: String,
    submittedAt: Date,
    approvedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionNote: String,
    lastAutoSaved: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for sections
reportSchema.virtual('sections', {
  ref: 'ReportSection',
  localField: '_id',
  foreignField: 'report',
  options: { sort: { sortOrder: 1 } },
});

// Virtual for budgets
reportSchema.virtual('budgets', {
  ref: 'Budget',
  localField: '_id',
  foreignField: 'report',
});

reportSchema.index({ event: 1 });
reportSchema.index({ createdBy: 1 });
reportSchema.index({ status: 1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
