import { Request, Response, NextFunction } from 'express';
import { Event, Report, User, ReportStatus, EventStatus } from '../models/index.js';

export const getOverview = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalEvents, totalUsers, totalReports, pendingReports, approvedReports] = await Promise.all([
      Event.countDocuments(),
      User.countDocuments({ isActive: true }),
      Report.countDocuments(),
      Report.countDocuments({ status: ReportStatus.SUBMITTED }),
      Report.countDocuments({ status: ReportStatus.APPROVED }),
    ]);
    res.json({
      success: true,
      data: { totalEvents, totalUsers, totalReports, pendingReports, approvedReports,
        rejectedReports: await Report.countDocuments({ status: ReportStatus.REJECTED }),
        draftReports: await Report.countDocuments({ status: ReportStatus.DRAFT }),
        activeEvents: await Event.countDocuments({ status: EventStatus.ACTIVE }),
      },
    });
  } catch (error) { next(error); }
};

export const getEventAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const byType = await Event.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const byDepartment = await Event.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);
    const byMonth = await Event.aggregate([
      { $group: { _id: { $month: '$date' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]);
    res.json({ success: true, data: { byType, byDepartment, byMonth } });
  } catch (error) { next(error); }
};

export const getReportAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const byStatus = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, data: { byStatus } });
  } catch (error) { next(error); }
};
