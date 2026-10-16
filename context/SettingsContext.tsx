'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'normal' | 'large' | 'xlarge';

export interface AppSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  highContrast: boolean;
  soundAlerts: boolean;
  autoRefresh: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  fontSize: 'normal',
  highContrast: false,
  soundAlerts: true,
  autoRefresh: true,
};

interface SettingsContextType {
  settings: AppSettings;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (fontSize: FontSize) => void;
  setHighContrast: (highContrast: boolean) => void;
  setSoundAlerts: (soundAlerts: boolean) => void;
  setAutoRefresh: (autoRefresh: boolean) => void;
  resetSettings: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'careconnect_app_settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemIsDark, setSystemIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage and detect system color scheme
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch {
      // Local storage unavailable or corrupt
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemIsDark(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Save settings when changed
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Local storage unavailable
    }
  }, [settings, mounted]);

  // Determine effective theme
  const effectiveTheme: 'light' | 'dark' =
    settings.theme === 'system' ? (systemIsDark ? 'dark' : 'light') : settings.theme;

  // Apply theme & accessibility to <html> root element
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Dark class
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Font size scaling (ideal for senior citizens / low vision)
    if (settings.fontSize === 'xlarge') {
      root.style.fontSize = '19px';
    } else if (settings.fontSize === 'large') {
      root.style.fontSize = '17.5px';
    } else {
      root.style.fontSize = '16px';
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add('contrast-125');
    } else {
      root.classList.remove('contrast-125');
    }
  }, [effectiveTheme, settings.fontSize, settings.highContrast]);

  const setTheme = (theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const setFontSize = (fontSize: FontSize) => {
    setSettings((prev) => ({ ...prev, fontSize }));
  };

  const setHighContrast = (highContrast: boolean) => {
    setSettings((prev) => ({ ...prev, highContrast }));
  };

  const setSoundAlerts = (soundAlerts: boolean) => {
    setSettings((prev) => ({ ...prev, soundAlerts }));
  };

  const setAutoRefresh = (autoRefresh: boolean) => {
    setSettings((prev) => ({ ...prev, autoRefresh }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);
  const toggleSettings = () => setIsSettingsOpen((prev) => !prev);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        effectiveTheme,
        setTheme,
        setFontSize,
        setHighContrast,
        setSoundAlerts,
        setAutoRefresh,
        resetSettings,
        isSettingsOpen,
        openSettings,
        closeSettings,
        toggleSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
