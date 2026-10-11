export type UserRole = 'requester' | 'volunteer' | 'coordinator';

export type KycStatus = 'PENDING_KYC' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type RequestCategory =
  | 'Grocery Pickup'
  | 'Medicine Pickup'
  | 'Hospital/Medical Assistance'
  | 'Transport Assistance'
  | 'Home Visit'
  | 'Companionship'
  | 'Other';

export type RequestStatus =
  | 'PENDING'
  | 'MATCHING'
  | 'ASSIGNED'
  | 'ACTIVE'
  | 'COMPLETION_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export type AssignmentStatus = 'ASSIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface GeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  address?: string;
  location?: GeoLocation;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IVolunteerAvailability {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  slots: string[]; // e.g. ["Morning (8 AM - 12 PM)", "Afternoon (12 PM - 4 PM)", "Evening (4 PM - 8 PM)"]
}

export interface IVolunteerProfile {
  _id: string;
  userId: string | IUser;
  capabilities: RequestCategory[];
  availability: IVolunteerAvailability[];
  location: GeoLocation;
  address: string;
  kycStatus: KycStatus;
  kycDocumentUrl?: string;
  kycDocumentType?: string;
  kycSubmittedAt?: string | Date;
  kycReviewedAt?: string | Date;
  kycRejectionReason?: string;
  completedTasks: number;
  rating?: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface IAssistanceRequest {
  _id: string;
  requesterId: string | IUser;
  category: RequestCategory;
  description: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // e.g. "Morning (9:00 AM - 12:00 PM)" or "4:00 PM"
  location: GeoLocation;
  address: string;
  status: RequestStatus;
  currentSearchRadius: number; // in km: 2, 5, 10, 15
  notifiedVolunteers?: string[];
  declinedVolunteers?: string[];
  assignedVolunteerId?: string | IUser | null;
  confirmationCode?: string; // e.g. "CARE-4821"
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface IAssignment {
  _id: string;
  requestId: string | IAssistanceRequest;
  volunteerId: string | IUser;
  requesterId: string | IUser;
  status: AssignmentStatus;
  assignedAt: string | Date;
  acceptedAt?: string | Date;
  completedAt?: string | Date;
}

export interface IKycReview {
  _id: string;
  volunteerId: string | IUser;
  coordinatorId: string | IUser;
  documentType: string;
  documentUrl: string;
  status: KycStatus;
  reviewReason?: string;
  reviewedAt: string | Date;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'request_matched' | 'request_accepted' | 'kyc_update' | 'task_update' | 'system';
  read: boolean;
  relatedRequestId?: string;
  createdAt: string | Date;
}

export interface AuthSessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  address?: string;
  location?: GeoLocation;
  kycStatus?: KycStatus;
}
