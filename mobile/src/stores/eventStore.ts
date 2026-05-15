import { create } from 'zustand';
import { eventApi } from '../services';

interface Event {
  _id: string;
  name: string;
  type: string;
  department: string;
  date: string;
  venue: string;
  convener: string;
  coConvener?: string;
  facultyCoordinator?: string;
  studentCoordinator?: string;
  status: string;
  themeType: string;
  subEvents?: Event[];
}

interface EventState {
  events: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;

  fetchEvents: (params?: Record<string, any>) => Promise<void>;
  fetchEvent: (id: string) => Promise<void>;
  createEvent: (data: Record<string, any>) => Promise<void>;
  updateEvent: (id: string, data: Record<string, any>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  assignUsers: (id: string, userIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const useEventStore = create<EventState>()((set) => ({
  events: [],
  currentEvent: null,
  isLoading: false,
  error: null,
  page: 1,
  totalPages: 1,

  fetchEvents: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await eventApi.getAll(params);
      set({ events: data.data.events, page: data.data.page, totalPages: data.data.totalPages, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch events', isLoading: false });
    }
  },

  fetchEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await eventApi.getById(id);
      set({ currentEvent: data.data.event, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch event', isLoading: false });
    }
  },

  createEvent: async (eventData) => {
    set({ isLoading: true, error: null });
    try {
      await eventApi.create(eventData);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create event', isLoading: false });
      throw error;
    }
  },

  updateEvent: async (id, eventData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await eventApi.update(id, eventData);
      set({ currentEvent: data.data.event, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update event', isLoading: false });
      throw error;
    }
  },

  deleteEvent: async (id) => {
    try {
      await eventApi.delete(id);
      set((state) => ({ events: state.events.filter((e) => e._id !== id) }));
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete event' });
    }
  },

  assignUsers: async (id, userIds) => {
    try {
      await eventApi.assignUsers(id, userIds);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to assign users' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
