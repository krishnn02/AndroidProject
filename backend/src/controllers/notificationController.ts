import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notificationService.js';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as any;
    const result = await notificationService.getUserNotifications(req.user!._id.toString(), page, limit);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAsRead(req.params.id);
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) { next(error); }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationService.markAllAsRead(req.user!._id.toString());
    res.json({ success: true, message: 'All marked as read' });
  } catch (error) { next(error); }
};
