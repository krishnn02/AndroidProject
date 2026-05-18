import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Calendar, FileText, CheckCircle } from 'lucide-react';

const data = [
  { name: 'Jan', events: 4, reports: 3 },
  { name: 'Feb', events: 3, reports: 2 },
  { name: 'Mar', events: 2, reports: 4 },
  { name: 'Apr', events: 6, reports: 5 },
  { name: 'May', events: 5, reports: 5 },
  { name: 'Jun', events: 8, reports: 7 },
];

export function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's an overview of the system's current status.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat Cards */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-2">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Users</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">124</div>
          <p className="text-xs text-muted-foreground">+4 from last month</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-2">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Events</h3>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-muted-foreground">+2 scheduled this week</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-2">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Pending Reports</h3>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-amber-500">5</div>
          <p className="text-xs text-muted-foreground">Requires admin approval</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-2">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Approved Reports</h3>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-green-500">89</div>
          <p className="text-xs text-muted-foreground">+14% from last month</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5 pb-6">
            <h3 className="text-lg font-semibold leading-none tracking-tight">Events vs Reports</h3>
            <p className="text-sm text-muted-foreground">Monthly comparison for the last 6 months.</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--accent))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '0.5rem' }} 
                />
                <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Events" />
                <Bar dataKey="reports" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Reports" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-1.5 pb-6">
            <h3 className="text-lg font-semibold leading-none tracking-tight">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Latest events and submissions.</p>
          </div>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">Annual Tech Symposium Report</p>
                  <p className="text-sm text-muted-foreground">Submitted by Computer Science Dept.</p>
                </div>
                <div className="text-xs text-muted-foreground">{i}h ago</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
