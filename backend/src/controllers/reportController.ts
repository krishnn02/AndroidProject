import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/reportService.js';

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.create(req.body.eventId, req.user!._id.toString(), req.body.templateId);
    res.status(201).json({ success: true, data: { report } });
  } catch (error) { next(error); }
};

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = { ...req.query } as any;
    if (req.user!.role === 'USER') filters.userId = req.user!._id.toString();
    const result = await reportService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.getFullReport(req.params.id as string);
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
};

export const updateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.update(req.params.id as string, req.body);
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
};

export const updateFrontPage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.updateFrontPage(req.params.id as string, req.body);
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
};

export const submitReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.submit(req.params.id as string, req.user!._id.toString());
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
};

export const approveReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.approve(req.params.id as string, req.user!._id.toString());
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
};

export const rejectReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.reject(req.params.id as string, req.body.note);
    res.json({ success: true, data: { report } });
  } catch (error) { next(error); }
};

// ===== Sections =====
export const addSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await reportService.addSection(req.params.reportId as string, req.body);
    res.status(201).json({ success: true, data: { section } });
  } catch (error) { next(error); }
};

export const updateSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await reportService.updateSection(req.params.id as string, req.body);
    res.json({ success: true, data: { section } });
  } catch (error) { next(error); }
};

export const deleteSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reportService.deleteSection(req.params.id as string);
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) { next(error); }
};

export const reorderSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reportService.reorderSections(req.params.reportId as string, req.body.sectionIds);
    res.json({ success: true, message: 'Sections reordered' });
  } catch (error) { next(error); }
};

// ===== Budgets =====
export const addBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await reportService.addBudget(req.params.reportId as string, req.body);
    res.status(201).json({ success: true, data: { budget } });
  } catch (error) { next(error); }
};

export const updateBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await reportService.updateBudget(req.params.id as string, req.body);
    res.json({ success: true, data: { budget } });
  } catch (error) { next(error); }
};

export const deleteBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reportService.deleteBudget(req.params.id as string);
    res.json({ success: true, message: 'Budget entry deleted' });
  } catch (error) { next(error); }
};

export const deleteReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reportService.delete(req.params.id as string);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) { next(error); }
};
