import { Event, type IEvent, EventStatus, Assignment } from '../models/index.js';
import { createError } from '../middleware/error.js';
import mongoose from 'mongoose';

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
    const { status, department, type, page = 1, limit = 20, userId } = filters;
    const query: Record<string, unknown> = { parentEvent: null };

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
    const event = await Event.findByIdAndUpdate(eventId, data, {
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

    // Delete sub-events
    await Event.deleteMany({ parentEvent: eventId });
    // Delete assignments
    await Assignment.deleteMany({ event: eventId });
    // Delete the event
    await event.deleteOne();
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
