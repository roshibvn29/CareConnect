'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HeartHandshake, Lock, Mail, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, switchDemoAccount } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to login. Please check your credentials.');
    }
  };

  const handleQuickDemo = async (role: 'requester' | 'volunteer' | 'coordinator', demoEmail: string) => {
    setEmail(demoEmail);
    setLoading(true);
    await switchDemoAccount(role, demoEmail);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-500">Sign in to your CareConnect account</p>
        </div>

        {/* Quick Demo Logins */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Quick Demo Sign In:
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('requester', 'kamala@careconnect.org')}
              className="p-2 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl font-medium text-slate-800 text-center transition"
            >
              Requester
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('volunteer', 'rahul@careconnect.org')}
              className="p-2 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl font-medium text-slate-800 text-center transition"
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('coordinator', 'admin@careconnect.org')}
              className="p-2 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl font-medium text-slate-800 text-center transition"
            >
              Coordinator
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
