import { Request, Response, NextFunction } from 'express';
import { eventService } from '../services/eventService.js';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.create(req.body, req.user!._id.toString());
    res.status(201).json({ success: true, data: { event } });
  } catch (error) { next(error); }
};

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = { ...req.query } as any;
    if (req.user!.role === 'USER') filters.userId = req.user!._id.toString();
    const result = await eventService.getAll(filters);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.getById(req.params.id as string);
    res.json({ success: true, data: { event } });
  } catch (error) { next(error); }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await eventService.update(req.params.id as string, req.body);
    res.json({ success: true, data: { event } });
  } catch (error) { next(error); }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await eventService.delete(req.params.id as string);
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) { next(error); }
};

export const assignUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await eventService.assignUsers(req.params.id as string, req.body.userIds, req.user!._id.toString());
    res.json({ success: true, message: 'Users assigned successfully' });
  } catch (error) { next(error); }
};

export const getAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignments = await eventService.getAssignments(req.params.id as string);
    res.json({ success: true, data: { assignments } });
  } catch (error) { next(error); }
};
