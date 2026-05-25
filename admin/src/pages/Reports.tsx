import { useEffect, useState } from 'react';
import { FileText, CheckCircle, XCircle, ExternalLink, Loader2, Search, Eye, X, Download } from 'lucide-react';
import { reportsApi } from '../services/api';

interface Report {
  _id: string;
  event: { _id: string; name: string; type: string; department: string; date: string; venue: string };
  createdBy: { _id: string; name: string; email: string; department: string };
  status: string;
  pdfUrl?: string;
  docxUrl?: string;
  rejectionNote?: string;
  sections?: any[];
  budgets?: any[];
  frontPage?: Record<string, any>;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
}

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadReports(); }, [filter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 100 };
      if (filter) params.status = filter;
      const { data } = await reportsApi.getAll(params);
      setReports(data.data.reports || []);
    } catch { setError('Failed to load reports'); }
    finally { setLoading(false); }
  };

  const viewDetail = async (report: Report) => {
    try {
      const { data } = await reportsApi.getById(report._id);
      setSelectedReport(data.data.report);
      setShowDetail(true);
    } catch { setSelectedReport(report); setShowDetail(true); }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this report?')) return;
    setActionLoading(id);
    try {
      await reportsApi.approve(id);
      await loadReports();
      setShowDetail(false);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to approve'); }
    finally { setActionLoading(''); }
  };

  const handleReject = async () => {
    if (!selectedReport || !rejectNote.trim()) return;
    setActionLoading(selectedReport._id);
    try {
      await reportsApi.reject(selectedReport._id, rejectNote);
      setShowRejectModal(false);
      setRejectNote('');
      await loadReports();
      setShowDetail(false);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to reject'); }
    finally { setActionLoading(''); }
  };

  const handleGeneratePdf = async (id: string) => {
    setActionLoading(id + '-pdf');
    try {
      // First ensure it's generated
      await reportsApi.generatePdf(id);
      
      // Then download via blob
      const { data } = await reportsApi.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      await loadReports();
    } catch (err: any) { setError(err.response?.data?.message || 'PDF generation/download failed'); }
    finally { setActionLoading(''); }
  };

  const handleGenerateDocx = async (id: string) => {
    setActionLoading(id + '-docx');
    try {
      // First ensure it's generated
      await reportsApi.generateDocx(id);
      
      // Then download via blob
      const { data } = await reportsApi.downloadDocx(id);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}.docx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      await loadReports();
    } catch (err: any) { setError(err.response?.data?.message || 'DOCX generation/download failed'); }
    finally { setActionLoading(''); }
  };

  const handleOpenPdf = async (id: string) => {
    setActionLoading(id + '-open-pdf');
    try {
      const { data } = await reportsApi.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      // Note: We don't revoke the URL immediately because the new tab needs to load it.
      // Ideally, it would be revoked when the tab closes, but browser memory management handles this.
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to open PDF securely'); }
    finally { setActionLoading(''); }
  };

  const handleOpenDocx = async (id: string) => {
    setActionLoading(id + '-open-docx');
    try {
      const { data } = await reportsApi.downloadDocx(id);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      window.open(url, '_blank');
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to open DOCX securely'); }
    finally { setActionLoading(''); }
  };

  const getStatusBadge = (status: string) => {
    const m: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      SUBMITTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return m[status] || 'bg-gray-100 text-gray-700';
  };

  const filtered = reports.filter(r =>
    (r.event?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.createdBy?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.createdBy?.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = reports.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Report Management</h1>
        <p className="text-muted-foreground mt-1">Review, approve, or reject submitted reports.</p>
      </div>

      {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3">{error}<button onClick={() => setError('')} className="ml-2 underline">dismiss</button></div>}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DRAFT'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
            {s || 'All'} {s ? `(${statusCounts[s] || 0})` : `(${reports.length})`}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by event, author, or department..."
          className="flex h-10 w-full max-w-sm rounded-md border bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Event</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Author</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Submitted</th>
                <th className="h-12 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4">
                    <div className="font-medium">{r.event?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{r.event?.type} · {r.event?.department}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">{r.createdBy?.name}</div>
                    <div className="text-xs text-muted-foreground">{r.createdBy?.email}</div>
                  </td>
                  <td className="p-4"><span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(r.status)}`}>{r.status}</span></td>
                  <td className="p-4 text-muted-foreground text-sm">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => viewDetail(r)} className="p-2 rounded-md hover:bg-accent transition-colors" title="View Details"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                      {r.pdfUrl && <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-accent transition-colors" title="Open PDF"><ExternalLink className="w-4 h-4 text-muted-foreground" /></a>}
                      {r.docxUrl && <a href={r.docxUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-accent transition-colors" title="Download Word"><FileText className="w-4 h-4 text-orange-600" /></a>}
                      {r.status === 'SUBMITTED' && (
                        <>
                          <button onClick={() => handleApprove(r._id)} disabled={actionLoading === r._id} className="p-2 rounded-md hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors" title="Approve">
                            {actionLoading === r._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                          </button>
                          <button onClick={() => { setSelectedReport(r); setShowRejectModal(true); setRejectNote(''); }} className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors" title="Reject">
                            <XCircle className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No reports found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Detail Modal */}
      {showDetail && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border bg-card shadow-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedReport.event?.name}</h2>
                <p className="text-sm text-muted-foreground">by {selectedReport.createdBy?.name} · {selectedReport.createdBy?.department}</p>
              </div>
              <button onClick={() => setShowDetail(false)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(selectedReport.status)}`}>{selectedReport.status}</span>
              {selectedReport.event && <span className="text-xs text-muted-foreground">Type: {selectedReport.event.type}</span>}
              {selectedReport.event?.venue && <span className="text-xs text-muted-foreground">Venue: {selectedReport.event.venue}</span>}
            </div>

            {selectedReport.rejectionNote && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm font-medium text-destructive">Rejection Note:</p>
                <p className="text-sm text-destructive/80">{selectedReport.rejectionNote}</p>
              </div>
            )}

            {/* Sections */}
            {selectedReport.sections && selectedReport.sections.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Sections ({selectedReport.sections.length})</h3>
                <div className="space-y-2">
                  {selectedReport.sections.map((s: any, i: number) => (
                    <div key={s._id || i} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{s.heading}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{s.type}</span>
                      </div>
                      {s.content?.paragraphs?.length > 0 && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.content.paragraphs[0]}</p>}
                      {s.images?.length > 0 && <p className="text-xs text-primary mt-1">{s.images.length} image(s)</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Budgets */}
            {selectedReport.budgets && selectedReport.budgets.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Budget ({selectedReport.budgets.length} items)</h3>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/50"><th className="px-3 py-2 text-left text-xs font-medium">Item</th><th className="px-3 py-2 text-right text-xs font-medium">Qty</th><th className="px-3 py-2 text-right text-xs font-medium">Cost</th><th className="px-3 py-2 text-right text-xs font-medium">Total</th></tr></thead>
                    <tbody>
                      {selectedReport.budgets.map((b: any, i: number) => (
                        <tr key={b._id || i} className="border-t"><td className="px-3 py-2">{b.item}</td><td className="px-3 py-2 text-right">{b.quantity}</td><td className="px-3 py-2 text-right">₹{b.unitCost}</td><td className="px-3 py-2 text-right font-medium">₹{b.totalCost}</td></tr>
                      ))}
                      <tr className="border-t bg-muted/30"><td colSpan={3} className="px-3 py-2 text-right font-semibold">Grand Total</td><td className="px-3 py-2 text-right font-bold">₹{selectedReport.budgets.reduce((s: number, b: any) => s + (b.totalCost || 0), 0)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t flex-wrap">
              <button onClick={() => setShowDetail(false)} className="inline-flex items-center gap-2 rounded-md border h-9 px-4 text-sm font-medium hover:bg-accent transition-colors">
                Back
              </button>
              
              <button onClick={() => handleGeneratePdf(selectedReport._id)} disabled={!!actionLoading}
                className="inline-flex items-center gap-2 rounded-md border h-9 px-4 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                {actionLoading === selectedReport._id + '-pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} Generate PDF
              </button>
              {selectedReport.pdfUrl && (
                <button 
                  onClick={() => handleOpenPdf(selectedReport._id)} 
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 rounded-md border h-9 px-4 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                  {actionLoading === selectedReport._id + '-open-pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} View PDF
                </button>
              )}
 
              <button onClick={() => handleGenerateDocx(selectedReport._id)} disabled={!!actionLoading}
                className="inline-flex items-center gap-2 rounded-md border h-9 px-4 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                {actionLoading === selectedReport._id + '-docx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Generate Word (DOCX)
              </button>
              {selectedReport.docxUrl && (
                <button 
                  onClick={() => handleOpenDocx(selectedReport._id)} 
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 rounded-md border h-9 px-4 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50">
                  {actionLoading === selectedReport._id + '-open-docx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4 text-orange-600" />} View Word
                </button>
              )}
 
              <div className="flex-1" />
              {selectedReport.status === 'SUBMITTED' && (
                <>
                  <button onClick={() => handleApprove(selectedReport._id)} disabled={!!actionLoading}
                    className="inline-flex items-center gap-2 rounded-md bg-green-600 text-white h-9 px-4 text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {actionLoading === selectedReport._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                  </button>
                  <button onClick={() => { setShowRejectModal(true); setRejectNote(''); }} disabled={!!actionLoading}
                    className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white h-9 px-4 text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedReport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border bg-card shadow-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-destructive">Reject Report</h2>
            <p className="text-sm text-muted-foreground">Provide a reason for rejection. The author will see this note.</p>
            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={4} placeholder="Reason for rejection..."
              className="flex w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="rounded-md border h-9 px-4 text-sm font-medium hover:bg-accent">Cancel</button>
              <button onClick={handleReject} disabled={!rejectNote.trim() || actionLoading === selectedReport._id}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white h-9 px-4 text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {actionLoading === selectedReport._id ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Reject Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
