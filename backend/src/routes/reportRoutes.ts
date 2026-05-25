import { Router } from 'express';
import {
  createReport, getReports, getReport, updateReport, updateFrontPage,
  submitReport, approveReport, rejectReport, deleteReport,
  addSection, updateSection, deleteSection, reorderSections,
  addBudget, updateBudget, deleteBudget, downloadPdf, downloadDocx
} from '../controllers/reportController.js';
import { generatePdf } from '../controllers/pdfController.js';
import { generateDocx } from '../controllers/docxController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '../models/index.js';

import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiter for document generation to prevent server abuse/crashing
const docGenerationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { success: false, message: 'Too many documents generated. Please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate);

// Reports
router.post('/', createReport);
router.get('/', getReports);
router.get('/:id', getReport);
router.get('/:id/pdf', docGenerationLimiter, generatePdf);
router.get('/:id/docx', docGenerationLimiter, generateDocx);
router.get('/:id/download/pdf', downloadPdf);
router.get('/:id/download/docx', downloadDocx);
router.patch('/:id', updateReport);
router.patch('/:id/front-page', updateFrontPage);
router.post('/:id/submit', submitReport);
router.post('/:id/approve', authorize(Role.ADMIN), approveReport);
router.post('/:id/reject', authorize(Role.ADMIN), rejectReport);
router.delete('/:id', deleteReport);

// Sections
router.post('/:reportId/sections', addSection);
router.patch('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);
router.patch('/:reportId/sections/reorder', reorderSections);

// Budgets
router.post('/:reportId/budgets', addBudget);
router.patch('/budgets/:id', updateBudget);
router.delete('/budgets/:id', deleteBudget);

export default router;
