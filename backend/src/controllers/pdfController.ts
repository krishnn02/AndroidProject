import { Request, Response, NextFunction } from 'express';
import { pdfService } from '../services/pdfService.js';

export const generatePdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pdfUrl = await pdfService.generatePdf(req.params.id);
    res.json({ success: true, data: { pdfUrl } });
  } catch (error) { next(error); }
};
