import {
  Report,
  ReportSection,
  Image,
  Budget,
  ReportStatus,
  Role,
  User,
  Assignment,
  type IReport,
  type IReportSection,
  type IBudget,
  type IFrontPage,
} from '../models/index.js';
import { createError } from '../middleware/error.js';
import { imageService } from './imageService.js';
import mongoose from 'mongoose';

class ReportService {
  /**
   * Helper to ensure user owns the report or is an ADMIN
   */
  async ensureOwnership(reportId: string, userId: string, userRole: string, session?: mongoose.ClientSession): Promise<IReport> {
    const report = await Report.findById(reportId).session(session || null as any);
    if (!report) throw createError(404, 'Report not found');
    if (report.createdBy.toString() !== userId && userRole !== Role.ADMIN) {
      throw createError(403, 'You are not authorized to modify this report');
    }
    return report;
  }

  /**
   * Create a new report for an event
   */
  async create(eventId: string, createdBy: string, templateId?: string): Promise<IReport> {
    // Check if user is assigned to this event (Admins bypass assignment check)
    const user = await User.findById(createdBy);
    if (user?.role !== Role.ADMIN) {
      const isAssigned = await Assignment.findOne({ user: createdBy, event: eventId });
      if (!isAssigned) {
        throw createError(403, 'You are not assigned to this event and cannot create a report');
      }
    }

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
    const { status, eventId, userId, page = 1 } = filters;
    let { limit = 20 } = filters;
    if (limit > 100) limit = 100; // Strict cap to prevent DB overload
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
  async update(reportId: string, data: Partial<IReport>, userId: string, userRole: string): Promise<IReport> {
    const report = await this.ensureOwnership(reportId, userId, userRole);
    if (report.status === ReportStatus.APPROVED || report.status === ReportStatus.SUBMITTED) {
      throw createError(400, 'Cannot edit a submitted or approved report');
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
  async updateFrontPage(reportId: string, frontPage: IFrontPage, userId: string, userRole: string): Promise<IReport> {
    const report = await this.ensureOwnership(reportId, userId, userRole);
    if (report.status === ReportStatus.APPROVED || report.status === ReportStatus.SUBMITTED) {
      throw createError(400, 'Cannot edit front page of a submitted or approved report');
    }
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      { frontPage },
      { new: true }
    );
    if (!updatedReport) throw createError(404, 'Report not found');
    return updatedReport;
  }

  /**
   * Submit report for approval
   */
  async submit(reportId: string, userId: string, userRole: string): Promise<IReport> {
    const report = await this.ensureOwnership(reportId, userId, userRole);
    if (report.status !== ReportStatus.DRAFT && report.status !== ReportStatus.REJECTED && report.status !== ReportStatus.SUBMITTED) {
      throw createError(400, 'Report can only be submitted from draft, rejected, or submitted state');
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
  async addSection(reportId: string, data: Partial<IReportSection>, userId: string, userRole: string): Promise<IReportSection> {
    const report = await this.ensureOwnership(reportId, userId, userRole);
    if (report.status === ReportStatus.APPROVED || report.status === ReportStatus.SUBMITTED) {
      throw createError(400, 'Cannot add section to a submitted or approved report');
    }


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
  async updateSection(sectionId: string, data: Partial<IReportSection>, userId: string, userRole: string): Promise<IReportSection> {
    const existingSection = await ReportSection.findById(sectionId);
    if (!existingSection) throw createError(404, 'Section not found');
    const report = await this.ensureOwnership(existingSection.report.toString(), userId, userRole);
    if (report.status === ReportStatus.APPROVED || report.status === ReportStatus.SUBMITTED) {
      throw createError(400, 'Cannot update section of a submitted or approved report');
    }

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
  async deleteSection(sectionId: string, userId: string, userRole: string): Promise<void> {
    const section = await ReportSection.findById(sectionId);
    if (!section) throw createError(404, 'Section not found');
    const report = await this.ensureOwnership(section.report.toString(), userId, userRole);
    if (report.status === ReportStatus.APPROVED || report.status === ReportStatus.SUBMITTED) {
      throw createError(400, 'Cannot delete section of a submitted or approved report');
    }

    // Delete associated images from Cloudinary
    const images = await Image.find({ section: sectionId });
    for (const img of images) {
      await imageService.deleteImage(img._id.toString()).catch(e => console.error('Failed to delete image:', e));
    }

    await section.deleteOne();
  }

  /**
   * Reorder sections
   */
  async reorderSections(reportId: string, sectionIds: string[], userId: string, userRole: string): Promise<void> {
    const report = await this.ensureOwnership(reportId, userId, userRole);
    if (report.status === ReportStatus.APPROVED || report.status === ReportStatus.SUBMITTED) {
      throw createError(400, 'Cannot reorder sections of a submitted or approved report');
    }
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
  async addBudget(reportId: string, data: Partial<IBudget>, userId: string, userRole: string): Promise<IBudget> {
    const report = await this.ensureOwnership(reportId, userId, userRole);
    if (report.status === ReportStatus.APPROVED || report.status === ReportStatus.SUBMITTED) {
      throw createError(400, 'Cannot add budget to a submitted or approved report');
    }

    const budget = await Budget.create({ ...data, report: reportId });
    return budget;
  }

  /**
   * Update a budget entry
   */
  async updateBudget(budgetId: string, data: Partial<IBudget>, userId: string, userRole: string): Promise<IBudget> {
    const existingBudget = await Budget.findById(budgetId);
    if (!existingBudget) throw createError(404, 'Budget entry not found');
    const report = await this.ensureOwnership(existingBudget.report.toString(), userId, userRole);
    if (report.status === ReportStatus.APPROVED || report.status === ReportStatus.SUBMITTED) {
      throw createError(400, 'Cannot update budget of a submitted or approved report');
    }

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
  async deleteBudget(budgetId: string, userId: string, userRole: string): Promise<void> {
    const existingBudget = await Budget.findById(budgetId);
    if (!existingBudget) throw createError(404, 'Budget entry not found');
    const report = await this.ensureOwnership(existingBudget.report.toString(), userId, userRole);
    if (report.status === ReportStatus.APPROVED || report.status === ReportStatus.SUBMITTED) {
      throw createError(400, 'Cannot delete budget of a submitted or approved report');
    }

    const budget = await Budget.findByIdAndDelete(budgetId);
    if (!budget) throw createError(404, 'Budget entry not found');
  }

  /**
   * Delete a report and all its components (sections, budgets, images)
   */
  async delete(reportId: string, userId: string, userRole: string, session?: mongoose.ClientSession): Promise<void> {
    const report = await this.ensureOwnership(reportId, userId, userRole, session);

    // Get section IDs
    const sections = await ReportSection.find({ report: reportId }).session(session || null as any);
    const sectionIds = sections.map(s => s._id);

    // Delete associated images from Cloudinary
    const images = await Image.find({ section: { $in: sectionIds } }).session(session || null as any);
    for (const img of images) {
      await imageService.deleteImage(img._id.toString(), userId, 'ADMIN').catch(e => console.error('Failed to delete image:', e));
    }

    await ReportSection.deleteMany({ report: reportId }, session ? { session } : {});
    await Budget.deleteMany({ report: reportId }, session ? { session } : {});
    await report.deleteOne(session ? { session } : {});
  }
}

export const reportService = new ReportService();
