import { Request, Response, NextFunction } from 'express';
import { docxService } from '../services/docxService.js';

export const generateDocx = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = `${protocol}://${host}`;
    const docxUrl = await docxService.generateDocx(req.params.id as string, baseUrl);
    res.json({ success: true, data: { docxUrl } });
  } catch (error) { next(error); }
};
