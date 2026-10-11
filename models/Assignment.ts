import mongoose, { Schema } from 'mongoose';

const AssignmentSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'AssistanceRequest', required: true, index: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['ASSIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ASSIGNED',
    },
    assignedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const AssignmentModel =
  mongoose.models.Assignment || mongoose.model('Assignment', AssignmentSchema);
export default AssignmentModel;
