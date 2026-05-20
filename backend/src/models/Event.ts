import mongoose, { Schema, Document } from 'mongoose';

export enum EventType {
  CULTURAL = 'CULTURAL',
  TECHNICAL = 'TECHNICAL',
  SEMINAR = 'SEMINAR',
  WORKSHOP = 'WORKSHOP',
  INDUSTRIAL_VISIT = 'INDUSTRIAL_VISIT',
  OTHER = 'OTHER',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ThemeType {
  CULTURAL = 'CULTURAL',
  TECHNICAL = 'TECHNICAL',
  SEMINAR = 'SEMINAR',
  ENVIRONMENT = 'ENVIRONMENT',
  SUSTAINABLE = 'SUSTAINABLE',
  CORPORATE = 'CORPORATE',
}

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: EventType;
  department: string;
  date: Date;
  endDate?: Date;
  venue: string;
  convener: string;
  coConvener?: string;
  facultyCoordinator?: string;
  studentCoordinator?: string;
  volunteers: string[];
  socialMediaLinks?: Record<string, string>;
  themeType: ThemeType;
  parentEvent?: mongoose.Types.ObjectId;
  status: EventStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(EventType), required: true },
    department: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    endDate: { type: Date },
    venue: { type: String, required: true, trim: true },
    convener: { type: String, required: true, trim: true },
    coConvener: { type: String, trim: true },
    facultyCoordinator: { type: String, trim: true },
    studentCoordinator: { type: String, trim: true },
    volunteers: [{ type: String, trim: true }],
    socialMediaLinks: { type: Schema.Types.Mixed, default: {} },
    themeType: { type: String, enum: Object.values(ThemeType), default: ThemeType.CORPORATE },
    parentEvent: { type: Schema.Types.ObjectId, ref: 'Event', default: null },
    status: { type: String, enum: Object.values(EventStatus), default: EventStatus.DRAFT },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for sub-events
eventSchema.virtual('subEvents', {
  ref: 'Event',
  localField: '_id',
  foreignField: 'parentEvent',
});

eventSchema.index({ department: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ parentEvent: 1 });

export const Event = mongoose.model<IEvent>('Event', eventSchema);
