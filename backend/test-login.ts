import mongoose from 'mongoose';
import { config } from './src/config/index.js';
import { authService } from './src/services/authService.js';

const testLogin = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB...');
    
    console.log('Testing admin@institution.edu / Admin@123 ...');
    const resultAdmin = await authService.login('admin@institution.edu', 'Admin@123');
    console.log('Admin login successful! Tokens:', Object.keys(resultAdmin.tokens));

    console.log('Testing rahul@institution.edu / User@123 ...');
    const resultUser = await authService.login('rahul@institution.edu', 'User@123');
    console.log('User login successful! Tokens:', Object.keys(resultUser.tokens));

    process.exit(0);
  } catch (err) {
    console.error('Login failed:', err.message || err);
    process.exit(1);
  }
};

testLogin();
