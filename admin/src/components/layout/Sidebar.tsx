import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuthStore } from '../../stores/authStore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-full shadow-sm">
      <div className="p-6 border-b flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">ReportAdmin</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground hover:border-transparent border border-transparent"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-3">
        {user && (
          <div className="px-2">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2.5 rounded-lg font-medium text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
