'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  HeartHandshake,
  User,
  LogOut,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  Users,
  Compass,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function Navbar() {
  const { user, logout, switchDemoAccount } = useAuth();
  const { effectiveTheme, setTheme, openSettings } = useSettings();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const demoAccounts = [
    { name: 'Kamala Devi', role: 'requester', email: 'kamala@careconnect.org', desc: 'Elderly Requester (78 yrs, Jayanagar)', icon: Users },
    { name: 'Robert Pinto', role: 'requester', email: 'robert@careconnect.org', desc: 'Requester with Disability (Koramangala)', icon: Users },
    { name: 'Rahul Verma', role: 'volunteer', email: 'rahul@careconnect.org', desc: 'Verified Approved Volunteer', badge: 'APPROVED', icon: CheckCircle },
    { name: 'Vikram Singh', role: 'volunteer', email: 'vikram@careconnect.org', desc: 'Volunteer (KYC Review Pending)', badge: 'PENDING_KYC', icon: Clock },
    { name: 'Karthik Rajan', role: 'volunteer', email: 'karthik@careconnect.org', desc: 'Volunteer (KYC Rejected)', badge: 'REJECTED', icon: XCircle },
    { name: 'Sarah Jenkins', role: 'coordinator', email: 'admin@careconnect.org', desc: 'Care Coordinator & Admin', icon: ShieldCheck },
  ];

  const handleResetData = async () => {
    if (!confirm('Reset database to clean demo state?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert('Database re-seeded successfully!');
        window.location.reload();
      } else {
        alert('Reset failed: ' + data.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20 group-hover:bg-teal-700 transition-colors">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                CareConnect
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-transparent dark:border-teal-800">
                  v2.0
                </span>
              </span>
              <span className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
                Community Assistance Matching
              </span>
            </div>
          </Link>

          {/* Role Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
              <Link
                href="/requester"
                className={`px-3 py-1.5 rounded-lg transition ${
                  user.role === 'requester'
                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Requester Portal
              </Link>
              <Link
                href="/volunteer"
                className={`px-3 py-1.5 rounded-lg transition ${
                  user.role === 'volunteer'
                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Volunteer Portal
              </Link>
              <Link
                href="/coordinator"
                className={`px-3 py-1.5 rounded-lg transition ${
                  user.role === 'coordinator'
                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Coordinator Hub
              </Link>
            </nav>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Demo Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition"
              title="Switch demo persona for testing"
            >
              <Compass className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="hidden sm:inline">Switch Demo Role</span>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-400" />
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 z-50 p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Quick Persona Switch</span>
                    <button
                      onClick={handleResetData}
                      disabled={isResetting}
                      className="text-[11px] text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300 flex items-center gap-1 font-medium"
                      title="Reset database to fresh seed state"
                    >
                      <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
                      Reset Data
                    </button>
                  </div>
                  <div className="py-1">
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={async () => {
                          setSwitcherOpen(false);
                          const res = await switchDemoAccount(acc.role as any, acc.email);
                          if (!res?.success) {
                            alert(res?.error || 'Failed to switch to demo role.');
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex flex-col transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          user?.email === acc.email
                            ? 'bg-teal-50/70 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-800/60 font-semibold'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-900 dark:text-slate-100 font-medium">{acc.name}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {acc.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">{acc.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent dark:border-slate-700 transition"
            title={`Switch to ${effectiveTheme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle Dark/Light Mode"
          >
            {effectiveTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Settings Modal Button */}
          <button
            type="button"
            onClick={openSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition"
            title="Open CareConnect Settings"
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {user ? (
            <>
              {/* Notifications */}
              <NotificationBell />

              {/* User Profile & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">{user.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-teal-700 dark:text-teal-400 font-bold">{user.role}</div>
                </div>

                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
