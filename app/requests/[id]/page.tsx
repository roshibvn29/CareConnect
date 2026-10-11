'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/common/StatusBadge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  KeyRound,
  User,
  Phone,
  ShieldCheck,
  Maximize2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { IAssistanceRequest } from '@/types';

export default function RequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [request, setRequest] = useState<IAssistanceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmationCodeInput, setConfirmationCodeInput] = useState('');
  const [confirmStatus, setConfirmStatus] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [expandLoading, setExpandLoading] = useState(false);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/requests/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setRequest(data.request);
      } else {
        setError(data.error || 'Request not found');
      }
    } catch (e: any) {
      setError(e.message || 'Error loading request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [params.id]);

  const handleExpandRadius = async () => {
    if (!request) return;
    setExpandLoading(true);
    try {
      const res = await fetch('/api/matching/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: request._id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchRequest();
      } else {
        alert(data.message || data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setExpandLoading(false);
    }
  };

  const handleConfirmTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    setConfirmLoading(true);
    setConfirmStatus('');

    try {
      const res = await fetch(`/api/tasks/${request._id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationCode: confirmationCodeInput }),
      });
      const data = await res.json();
      setConfirmLoading(false);

      if (data.success) {
        setConfirmStatus('Task completion verified successfully!');
        fetchRequest();
      } else {
        alert(data.error || 'Incorrect confirmation code.');
      }
    } catch (err: any) {
      setConfirmLoading(false);
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-teal-600" /> Loading request details...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Request Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Could not locate this assistance request.'}</p>
        <Link
          href="/requester"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const requester = typeof request.requesterId === 'object' ? request.requesterId : null;
  const volunteer = typeof request.assignedVolunteerId === 'object' ? request.assignedVolunteerId : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <Link
        href={user?.role === 'coordinator' ? '/coordinator' : user?.role === 'volunteer' ? '/volunteer' : '/requester'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              {request.category}
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">{request.description}</h1>
            <p className="text-xs text-slate-400 mt-1">Request ID: {request._id}</p>
          </div>

          <StatusBadge status={request.status} />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider block">
              Schedule & Location
            </span>
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Date: {request.preferredDate}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Time: {request.preferredTime}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>{request.address}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider block">
              Participants
            </span>
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              <span>
                <strong className="text-slate-900">Requester:</strong> {(requester as any)?.name || 'Community Member'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Contact: {(requester as any)?.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 pt-1 border-t border-slate-200">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>
                <strong className="text-slate-900">Volunteer:</strong>{' '}
                {volunteer ? (
                  <span className="text-emerald-700 font-semibold">
                    {(volunteer as any).name} (Verified)
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Matching nearby...</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Radius Matching Info */}
        {(request.status === 'MATCHING' || request.status === 'PENDING') && (
          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-teal-900">
                Rule-Based Geographic Matching Active
              </div>
              <div className="text-[11px] text-teal-700 mt-0.5">
                Current search radius: <strong>{request.currentSearchRadius || 2} km</strong>. Notified verified volunteers in this radius.
              </div>
            </div>

            <button
              onClick={handleExpandRadius}
              disabled={expandLoading || (request.currentSearchRadius || 2) >= 15}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {expandLoading ? 'Expanding...' : 'Expand Radius (+) '}
            </button>
          </div>
        )}

        {/* Confirmation Code Card */}
        <div className="p-5 bg-teal-50/70 rounded-2xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-teal-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-teal-600" />
              Task Completion Confirmation Code
            </div>
            <div className="text-2xl font-mono font-black text-teal-950 mt-1 tracking-wider">
              {request.confirmationCode}
            </div>
            <p className="text-[11px] text-teal-700 mt-0.5">
              The requester presents this verification code to confirm delivery / completion.
            </p>
          </div>

          {request.status !== 'COMPLETED' && (
            <form onSubmit={handleConfirmTask} className="flex gap-2">
              <input
                type="text"
                value={confirmationCodeInput}
                onChange={(e) => setConfirmationCodeInput(e.target.value)}
                placeholder="Enter Code (CARE-XXXX)"
                className="px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 uppercase"
              />
              <button
                type="submit"
                disabled={confirmLoading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition whitespace-nowrap"
              >
                {confirmLoading ? 'Verifying...' : 'Confirm'}
              </button>
            </form>
          )}

          {confirmStatus && (
            <span className="text-xs font-bold text-emerald-700">{confirmStatus}</span>
          )}
        </div>
      </div>
    </div>
  );
}
