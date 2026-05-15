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

class PdfService {
  /**
   * Generate PDF for a report
   */
  async generatePdf(reportId: string): Promise<string> {
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

    // Build template data
    const data = {
      report: report.toJSON(),
      sections: sections.map((s) => ({
        ...s.toJSON(),
        images: (s as any).images || [],
        imageCount: ((s as any).images || []).length,
      })),
      budgets: budgets.map((b) => b.toJSON()),
      budgetTotal: budgets.reduce((sum, b) => sum + b.totalCost, 0),
      generatedAt: new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
    };

    // Get HTML template
    let htmlTemplate: string;
    if (report.template) {
      const tmpl = report.template as any;
      htmlTemplate = tmpl.htmlContent;
    } else {
      // Use default template
      const templatePath = path.join(process.cwd(), 'src', 'templates', 'default.hbs');
      htmlTemplate = await fs.readFile(templatePath, 'utf-8');
    }

    // Compile and render
    const compiled = Handlebars.compile(htmlTemplate);
    const html = compiled(data);

    // Generate PDF with Puppeteer
    const browserInstance = await getBrowser();
    const page = await browserInstance.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

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

    // Upload PDF to Cloudinary
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
    const result = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${base64Pdf}`,
      { folder: 'event-reports/pdfs', resource_type: 'raw', public_id: `report-${reportId}` }
    );

    // Save URL to report
    report.pdfUrl = result.secure_url;
    await report.save();

    return result.secure_url;
  }
}

export const pdfService = new PdfService();
