import { Request, Response, NextFunction } from 'express';
import { imageService } from '../services/imageService.js';

export const uploadImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No images provided' });
      return;
    }
    const images = await imageService.uploadImages(req.params.sectionId as string, files, req.user!._id.toString(), req.user!.role);
    res.status(201).json({ success: true, data: { images } });
  } catch (error) { next(error); }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await imageService.deleteImage(req.params.id as string, req.user!._id.toString(), req.user!.role);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) { next(error); }
};

export const reorderImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await imageService.reorderImages(req.params.sectionId as string, req.body.imageIds, req.user!._id.toString(), req.user!.role);
    res.json({ success: true, message: 'Images reordered' });
  } catch (error) { next(error); }
};

export const uploadLogo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }
    const url = await imageService.uploadLogo(file);
    res.json({ success: true, data: { url } });
  } catch (error) { next(error); }
};
