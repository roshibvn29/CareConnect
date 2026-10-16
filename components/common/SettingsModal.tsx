'use client';

import React, { useEffect, useState } from 'react';
import { useSettings, ThemeMode, FontSize } from '@/context/SettingsContext';
import {
  X,
  Sun,
  Moon,
  Laptop,
  Type,
  Eye,
  Bell,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  ShieldCheck,
  Sparkles,
  Settings,
} from 'lucide-react';

export default function SettingsModal() {
  const {
    settings,
    effectiveTheme,
    setTheme,
    setFontSize,
    setHighContrast,
    setSoundAlerts,
    setAutoRefresh,
    resetSettings,
    isSettingsOpen,
    closeSettings,
  } = useSettings();

  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings();
    };
    if (isSettingsOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  const handleResetDemoData = async () => {
    if (!confirm('Re-seed database to default clean demo state?')) return;
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetMessage('Database re-seeded successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setResetMessage('Reset failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e: any) {
      setResetMessage('Error: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={closeSettings}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 id="settings-dialog-title" className="text-base font-bold text-slate-900 dark:text-white">
                Application Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize appearance, accessibility & preferences
              </p>
            </div>
          </div>
          <button
            onClick={closeSettings}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Theme Selection */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Theme & Appearance
              </label>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Active: <span className="font-semibold text-teal-600 dark:text-teal-400 capitalize">{effectiveTheme}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Light */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                  settings.theme === 'light'
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold">Light</div>
                {settings.theme === 'light' && (
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                )}
              </button>

              {/* Dark */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                  settings.theme === 'dark'
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold">Dark</div>
                {settings.theme === 'dark' && (
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                )}
              </button>

              {/* System */}
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-2 ${
                  settings.theme === 'system'
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Laptop className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold">Auto (System)</div>
                {settings.theme === 'system' && (
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                )}
              </button>
            </div>
          </section>

          {/* 2. Accessibility & Text Size */}
          <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Text Sizing (Senior Friendly)
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Scaling: <span className="font-semibold text-teal-600 dark:text-teal-400 capitalize">{settings.fontSize}</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFontSize('normal')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition ${
                  settings.fontSize === 'normal'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                Normal (100%)
              </button>
              <button
                type="button"
                onClick={() => setFontSize('large')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition ${
                  settings.fontSize === 'large'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                Large (110%)
              </button>
              <button
                type="button"
                onClick={() => setFontSize('xlarge')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition ${
                  settings.fontSize === 'xlarge'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                Extra Large (120%)
              </button>
            </div>

            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    High Contrast Mode
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sharpen visual contrast for easier reading
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHighContrast(!settings.highContrast)}
                role="switch"
                aria-checked={settings.highContrast}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.highContrast ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* 3. Alerts & Notification Options */}
          <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Notifications & Audio
            </label>

            <div className="space-y-2">
              {/* Sound Alerts */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  {settings.soundAlerts ? (
                    <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Audio Notification Chimes
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Play alert chime when requests match or update
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundAlerts(!settings.soundAlerts)}
                  role="switch"
                  aria-checked={settings.soundAlerts}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.soundAlerts ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.soundAlerts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Refresh */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Live Dashboard Polling
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Periodically fetch real-time volunteer updates
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoRefresh(!settings.autoRefresh)}
                  role="switch"
                  aria-checked={settings.autoRefresh}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoRefresh ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* 4. Demo Data & Reset */}
          <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Demo Data Management
            </label>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
              <div>
                <div className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                  Reset Demo Database
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-400">
                  Re-initialize demo coordinators, volunteers & tasks
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetDemoData}
                disabled={isResetting}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
            {resetMessage && (
              <p className="text-xs text-teal-700 dark:text-teal-400 font-medium">
                {resetMessage}
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <button
            type="button"
            onClick={resetSettings}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
          >
            Reset settings to default
          </button>
          <button
            type="button"
            onClick={closeSettings}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
