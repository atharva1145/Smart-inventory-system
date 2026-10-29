import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getErrorMessage } from '../services/api';
import { Lock, User, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      const authData = res.data.data;
      login(authData.token, {
        id: authData.id,
        username: authData.username,
        email: authData.email,
        fullName: authData.fullName,
        role: authData.role,
        active: true,
        createdAt: '',
        updatedAt: '',
      });
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (user: string) => {
    setUsername(user);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-600/30 font-bold text-2xl">
            S
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to SmartInventory
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Production-grade inventory & concurrency-safe order management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username or Email</label>
              <div className="relative rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="e.g. admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative rounded-lg">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2.5">
              <Shield className="w-3.5 h-3.5 text-primary-600" />
              <span>Demo Quick-Fill Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="text-left px-2.5 py-2 rounded-lg border border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
              >
                <div className="font-semibold text-slate-800">Admin</div>
                <div className="text-[10px] text-slate-400">Full system access</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager')}
                className="text-left px-2.5 py-2 rounded-lg border border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
              >
                <div className="font-semibold text-slate-800">Manager</div>
                <div className="text-[10px] text-slate-400">Stock & PO controls</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('sales')}
                className="text-left px-2.5 py-2 rounded-lg border border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
              >
                <div className="font-semibold text-slate-800">Sales Staff</div>
                <div className="text-[10px] text-slate-400">Order creations</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('viewer')}
                className="text-left px-2.5 py-2 rounded-lg border border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
              >
                <div className="font-semibold text-slate-800">Viewer</div>
                <div className="text-[10px] text-slate-400">Read-only auditing</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
