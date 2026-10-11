import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['requester', 'volunteer', 'coordinator'],
      required: true,
      default: 'requester',
    },
    address: { type: String, trim: true },
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
  },
  { timestamps: true }
);

UserSchema.index({ location: '2dsphere' });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export default UserModel;
