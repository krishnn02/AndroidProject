import { config } from './config/index.js';

const API_URL = `http://localhost:${config.port}/api`;

async function run() {
  console.log('=== STARTING E2E API VERIFICATION TEST ===');
  console.log(`Target API: ${API_URL}`);

  try {
    // 1. Login Admin
    console.log('\n[Phase 1] Logging in as Admin...');
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@institution.edu', password: 'Admin@123' }),
    });
    if (!adminLoginRes.ok) {
      const body = await adminLoginRes.text();
      throw new Error(`Admin login failed: ${adminLoginRes.status} ${adminLoginRes.statusText} - ${body}`);
    }
    const adminData = (await adminLoginRes.json()) as any;
    const adminToken = adminData.data.tokens.accessToken;
    console.log('✓ Admin login successful. Token acquired.');

    // 2. Login Staff User
    console.log('\n[Phase 2] Logging in as Staff (User)...');
    const userLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@institution.edu', password: 'User@123' }),
    });
    if (!userLoginRes.ok) {
      const body = await userLoginRes.text();
      throw new Error(`User login failed: ${userLoginRes.status} ${userLoginRes.statusText} - ${body}`);
    }
    const userData = (await userLoginRes.json()) as any;
    const userToken = userData.data.tokens.accessToken;
    const userId = userData.data.user.id || userData.data.user._id;
    console.log(`✓ Staff login successful. User ID: ${userId}`);

    // 3. Create Test Event (Admin)
    console.log('\n[Phase 3] Creating Test Event (Admin)...');
    const eventPayload = {
      name: `E2E Coding Seminar ${Date.now()}`,
      type: 'TECHNICAL',
      department: 'Computer Science',
      date: new Date().toISOString(),
      venue: 'Main Auditorium',
      convener: 'Dr. Jane Smith',
      coConvener: 'Dr. John Doe',
      themeType: 'TECHNICAL',
      status: 'ACTIVE',
    };
    const createEventRes = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(eventPayload),
    });
    if (!createEventRes.ok) {
      const body = await createEventRes.text();
      throw new Error(`Event creation failed: ${createEventRes.status} ${createEventRes.statusText} - ${body}`);
    }
    const eventResult = (await createEventRes.json()) as any;
    const eventId = eventResult.data.event._id;
    console.log(`✓ Event created. Event ID: ${eventId}`);

    // 4. Assign Staff User to Event
    console.log('\n[Phase 4] Assigning Staff User to Event...');
    const assignRes = await fetch(`${API_URL}/events/${eventId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ userIds: [userId] }),
    });
    if (!assignRes.ok) {
      const body = await assignRes.text();
      throw new Error(`Assign user failed: ${assignRes.status} ${assignRes.statusText} - ${body}`);
    }
    console.log('✓ Staff user assigned to event successfully.');

    // 5. Create Report Draft (Staff)
    console.log('\n[Phase 5] Creating Report Draft (Staff)...');
    const createReportRes = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ eventId }),
    });
    if (!createReportRes.ok) {
      const body = await createReportRes.text();
      throw new Error(`Report creation failed: ${createReportRes.status} ${createReportRes.statusText} - ${body}`);
    }
    const reportResult = (await createReportRes.json()) as any;
    const reportId = reportResult.data.report._id;
    console.log(`✓ Report draft created. Report ID: ${reportId}`);

    // 6. Configure Front Page
    console.log('\n[Phase 6] Configuring Front Page...');
    const frontPagePayload = {
      eventTitle: eventPayload.name,
      eventSubtitle: 'Analyzing advanced software agents and developer tools',
      venue: eventPayload.venue,
      associationName: 'Department of Computer Science & Engineering',
      logos: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      eventDetails: [
        { key: 'Date', value: new Date().toLocaleDateString('en-IN') },
        { key: 'Convener', value: eventPayload.convener },
        { key: 'Coordinator', value: 'Rahul Kumar' },
      ],
    };
    const updateFrontRes = await fetch(`${API_URL}/reports/${reportId}/front-page`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(frontPagePayload),
    });
    if (!updateFrontRes.ok) {
      const body = await updateFrontRes.text();
      throw new Error(`Front page update failed: ${updateFrontRes.status} ${updateFrontRes.statusText} - ${body}`);
    }
    console.log('✓ Front page cover configured.');

    // 7. Add Report Sections
    console.log('\n[Phase 7] Adding Report Sections...');
    const sections = [
      {
        type: 'ABOUT',
        heading: 'Introduction',
        content: {
          paragraphs: [
            'This seminar focused on agentic coding and its impact on developer productivity.',
            'Speakers presented case studies of real-world deployments and design pattern structures.',
          ],
        },
      },
      {
        type: 'OBJECTIVES',
        heading: 'Learning Outcomes',
        content: {
          bullets: [
            'Understand large language models for software engineering.',
            'Learn to configure sandboxed execution contexts.',
            'Design autonomous workflows and check procedures.',
          ],
        },
      },
    ];

    for (const section of sections) {
      const addSecRes = await fetch(`${API_URL}/reports/${reportId}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(section),
      });
      if (!addSecRes.ok) {
        const body = await addSecRes.text();
        throw new Error(`Failed to add section: ${section.heading} - ${addSecRes.status} - ${body}`);
      }
    }
    console.log('✓ Added all template text sections.');

    // 8. Add Budget Ledger
    console.log('\n[Phase 8] Adding Budget Ledger...');
    const budgets = [
      { item: 'Guest Speaker Honorarium', quantity: 2, unitCost: 15000, totalCost: 30000, category: 'Honorarium' },
      { item: 'Catering & Lunch', quantity: 80, unitCost: 250, totalCost: 20000, category: 'Food' },
      { item: 'Certificates and Printing', quantity: 80, unitCost: 35, totalCost: 2800, category: 'Stationery' },
    ];

    for (const budget of budgets) {
      const addBudRes = await fetch(`${API_URL}/reports/${reportId}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(budget),
      });
      if (!addBudRes.ok) {
        const body = await addBudRes.text();
        throw new Error(`Failed to add budget item: ${budget.item} - ${addBudRes.status} - ${body}`);
      }
    }
    console.log('✓ Configured budget ledger entries.');

    // 9. Submit Report for Approval (Staff)
    console.log('\n[Phase 9] Submitting Report (Staff)...');
    const submitRes = await fetch(`${API_URL}/reports/${reportId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    });
    if (!submitRes.ok) {
      const body = await submitRes.text();
      throw new Error(`Submit failed: ${submitRes.status} ${submitRes.statusText} - ${body}`);
    }
    console.log('✓ Report submitted successfully. Status: SUBMITTED');

    // 10. Approve Report (Admin)
    console.log('\n[Phase 10] Approving Report (Admin)...');
    const approveRes = await fetch(`${API_URL}/reports/${reportId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (!approveRes.ok) {
      const body = await approveRes.text();
      throw new Error(`Approval failed: ${approveRes.status} ${approveRes.statusText} - ${body}`);
    }
    console.log('✓ Report approved successfully. Status: APPROVED');

    // 11. Compile & Generate PDF
    console.log('\n[Phase 11] Generating PDF Compilation & Uploading...');
    const pdfRes = await fetch(`${API_URL}/reports/${reportId}/pdf`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });
    if (!pdfRes.ok) {
      const body = await pdfRes.text();
      throw new Error(`PDF generation failed: ${pdfRes.status} ${pdfRes.statusText} - ${body}`);
    }
    const pdfResult = (await pdfRes.json()) as any;
    const pdfUrl = pdfResult.data.pdfUrl;

    console.log('\n=============================================');
    console.log('🎉 SUCCESS: E2E API VERIFICATION PASSED!');
    console.log(`Generated Cloudinary PDF Report URL:\n${pdfUrl}`);
    console.log('=============================================');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E API VERIFICATION FAILED:');
    console.error(error);
    process.exit(1);
  }
}

run();
