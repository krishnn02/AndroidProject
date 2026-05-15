import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config/index.js';
import { User, Role } from './models/index.js';

const seed = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB for seeding...');

    // Check if admin exists
    const adminExists = await User.findOne({ role: Role.ADMIN });
    if (adminExists) {
      console.log('Admin already exists. Skipping seed.');
      process.exit(0);
    }

    // Create default admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@institution.edu',
      password: 'Admin@123',
      department: 'Administration',
      college: 'Main Campus',
      role: Role.ADMIN,
    });
    console.log(`✅ Admin created: ${admin.email}`);

    // Create sample users
    const users = [
      { name: 'Rahul Sharma', email: 'rahul@institution.edu', password: 'User@123', department: 'Computer Science', college: 'Engineering', phone: '9876543210' },
      { name: 'Priya Patel', email: 'priya@institution.edu', password: 'User@123', department: 'Information Technology', college: 'Engineering', phone: '9876543211' },
      { name: 'Amit Kumar', email: 'amit@institution.edu', password: 'User@123', department: 'Electronics', college: 'Engineering', phone: '9876543212' },
    ];

    for (const u of users) {
      await User.create({ ...u, role: Role.USER });
      console.log(`✅ User created: ${u.email}`);
    }

    console.log('\n🌱 Seeding complete!');
    console.log('Admin login: admin@institution.edu / Admin@123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
