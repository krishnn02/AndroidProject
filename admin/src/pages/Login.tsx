import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { FileText, Loader2 } from 'lucide-react';

export function Login() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-muted-foreground mt-2">Smart Event Report Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border bg-card shadow-sm p-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              placeholder="admin@institution.edu"
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              placeholder="••••••••"
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground h-10 px-4 py-2 text-sm font-medium w-full hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Only admin accounts can access this portal.
        </p>
      </div>
    </div>
  );
}
