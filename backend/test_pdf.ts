import mongoose from 'mongoose';
import { Report } from './src/models/index.js';
import { pdfService } from './src/services/pdfService.js';
import dotenv from 'dotenv';
dotenv.config();

async function testPdf() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/event-manager');
  const report = await Report.findOne().sort({ createdAt: -1 });
  if (!report) {
    console.log('No report found to test');
    process.exit(0);
  }
  console.log('Testing PDF generation for report ID:', report._id.toString());
  try {
    const url = await pdfService.generatePdf(report._id.toString(), 'http://localhost:5000');
    console.log('Successfully generated PDF:', url);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
  process.exit(0);
}

testPdf();
