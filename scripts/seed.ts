import { seedDatabase } from '../lib/seedData';

seedDatabase()
  .then(() => {
    console.log('Summary of demo accounts:');
    console.log('Coordinators: admin@careconnect.org, david@careconnect.org');
    console.log('Requesters:   kamala@careconnect.org, robert@careconnect.org, anita@careconnect.org');
    console.log('Volunteers:   rahul@careconnect.org (Approved), priya@careconnect.org (Approved)');
    console.log('              vikram@careconnect.org (Pending KYC), deepa@careconnect.org (Pending KYC)');
    console.log('              karthik@careconnect.org (Rejected)');
    console.log('Default Password: Password123!');
    console.log('--------------------------------------------------');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
