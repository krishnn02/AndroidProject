import mongoose from 'mongoose';
import { config } from './backend/dist/config/index.js';
import { Report } from './backend/dist/models/index.js';

async function run() {
  await mongoose.connect(config.mongodb.uri);
  const report = await Report.findById('6a0db4baff07b121547f5e18').lean();
  console.log('Report content in DB:', JSON.stringify(report, null, 2));
  process.exit(0);
}

run().catch(console.error);
