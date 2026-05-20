import puppeteer, { Browser } from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { Report, ReportSection, Image, Budget, Template } from '../models/index.js';
import cloudinary from '../config/cloudinary.js';
import { createError } from '../middleware/error.js';

// Singleton browser instance
let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }
  return browser;
}

// Register Handlebars helpers
Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('imageGridClass', (count: number) => {
  if (count === 1) return 'img-full';
  if (count === 2) return 'img-side-by-side';
  return 'img-grid';
});
Handlebars.registerHelper('formatCurrency', (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
});

// Dynamic logo sizing — shrinks logos when there are many
Handlebars.registerHelper('logoSize', (count: number) => {
  if (count <= 2) return 80;
  if (count <= 4) return 65;
  if (count <= 6) return 50;
  return 40;
});

// Get the last element of an array
Handlebars.registerHelper('lastLogo', (logos: string[]) => {
  return logos?.[logos.length - 1] || '';
});

// Check if current index is the last in an array
Handlebars.registerHelper('isLast', function (this: any, options: any) {
  const data = options.data;
  if (data.index === data.last) return options.fn(this);
  return options.inverse(this);
});

// Subtract helper for logo count math
Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);

class PdfService {
  /**
   * Generate PDF for a report
   */
  async generatePdf(reportId: string, baseUrl?: string): Promise<string> {
    // Fetch full report data
    const report = await Report.findById(reportId)
      .populate('event')
      .populate('createdBy', 'name email department')
      .populate('template');

    if (!report) throw createError(404, 'Report not found');

    const sections = await ReportSection.find({ report: reportId })
      .populate('images')
      .sort({ sortOrder: 1 });

    const budgets = await Budget.find({ report: reportId });

    // Build template data — deep-clone via JSON to strip ALL Mongoose prototypes
    // This prevents Handlebars from blocking access to nested properties
    const reportJson = JSON.parse(JSON.stringify(report.toJSON()));
    
    // Ensure frontPage has safe defaults
    if (!reportJson.frontPage) reportJson.frontPage = {};
    if (!reportJson.frontPage.logos) reportJson.frontPage.logos = [];
    if (!reportJson.frontPage.eventDetails) reportJson.frontPage.eventDetails = [];

    const data = {
      report: reportJson,
      sections: sections.map((s) => {
        const sJson = JSON.parse(JSON.stringify(s.toJSON()));
        sJson.images = ((s as any).images || []).map((img: any) =>
          JSON.parse(JSON.stringify(img.toJSON ? img.toJSON() : img))
        );
        sJson.imageCount = sJson.images.length;
        return sJson;
      }),
      budgets: budgets.map((b) => JSON.parse(JSON.stringify(b.toJSON()))),
      budgetTotal: budgets.reduce((sum, b) => sum + b.totalCost, 0),
      generatedAt: new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
    };

    console.log('[PDF] Template data:', JSON.stringify({
      title: data.report.frontPage?.eventTitle,
      logos: data.report.frontPage?.logos?.length,
      details: data.report.frontPage?.eventDetails?.length,
      sections: data.sections.length,
      budgets: data.budgets.length,
    }));

    // Get HTML template
    let htmlTemplate: string;
    if (report.template) {
      const tmpl = report.template as any;
      htmlTemplate = tmpl.htmlContent;
    } else {
      // Select template based on event theme type
      const event = report.event as any;
      const themeType = event?.themeType?.toUpperCase() || 'CORPORATE';
      const templateMap: Record<string, string> = {
        'CULTURAL': 'cultural.hbs',
        'TECHNICAL': 'technical.hbs',
        'SEMINAR': 'seminar.hbs',
        'SUSTAINABLE': 'sustainable.hbs',
        'ENVIRONMENT': 'sustainable.hbs',
      };
      const templateFile = templateMap[themeType] || 'default.hbs';
      const templatePath = path.join(process.cwd(), 'src', 'templates', templateFile);
      htmlTemplate = await fs.readFile(templatePath, 'utf-8');
    }

    console.log('[PDF] Using template, compiling...');

    // Compile and render
    const compiled = Handlebars.compile(htmlTemplate);
    const html = compiled(data);

    // Generate PDF with Puppeteer
    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();

    // Use domcontentloaded for fast load, then wait softly for network idle
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try {
      await page.waitForNetworkIdle({ timeout: 5000 });
    } catch (e) {
      console.log('[PDF] Warning: Network did not fully idle in 5s. Proceeding with generation.');
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;text-align:center;font-size:9px;color:#888;padding:5px 0;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    await page.close();

    // Save PDF locally to uploads/reports/
    const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    const filename = `report-${reportId}.pdf`;
    const filePath = path.join(reportsDir, filename);
    await fs.writeFile(filePath, pdfBuffer);

    // Build the local serving URL (always works for direct downloads)
    const localPdfUrl = `${baseUrl || ''}/uploads/reports/${filename}`;
    let cloudinaryUrl = '';

    try {
      console.log(`[PDF] Uploading report-${reportId}.pdf to Cloudinary...`);
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: 'event-reports/pdfs',
        resource_type: 'raw',
        public_id: `report-${reportId}.pdf`,
        overwrite: true,
      });
      cloudinaryUrl = uploadResult.secure_url;
      console.log(`[PDF] Cloudinary Upload Success: ${cloudinaryUrl}`);
    } catch (uploadError) {
      console.error('[PDF] Cloudinary Upload Failed (local file still available):', uploadError);
    }

    // Use local URL as primary (always accessible without auth)
    // Keep local file for serving via Express static middleware
    const pdfUrl = localPdfUrl;
    console.log(`[PDF] Serving PDF from local URL: ${pdfUrl}`);

    // Save URL to report (use updateOne to bypass full document validation)
    await Report.updateOne({ _id: report._id }, { $set: { pdfUrl } });

    return pdfUrl;
  }
}

export const pdfService = new PdfService();
