import { Request, Response, NextFunction } from 'express';
import { pdfService } from '../services/pdfService.js';

export const generatePdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;
    const pdfUrl = await pdfService.generatePdf(req.params.id as string, baseUrl);
    res.json({ success: true, data: { pdfUrl } });
  } catch (error) { next(error); }
};
