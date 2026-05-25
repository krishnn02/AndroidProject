import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

let adminToken, rahulToken, priyaToken;
let eventId, reportId, sectionId;

async function runTest() {
  console.log('--- Starting E2E Flow Test ---');
  
  try {
    // 1. Logins
    console.log('1. Admin Login...');
    const adminRes = await api.post('/auth/login', { email: 'admin@institution.edu', password: 'Admin@123' });
    adminToken = adminRes.data.data.tokens.accessToken;
    console.log('Admin token:', adminToken.slice(0, 20) + '...');

    console.log('2. Rahul Login...');
    const rahulRes = await api.post('/auth/login', { email: 'rahul@institution.edu', password: 'User@123' });
    rahulToken = rahulRes.data.data.tokens.accessToken;
    console.log('Rahul token:', rahulToken.slice(0, 20) + '...');

    console.log('3. Priya Login...');
    const priyaRes = await api.post('/auth/login', { email: 'priya@institution.edu', password: 'User@123' });
    priyaToken = priyaRes.data.data.tokens.accessToken;
    console.log('Priya token:', priyaToken.slice(0, 20) + '...');

    // 4. Admin creates event
    console.log('4. Admin creating event...');
    const evRes = await api.post('/events', {
      name: 'E2E Test Event',
      type: 'TECHNICAL',
      department: 'CS',
      date: new Date().toISOString(),
      venue: 'Lab',
      themeType: 'TECHNICAL',
      convener: 'Test Convener',
      facultyCoordinator: 'Test Faculty',
      studentCoordinator: 'Test Student'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    eventId = evRes.data.data.event._id;

    // Assign Rahul and Amit
    console.log('Assigning users to event...');
    const usersRes = await api.get('/users', { headers: { Authorization: `Bearer ${adminToken}` } });
    const rahul = usersRes.data.data.users.find(u => u.email === 'rahul@institution.edu');
    const priya = usersRes.data.data.users.find(u => u.email === 'priya@institution.edu');
    
    await api.post(`/events/${eventId}/assign`, { userIds: [rahul._id, priya._id] }, { headers: { Authorization: `Bearer ${adminToken}` } });

    // 5. Rahul creates report
    console.log('5. Rahul creating report...');
    const repRes = await api.post('/reports', { eventId }, { headers: { Authorization: `Bearer ${rahulToken}` } });
    reportId = repRes.data.data.report._id;

    // 6. Rahul edits report
    console.log('6. Rahul editing report...');
    await api.patch(`/reports/${reportId}/front-page`, { institutionName: 'Test Inst' }, { headers: { Authorization: `Bearer ${rahulToken}` } });
    const secRes = await api.post(`/reports/${reportId}/sections`, { type: 'ABOUT', heading: 'Test Heading' }, { headers: { Authorization: `Bearer ${rahulToken}` } });
    sectionId = secRes.data.data.section._id;

    // 7. Priya tries to edit Rahul's report (IDOR Test)
    console.log('7. IDOR Test: Priya tries to edit Rahul\'s report...');
    try {
      await api.patch(`/reports/sections/${sectionId}`, { heading: 'Hacked by Priya' }, { headers: { Authorization: `Bearer ${priyaToken}` } });
      throw new Error('IDOR FAILED: Priya was able to edit Rahul\'s section');
    } catch (e) {
      if (e.response?.status === 403) {
        console.log('✅ IDOR correctly blocked with 403 Forbidden!');
      } else {
        throw new Error(`IDOR Test unexpected error: ${e.response?.status}`);
      }
    }

    // 8. Rahul submits
    console.log('8. Rahul submitting report...');
    await api.post(`/reports/${reportId}/submit`, {}, { headers: { Authorization: `Bearer ${rahulToken}` } });

    // 9. Admin approves
    console.log('9. Admin approving report...');
    await api.post(`/reports/${reportId}/approve`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });

    // 10. Rahul downloads PDF (Generate first, then download)
    console.log('10. Rahul downloading PDF & DOCX...');
    await api.get(`/reports/${reportId}/pdf`, { headers: { Authorization: `Bearer ${rahulToken}` } });
    const pdfRes = await api.get(`/reports/${reportId}/download/pdf`, { headers: { Authorization: `Bearer ${rahulToken}` }, responseType: 'blob' });
    console.log(`✅ PDF downloaded successfully (Size: ${pdfRes.data.length} bytes)`);
    
    await api.get(`/reports/${reportId}/docx`, { headers: { Authorization: `Bearer ${rahulToken}` } });
    const docxRes = await api.get(`/reports/${reportId}/download/docx`, { headers: { Authorization: `Bearer ${rahulToken}` }, responseType: 'blob' });
    console.log(`✅ DOCX downloaded successfully (Size: ${docxRes.data.length} bytes)`);

    // 11. Orphaned Data Test: Admin deletes event
    console.log('11. Admin deleting event (Orphaned data test)...');
    await api.delete(`/events/${eventId}`, { headers: { Authorization: `Bearer ${adminToken}` } });

    // 12. Verify report is deleted
    console.log('12. Verifying report is deleted...');
    try {
      await api.get(`/reports/${reportId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      throw new Error('Orphaned Data FAILED: Report still exists');
    } catch (e) {
      if (e.response?.status === 404) {
        console.log('✅ Orphaned report correctly deleted!');
      } else {
        throw new Error(`Orphaned Data unexpected error: ${e.message}`);
      }
    }

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.response?.data || err.message);
  }
}

runTest();
