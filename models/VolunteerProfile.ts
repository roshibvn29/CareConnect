import mongoose, { Schema } from 'mongoose';

const AvailabilitySlotSchema = new Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    slots: [{ type: String }],
  },
  { _id: false }
);

const VolunteerProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    capabilities: [{ type: String, required: true }],
    availability: [AvailabilitySlotSchema],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [77.5946, 12.9716],
      },
    },
    address: { type: String, required: true },
    kycStatus: {
      type: String,
      enum: ['PENDING_KYC', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_KYC',
      index: true,
    },
    kycDocumentUrl: { type: String },
    kycDocumentType: { type: String },
    kycSubmittedAt: { type: Date, default: Date.now },
    kycReviewedAt: { type: Date },
    kycRejectionReason: { type: String },
    completedTasks: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
  },
  { timestamps: true }
);

VolunteerProfileSchema.index({ location: '2dsphere' });

export const VolunteerProfileModel =
  mongoose.models.VolunteerProfile ||
  mongoose.model('VolunteerProfile', VolunteerProfileSchema);
export default VolunteerProfileModel;
