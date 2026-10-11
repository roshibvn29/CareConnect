import { db } from './db';
import { calculateHaversineDistance, pointToCoords, getNextRadius } from './geo';
import { IAssistanceRequest, IVolunteerProfile } from '@/types';

export interface MatchedVolunteerResult {
  volunteerProfile: IVolunteerProfile;
  user: any;
  distanceKm: number;
}

/**
 * Maps a date string (YYYY-MM-DD) to Day of week
 */
export function getDayOfWeek(dateStr: string): string {
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Monday';
    return days[d.getDay()];
  } catch {
    return 'Monday';
  }
}

/**
 * Rule-based volunteer eligibility and distance filter
 */
export async function findEligibleVolunteers(
  request: IAssistanceRequest,
  radiusKm: number
): Promise<MatchedVolunteerResult[]> {
  // 1. Fetch all volunteer profiles
  const profiles = await db.volunteerProfiles.find({});
  const dayOfWeek = getDayOfWeek(request.preferredDate);

  const reqCoords = pointToCoords(request.location);
  const declinedSet = new Set(
    (request.declinedVolunteers || []).map((id: any) => (typeof id === 'object' ? id._id.toString() : id.toString()))
  );

  const matched: MatchedVolunteerResult[] = [];

  for (const profile of profiles) {
    const userIdStr = (typeof profile.userId === 'object' ? profile.userId._id : profile.userId)?.toString();

    // RULE 1: Volunteer KYC status must be APPROVED (PENDING_KYC, REJECTED, SUSPENDED excluded)
    if (profile.kycStatus !== 'APPROVED') {
      continue;
    }

    // RULE 2: Volunteer must support requested task category
    if (!profile.capabilities || !profile.capabilities.includes(request.category)) {
      continue;
    }

    // RULE 3: Volunteer must not have previously declined this request
    if (declinedSet.has(userIdStr)) {
      continue;
    }

    // RULE 4: Check Day Availability (if specified by volunteer)
    if (profile.availability && profile.availability.length > 0) {
      const dayAvail = profile.availability.find((a: any) => a.day.toLowerCase() === dayOfWeek.toLowerCase());
      // If volunteer explicitly defined availability days and this day is not included
      if (!dayAvail) {
        continue;
      }
    }

    // RULE 5: Geographic distance within current radius
    if (!profile.location || !profile.location.coordinates) {
      continue;
    }

    const volCoords = pointToCoords(profile.location);
    const distanceKm = calculateHaversineDistance(reqCoords, volCoords);

    if (distanceKm <= radiusKm) {
      const user = typeof profile.userId === 'object' ? profile.userId : await db.users.findById(userIdStr);
      matched.push({
        volunteerProfile: profile,
        user,
        distanceKm,
      });
    }
  }

  // Sort primarily by distance (closest first), secondary by completed tasks
  matched.sort((a, b) => {
    if (a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }
    return (b.volunteerProfile.completedTasks || 0) - (a.volunteerProfile.completedTasks || 0);
  });

  return matched;
}

/**
 * Generates formatted confirmation code, e.g. CARE-4821
 */
export function generateConfirmationCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CARE-${num}`;
}

/**
 * Performs matching step with dynamic radius expansion
 */
export async function runMatchingStep(requestId: string): Promise<{
  success: boolean;
  status: string;
  radiusKm: number;
  matchedVolunteers: MatchedVolunteerResult[];
  message: string;
}> {
  const request = await db.assistanceRequests.findById(requestId);
  if (!request) {
    throw new Error('Assistance request not found');
  }

  if (request.status === 'ASSIGNED' || request.status === 'ACTIVE' || request.status === 'COMPLETED') {
    return {
      success: true,
      status: request.status,
      radiusKm: request.currentSearchRadius,
      matchedVolunteers: [],
      message: 'Request is already assigned or active.',
    };
  }

  let currentRadius = request.currentSearchRadius || 2;
  let eligible = await findEligibleVolunteers(request, currentRadius);

  // If no one in current radius, attempt auto-expansion up to 15km
  while (eligible.length === 0) {
    const nextR = getNextRadius(currentRadius);
    if (!nextR) {
      // Reached max 15km and no match found
      break;
    }
    currentRadius = nextR;
    eligible = await findEligibleVolunteers(request, currentRadius);
  }

  // Update request radius and notified volunteers
  const notifiedIds = eligible.map((m) =>
    (typeof m.user?._id === 'object' ? m.user._id.toString() : m.user?._id?.toString()) || ''
  ).filter(Boolean);

  const newStatus = eligible.length > 0 ? 'MATCHING' : 'PENDING';

  await db.assistanceRequests.updateById(requestId, {
    currentSearchRadius: currentRadius,
    status: newStatus,
    notifiedVolunteers: Array.from(new Set([...(request.notifiedVolunteers || []), ...notifiedIds])),
  });

  // Notify newly matched volunteers
  for (const m of eligible) {
    const volUserId = typeof m.user?._id === 'object' ? m.user._id.toString() : m.user?._id;
    if (volUserId) {
      await db.notifications.create({
        userId: volUserId,
        title: 'New Assistance Request Nearby',
        message: `${request.category} requested ~${m.distanceKm} km away. Click to review.`,
        type: 'request_matched',
        relatedRequestId: requestId,
      });
    }
  }

  const requesterId = typeof request.requesterId === 'object' ? request.requesterId._id : request.requesterId;
  await db.notifications.create({
    userId: requesterId,
    title: 'Matching Update',
    message: eligible.length > 0
      ? `Found ${eligible.length} volunteer(s) within ${currentRadius} km. Waiting for volunteer acceptance.`
      : `Searching for volunteers within ${currentRadius} km radius...`,
    type: 'system',
    relatedRequestId: requestId,
  });

  return {
    success: true,
    status: newStatus,
    radiusKm: currentRadius,
    matchedVolunteers: eligible,
    message: eligible.length > 0
      ? `Found ${eligible.length} eligible volunteer(s) within ${currentRadius} km.`
      : `No available approved volunteers within ${currentRadius} km.`,
  };
}
