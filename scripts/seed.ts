import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';

const STORAGE_DIR = process.env.KYC_STORAGE_DIR || path.join(process.cwd(), 'storage', 'kyc_documents');

async function seed() {
  console.log('🌱 Starting CareConnect database seeding...');

  // Ensure storage folder exists
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  // Create demo KYC sample files if not present
  const sampleAadhaarPath = path.join(STORAGE_DIR, 'sample_aadhaar_vikram.jpg');
  const sampleDlPath = path.join(STORAGE_DIR, 'sample_dl_deepa.jpg');
  const sampleKarthikPath = path.join(STORAGE_DIR, 'sample_voter_karthik.jpg');

  // Simple minimal SVG/JPEG representation for demo files
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="30" y="30" width="540" height="70" rx="8" fill="#0d9488"/>
    <text x="300" y="75" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">GOVERNMENT OF INDIA - IDENTITY VERIFICATION</text>
    <rect x="50" y="130" width="120" height="150" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>
    <text x="110" y="210" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">PHOTO</text>
    <text x="200" y="160" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#0f172a">NAME: DEMO IDENTITY CARD</text>
    <text x="200" y="195" font-family="Arial, sans-serif" font-size="16" fill="#334155">ID NUMBER: XXXX-XXXX-4921</text>
    <text x="200" y="230" font-family="Arial, sans-serif" font-size="16" fill="#334155">DOB: 14/08/1992</text>
    <text x="200" y="265" font-family="Arial, sans-serif" font-size="16" fill="#334155">ADDRESS: Bangalore, Karnataka, India</text>
    <rect x="50" y="310" width="500" height="50" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
    <text x="300" y="340" font-family="Arial, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">CONFIDENTIAL • CARECONNECT VERIFIED VOLUNTEER KYC</text>
  </svg>`;

  fs.writeFileSync(sampleAadhaarPath, sampleSvg, 'utf-8');
  fs.writeFileSync(sampleDlPath, sampleSvg, 'utf-8');
  fs.writeFileSync(sampleKarthikPath, sampleSvg, 'utf-8');

  // Reset existing data
  await db.resetAll();

  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // ==========================================
  // 1. COORDINATORS (2)
  // ==========================================
  console.log('Creating Coordinators...');
  const coord1 = await db.users.create({
    name: 'Sarah Jenkins',
    email: 'admin@careconnect.org',
    phone: '+91 98450 11001',
    passwordHash,
    role: 'coordinator',
    address: 'Central Care Hub, MG Road, Bangalore',
    location: { type: 'Point', coordinates: [77.6093, 12.9756] },
  });

  const coord2 = await db.users.create({
    name: 'David Kumar',
    email: 'david@careconnect.org',
    phone: '+91 98450 11002',
    passwordHash,
    role: 'coordinator',
    address: 'South Zonal Office, Jayanagar, Bangalore',
    location: { type: 'Point', coordinates: [77.5857, 12.925] },
  });

  // ==========================================
  // 2. REQUESTERS (3)
  // ==========================================
  console.log('Creating Requesters...');
  const req1 = await db.users.create({
    name: 'Kamala Devi',
    email: 'kamala@careconnect.org',
    phone: '+91 98450 22001',
    passwordHash,
    role: 'requester',
    address: '4th Block, Jayanagar, Bangalore - 560011',
    location: { type: 'Point', coordinates: [77.585, 12.9299] },
  });

  const req2 = await db.users.create({
    name: 'Robert Pinto',
    email: 'robert@careconnect.org',
    phone: '+91 98450 22002',
    passwordHash,
    role: 'requester',
    address: '5th Block, Koramangala, Bangalore - 560095',
    location: { type: 'Point', coordinates: [77.6186, 12.9352] },
  });

  const req3 = await db.users.create({
    name: 'Anita Sharma',
    email: 'anita@careconnect.org',
    phone: '+91 98450 22003',
    passwordHash,
    role: 'requester',
    address: '100ft Road, Indiranagar, Bangalore - 560038',
    location: { type: 'Point', coordinates: [77.6408, 12.9784] },
  });

  // ==========================================
  // 3. VOLUNTEERS (8)
  // ==========================================
  console.log('Creating Volunteers...');

  // Volunteer 1: Rahul Verma (Approved, Koramangala, close to Robert Pinto)
  const volUser1 = await db.users.create({
    name: 'Rahul Verma',
    email: 'rahul@careconnect.org',
    phone: '+91 98450 33001',
    passwordHash,
    role: 'volunteer',
    address: '6th Block, Koramangala, Bangalore',
    location: { type: 'Point', coordinates: [77.6245, 12.934] },
  });
  await db.volunteerProfiles.create({
    userId: volUser1._id,
    capabilities: ['Grocery Pickup', 'Medicine Pickup', 'Transport Assistance'],
    availability: [
      { day: 'Monday', slots: ['Morning (8 AM - 12 PM)', 'Evening (4 PM - 8 PM)'] },
      { day: 'Wednesday', slots: ['Morning (8 AM - 12 PM)', 'Evening (4 PM - 8 PM)'] },
      { day: 'Saturday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 8 PM)'] },
      { day: 'Sunday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
    ],
    location: { type: 'Point', coordinates: [77.6245, 12.934] },
    address: '6th Block, Koramangala, Bangalore',
    kycStatus: 'APPROVED',
    kycDocumentType: 'Driving License',
    kycDocumentUrl: '/api/kyc/document/sample_dl_deepa.jpg',
    kycSubmittedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    kycReviewedAt: new Date(Date.now() - 29 * 86400000).toISOString(),
    completedTasks: 14,
    rating: 4.9,
  });

  // Volunteer 2: Priya Nair (Approved, Jayanagar, close to Kamala Devi)
  const volUser2 = await db.users.create({
    name: 'Priya Nair',
    email: 'priya@careconnect.org',
    phone: '+91 98450 33002',
    passwordHash,
    role: 'volunteer',
    address: '3rd Block, Jayanagar, Bangalore',
    location: { type: 'Point', coordinates: [77.5835, 12.932] },
  });
  await db.volunteerProfiles.create({
    userId: volUser2._id,
    capabilities: ['Medicine Pickup', 'Hospital/Medical Assistance', 'Grocery Pickup'],
    availability: [
      { day: 'Monday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
      { day: 'Tuesday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
      { day: 'Wednesday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
      { day: 'Thursday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
      { day: 'Friday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
    ],
    location: { type: 'Point', coordinates: [77.5835, 12.932] },
    address: '3rd Block, Jayanagar, Bangalore',
    kycStatus: 'APPROVED',
    kycDocumentType: 'Aadhaar Card',
    kycDocumentUrl: '/api/kyc/document/sample_aadhaar_vikram.jpg',
    kycSubmittedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    kycReviewedAt: new Date(Date.now() - 19 * 86400000).toISOString(),
    completedTasks: 22,
    rating: 5.0,
  });

  // Volunteer 3: Amit Patel (Approved, Indiranagar, close to Anita Sharma)
  const volUser3 = await db.users.create({
    name: 'Amit Patel',
    email: 'amit@careconnect.org',
    phone: '+91 98450 33003',
    passwordHash,
    role: 'volunteer',
    address: 'HAL 2nd Stage, Indiranagar, Bangalore',
    location: { type: 'Point', coordinates: [77.645, 12.972] },
  });
  await db.volunteerProfiles.create({
    userId: volUser3._id,
    capabilities: ['Home Visit', 'Companionship', 'Grocery Pickup', 'Transport Assistance'],
    availability: [
      { day: 'Saturday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 8 PM)'] },
      { day: 'Sunday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 8 PM)'] },
      { day: 'Friday', slots: ['Evening (4 PM - 8 PM)'] },
    ],
    location: { type: 'Point', coordinates: [77.645, 12.972] },
    address: 'HAL 2nd Stage, Indiranagar, Bangalore',
    kycStatus: 'APPROVED',
    kycDocumentType: 'Passport',
    kycDocumentUrl: '/api/kyc/document/sample_aadhaar_vikram.jpg',
    kycSubmittedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    kycReviewedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    completedTasks: 8,
    rating: 4.8,
  });

  // Volunteer 4: Sneha Rao (Approved, BTM Layout)
  const volUser4 = await db.users.create({
    name: 'Sneha Rao',
    email: 'sneha@careconnect.org',
    phone: '+91 98450 33004',
    passwordHash,
    role: 'volunteer',
    address: '1st Stage, BTM Layout, Bangalore',
    location: { type: 'Point', coordinates: [77.61, 12.915] },
  });
  await db.volunteerProfiles.create({
    userId: volUser4._id,
    capabilities: ['Medicine Pickup', 'Hospital/Medical Assistance', 'Companionship'],
    availability: [
      { day: 'Monday', slots: ['Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 8 PM)'] },
      { day: 'Wednesday', slots: ['Afternoon (12 PM - 4 PM)', 'Evening (4 PM - 8 PM)'] },
      { day: 'Saturday', slots: ['Morning (8 AM - 12 PM)'] },
    ],
    location: { type: 'Point', coordinates: [77.61, 12.915] },
    address: '1st Stage, BTM Layout, Bangalore',
    kycStatus: 'APPROVED',
    kycDocumentType: 'Driving License',
    kycDocumentUrl: '/api/kyc/document/sample_dl_deepa.jpg',
    kycSubmittedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    kycReviewedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    completedTasks: 11,
    rating: 4.9,
  });

  // Volunteer 5: Vikram Singh (PENDING_KYC, HSR Layout - waiting coordinator review)
  const volUser5 = await db.users.create({
    name: 'Vikram Singh',
    email: 'vikram@careconnect.org',
    phone: '+91 98450 33005',
    passwordHash,
    role: 'volunteer',
    address: 'Sector 2, HSR Layout, Bangalore',
    location: { type: 'Point', coordinates: [77.638, 12.911] },
  });
  await db.volunteerProfiles.create({
    userId: volUser5._id,
    capabilities: ['Grocery Pickup', 'Transport Assistance', 'Medicine Pickup'],
    availability: [
      { day: 'Monday', slots: ['Morning (8 AM - 12 PM)'] },
      { day: 'Tuesday', slots: ['Morning (8 AM - 12 PM)'] },
      { day: 'Friday', slots: ['Afternoon (12 PM - 4 PM)'] },
    ],
    location: { type: 'Point', coordinates: [77.638, 12.911] },
    address: 'Sector 2, HSR Layout, Bangalore',
    kycStatus: 'PENDING_KYC',
    kycDocumentType: 'Aadhaar Card',
    kycDocumentUrl: '/api/kyc/document/sample_aadhaar_vikram.jpg',
    kycSubmittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    completedTasks: 0,
    rating: 5.0,
  });

  // Volunteer 6: Deepa Krishnan (PENDING_KYC, Whitefield - waiting coordinator review)
  const volUser6 = await db.users.create({
    name: 'Deepa Krishnan',
    email: 'deepa@careconnect.org',
    phone: '+91 98450 33006',
    passwordHash,
    role: 'volunteer',
    address: 'ITPL Main Road, Whitefield, Bangalore',
    location: { type: 'Point', coordinates: [77.7499, 12.9698] },
  });
  await db.volunteerProfiles.create({
    userId: volUser6._id,
    capabilities: ['Companionship', 'Home Visit', 'Grocery Pickup'],
    availability: [
      { day: 'Saturday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
      { day: 'Sunday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
    ],
    location: { type: 'Point', coordinates: [77.7499, 12.9698] },
    address: 'ITPL Main Road, Whitefield, Bangalore',
    kycStatus: 'PENDING_KYC',
    kycDocumentType: 'Driving License',
    kycDocumentUrl: '/api/kyc/document/sample_dl_deepa.jpg',
    kycSubmittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    completedTasks: 0,
    rating: 5.0,
  });

  // Volunteer 7: Karthik Rajan (REJECTED, Jayanagar - rejected with reason)
  const volUser7 = await db.users.create({
    name: 'Karthik Rajan',
    email: 'karthik@careconnect.org',
    phone: '+91 98450 33007',
    passwordHash,
    role: 'volunteer',
    address: '9th Block, Jayanagar, Bangalore',
    location: { type: 'Point', coordinates: [77.595, 12.918] },
  });
  await db.volunteerProfiles.create({
    userId: volUser7._id,
    capabilities: ['Medicine Pickup', 'Grocery Pickup'],
    availability: [
      { day: 'Monday', slots: ['Morning (8 AM - 12 PM)'] },
    ],
    location: { type: 'Point', coordinates: [77.595, 12.918] },
    address: '9th Block, Jayanagar, Bangalore',
    kycStatus: 'REJECTED',
    kycDocumentType: 'Voter ID',
    kycDocumentUrl: '/api/kyc/document/sample_voter_karthik.jpg',
    kycSubmittedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    kycReviewedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    kycRejectionReason: 'Document image was blurry and name did not match registered account.',
    completedTasks: 0,
  });

  // Volunteer 8: Pooja Hegde (APPROVED, Malleshwaram)
  const volUser8 = await db.users.create({
    name: 'Pooja Hegde',
    email: 'pooja@careconnect.org',
    phone: '+91 98450 33008',
    passwordHash,
    role: 'volunteer',
    address: '15th Cross, Malleshwaram, Bangalore',
    location: { type: 'Point', coordinates: [77.568, 13.003] },
  });
  await db.volunteerProfiles.create({
    userId: volUser8._id,
    capabilities: [
      'Grocery Pickup',
      'Medicine Pickup',
      'Hospital/Medical Assistance',
      'Transport Assistance',
      'Home Visit',
      'Companionship',
      'Other',
    ],
    availability: [
      { day: 'Monday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
      { day: 'Saturday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
      { day: 'Sunday', slots: ['Morning (8 AM - 12 PM)', 'Afternoon (12 PM - 4 PM)'] },
    ],
    location: { type: 'Point', coordinates: [77.568, 13.003] },
    address: '15th Cross, Malleshwaram, Bangalore',
    kycStatus: 'APPROVED',
    kycDocumentType: 'Passport',
    kycDocumentUrl: '/api/kyc/document/sample_aadhaar_vikram.jpg',
    kycSubmittedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    kycReviewedAt: new Date(Date.now() - 24 * 86400000).toISOString(),
    completedTasks: 19,
    rating: 4.9,
  });

  // ==========================================
  // 4. DEMO ASSISTANCE REQUESTS & ASSIGNMENTS
  // ==========================================
  console.log('Creating Demo Assistance Requests & Assignments...');

  // Request 1: Robert Pinto - Medicine Pickup (Assigned & Active with Rahul Verma)
  const reqMedicine = await db.assistanceRequests.create({
    requesterId: req2._id,
    category: 'Medicine Pickup',
    description: 'Need critical blood pressure and insulin medication picked up from Apollo Pharmacy on 80ft Road, Koramangala.',
    preferredDate: '2026-10-12',
    preferredTime: '4:00 PM',
    location: { type: 'Point', coordinates: [77.6186, 12.9352] },
    address: '5th Block, Koramangala, Bangalore',
    status: 'ACTIVE',
    currentSearchRadius: 2,
    notifiedVolunteers: [volUser1._id],
    declinedVolunteers: [],
    assignedVolunteerId: volUser1._id,
    confirmationCode: 'CARE-4821',
  });

  await db.assignments.create({
    requestId: reqMedicine._id,
    volunteerId: volUser1._id,
    requesterId: req2._id,
    status: 'ACTIVE',
    assignedAt: new Date(Date.now() - 3600000).toISOString(),
    acceptedAt: new Date(Date.now() - 3500000).toISOString(),
  });

  // Request 2: Kamala Devi - Hospital/Medical Assistance (Assigned to Priya Nair, COMPLETION_PENDING with confirmation code CARE-7193)
  const reqHospital = await db.assistanceRequests.create({
    requesterId: req1._id,
    category: 'Hospital/Medical Assistance',
    description: 'Need accompaniment for monthly cardiac checkup at Manipal Hospital Jayanagar. Need help entering OPD and sitting comfortably.',
    preferredDate: '2026-10-05',
    preferredTime: '10:00 AM',
    location: { type: 'Point', coordinates: [77.585, 12.9299] },
    address: '4th Block, Jayanagar, Bangalore',
    status: 'COMPLETION_PENDING',
    currentSearchRadius: 2,
    notifiedVolunteers: [volUser2._id],
    declinedVolunteers: [],
    assignedVolunteerId: volUser2._id,
    confirmationCode: 'CARE-7193',
  });

  await db.assignments.create({
    requestId: reqHospital._id,
    volunteerId: volUser2._id,
    requesterId: req1._id,
    status: 'ACTIVE',
    assignedAt: new Date(Date.now() - 7200000).toISOString(),
    acceptedAt: new Date(Date.now() - 7100000).toISOString(),
  });

  // Request 3: Kamala Devi - Grocery Pickup (Completed earlier, verified with code CARE-3312)
  const reqGroceryCompleted = await db.assistanceRequests.create({
    requesterId: req1._id,
    category: 'Grocery Pickup',
    description: 'Fresh fruits and dairy pickup from Nilgiris Supermarket, 11th Main Jayanagar.',
    preferredDate: '2026-09-28',
    preferredTime: '11:00 AM',
    location: { type: 'Point', coordinates: [77.585, 12.9299] },
    address: '4th Block, Jayanagar, Bangalore',
    status: 'COMPLETED',
    currentSearchRadius: 2,
    notifiedVolunteers: [volUser2._id],
    assignedVolunteerId: volUser2._id,
    confirmationCode: 'CARE-3312',
  });

  await db.assignments.create({
    requestId: reqGroceryCompleted._id,
    volunteerId: volUser2._id,
    requesterId: req1._id,
    status: 'COMPLETED',
    assignedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    acceptedAt: new Date(Date.now() - 3 * 86400000 + 600000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 86400000 + 7200000).toISOString(),
  });

  // Request 4: Anita Sharma - Companionship (Currently MATCHING at 5km radius)
  const reqCompanionship = await db.assistanceRequests.create({
    requesterId: req3._id,
    category: 'Companionship',
    description: 'Looking for a kind volunteer to spend 1-2 hours having tea and playing carrom/reading newspapers with my 82-year-old father.',
    preferredDate: '2026-10-18',
    preferredTime: '4:00 PM',
    location: { type: 'Point', coordinates: [77.6408, 12.9784] },
    address: '100ft Road, Indiranagar, Bangalore',
    status: 'MATCHING',
    currentSearchRadius: 5,
    notifiedVolunteers: [volUser3._id],
    declinedVolunteers: [],
    assignedVolunteerId: null,
    confirmationCode: 'CARE-9054',
  });

  // Request 5: Robert Pinto - Transport Assistance (Pending in matching)
  const reqTransport = await db.assistanceRequests.create({
    requesterId: req2._id,
    category: 'Transport Assistance',
    description: 'Assistance taking an auto/cab to the local post office and bank branch.',
    preferredDate: '2026-10-15',
    preferredTime: '11:30 AM',
    location: { type: 'Point', coordinates: [77.6186, 12.9352] },
    address: '5th Block, Koramangala, Bangalore',
    status: 'MATCHING',
    currentSearchRadius: 2,
    notifiedVolunteers: [volUser1._id],
    declinedVolunteers: [],
    assignedVolunteerId: null,
    confirmationCode: 'CARE-2281',
  });

  // ==========================================
  // 5. KYC AUDIT REVIEWS
  // ==========================================
  console.log('Creating KYC review logs...');
  await db.kycReviews.create({
    volunteerId: volUser2._id,
    coordinatorId: coord1._id,
    documentType: 'Aadhaar Card',
    documentUrl: '/api/kyc/document/sample_aadhaar_vikram.jpg',
    status: 'APPROVED',
    reviewReason: 'Aadhaar government identity verified with clear details.',
  });

  await db.kycReviews.create({
    volunteerId: volUser1._id,
    coordinatorId: coord2._id,
    documentType: 'Driving License',
    documentUrl: '/api/kyc/document/sample_dl_deepa.jpg',
    status: 'APPROVED',
    reviewReason: 'Commercial/Private driving license verified.',
  });

  await db.kycReviews.create({
    volunteerId: volUser7._id,
    coordinatorId: coord1._id,
    documentType: 'Voter ID',
    documentUrl: '/api/kyc/document/sample_voter_karthik.jpg',
    status: 'REJECTED',
    reviewReason: 'Document image was blurry and name did not match registered account.',
  });

  // ==========================================
  // 6. IN-APP NOTIFICATIONS
  // ==========================================
  console.log('Creating notifications...');
  await db.notifications.create({
    userId: req2._id,
    title: 'Volunteer Rahul Assigned',
    message: 'Rahul Verma has accepted your Medicine Pickup request. Code: CARE-4821',
    type: 'request_accepted',
    relatedRequestId: reqMedicine._id,
  });

  await db.notifications.create({
    userId: volUser1._id,
    title: 'New Assistance Request Nearby',
    message: 'Medicine Pickup requested ~0.8 km away in Koramangala.',
    type: 'request_matched',
    relatedRequestId: reqMedicine._id,
  });

  await db.notifications.create({
    userId: coord1._id,
    title: 'Pending KYC Review',
    message: 'Vikram Singh submitted an Aadhaar card for verification.',
    type: 'kyc_update',
  });

  await db.notifications.create({
    userId: coord2._id,
    title: 'Pending KYC Review',
    message: 'Deepa Krishnan submitted a Driving License for verification.',
    type: 'kyc_update',
  });

  console.log('✅ CareConnect seed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Summary of demo accounts:');
  console.log('Coordinators: admin@careconnect.org, david@careconnect.org');
  console.log('Requesters:   kamala@careconnect.org, robert@careconnect.org, anita@careconnect.org');
  console.log('Volunteers:   rahul@careconnect.org (Approved), priya@careconnect.org (Approved)');
  console.log('              vikram@careconnect.org (Pending KYC), deepa@careconnect.org (Pending KYC)');
  console.log('              karthik@careconnect.org (Rejected)');
  console.log('Default Password: Password123!');
  console.log('--------------------------------------------------');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
