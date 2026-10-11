import mongoose, { Schema } from 'mongoose';

const KycReviewSchema = new Schema(
  {
    volunteerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coordinatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    documentType: { type: String, required: true },
    documentUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['APPROVED', 'REJECTED', 'SUSPENDED'],
      required: true,
    },
    reviewReason: { type: String },
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const KycReviewModel =
  mongoose.models.KycReview || mongoose.model('KycReview', KycReviewSchema);
export default KycReviewModel;
