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
      console.log(`⏭️  ${eventCount} events already exist.`);
    }

    // No dummy events seeded anymore.

    console.log('\n🌱 Seeding complete!');
    console.log('────────────────────────────');
    console.log('Admin:  admin@institution.edu / Admin@123');
    console.log('User:   rahul@institution.edu / User@123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
