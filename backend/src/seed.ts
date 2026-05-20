import mongoose from 'mongoose';
import { config } from './config/index.js';
import { User, Role, Event, EventStatus, Assignment, Report, ReportStatus, ReportSection, Budget } from './models/index.js';

const seed = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB for seeding...');

    // Check if admin exists
    const adminExists = await User.findOne({ role: Role.ADMIN });

    // Create admin if not exists
    let admin;
    if (!adminExists) {
      admin = await User.create({
        name: 'Admin',
        email: 'admin@institution.edu',
        password: 'Admin@123',
        department: 'Administration',
        college: 'Main Campus',
        role: Role.ADMIN,
      });
      console.log(`✅ Admin created: ${admin.email}`);
    } else {
      admin = adminExists;
      console.log(`⏭️  Admin exists: ${admin.email}`);
    }

    // Create sample users (skip if they exist)
    const usersData = [
      { name: 'Rahul Sharma', email: 'rahul@institution.edu', password: 'User@123', department: 'Computer Science', college: 'Engineering', phone: '9876543210' },
      { name: 'Priya Patel', email: 'priya@institution.edu', password: 'User@123', department: 'Information Technology', college: 'Engineering', phone: '9876543211' },
      { name: 'Amit Kumar', email: 'amit@institution.edu', password: 'User@123', department: 'Electronics', college: 'Engineering', phone: '9876543212' },
    ];

    const users: any[] = [];
    for (const u of usersData) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create({ ...u, role: Role.USER });
        console.log(`✅ User created: ${u.email}`);
      } else {
        console.log(`⏭️  User exists: ${u.email}`);
      }
      users.push(existing);
    }

    // Skip event/report creation if events already exist
    const eventCount = await Event.countDocuments();
    if (eventCount > 0) {
      console.log(`⏭️  ${eventCount} events already exist. Skipping event/report creation.`);
      console.log('\n🌱 Seeding complete!');
      process.exit(0);
    }

    // Create events
    const eventsData = [
      {
        name: 'Annual Tech Symposium 2026',
        type: 'TECHNICAL',
        department: 'Computer Science',
        date: new Date('2026-06-15'),
        venue: 'Main Auditorium',
        convener: 'Dr. Rajesh Gupta',
        coConvener: 'Prof. Meera Joshi',
        facultyCoordinator: 'Dr. Anil Verma',
        studentCoordinator: 'Rahul Sharma',
        status: EventStatus.ACTIVE,
        themeType: 'TECHNICAL',
        createdBy: admin._id,
      },
      {
        name: 'Cultural Fest - Tarang 2026',
        type: 'CULTURAL',
        department: 'Student Council',
        date: new Date('2026-05-25'),
        venue: 'Open Air Theatre',
        convener: 'Dr. Sunita Rao',
        coConvener: 'Prof. Anand Iyer',
        facultyCoordinator: 'Dr. Kavita Nair',
        studentCoordinator: 'Priya Patel',
        status: EventStatus.COMPLETED,
        themeType: 'CULTURAL',
        createdBy: admin._id,
      },
      {
        name: 'Industry Expert Seminar on AI/ML',
        type: 'SEMINAR',
        department: 'Information Technology',
        date: new Date('2026-06-01'),
        venue: 'Seminar Hall B',
        convener: 'Dr. Pradeep Singh',
        facultyCoordinator: 'Prof. Neha Kulkarni',
        studentCoordinator: 'Amit Kumar',
        status: EventStatus.ACTIVE,
        themeType: 'SEMINAR',
        createdBy: admin._id,
      },
      {
        name: 'Workshop on Cloud Computing',
        type: 'WORKSHOP',
        department: 'Computer Science',
        date: new Date('2026-07-10'),
        venue: 'Lab 301',
        convener: 'Prof. Vikram Shah',
        facultyCoordinator: 'Dr. Pooja Mehta',
        studentCoordinator: 'Rahul Sharma',
        status: EventStatus.DRAFT,
        themeType: 'TECHNICAL',
        createdBy: admin._id,
      },
      {
        name: 'National Conference on IoT',
        type: 'SEMINAR',
        department: 'Electronics',
        date: new Date('2026-08-20'),
        venue: 'Conference Hall A',
        convener: 'Dr. Suresh Patil',
        coConvener: 'Prof. Rita Deshmukh',
        facultyCoordinator: 'Dr. Manish Jain',
        studentCoordinator: 'Amit Kumar',
        status: EventStatus.ACTIVE,
        themeType: 'SEMINAR',
        createdBy: admin._id,
      },
    ];

    const events: any[] = [];
    for (const ev of eventsData) {
      const event = await Event.create(ev);
      events.push(event);
      console.log(`✅ Event created: ${ev.name}`);
    }

    // Create assignments (user ↔ event mapping)
    const assignmentsData = [
      // Rahul → Tech Symposium, Cultural Fest, AI/ML Seminar, Cloud Workshop
      { user: users[0]._id, event: events[0]._id, assignedBy: admin._id },
      { user: users[0]._id, event: events[1]._id, assignedBy: admin._id },
      { user: users[0]._id, event: events[2]._id, assignedBy: admin._id },
      { user: users[0]._id, event: events[3]._id, assignedBy: admin._id },
      // Priya → Cultural Fest, Tech Symposium
      { user: users[1]._id, event: events[1]._id, assignedBy: admin._id },
      { user: users[1]._id, event: events[0]._id, assignedBy: admin._id },
      // Amit → AI/ML Seminar, IoT Conference
      { user: users[2]._id, event: events[2]._id, assignedBy: admin._id },
      { user: users[2]._id, event: events[4]._id, assignedBy: admin._id },
    ];

    for (const a of assignmentsData) {
      await Assignment.create(a);
    }
    console.log(`✅ ${assignmentsData.length} assignments created`);

    // Create a submitted report for the Cultural Fest (by Priya)
    const report1 = await Report.create({
      event: events[1]._id,
      createdBy: users[1]._id,
      status: ReportStatus.SUBMITTED,
      frontPage: {
        institutionName: 'National Institute of Engineering',
        departmentName: 'Student Council',
        eventTitle: 'Cultural Fest - Tarang 2026',
        eventSubtitle: 'Celebrating Unity in Diversity',
        venueDate: '25 May 2026',
      },
      submittedAt: new Date(),
    });
    console.log(`✅ Report created: Cultural Fest (SUBMITTED)`);

    // Create sections for report1
    await ReportSection.create({
      report: report1._id,
      type: 'ABOUT',
      heading: 'About the Event',
      content: { paragraphs: ['Tarang 2026 was a two-day cultural extravaganza featuring music, dance, drama, and fine arts from students across all departments. Over 500 participants showcased their talents in 15 competitive events.'] },
      sortOrder: 0,
    });
    await ReportSection.create({
      report: report1._id,
      type: 'HIGHLIGHTS',
      heading: 'Event Highlights',
      content: {
        paragraphs: ['The fest featured 15 competitive events including solo singing, group dance, fashion show, and short film making. The closing ceremony was graced by renowned Bollywood choreographer Ms. Geeta Kapoor.'],
        bullets: ['Best Singer: Riya Kapoor (CSE)', 'Best Dance Troupe: IT Department', 'Best Short Film: "Echoes" by ECE', 'Overall Champions: Computer Science Dept.'],
      },
      sortOrder: 1,
    });
    await ReportSection.create({
      report: report1._id,
      type: 'CONCLUSION',
      heading: 'Conclusion',
      content: { paragraphs: ['Tarang 2026 was a resounding success, bringing together students from diverse backgrounds to celebrate art and culture. The organizing committee thanks all participants, sponsors, and faculty for their support.'] },
      sortOrder: 2,
    });
    console.log(`✅ 3 sections created for Cultural Fest report`);

    // Create budgets for report1
    await Budget.create({ report: report1._id, item: 'Stage Setup & Decoration', category: 'Infrastructure', quantity: 1, unitCost: 25000, totalCost: 25000 });
    await Budget.create({ report: report1._id, item: 'Sound System Rental', category: 'Equipment', quantity: 1, unitCost: 15000, totalCost: 15000 });
    await Budget.create({ report: report1._id, item: 'Prizes & Trophies', category: 'Awards', quantity: 30, unitCost: 500, totalCost: 15000 });
    await Budget.create({ report: report1._id, item: 'Refreshments', category: 'Catering', quantity: 500, unitCost: 60, totalCost: 30000 });
    console.log(`✅ 4 budget items created for Cultural Fest report`);

    // Create a draft report for AI/ML Seminar (by Amit)
    const report2 = await Report.create({
      event: events[2]._id,
      createdBy: users[2]._id,
      status: ReportStatus.DRAFT,
      frontPage: {
        institutionName: 'National Institute of Engineering',
        departmentName: 'Information Technology',
        eventTitle: 'Industry Expert Seminar on AI/ML',
        venueDate: '1 June 2026',
      },
    });
    await ReportSection.create({
      report: report2._id,
      type: 'ABOUT',
      heading: 'About the Seminar',
      content: { paragraphs: ['A half-day seminar featuring industry experts from Google and Microsoft, discussing the latest advances in artificial intelligence and machine learning applications in industry.'] },
      sortOrder: 0,
    });
    console.log(`✅ Report created: AI/ML Seminar (DRAFT)`);

    console.log('\n🌱 Seeding complete!');
    console.log('────────────────────────────');
    console.log('Admin:  admin@institution.edu / Admin@123');
    console.log('User:   rahul@institution.edu / User@123');
    console.log(`Events: ${events.length}, Reports: 2, Assignments: ${assignmentsData.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
