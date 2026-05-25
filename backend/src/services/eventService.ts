import { Event, type IEvent, EventStatus, Assignment, Report } from '../models/index.js';
import { createError } from '../middleware/error.js';
import mongoose from 'mongoose';
import { reportService } from './reportService.js';

// Transaction helper with automatic fallback for local standalone databases
const runInTransaction = async <T>(fn: (session: mongoose.ClientSession | null) => Promise<T>): Promise<T> => {
  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    return fn(null);
  }

  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error: any) {
    if (error.codeName === 'NotAReplicaSet' || error.message?.includes('Transaction numbers are only allowed')) {
      await session.endSession().catch(() => {});
      return fn(null);
    }
    await session.abortTransaction().catch(() => {});
    throw error;
  } finally {
    if (session) {
      await session.endSession().catch(() => {});
    }
  }
};

class EventService {
  /**
   * Create a new event
   */
  async create(data: Partial<IEvent>, createdBy: string): Promise<IEvent> {
    const event = await Event.create({ ...data, createdBy });
    return event;
  }

  /**
   * Get all events with filters
   */
  async getAll(filters: {
    status?: EventStatus;
    department?: string;
    type?: string;
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{ events: IEvent[]; total: number; page: number; totalPages: number }> {
    const { status, department, type, page = 1, userId } = filters;
    let { limit = 20 } = filters;
    if (limit > 100) limit = 100; // Strict cap to prevent DB overload
    const query: Record<string, unknown> = {};

    if (!userId) {
      query.parentEvent = null;
    }

    if (status) query.status = status;
    if (department) query.department = department;
    if (type) query.type = type;

    // If userId provided, only get assigned events
    if (userId) {
      const assignments = await Assignment.find({ user: userId }).select('event');
      const eventIds = assignments.map((a) => a.event);
      query._id = { $in: eventIds };
    }

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('subEvents')
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      events: events as any as IEvent[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single event by ID with sub-events
   */
  async getById(eventId: string): Promise<IEvent> {
    const event = await Event.findById(eventId)
      .populate('subEvents')
      .populate('createdBy', 'name email');

    if (!event) {
      throw createError(404, 'Event not found');
    }
    return event;
  }

  /**
   * Update event
   */
  async update(eventId: string, data: Partial<IEvent>): Promise<IEvent> {
    const allowedFields = [
      'name', 'type', 'department', 'date', 'venue', 'status', 
      'themeType', 'description', 'convener', 'coConvener', 
      'facultyCoordinator', 'studentCoordinator'
    ];
    const filteredData: Record<string, any> = {};
    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key)) {
        filteredData[key] = (data as any)[key];
      }
    });

    const event = await Event.findByIdAndUpdate(eventId, filteredData, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      throw createError(404, 'Event not found');
    }
    return event;
  }

  /**
   * Delete event and all sub-events
   */
  async delete(eventId: string): Promise<void> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw createError(404, 'Event not found');
    }

    await runInTransaction(async (session) => {
      const queryOpts = session ? { session } : {};

      // Find and delete all reports associated with this event
      const reports = await Report.find({ event: eventId }).session(session || null as any);
      for (const report of reports) {
        // Pass 'ADMIN' to bypass ownership checks during cascade deletion
        await reportService.delete(report._id.toString(), '', 'ADMIN', session || undefined);
      }

      // Delete sub-events
      await Event.deleteMany({ parentEvent: eventId }, queryOpts);
      // Delete assignments
      await Assignment.deleteMany({ event: eventId }, queryOpts);
      // Delete the event
      await Event.deleteOne({ _id: eventId }, queryOpts);
    });
  }

  /**
   * Assign users to event
   */
  async assignUsers(eventId: string, userIds: string[], assignedBy: string): Promise<void> {
    const event = await Event.findById(eventId);
    if (!event) {
      throw createError(404, 'Event not found');
    }

    const assignments = userIds.map((userId) => ({
      user: new mongoose.Types.ObjectId(userId),
      event: new mongoose.Types.ObjectId(eventId),
      assignedBy: new mongoose.Types.ObjectId(assignedBy),
    }));

    // Use insertMany with ordered:false to skip duplicates
    try {
      await Assignment.insertMany(assignments, { ordered: false });
    } catch (error: any) {
      // Ignore duplicate key errors (code 11000), throw others
      if (error.code !== 11000 && !error.writeErrors) {
        throw error;
      }
    }
  }

  /**
   * Get assignments for an event
   */
  async getAssignments(eventId: string) {
    return Assignment.find({ event: eventId })
      .populate('user', 'name email department phone')
      .populate('assignedBy', 'name');
  }

  /**
   * Get events assigned to a user
   */
  async getUserEvents(userId: string) {
    const assignments = await Assignment.find({ user: userId })
      .populate({
        path: 'event',
        populate: { path: 'subEvents' },
      });
    return assignments.map((a) => a.event);
  }
}

export const eventService = new EventService();
