import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await userService.getAll(req.query as any);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getById(req.params.id as string);
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.update(req.params.id as string, req.body);
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.delete(req.params.id as string);
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) { next(error); }
};
