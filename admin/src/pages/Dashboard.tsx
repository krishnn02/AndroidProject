import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, FileText, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { analyticsApi, reportsApi } from '../services/api';

const PIE_COLORS = ['hsl(222, 47%, 11%)', 'hsl(45, 93%, 47%)', 'hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)'];
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function Dashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [eventAnalytics, setEventAnalytics] = useState<any>(null);
  const [reportAnalytics, setReportAnalytics] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, evRes, rpRes, recRes] = await Promise.all([
        analyticsApi.overview(),
        analyticsApi.events(),
        analyticsApi.reports(),
        reportsApi.getAll({ limit: 5 }),
      ]);
      setOverview(ovRes.data.data);
      setEventAnalytics(evRes.data.data);
      setReportAnalytics(rpRes.data.data);
      setRecentReports(recRes.data.data.reports || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const eventMonthData = (eventAnalytics?.byMonth || []).map((m: any) => ({
    name: MONTH_NAMES[m._id] || `M${m._id}`,
    events: m.count,
  }));

  const reportStatusData = (reportAnalytics?.byStatus || []).map((s: any) => ({
    name: s._id,
    value: s.count,
  }));

  const eventTypeData = (eventAnalytics?.byType || []).map((t: any) => ({
    name: t._id,
    count: t.count,
  }));

  const stats = [
    { label: 'Total Users', value: overview?.totalUsers ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Active Events', value: overview?.activeEvents ?? 0, icon: Calendar, color: 'text-green-500' },
    { label: 'Pending Approval', value: overview?.pendingReports ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Approved Reports', value: overview?.approvedReports ?? 0, icon: CheckCircle, color: 'text-emerald-500' },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      SUBMITTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time system metrics and analytics.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Events by Month */}
        <div className="col-span-4 rounded-xl border bg-card shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-1">Events by Month</h3>
          <p className="text-sm text-muted-foreground mb-4">Monthly event distribution.</p>
          <div className="h-[280px]">
            {eventMonthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventMonthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem' }} />
                  <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Events" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No event data yet</div>
            )}
          </div>
        </div>

        {/* Report Status Pie */}
        <div className="col-span-3 rounded-xl border bg-card shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-1">Report Status</h3>
          <p className="text-sm text-muted-foreground mb-4">Distribution by status.</p>
          <div className="h-[280px]">
            {reportStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reportStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {reportStatusData.map((_: any, idx: number) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No report data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Event Types + Recent Reports */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Event Types */}
        <div className="rounded-xl border bg-card shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Events by Type</h3>
          {eventTypeData.length > 0 ? (
            <div className="space-y-3">
              {eventTypeData.map((t: any) => (
                <div key={t.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((t.count / Math.max(...eventTypeData.map((x: any) => x.count))) * 100, 100)}%` }} />
                    </div>
                    <span className="text-sm text-muted-foreground w-6 text-right">{t.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No events created yet.</p>
          )}
        </div>

        {/* Recent Reports */}
        <div className="rounded-xl border bg-card shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
          {recentReports.length > 0 ? (
            <div className="space-y-4">
              {recentReports.map((r: any) => (
                <div key={r._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.event?.name || 'Unknown Event'}</p>
                    <p className="text-xs text-muted-foreground">{r.createdBy?.name} · {r.createdBy?.department}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(r.status)}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No reports submitted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
