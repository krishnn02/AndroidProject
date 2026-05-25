import mongoose from 'mongoose';
import { config } from './config/index.js';
import {
  User,
  Role,
  Event,
  EventStatus,
  Report,
  ReportStatus,
  ReportSection,
  Budget,
  ThemeType,
  EventType,
} from './models/index.js';
import { pdfService } from './services/pdfService.js';
import { docxService } from './services/docxService.js';
import fs from 'fs/promises';
import path from 'path';

async function runStressTests() {
  console.log('=== STARTING REPORT ENGINE STRESS & THEME VALIDATION ===');
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✓ Connected to MongoDB');

    // 1. Ensure an Admin user exists for event ownership
    let adminUser = await User.findOne({ role: Role.ADMIN });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Stress Test Admin',
        email: `admin-stress-${Date.now()}@institution.edu`,
        password: 'Admin@123',
        department: 'Computer Science',
        college: 'Engineering Campus',
        role: Role.ADMIN,
      });
      console.log('✓ Created transient Admin user for test runs');
    }

    const themes: ThemeType[] = [
      ThemeType.AQUA,
      ThemeType.CULTURAL,
      ThemeType.TECHNICAL,
      ThemeType.SEMINAR,
      ThemeType.SUSTAINABLE,
      ThemeType.CORPORATE,
    ];

    console.log(`\n--- Part 1: Validating All ${themes.length} Themes ---`);

    for (const theme of themes) {
      console.log(`\n[Theme: ${theme}] Creating test event & report...`);

      // Create event
      const event = await Event.create({
        name: `${theme} Theme Validation Event`,
        type: EventType.TECHNICAL,
        department: 'Computer Science',
        date: new Date(),
        venue: 'Institutional Main Hall',
        convener: 'Dr. John Doe',
        themeType: theme,
        status: EventStatus.ACTIVE,
        createdBy: adminUser._id,
      });

      // Create report
      const report = await Report.create({
        event: event._id,
        createdBy: adminUser._id,
        status: ReportStatus.DRAFT,
      });

      // Configure cover page with mixed optional details
      // We will also pass different amounts of logos to verify the Handlebars logoSize helper
      const logosCount = theme === ThemeType.AQUA ? 5 : (theme === ThemeType.TECHNICAL ? 2 : 1);
      const testLogos = Array.from(
        { length: logosCount },
        (_, i) => `https://res.cloudinary.com/demo/image/upload/sample.jpg`
      );

      await Report.updateOne(
        { _id: report._id },
        {
          $set: {
            frontPage: {
              institutionName: 'State Institute of Engineering',
              departmentName: 'Department of Computer Science & Engineering',
              eventTitle: `${theme} Style Annual Technical Colloquium`,
              eventSubtitle: 'Exploring sustainable agent frameworks and runtime security models',
              venue: 'Campus Conference Center, Hall 4B',
              logos: testLogos,
              eventDetails: [
                { key: 'Event Date', value: new Date().toLocaleDateString('en-IN') },
                { key: 'Convener', value: event.convener },
                { key: 'Status', value: 'Verified Release' },
              ],
            },
          },
        }
      );

      // Add a couple of text and list sections
      await ReportSection.create({
        report: report._id,
        type: 'ABOUT',
        heading: '1. Executive Abstract',
        content: {
          paragraphs: [
            'This report details the primary findings, key learnings, and architectural achievements from the technical event.',
            'We evaluated sandbox runtimes, container isolation layers, and security policies matching enterprise criteria.',
          ],
        },
        sortOrder: 0,
      });

      await ReportSection.create({
        report: report._id,
        type: 'OBJECTIVES',
        heading: '2. Major Program Objectives',
        content: {
          bullets: [
            'Introduce students to production gradle build systems and obfuscation strategies.',
            'Understand local network routing for testing sideloaded APK files on mobile hardware.',
            'Verify PDF and DOCX document template rendering metrics.',
          ],
        },
        sortOrder: 1,
      });

      // Add budget item
      await Budget.create({
        report: report._id,
        item: 'Infrastructure Cloud Host',
        quantity: 1,
        unitCost: 12500,
        totalCost: 12500,
        category: 'Infrastructure',
      });

      // Compile outputs
      console.log(`Generating PDF for theme: ${theme}...`);
      const pdfUrl = await pdfService.generatePdf(report._id.toString(), 'http://localhost:5000');
      console.log(`✓ PDF Generated: ${pdfUrl}`);

      console.log(`Generating DOCX for theme: ${theme}...`);
      const docxUrl = await docxService.generateDocx(report._id.toString(), 'http://localhost:5000');
      console.log(`✓ DOCX Generated: ${docxUrl}`);
    }

    console.log('\n--- Part 2: Stress Testing Large Reports (50+ Pages) ---');
    
    const stressEvent = await Event.create({
      name: 'Extreme High-Volume Stress Seminar',
      type: EventType.TECHNICAL,
      department: 'Testing Division',
      date: new Date(),
      venue: 'Simulation Cluster Room',
      convener: 'Automation Tester Bot',
      themeType: ThemeType.TECHNICAL,
      status: EventStatus.ACTIVE,
      createdBy: adminUser._id,
    });

    const stressReport = await Report.create({
      event: stressEvent._id,
      createdBy: adminUser._id,
      status: ReportStatus.DRAFT,
      frontPage: {
        institutionName: 'STRESS TEST MAIN DATABASE CAMPUS',
        departmentName: 'Quality Assurance Division',
        eventTitle: 'Ultra Large-Scale Document Compilation Stress Output',
        eventSubtitle: 'Testing memory footprints, Puppeteer load limits, and layout overflows across 50+ sections',
        venue: 'Virtual Simulated Environment',
        logos: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
        eventDetails: [{ key: 'Load Factor', value: '50+ Sections, 100+ Paragraphs' }],
      },
    });

    // Populate 55 sections to exceed the 50-page threshold and stress layout engines
    console.log('Inserting 55 text sections and 50 budget ledger entries...');
    const sectionPromises = [];
    for (let i = 1; i <= 55; i++) {
      sectionPromises.push(
        ReportSection.create({
          report: stressReport._id,
          type: 'ABOUT',
          heading: `Stress Section Block ${i}`,
          content: {
            paragraphs: [
              `This is block paragraph A for section index ${i}. It contains boilerplate text to pad the page length and trigger complex page break calculations in Puppeteer layout rendering.`,
              `This is block paragraph B for section index ${i}. We want to verify that the CSS styles of our template successfully split columns, headings, and signature blocks across A4 dimensions without clip margins.`,
            ],
            bullets: [
              `Bullet check index ${i} - A`,
              `Bullet check index ${i} - B`,
              `Bullet check index ${i} - C`,
            ],
          },
          sortOrder: i,
        })
      );
    }
    await Promise.all(sectionPromises);

    const budgetPromises = [];
    for (let i = 1; i <= 50; i++) {
      budgetPromises.push(
        Budget.create({
          report: stressReport._id,
          item: `Line Ledger Item #${i}`,
          quantity: i,
          unitCost: 100,
          totalCost: i * 100,
          category: 'Simulation',
        })
      );
    }
    await Promise.all(budgetPromises);

    console.log('Compiling 50+ page stress PDF...');
    const startPdfTime = Date.now();
    const stressPdfPath = await pdfService.generatePdf(stressReport._id.toString(), 'http://localhost:5000');
    console.log(`✓ Stress PDF compiled in ${Date.now() - startPdfTime}ms -> ${stressPdfPath}`);

    console.log('Compiling 50+ page stress DOCX...');
    const startDocxTime = Date.now();
    const stressDocxPath = await docxService.generateDocx(stressReport._id.toString(), 'http://localhost:5000');
    console.log(`✓ Stress DOCX compiled in ${Date.now() - startDocxTime}ms -> ${stressDocxPath}`);


    console.log('\n--- Part 3: Data Fallback Safety Tests (Missing Optional Fields) ---');
    
    const boundaryEvent = await Event.create({
      name: 'Boundary Test Event',
      type: EventType.OTHER,
      department: 'Minimalist Dept',
      date: new Date(),
      venue: 'Empty Hall',
      convener: 'Minimal Convener',
      themeType: ThemeType.CORPORATE,
      status: EventStatus.ACTIVE,
      createdBy: adminUser._id,
    });

    const boundaryReport = await Report.create({
      event: boundaryEvent._id,
      createdBy: adminUser._id,
      status: ReportStatus.DRAFT,
      frontPage: {
        eventTitle: 'Bare Minimum Title',
        // Omit subtitle, logos, details, etc.
      },
    });

    // Generate with empty contents
    console.log('Compiling minimal report PDF (zero optional fields)...');
    await pdfService.generatePdf(boundaryReport._id.toString(), 'http://localhost:5000');
    console.log('✓ Safe fallback: PDF compiled successfully without crashes!');

    console.log('Compiling minimal report DOCX (zero optional fields)...');
    await docxService.generateDocx(boundaryReport._id.toString(), 'http://localhost:5000');
    console.log('✓ Safe fallback: DOCX compiled successfully without crashes!');


    console.log('\n--- Part 4: Concurrent Rendering Test (10 Concurrent Compilations) ---');
    console.log('Launching 10 concurrent PDF generation tasks to stress-test browser concurrency...');
    
    const concurrentReports = [];
    for (let i = 0; i < 10; i++) {
      const cEvent = await Event.create({
        name: `Concurrent Event #${i}`,
        type: EventType.SEMINAR,
        department: 'Concurrency Lab',
        date: new Date(),
        venue: 'Thread Room',
        convener: 'Dr. Parallel',
        themeType: ThemeType.SEMINAR,
        createdBy: adminUser._id,
      });
      const cReport = await Report.create({
        event: cEvent._id,
        createdBy: adminUser._id,
        status: ReportStatus.DRAFT,
        frontPage: {
          eventTitle: `Parallel Output File ${i}`,
          logos: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
        },
      });
      await ReportSection.create({
        report: cReport._id,
        type: 'ABOUT',
        heading: 'Intro',
        content: { paragraphs: [`Parallel run text block ${i}`] },
      });
      concurrentReports.push(cReport._id.toString());
    }

    const startConcurrent = Date.now();
    const concurrentPromises = concurrentReports.map(id =>
      pdfService.generatePdf(id, 'http://localhost:5000').catch(err => {
        console.error(`❌ Concurrency Fail on report ID ${id}:`, err.message);
        throw err;
      })
    );

    await Promise.all(concurrentPromises);
    console.log(`✓ 10 Concurrent PDFs rendered successfully in ${Date.now() - startConcurrent}ms!`);

    console.log('\n🎉 ALL REPORT ENGINE STRESS & THEME VALIDATIONS PASSED!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ STRESS TEST EXECUTION RUN ENCOUNTERED FATAL ERROR:');
    console.error(error);
    process.exit(1);
  }
}

runStressTests();
