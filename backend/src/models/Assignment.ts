import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: { createdAt: 'assignedAt', updatedAt: false },
  }
);

// Prevent duplicate assignments
assignmentSchema.index({ user: 1, event: 1 }, { unique: true });
assignmentSchema.index({ event: 1 });
assignmentSchema.index({ user: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);
