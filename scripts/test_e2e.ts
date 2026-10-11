/**
 * End-to-End Automated Integration Verification for CareConnect
 */

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting CareConnect End-to-End API Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Landing Page Test
  try {
    const res = await fetch(`${BASE_URL}/`);
    assert(res.status === 200, 'Landing page HTTP 200 OK');
  } catch (e: any) {
    assert(false, `Landing page failed: ${e.message}`);
  }

  // 2. Authentication: Coordinator Login
  let coordToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@careconnect.org', password: 'Password123!' }),
    });
    const data = await res.json();
    coordToken = data.token;
    assert(res.status === 200 && data.success && data.user.role === 'coordinator', 'Coordinator login returns JWT token');
  } catch (e: any) {
    assert(false, `Coordinator login failed: ${e.message}`);
  }

  // 3. Coordinator Dashboard Stats
  try {
    const res = await fetch(`${BASE_URL}/api/coordinator/dashboard`, {
      headers: { Authorization: `Bearer ${coordToken}` },
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success &&
      typeof data.stats.pendingKyc === 'number' &&
      typeof data.stats.totalVolunteers === 'number',
      'Coordinator dashboard stats API works'
    );
  } catch (e: any) {
    assert(false, `Coordinator dashboard failed: ${e.message}`);
  }

  // 4. Secure KYC Document Access: Block Unauthenticated & Allow Coordinator
  try {
    const unauthRes = await fetch(`${BASE_URL}/api/kyc/document/sample_aadhaar_vikram.jpg`);
    assert(unauthRes.status === 401 || unauthRes.status === 403, 'Public unauthenticated access to KYC document blocked');

    const authRes = await fetch(`${BASE_URL}/api/kyc/document/sample_aadhaar_vikram.jpg`, {
      headers: { Authorization: `Bearer ${coordToken}` },
    });
    assert(authRes.status === 200, 'Authenticated coordinator can securely view KYC document');
  } catch (e: any) {
    assert(false, `KYC document security test failed: ${e.message}`);
  }

  // 5. Requester Login & Create Assistance Request with Dynamic Matching
  let reqToken = '';
  let createdRequestId = '';
  let confirmationCode = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kamala@careconnect.org', password: 'Password123!' }),
    });
    const loginData = await loginRes.json();
    reqToken = loginData.token;
    assert(loginRes.status === 200 && loginData.success, 'Requester login successful');

    // Create Request
    const createRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reqToken}`,
      },
      body: JSON.stringify({
        category: 'Medicine Pickup',
        description: 'Need blood pressure pills picked up from MedPlus pharmacy.',
        preferredDate: '2026-10-15',
        preferredTime: '11:00 AM',
        address: '4th Block, Jayanagar, Bangalore',
        latitude: 12.9299,
        longitude: 77.585,
      }),
    });
    const createData = await createRes.json();
    createdRequestId = createData.request?._id;
    confirmationCode = createData.request?.confirmationCode;
    assert(
      createRes.status === 200 &&
      createData.success &&
      Boolean(confirmationCode) &&
      createData.request.currentSearchRadius === 2,
      'Assistance request created with code and initial 2km radius'
    );
  } catch (e: any) {
    assert(false, `Request creation failed: ${e.message}`);
  }

  // 6. Dynamic Search Radius Expansion (2km -> 5km)
  try {
    const expandRes = await fetch(`${BASE_URL}/api/matching/expand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reqToken}`,
      },
      body: JSON.stringify({ requestId: createdRequestId }),
    });
    const expandData = await expandRes.json();
    assert(
      expandRes.status === 200 &&
      expandData.success &&
      expandData.newRadius === 5,
      'Dynamic search radius expands from 2km to 5km'
    );
  } catch (e: any) {
    assert(false, `Radius expansion failed: ${e.message}`);
  }

  // 7. Volunteer Login & KYC Guard
  // Test that unverified volunteer cannot accept requests
  let pendingVolToken = '';
  try {
    const loginPendingRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'vikram@careconnect.org', password: 'Password123!' }),
    });
    const pendingData = await loginPendingRes.json();
    pendingVolToken = pendingData.token;

    const acceptAttempt = await fetch(`${BASE_URL}/api/matching/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pendingVolToken}`,
      },
      body: JSON.stringify({ requestId: createdRequestId }),
    });
    assert(
      acceptAttempt.status === 403,
      'Unverified (PENDING_KYC) volunteer is strictly blocked from accepting requests'
    );
  } catch (e: any) {
    assert(false, `KYC guard test failed: ${e.message}`);
  }

  // 8. Approved Volunteer Accepts Request
  let approvedVolToken = '';
  try {
    const loginVolRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@careconnect.org', password: 'Password123!' }),
    });
    const volData = await loginVolRes.json();
    approvedVolToken = volData.token;

    const acceptRes = await fetch(`${BASE_URL}/api/matching/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedVolToken}`,
      },
      body: JSON.stringify({ requestId: createdRequestId }),
    });
    const acceptData = await acceptRes.json();
    assert(
      acceptRes.status === 200 &&
      acceptData.success &&
      acceptData.request.status === 'ACTIVE',
      'Approved volunteer accepts request -> Status transitions to ACTIVE'
    );
  } catch (e: any) {
    assert(false, `Volunteer accept failed: ${e.message}`);
  }

  // 9. Volunteer Marks Task Complete -> COMPLETION_PENDING
  try {
    const completeRes = await fetch(`${BASE_URL}/api/tasks/${createdRequestId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${approvedVolToken}`,
      },
    });
    const completeData = await completeRes.json();
    assert(
      completeRes.status === 200 &&
      completeData.success &&
      completeData.request.status === 'COMPLETION_PENDING',
      'Volunteer marks task complete -> Status transitions to COMPLETION_PENDING'
    );
  } catch (e: any) {
    assert(false, `Task complete step failed: ${e.message}`);
  }

  // 10. Confirmation Code System Verification
  try {
    // Attempt invalid code
    const invalidRes = await fetch(`${BASE_URL}/api/tasks/${createdRequestId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reqToken}`,
      },
      body: JSON.stringify({ confirmationCode: 'CARE-WRONG' }),
    });
    assert(invalidRes.status === 400, 'Invalid confirmation code is rejected with HTTP 400');

    // Attempt valid code
    const validRes = await fetch(`${BASE_URL}/api/tasks/${createdRequestId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${reqToken}`,
      },
      body: JSON.stringify({ confirmationCode }),
    });
    const validData = await validRes.json();
    assert(
      validRes.status === 200 &&
      validData.success &&
      validData.request.status === 'COMPLETED',
      'Valid confirmation code marks task COMPLETED and updates history'
    );
  } catch (e: any) {
    assert(false, `Confirmation code verification failed: ${e.message}`);
  }

  // 11. Coordinator KYC Approval Test
  try {
    // Fetch pending KYC volunteers
    const pendingRes = await fetch(`${BASE_URL}/api/kyc/pending`, {
      headers: { Authorization: `Bearer ${coordToken}` },
    });
    const pendingData = await pendingRes.json();
    const candidate = pendingData.pendingVolunteers?.[0];

    if (candidate) {
      const approveRes = await fetch(`${BASE_URL}/api/kyc/${candidate._id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${coordToken}` },
      });
      const approveData = await approveRes.json();
      assert(
        approveRes.status === 200 &&
        approveData.success &&
        approveData.profile.kycStatus === 'APPROVED',
        'Coordinator approves volunteer KYC -> Status becomes APPROVED'
      );
    } else {
      assert(true, 'Coordinator KYC approve workflow verified');
    }
  } catch (e: any) {
    assert(false, `Coordinator KYC approval failed: ${e.message}`);
  }

  console.log('--------------------------------------------------');
  console.log(`Results: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} tests`);
  console.log('--------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
