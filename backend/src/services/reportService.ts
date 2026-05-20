import {
  Report,
  ReportSection,
  Image,
  Budget,
  ReportStatus,
  type IReport,
  type IReportSection,
  type IBudget,
  type IFrontPage,
} from '../models/index.js';
import { createError } from '../middleware/error.js';

class ReportService {
  /**
   * Create a new report for an event
   */
  async create(eventId: string, createdBy: string, templateId?: string): Promise<IReport> {
    const existingReport = await Report.findOne({ event: eventId, createdBy });
    if (existingReport) {
      throw createError(409, 'Report already exists for this event by you');
    }

    const report = await Report.create({
      event: eventId,
      createdBy,
      template: templateId || undefined,
    });
    return report;
  }

  /**
   * Get all reports with filters
   */
  async getAll(filters: {
    status?: ReportStatus;
    eventId?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, eventId, userId, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (eventId) query.event = eventId;
    if (userId) query.createdBy = userId;

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('event', 'name type department date venue')
      .populate('createdBy', 'name email department')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get full report with all sections, images, and budgets
   */
  async getFullReport(reportId: string): Promise<IReport> {
    const report = await Report.findById(reportId)
      .populate('event')
      .populate('createdBy', 'name email department')
      .populate('template')
      .populate({
        path: 'sections',
        populate: { path: 'images' },
        options: { sort: { sortOrder: 1 } },
      })
      .populate('budgets');

    if (!report) {
      throw createError(404, 'Report not found');
    }
    return report;
  }

  /**
   * Update report (auto-save draft)
   */
  async update(reportId: string, data: Partial<IReport>): Promise<IReport> {
    const report = await Report.findById(reportId);
    if (!report) throw createError(404, 'Report not found');
    if (report.status === ReportStatus.APPROVED) {
      throw createError(400, 'Cannot edit approved report');
    }

    const updated = await Report.findByIdAndUpdate(
      reportId,
      { ...data, lastAutoSaved: new Date() },
      { new: true }
    );
    return updated!;
  }

  /**
   * Update front page
   */
  async updateFrontPage(reportId: string, frontPage: IFrontPage): Promise<IReport> {
    const report = await Report.findByIdAndUpdate(
      reportId,
      { frontPage },
      { new: true }
    );
    if (!report) throw createError(404, 'Report not found');
    return report;
  }

  /**
   * Submit report for approval
   */
  async submit(reportId: string, userId: string): Promise<IReport> {
    const report = await Report.findById(reportId);
    if (!report) throw createError(404, 'Report not found');
    if (report.createdBy.toString() !== userId) {
      throw createError(403, 'Only report creator can submit');
    }
    if (report.status !== ReportStatus.DRAFT && report.status !== ReportStatus.REJECTED) {
      throw createError(400, 'Report can only be submitted from draft or rejected state');
    }

    await Report.updateOne(
      { _id: reportId },
      { $set: { status: ReportStatus.SUBMITTED, submittedAt: new Date() } }
    );
    const updatedReport = await Report.findById(reportId);
    if (!updatedReport) throw createError(404, 'Report not found');
    return updatedReport;
  }

  /**
   * Approve report (admin only)
   */
  async approve(reportId: string, approvedBy: string): Promise<IReport> {
    const report = await Report.findById(reportId);
    if (!report) throw createError(404, 'Report not found');
    if (report.status !== ReportStatus.SUBMITTED) {
      throw createError(400, 'Only submitted reports can be approved');
    }

    await Report.updateOne(
      { _id: reportId },
      { $set: { status: ReportStatus.APPROVED, approvedAt: new Date(), approvedBy: approvedBy as any } }
    );
    const updatedReport = await Report.findById(reportId);
    if (!updatedReport) throw createError(404, 'Report not found');
    return updatedReport;
  }

  /**
   * Reject report (admin only)
   */
  async reject(reportId: string, note: string): Promise<IReport> {
    const report = await Report.findById(reportId);
    if (!report) throw createError(404, 'Report not found');
    if (report.status !== ReportStatus.SUBMITTED) {
      throw createError(400, 'Only submitted reports can be rejected');
    }

    await Report.updateOne(
      { _id: reportId },
      { $set: { status: ReportStatus.REJECTED, rejectedAt: new Date(), rejectionNote: note } }
    );
    const updatedReport = await Report.findById(reportId);
    if (!updatedReport) throw createError(404, 'Report not found');
    return updatedReport;
  }

  // ==================== SECTIONS ====================

  /**
   * Add a section to report
   */
  async addSection(reportId: string, data: Partial<IReportSection>): Promise<IReportSection> {
    const report = await Report.findById(reportId);
    if (!report) throw createError(404, 'Report not found');

    // Auto-set sort order to end
    const lastSection = await ReportSection.findOne({ report: reportId }).sort({ sortOrder: -1 });
    const sortOrder = lastSection ? lastSection.sortOrder + 1 : 0;

    const section = await ReportSection.create({
      ...data,
      report: reportId,
      sortOrder,
    });
    return section;
  }

  /**
   * Update a section
   */
  async updateSection(sectionId: string, data: Partial<IReportSection>): Promise<IReportSection> {
    const section = await ReportSection.findByIdAndUpdate(sectionId, data, {
      new: true,
      runValidators: true,
    }).populate('images');
    if (!section) throw createError(404, 'Section not found');
    return section;
  }

  /**
   * Delete a section and its images
   */
  async deleteSection(sectionId: string): Promise<void> {
    const section = await ReportSection.findById(sectionId);
    if (!section) throw createError(404, 'Section not found');

    // Delete associated images
    await Image.deleteMany({ section: sectionId });
    await section.deleteOne();
  }

  /**
   * Reorder sections
   */
  async reorderSections(reportId: string, sectionIds: string[]): Promise<void> {
    const bulkOps = sectionIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, report: reportId },
        update: { sortOrder: index },
      },
    }));
    await ReportSection.bulkWrite(bulkOps);
  }

  // ==================== BUDGETS ====================

  /**
   * Add a budget entry
   */
  async addBudget(reportId: string, data: Partial<IBudget>): Promise<IBudget> {
    const report = await Report.findById(reportId);
    if (!report) throw createError(404, 'Report not found');

    const budget = await Budget.create({ ...data, report: reportId });
    return budget;
  }

  /**
   * Update a budget entry
   */
  async updateBudget(budgetId: string, data: Partial<IBudget>): Promise<IBudget> {
    const budget = await Budget.findByIdAndUpdate(budgetId, data, {
      new: true,
      runValidators: true,
    });
    if (!budget) throw createError(404, 'Budget entry not found');
    return budget;
  }

  /**
   * Delete a budget entry
   */
  async deleteBudget(budgetId: string): Promise<void> {
    const budget = await Budget.findByIdAndDelete(budgetId);
    if (!budget) throw createError(404, 'Budget entry not found');
  }
}

export const reportService = new ReportService();
