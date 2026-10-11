import mongoose, { Schema } from 'mongoose';

const AssistanceRequestSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: [
        'Grocery Pickup',
        'Medicine Pickup',
        'Hospital/Medical Assistance',
        'Transport Assistance',
        'Home Visit',
        'Companionship',
        'Other',
      ],
      required: true,
    },
    description: { type: String, required: true },
    preferredDate: { type: String, required: true },
    preferredTime: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'PENDING',
        'MATCHING',
        'ASSIGNED',
        'ACTIVE',
        'COMPLETION_PENDING',
        'COMPLETED',
        'CANCELLED',
        'EXPIRED',
      ],
      default: 'PENDING',
      index: true,
    },
    currentSearchRadius: { type: Number, default: 2 },
    notifiedVolunteers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    declinedVolunteers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    assignedVolunteerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    confirmationCode: { type: String },
  },
  { timestamps: true }
);

AssistanceRequestSchema.index({ location: '2dsphere' });

export const AssistanceRequestModel =
  mongoose.models.AssistanceRequest ||
  mongoose.model('AssistanceRequest', AssistanceRequestSchema);
export default AssistanceRequestModel;
