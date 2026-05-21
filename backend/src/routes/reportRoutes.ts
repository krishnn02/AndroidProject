import { Router } from 'express';
import {
  createReport, getReports, getReport, updateReport, updateFrontPage,
  submitReport, approveReport, rejectReport, deleteReport,
  addSection, updateSection, deleteSection, reorderSections,
  addBudget, updateBudget, deleteBudget,
} from '../controllers/reportController.js';
import { generatePdf } from '../controllers/pdfController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '../models/index.js';

const router = Router();

router.use(authenticate);

// Reports
router.post('/', createReport);
router.get('/', getReports);
router.get('/:id', getReport);
router.get('/:id/pdf', generatePdf);
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
