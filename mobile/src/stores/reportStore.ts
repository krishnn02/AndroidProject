import { create } from 'zustand';
import { reportApi } from '../services';

interface ReportSection {
  _id: string;
  type: string;
  heading: string;
  content: { paragraphs?: string[]; bullets?: string[]; richText?: string };
  sortOrder: number;
  imageLayout: string;
  imageFrame: string;
  images: Array<{ _id: string; url: string; caption?: string; sortOrder: number }>;
}

interface Budget {
  _id: string;
  item: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  category?: string;
}

interface Report {
  _id: string;
  event: any;
  createdBy: any;
  status: string;
  frontPage: Record<string, any>;
  sections?: ReportSection[];
  budgets?: Budget[];
  pdfUrl?: string;
  rejectionNote?: string;
  createdAt?: string;
}

interface ReportState {
  reports: Report[];
  currentReport: Report | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  page: number;
  totalPages: number;

  fetchReports: (params?: Record<string, any>) => Promise<void>;
  fetchReport: (id: string) => Promise<void>;
  createReport: (eventId: string, templateId?: string) => Promise<string>;
  updateReport: (id: string, data: Record<string, any>) => Promise<void>;
  updateFrontPage: (id: string, frontPage: Record<string, any>) => Promise<void>;
  submitReport: (id: string) => Promise<void>;
  approveReport: (id: string) => Promise<void>;
  rejectReport: (id: string, note: string) => Promise<void>;
  generatePdf: (id: string) => Promise<string>;
  addSection: (reportId: string, data: Record<string, any>) => Promise<void>;
  updateSection: (sectionId: string, data: Record<string, any>) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
  reorderSections: (reportId: string, sectionIds: string[]) => Promise<void>;
  addBudget: (reportId: string, data: Record<string, any>) => Promise<void>;
  updateBudget: (budgetId: string, data: Record<string, any>) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  clearError: () => void;
}

export const useReportStore = create<ReportState>()((set, get) => ({
  reports: [],
  currentReport: null,
  isLoading: false,
  isSaving: false,
  error: null,
  page: 1,
  totalPages: 1,

  fetchReports: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await reportApi.getAll(params);
      set({ reports: data.data.reports, page: data.data.page, totalPages: data.data.totalPages, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch reports', isLoading: false });
    }
  },

  fetchReport: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await reportApi.getById(id);
      set({ currentReport: data.data.report, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch report', isLoading: false });
    }
  },

  createReport: async (eventId, templateId) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await reportApi.create(eventId, templateId);
      set({ isLoading: false });
      return data.data.report._id;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create report', isLoading: false });
      throw error;
    }
  },

  updateReport: async (id, reportData) => {
    set({ isSaving: true });
    try {
      await reportApi.update(id, reportData);
      set({ isSaving: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to save', isSaving: false });
    }
  },

  updateFrontPage: async (id, frontPage) => {
    set({ isSaving: true });
    try {
      const { data } = await reportApi.updateFrontPage(id, frontPage);
      set({ currentReport: data.data.report, isSaving: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update front page', isSaving: false });
    }
  },

  submitReport: async (id) => {
    try {
      const { data } = await reportApi.submit(id);
      set({ currentReport: data.data.report });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to submit' });
      throw error;
    }
  },

  approveReport: async (id) => {
    try {
      const { data } = await reportApi.approve(id);
      set({ currentReport: data.data.report });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to approve' });
      throw error;
    }
  },

  rejectReport: async (id, note) => {
    try {
      const { data } = await reportApi.reject(id, note);
      set({ currentReport: data.data.report });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to reject' });
      throw error;
    }
  },

  generatePdf: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await reportApi.generatePdf(id);
      set({ isLoading: false });
      return data.data.pdfUrl;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'PDF generation failed', isLoading: false });
      throw error;
    }
  },

  addSection: async (reportId, sectionData) => {
    try {
      await reportApi.addSection(reportId, sectionData);
      await get().fetchReport(reportId);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to add section' });
      throw error;
    }
  },

  updateSection: async (sectionId, sectionData) => {
    set({ isSaving: true });
    try {
      await reportApi.updateSection(sectionId, sectionData);
      set({ isSaving: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update section', isSaving: false });
    }
  },

  deleteSection: async (sectionId) => {
    try {
      await reportApi.deleteSection(sectionId);
      const report = get().currentReport;
      if (report) await get().fetchReport(report._id);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete section' });
    }
  },

  reorderSections: async (reportId, sectionIds) => {
    try {
      await reportApi.reorderSections(reportId, sectionIds);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to reorder' });
    }
  },

  addBudget: async (reportId, budgetData) => {
    try {
      await reportApi.addBudget(reportId, budgetData);
      await get().fetchReport(reportId);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to add budget' });
      throw error;
    }
  },

  updateBudget: async (budgetId, budgetData) => {
    try {
      await reportApi.updateBudget(budgetId, budgetData);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update budget' });
    }
  },

  deleteBudget: async (budgetId) => {
    try {
      await reportApi.deleteBudget(budgetId);
      const report = get().currentReport;
      if (report) await get().fetchReport(report._id);
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete budget' });
    }
  },

  clearError: () => set({ error: null }),
}));
