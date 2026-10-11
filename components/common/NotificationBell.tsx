'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, Radio } from 'lucide-react';
import { INotification } from '@/types';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Ignore background notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s poll
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                Notifications
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {unreadCount} unread
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n._id}
                    className={`p-3.5 text-xs transition-colors hover:bg-slate-50 ${
                      !n.read ? 'bg-teal-50/40 font-medium' : 'text-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-teal-600" />
                          )}
                          <span className="font-semibold text-slate-900">
                            {n.title}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {!n.read && (
                        <button
                          onClick={() => markAsRead(n._id)}
                          title="Mark read"
                          className="p-1 hover:bg-white rounded-md text-slate-400 hover:text-teal-600"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
