import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['request_matched', 'request_accepted', 'kyc_update', 'task_update', 'system'],
      default: 'system',
    },
    read: { type: Boolean, default: false },
    relatedRequestId: { type: Schema.Types.ObjectId, ref: 'AssistanceRequest' },
  },
  { timestamps: true }
);

export const NotificationModel =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export default NotificationModel;
