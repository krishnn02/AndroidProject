import mongoose from 'mongoose';
import { config } from './src/config/index.js';
import { User, Role } from './src/models/index.js';
import bcrypt from 'bcryptjs';

const reset = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB...');

    const adminEmail = 'admin@foodlab.com';
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.password = 'Admin@123';
      if (!admin.department) admin.department = 'Administration';
      await admin.save();
      console.log(`Reset password for admin: ${adminEmail} to Admin@123`);
    } else {
        admin = await User.create({
            name: 'Admin',
            email: 'admin@institution.edu',
            password: 'Admin@123',
            department: 'Administration',
            role: Role.ADMIN,
        });
        console.log(`Created admin: admin@institution.edu to Admin@123`);
    }

    const userEmail = 'rahul@institution.edu';
    const user = await User.findOne({ email: userEmail });
    if (user) {
      user.password = 'User@123';
      if (!user.department) user.department = 'Computer Science';
      await user.save();
      console.log(`Reset password for user: ${userEmail} to User@123`);
    } else {
        await User.create({
            name: 'Rahul',
            email: userEmail,
            password: 'User@123',
            department: 'Computer Science',
            role: Role.USER,
        });
        console.log(`Created user: rahul@institution.edu to User@123`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

reset();
