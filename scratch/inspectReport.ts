import mongoose from 'mongoose';
import { config } from '../backend/src/config/index';
import { Report } from '../backend/src/models/index';

async function run() {
  await mongoose.connect(config.mongodb.uri);
  const report = await Report.findById('6a0db4baff07b121547f5e18').lean();
  console.log('Report content in DB:', JSON.stringify(report, null, 2));
  process.exit(0);
}

run().catch(console.error);
