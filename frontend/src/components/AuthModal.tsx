import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { loginUser, registerUser, type User } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser(identifier, password);
        if (res.user) {
          onSuccess(res.user);
          onClose();
        }
      } else {
        const res = await registerUser(username, email, password);
        if (res.user) {
          onSuccess(res.user);
          onClose();
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-100">
            {mode === 'login' ? 'Welcome Back, Operator' : 'Create Your Ham Prep Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Log in to sync your question mastery across all your devices.'
              : 'Save your mock exam history and spaced repetition progress.'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-slate-800 rounded-xl p-1 mb-6 border border-slate-700">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Google OAuth Button */}
        <a
          href="/accounts/google/login/?process=login"
          className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm rounded-xl transition shadow mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </a>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-700 w-full" />
          <span className="bg-slate-900 px-2 text-xs text-slate-500 uppercase tracking-wider">or</span>
          <div className="border-t border-slate-700 w-full" />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. k7xyz or name@email.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Username / Call Sign
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. radio_aficionado"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-blue-900/30 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
