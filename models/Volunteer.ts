import mongoose, { Schema, models } from "mongoose";
const VolunteerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", unique: true }, capabilities: [String],
  availability: [{ day: String, start: String, end: String }], location: { lat: Number, lng: Number },
  kycStatus: { type: String, enum: ["PENDING_KYC","APPROVED","REJECTED","SUSPENDED"], default: "PENDING_KYC" },
  kycDocumentUrl: String, kycDocumentType: String, kycSubmittedAt: Date, kycReviewedAt: Date,
  kycRejectionReason: String, completedTasks: { type: Number, default: 0 }, active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
export default models.Volunteer || mongoose.model("Volunteer", VolunteerSchema);