import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Loader2, X, Search, UserPlus, Calendar } from 'lucide-react';
import { eventsApi, usersApi } from '../services/api';

const EVENT_TYPES = ['CULTURAL', 'TECHNICAL', 'SEMINAR', 'WORKSHOP', 'INDUSTRIAL_VISIT', 'OTHER'];
const EVENT_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const THEME_TYPES = ['CULTURAL', 'TECHNICAL', 'SEMINAR', 'ENVIRONMENT', 'CORPORATE'];

interface Event {
  _id: string; name: string; type: string; department: string; date: string; venue: string;
  convener: string; coConvener?: string; facultyCoordinator?: string; studentCoordinator?: string;
  status: string; themeType: string; createdAt: string;
}

const emptyForm = { name: '', type: 'TECHNICAL', department: '', date: '', venue: '', convener: '', coConvener: '', facultyCoordinator: '', studentCoordinator: '', themeType: 'CORPORATE', status: 'DRAFT' };

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [assignEvent, setAssignEvent] = useState<Event | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await eventsApi.getAll({ limit: 100 });
      setEvents(data.data.events || []);
    } catch { setError('Failed to load events'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editing) {
        await eventsApi.update(editing._id, form);
      } else {
        await eventsApi.create(form);
      }
      setShowModal(false); setEditing(null); setForm(emptyForm);
      await loadEvents();
    } catch (err: any) { setError(err.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  const handleEdit = (ev: Event) => {
    setEditing(ev);
    setForm({ name: ev.name, type: ev.type, department: ev.department, date: ev.date.split('T')[0], venue: ev.venue, convener: ev.convener, coConvener: ev.coConvener || '', facultyCoordinator: ev.facultyCoordinator || '', studentCoordinator: ev.studentCoordinator || '', themeType: ev.themeType || 'CORPORATE', status: ev.status });
    setShowModal(true); setError('');
  };

  const handleDelete = async (ev: Event) => {
    if (!confirm(`Delete event "${ev.name}"?`)) return;
    try { await eventsApi.delete(ev._id); await loadEvents(); }
    catch { setError('Failed to delete event'); }
  };

  const openAssign = async (ev: Event) => {
    setAssignEvent(ev); setShowAssignModal(true); setSelectedUserIds([]);
    try {
      const [usersRes, assignRes] = await Promise.all([usersApi.getAll({ limit: 100 }), eventsApi.getAssignments(ev._id)]);
      setAllUsers(usersRes.data.data.users || []);
      const assigned = (assignRes.data.data || []).map((a: any) => a.user?._id).filter(Boolean);
      setSelectedUserIds(assigned);
    } catch { setError('Failed to load users'); }
  };

  const handleAssign = async () => {
    if (!assignEvent) return;
    setSaving(true);
    try {
      await eventsApi.assign(assignEvent._id, selectedUserIds);
      setShowAssignModal(false); setAssignEvent(null);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to assign'); }
    finally { setSaving(false); }
  };

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filtered = events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.department.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (s: string) => {
    const m: Record<string, string> = { DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    return m[s] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground mt-1">Create, manage, and assign events.</p>
        </div>
        <button onClick={() => { setShowModal(true); setEditing(null); setForm(emptyForm); setError(''); }}
          className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground h-10 px-4 text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..."
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
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Department</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Date</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ev) => (
                <tr key={ev._id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4">
                    <div className="font-medium">{ev.name}</div>
                    <div className="text-xs text-muted-foreground">{ev.venue}</div>
                  </td>
                  <td className="p-4 text-muted-foreground">{ev.type}</td>
                  <td className="p-4">{ev.department}</td>
                  <td className="p-4 text-muted-foreground">{new Date(ev.date).toLocaleDateString()}</td>
                  <td className="p-4"><span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(ev.status)}`}>{ev.status}</span></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openAssign(ev)} className="p-2 rounded-md hover:bg-accent transition-colors" title="Assign Users"><UserPlus className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => handleEdit(ev)} className="p-2 rounded-md hover:bg-accent transition-colors" title="Edit"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(ev)} className="p-2 rounded-md hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No events found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border bg-card shadow-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? 'Edit Event' : 'Create Event'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1"><label className="text-sm font-medium">Event Name</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-medium">Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">{EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="space-y-1"><label className="text-sm font-medium">Theme</label><select value={form.themeType} onChange={e => setForm({...form, themeType: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">{THEME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-medium">Department</label><input required value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Date</label><input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
              <div className="space-y-1"><label className="text-sm font-medium">Venue</label><input required value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-medium">Convener</label><input required value={form.convener} onChange={e => setForm({...form, convener: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Co-Convener</label><input value={form.coConvener} onChange={e => setForm({...form, coConvener: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-sm font-medium">Faculty Coordinator</label><input value={form.facultyCoordinator} onChange={e => setForm({...form, facultyCoordinator: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div className="space-y-1"><label className="text-sm font-medium">Student Coordinator</label><input value={form.studentCoordinator} onChange={e => setForm({...form, studentCoordinator: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
              {editing && (
                <div className="space-y-1"><label className="text-sm font-medium">Status</label><select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm">{EVENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              )}
              <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-10 px-4 py-2 text-sm font-medium w-full hover:bg-primary/90 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{editing ? 'Save Changes' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && assignEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-xl border bg-card shadow-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Assign Users</h2>
                <p className="text-sm text-muted-foreground">{assignEvent.name}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-md hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {allUsers.filter(u => u.role !== 'ADMIN').map(user => (
                <label key={user._id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors">
                  <input type="checkbox" checked={selectedUserIds.includes(user._id)} onChange={() => toggleUser(user._id)} className="rounded" />
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.department} · {user.email}</div>
                  </div>
                </label>
              ))}
              {allUsers.filter(u => u.role !== 'ADMIN').length === 0 && <p className="text-center text-muted-foreground py-4">No users available.</p>}
            </div>
            <button onClick={handleAssign} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-10 px-4 py-2 text-sm font-medium w-full hover:bg-primary/90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Assign {selectedUserIds.length} User(s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
