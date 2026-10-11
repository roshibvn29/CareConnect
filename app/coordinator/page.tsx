'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import KycBadge from '@/components/common/KycBadge';
import StatusBadge from '@/components/common/StatusBadge';
import {
  LayoutDashboard,
  FileQuestion,
  Users,
  ShieldCheck,
  CheckCircle,
  Activity,
  BarChart3,
  Settings,
  Clock,
  RotateCw,
  Search,
  Filter,
  Check,
  X,
  Eye,
  AlertTriangle,
  MapPin,
  Calendar,
  Maximize2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { IAssistanceRequest, IVolunteerProfile, IKycReview, IAssignment } from '@/types';

export default function CoordinatorDashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'requests' | 'volunteers' | 'kyc' | 'assignments' | 'completed' | 'reports' | 'settings'
  >('dashboard');

  const [stats, setStats] = useState<any>({
    pendingRequests: 0,
    activeAssignments: 0,
    completedTasks: 0,
    cancelledRequests: 0,
    pendingKyc: 0,
    approvedVolunteers: 0,
    rejectedVolunteers: 0,
    totalVolunteers: 0,
    totalRequests: 0,
  });

  const [requests, setRequests] = useState<IAssistanceRequest[]>([]);
  const [volunteers, setVolunteers] = useState<IVolunteerProfile[]>([]);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [kycReviews, setKycReviews] = useState<IKycReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [requestFilter, setRequestFilter] = useState('ALL');
  const [volunteerFilter, setVolunteerFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // KYC Review Modal State
  const [reviewVolunteer, setReviewVolunteer] = useState<IVolunteerProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewActionLoading, setReviewActionLoading] = useState(false);

  const fetchCoordinatorData = async () => {
    try {
      // 1. Fetch dashboard overview stats
      const dashRes = await fetch('/api/coordinator/dashboard');
      const dashData = await dashRes.json();
      if (dashData.success) {
        setStats(dashData.stats || {});
      }

      // 2. Fetch requests
      const reqRes = await fetch('/api/coordinator/requests');
      const reqData = await reqRes.json();
      if (reqData.success) {
        setRequests(reqData.requests || []);
      }

      // 3. Fetch volunteers
      const volRes = await fetch('/api/coordinator/volunteers');
      const volData = await volRes.json();
      if (volData.success) {
        setVolunteers(volData.volunteers || []);
      }

      // 4. Fetch history / assignments
      const histRes = await fetch('/api/coordinator/history');
      const histData = await histRes.json();
      if (histData.success) {
        setAssignments(histData.allAssignments || []);
        setKycReviews(histData.kycReviews || []);
      }
    } catch (e) {
      console.error('Coordinator fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoordinatorData();
    const interval = setInterval(fetchCoordinatorData, 10000);
    return () => clearInterval(interval);
  }, []);

  // APPROVE VOLUNTEER KYC
  const handleApproveKyc = async (profileId: string) => {
    setReviewActionLoading(true);
    try {
      const res = await fetch(`/api/kyc/${profileId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert('Volunteer KYC approved successfully! Volunteer can now accept requests.');
        setReviewVolunteer(null);
        fetchCoordinatorData();
      } else {
        alert(data.error || 'Failed to approve volunteer.');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setReviewActionLoading(false);
    }
  };

  // REJECT VOLUNTEER KYC
  const handleRejectKyc = async (profileId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please enter a reason for rejecting this document.');
      return;
    }

    setReviewActionLoading(true);
    try {
      const res = await fetch(`/api/kyc/${profileId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Volunteer KYC rejected with feedback.');
        setReviewVolunteer(null);
        setRejectionReason('');
        fetchCoordinatorData();
      } else {
        alert(data.error || 'Failed to reject KYC.');
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setReviewActionLoading(false);
    }
  };

  // SUSPEND VOLUNTEER
  const handleSuspendVolunteer = async (profileId: string) => {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/kyc/${profileId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Volunteer suspended.');
        fetchCoordinatorData();
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // EXPAND SEARCH RADIUS
  const handleExpandRadius = async (requestId: string) => {
    try {
      const res = await fetch('/api/matching/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchCoordinatorData();
      } else {
        alert(data.message || data.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  // FILTERED LISTS
  const pendingKycVolunteers = volunteers.filter((v) => v.kycStatus === 'PENDING_KYC');

  const filteredRequests = requests.filter((r) => {
    if (requestFilter !== 'ALL' && r.status !== requestFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCat = r.category.toLowerCase().includes(q);
      const matchDesc = r.description.toLowerCase().includes(q);
      const matchAddr = r.address.toLowerCase().includes(q);
      const requesterName = typeof r.requesterId === 'object' ? (r.requesterId as any).name?.toLowerCase() : '';
      if (!matchCat && !matchDesc && !matchAddr && !requesterName.includes(q)) return false;
    }
    return true;
  });

  const filteredVolunteers = volunteers.filter((v) => {
    if (volunteerFilter !== 'ALL' && v.kycStatus !== volunteerFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const userName = typeof v.userId === 'object' ? (v.userId as any).name?.toLowerCase() : '';
      const email = typeof v.userId === 'object' ? (v.userId as any).email?.toLowerCase() : '';
      if (!userName.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Coordinator Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Community Assistance Supervision
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervise requests, verify volunteer credentials, monitor dynamic radius matching, and ensure safety.
          </p>
        </div>

        <button
          onClick={fetchCoordinatorData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition"
        >
          <RotateCw className="w-4 h-4 text-teal-600" />
          Live Refresh
        </button>
      </div>

      {/* DASHBOARD STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending Requests</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats.pendingRequests}</div>
          <span className="text-[10px] text-slate-400">Awaiting match</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Tasks</div>
          <div className="text-2xl font-black text-teal-700 mt-1">{stats.activeAssignments}</div>
          <span className="text-[10px] text-slate-400">Assigned / In Progress</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/40 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pending KYC</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats.pendingKyc}</div>
          <span className="text-[10px] text-amber-700 font-semibold">Requires verification</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Approved Volunteers</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{stats.approvedVolunteers}</div>
          <span className="text-[10px] text-slate-400">Ready to dispatch</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Tasks</div>
          <div className="text-2xl font-black text-indigo-700 mt-1">{stats.completedTasks}</div>
          <span className="text-[10px] text-slate-400">Code verified</span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-semibold scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
          { id: 'kyc', label: `KYC Verification (${stats.pendingKyc})`, icon: ShieldCheck },
          { id: 'requests', label: 'All Requests', icon: FileQuestion },
          { id: 'volunteers', label: 'Volunteers Directory', icon: Users },
          { id: 'assignments', label: 'Active Assignments', icon: Activity },
          { id: 'completed', label: 'Completed Missions', icon: CheckCircle },
          { id: 'reports', label: 'Audit & Reports', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition ${
                isActive ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KYC Action Required Alert */}
          {pendingKycVolunteers.length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm text-amber-900">
                    {pendingKycVolunteers.length} Volunteer(s) Awaiting KYC Document Review
                  </h3>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Unverified volunteers cannot accept assistance requests until their government identity document is reviewed and approved.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('kyc')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition whitespace-nowrap"
              >
                Review Documents Now →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Requests */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-teal-600" />
                  Recent Assistance Requests
                </h3>
                <button
                  onClick={() => setActiveTab('requests')}
                  className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
                >
                  View All ({requests.length}) →
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {requests.slice(0, 5).map((r) => (
                  <div key={r._id} className="py-3 text-xs flex items-center justify-between gap-3">
                    <div className="flex-1 truncate">
                      <div className="font-semibold text-slate-900 truncate">{r.category}</div>
                      <div className="text-[11px] text-slate-500 truncate">{r.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {r.preferredDate} • Radius: {r.currentSearchRadius || 2} km
                      </div>
                    </div>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Volunteers Waiting for KYC */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Volunteers Waiting for KYC Approval
                </h3>
                <button
                  onClick={() => setActiveTab('kyc')}
                  className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
                >
                  Verification Queue →
                </button>
              </div>

              {pendingKycVolunteers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  All volunteer identity documents are up-to-date and verified.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingKycVolunteers.slice(0, 5).map((v) => {
                    const u = typeof v.userId === 'object' ? v.userId : null;
                    return (
                      <div key={v._id} className="py-3 text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{(u as any)?.name}</div>
                          <div className="text-[11px] text-slate-500">{(u as any)?.phone}</div>
                          <div className="text-[10px] text-amber-700 font-medium">
                            Doc: {v.kycDocumentType || 'ID Document'}
                          </div>
                        </div>

                        <button
                          onClick={() => setReviewVolunteer(v)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition shadow-sm"
                        >
                          Review KYC
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KYC VERIFICATION QUEUE */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Volunteer KYC Verification Queue</h2>
              <p className="text-xs text-slate-500">
                Securely inspect submitted identity documents and approve or reject volunteer accounts.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-4">Volunteer</th>
                    <th className="p-4">Document Type</th>
                    <th className="p-4">Submitted At</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {volunteers.map((v) => {
                    const u = typeof v.userId === 'object' ? v.userId : null;
                    return (
                      <tr key={v._id} className="hover:bg-slate-50/60">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{(u as any)?.name}</div>
                          <div className="text-[11px] text-slate-500">{(u as any)?.email}</div>
                          <div className="text-[11px] text-slate-400">{(u as any)?.phone}</div>
                        </td>
                        <td className="p-4 text-slate-700 font-medium">
                          {v.kycDocumentType || 'Government ID'}
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          {v.kycSubmittedAt ? new Date(v.kycSubmittedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <KycBadge status={v.kycStatus} size="sm" />
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setReviewVolunteer(v)}
                            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review Document
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REQUESTS TABLE */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">All Assistance Requests</h2>
              <p className="text-xs text-slate-500">Manage, track matching radius, and inspect requests.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['ALL', 'PENDING', 'MATCHING', 'ACTIVE', 'COMPLETED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setRequestFilter(status)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    requestFilter === status ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-4">Request ID</th>
                    <th className="p-4">Requester</th>
                    <th className="p-4">Task Details</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Assigned Volunteer</th>
                    <th className="p-4">Status & Radius</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((r) => {
                    const reqUser = typeof r.requesterId === 'object' ? r.requesterId : null;
                    const volUser = typeof r.assignedVolunteerId === 'object' ? r.assignedVolunteerId : null;

                    return (
                      <tr key={r._id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-medium text-slate-400 text-[11px]">
                          {r._id.slice(-6).toUpperCase()}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{(reqUser as any)?.name}</div>
                          <div className="text-[11px] text-slate-500">{(reqUser as any)?.phone}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-teal-800">{r.category}</div>
                          <div className="text-slate-600 truncate max-w-xs">{r.description}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {r.preferredDate} ({r.preferredTime})
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 truncate max-w-xs">{r.address}</td>
                        <td className="p-4">
                          {volUser ? (
                            <span className="font-semibold text-slate-800">{(volUser as any).name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Matching...</span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <StatusBadge status={r.status} size="sm" />
                            <div className="text-[10px] text-slate-400">Radius: {r.currentSearchRadius || 2} km</div>
                          </div>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          {(r.status === 'MATCHING' || r.status === 'PENDING') && (
                            <button
                              onClick={() => handleExpandRadius(r._id)}
                              className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] rounded-lg border border-teal-200 transition"
                            >
                              Expand Radius (+)
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VOLUNTEERS DIRECTORY */}
      {activeTab === 'volunteers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Volunteers Directory</h2>
              <p className="text-xs text-slate-500">All registered volunteers, capabilities, and KYC standings.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              {['ALL', 'APPROVED', 'PENDING_KYC', 'REJECTED', 'SUSPENDED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setVolunteerFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    volunteerFilter === st ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-4">Volunteer</th>
                    <th className="p-4">Capabilities</th>
                    <th className="p-4">KYC Status</th>
                    <th className="p-4">Completed Tasks</th>
                    <th className="p-4">Location / Area</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVolunteers.map((v) => {
                    const u = typeof v.userId === 'object' ? v.userId : null;
                    return (
                      <tr key={v._id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{(u as any)?.name}</div>
                          <div className="text-[11px] text-slate-500">{(u as any)?.email}</div>
                          <div className="text-[11px] text-slate-400">{(u as any)?.phone}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {v.capabilities?.map((c) => (
                              <span
                                key={c}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <KycBadge status={v.kycStatus} size="sm" />
                        </td>
                        <td className="p-4 font-bold text-slate-800 text-sm">{v.completedTasks || 0}</td>
                        <td className="p-4 text-slate-600 truncate max-w-xs">{v.address}</td>
                        <td className="p-4 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => setReviewVolunteer(v)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] rounded-lg transition"
                          >
                            Inspect KYC
                          </button>
                          {v.kycStatus !== 'SUSPENDED' && (
                            <button
                              onClick={() => handleSuspendVolunteer(v._id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-[11px] rounded-lg transition"
                            >
                              Suspend
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVE ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Live Active Assignments</h2>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-4">Assignment ID</th>
                    <th className="p-4">Volunteer</th>
                    <th className="p-4">Requester</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Assigned Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((a) => {
                    const vol = typeof a.volunteerId === 'object' ? a.volunteerId : null;
                    const req = typeof a.requesterId === 'object' ? a.requesterId : null;
                    return (
                      <tr key={a._id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono text-slate-400">{a._id.slice(-6).toUpperCase()}</td>
                        <td className="p-4 font-semibold text-slate-900">{(vol as any)?.name}</td>
                        <td className="p-4 font-semibold text-slate-900">{(req as any)?.name}</td>
                        <td className="p-4">
                          <StatusBadge status={a.status} size="sm" />
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          {new Date(a.assignedAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: COMPLETED MISSIONS */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Completed & Verified Assistance History</h2>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-4">Category</th>
                    <th className="p-4">Requester</th>
                    <th className="p-4">Volunteer</th>
                    <th className="p-4">Address</th>
                    <th className="p-4">Confirmation Code</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests
                    .filter((r) => r.status === 'COMPLETED')
                    .map((r) => {
                      const reqUser = typeof r.requesterId === 'object' ? r.requesterId : null;
                      const volUser = typeof r.assignedVolunteerId === 'object' ? r.assignedVolunteerId : null;
                      return (
                        <tr key={r._id} className="hover:bg-slate-50">
                          <td className="p-4 font-semibold text-slate-900">{r.category}</td>
                          <td className="p-4 text-slate-800">{(reqUser as any)?.name}</td>
                          <td className="p-4 text-slate-800">{(volUser as any)?.name}</td>
                          <td className="p-4 text-slate-500 truncate max-w-xs">{r.address}</td>
                          <td className="p-4 font-mono font-bold text-teal-800">{r.confirmationCode}</td>
                          <td className="p-4 text-right">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 text-[11px]">
                              Verified Complete ✓
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT & REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Coordinator KYC Review Audit Log</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {kycReviews.length === 0 ? (
                <div className="p-4 text-slate-400">No review logs recorded yet.</div>
              ) : (
                kycReviews.map((rev) => {
                  const vol = typeof rev.volunteerId === 'object' ? rev.volunteerId : null;
                  const coord = typeof rev.coordinatorId === 'object' ? rev.coordinatorId : null;
                  return (
                    <div key={rev._id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-slate-900">
                          Volunteer: {(vol as any)?.name} ({rev.documentType})
                        </div>
                        <div className="text-slate-600 mt-0.5">{rev.reviewReason || 'Status update'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Reviewed by {(coord as any)?.name || 'Coordinator'} on {new Date(rev.reviewedAt).toLocaleString()}
                        </div>
                      </div>
                      <KycBadge status={rev.status} size="sm" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECURE KYC REVIEW MODAL / VIEWER */}
      {reviewVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Secure Document Review
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Volunteer: {(reviewVolunteer.userId as any)?.name || 'Volunteer'}
                </h3>
                <p className="text-xs text-slate-500">
                  {(reviewVolunteer.userId as any)?.email} • {(reviewVolunteer.userId as any)?.phone}
                </p>
              </div>

              <button
                onClick={() => setReviewVolunteer(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Volunteer Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-700">Document Type:</span>{' '}
                {reviewVolunteer.kycDocumentType || 'Government ID'}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Current Status:</span>{' '}
                <KycBadge status={reviewVolunteer.kycStatus} size="sm" />
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-slate-700">Primary Address:</span>{' '}
                {reviewVolunteer.address}
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-slate-700">Capabilities:</span>{' '}
                {reviewVolunteer.capabilities?.join(', ')}
              </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Submitted Document:</span>
                {reviewVolunteer.kycDocumentUrl && (
                  <a
                    href={reviewVolunteer.kycDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
                  >
                    Open in New Tab <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="w-full h-64 bg-slate-100 rounded-2xl border border-slate-300 flex items-center justify-center overflow-hidden relative">
                {reviewVolunteer.kycDocumentUrl ? (
                  <iframe
                    src={reviewVolunteer.kycDocumentUrl}
                    title="KYC Document Preview"
                    className="w-full h-full border-0 rounded-2xl"
                  />
                ) : (
                  <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                    <ShieldAlert className="w-8 h-8 text-slate-300" />
                    <span>No document uploaded yet.</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                🔒 Protected coordinator-only endpoint. Unauthorized requests are blocked with HTTP 403.
              </p>
            </div>

            {/* Rejection Reason Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection / Feedback Reason (Required if rejecting):
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Identity document photo was blurred or name did not match registered name."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            {/* Approval / Rejection Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleRejectKyc(reviewVolunteer._id)}
                disabled={reviewActionLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Reject Document
              </button>

              <button
                type="button"
                onClick={() => handleApproveKyc(reviewVolunteer._id)}
                disabled={reviewActionLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Approve Volunteer (Verified)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
