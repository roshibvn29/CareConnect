'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import StatusBadge from '@/components/common/StatusBadge';
import {
  Plus,
  Clock,
  CheckCircle,
  Radio,
  User,
  MapPin,
  Calendar,
  KeyRound,
  AlertCircle,
  RotateCw,
  Phone,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  Check,
} from 'lucide-react';
import { IAssistanceRequest } from '@/types';

export default function RequesterDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [requests, setRequests] = useState<IAssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModalRequest, setConfirmModalRequest] = useState<IAssistanceRequest | null>(null);
  const [codeInputValue, setCodeInputValue] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [expandingId, setExpandingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests?my=true');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 8000);
    return () => clearInterval(interval);
  }, []);

  const activeRequests = requests.filter(
    (r) => r.status === 'ACTIVE' || r.status === 'ASSIGNED' || r.status === 'COMPLETION_PENDING'
  );
  const pendingRequests = requests.filter(
    (r) => r.status === 'PENDING' || r.status === 'MATCHING'
  );
  const completedRequests = requests.filter((r) => r.status === 'COMPLETED');

  // Expand Radius Handler
  const handleExpandRadius = async (requestId: string) => {
    setExpandingId(requestId);
    try {
      const res = await fetch('/api/matching/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchRequests();
      } else {
        alert(data.message || data.error);
      }
    } catch (err: any) {
      alert('Error expanding search radius: ' + err.message);
    } finally {
      setExpandingId(null);
    }
  };

  // Confirm Completion Handler
  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModalRequest) return;

    setConfirmError('');
    setConfirmSuccess('');
    setIsSubmittingCode(true);

    try {
      const res = await fetch(`/api/tasks/${confirmModalRequest._id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationCode: codeInputValue }),
      });

      const data = await res.json();
      setIsSubmittingCode(false);

      if (data.success) {
        setConfirmSuccess('Task confirmed completed successfully!');
        setTimeout(() => {
          setConfirmModalRequest(null);
          setCodeInputValue('');
          setConfirmSuccess('');
          fetchRequests();
        }, 1200);
      } else {
        setConfirmError(data.error || 'Incorrect confirmation code.');
      }
    } catch (err: any) {
      setIsSubmittingCode(false);
      setConfirmError(err.message || 'Error confirming code.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Requester Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Welcome, {user?.name || 'Friend'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Your community assistance requests are monitored with verified local volunteers.
          </p>
        </div>

        <Link
          href="/requests/create"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-600/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          Create New Request
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Requests</div>
            <div className="text-3xl font-black text-teal-700 mt-1">{activeRequests.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending / Matching</div>
            <div className="text-3xl font-black text-amber-600 mt-1">{pendingRequests.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed Requests</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">{completedRequests.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ACTIVE & MATCHING REQUESTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-600 animate-pulse" />
            Active & Ongoing Assistance Requests
          </h2>
          <button
            onClick={fetchRequests}
            className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {activeRequests.length === 0 && pendingRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
            <p className="text-sm text-slate-500">You have no active requests right now.</p>
            <Link
              href="/requests/create"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900"
            >
              Need something? Create a request now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...activeRequests, ...pendingRequests].map((req) => {
              const assignedVol = typeof req.assignedVolunteerId === 'object' ? req.assignedVolunteerId : null;
              const isCompletionPending = req.status === 'COMPLETION_PENDING';
              const isMatching = req.status === 'MATCHING' || req.status === 'PENDING';

              return (
                <div
                  key={req._id}
                  className={`p-6 rounded-3xl border shadow-sm space-y-4 transition bg-white ${
                    isCompletionPending
                      ? 'border-amber-300 ring-2 ring-amber-200'
                      : isMatching
                      ? 'border-teal-200 bg-teal-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                        {req.category}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">{req.description}</h3>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{req.preferredDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{req.preferredTime}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{req.address}</span>
                    </div>
                  </div>

                  {/* Matching Dynamic Radius Status */}
                  {isMatching && (
                    <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-100 text-xs space-y-2">
                      <div className="flex items-center justify-between text-teal-900 font-semibold">
                        <span>Current Search Radius: {req.currentSearchRadius || 2} km</span>
                        <span className="text-[11px] bg-teal-200/60 px-2 py-0.5 rounded-full font-bold">
                          Step {(req.currentSearchRadius || 2) <= 2 ? '1/4' : (req.currentSearchRadius || 2) <= 5 ? '2/4' : '3/4'}
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-700">
                        Searching for verified volunteers within {req.currentSearchRadius || 2} km. If none accept, radius can expand up to 15 km.
                      </p>
                      <button
                        onClick={() => handleExpandRadius(req._id)}
                        disabled={expandingId === req._id || (req.currentSearchRadius || 2) >= 15}
                        className="w-full py-1.5 px-3 bg-white hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl border border-teal-200 transition flex items-center justify-center gap-1.5"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        {expandingId === req._id ? 'Expanding Radius...' : 'Expand Search Radius (+)'}
                      </button>
                    </div>
                  )}

                  {/* Assigned Volunteer Details */}
                  {assignedVol && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-teal-600" />
                          Assigned Volunteer: {(assignedVol as any).name}
                        </span>
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                          KYC Verified
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Contact: {(assignedVol as any).phone}</span>
                      </div>
                    </div>
                  )}

                  {/* Confirmation Code Showcase */}
                  <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase font-bold text-teal-800 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                        Task Confirmation Code
                      </div>
                      <div className="text-xl font-mono font-black text-teal-900 tracking-wider mt-0.5">
                        {req.confirmationCode || 'CARE-4821'}
                      </div>
                      <span className="text-[10px] text-teal-700 block mt-0.5">
                        Share this code with volunteer upon successful task completion.
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setConfirmModalRequest(req);
                        setCodeInputValue(req.confirmationCode || '');
                      }}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Verify / Confirm
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REQUEST HISTORY SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" />
          Request History
        </h2>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-4">Task Category</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Assigned Volunteer</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const vol = typeof r.assignedVolunteerId === 'object' ? r.assignedVolunteerId : null;
                    return (
                      <tr key={r._id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 font-semibold text-slate-900">
                          {r.category}
                          <p className="text-[11px] text-slate-500 font-normal truncate max-w-xs">
                            {r.description}
                          </p>
                        </td>
                        <td className="p-4 text-slate-600 whitespace-nowrap">
                          {r.preferredDate}
                          <div className="text-[11px] text-slate-400">{r.preferredTime}</div>
                        </td>
                        <td className="p-4 text-slate-700">
                          {vol ? (
                            <span className="font-medium text-slate-900">{(vol as any).name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 truncate max-w-xs">{r.address}</td>
                        <td className="p-4 whitespace-nowrap">
                          <StatusBadge status={r.status} size="sm" />
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-teal-800">
                          {r.confirmationCode}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CONFIRMATION CODE MODAL */}
      {confirmModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirm Task Completion</h3>
              <p className="text-xs text-slate-500">
                Enter your confirmation code to formally close and complete this task.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-1 border border-slate-200">
              <div>
                <span className="font-semibold text-slate-700">Task:</span> {confirmModalRequest.category}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Your Confirmation Code:</span>{' '}
                <span className="font-mono font-bold text-teal-700">
                  {confirmModalRequest.confirmationCode}
                </span>
              </div>
            </div>

            {confirmError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
                {confirmError}
              </div>
            )}

            {confirmSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {confirmSuccess}
              </div>
            )}

            <form onSubmit={handleConfirmCompletion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Enter Code
                </label>
                <input
                  type="text"
                  required
                  value={codeInputValue}
                  onChange={(e) => setCodeInputValue(e.target.value)}
                  placeholder="e.g. CARE-4821"
                  className="w-full text-center text-lg font-mono font-bold tracking-widest py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 uppercase"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmModalRequest(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCode}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {isSubmittingCode ? 'Verifying...' : 'Confirm Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
