'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import KycBadge from '@/components/common/KycBadge';
import StatusBadge from '@/components/common/StatusBadge';
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  Radio,
  MapPin,
  Calendar,
  AlertTriangle,
  Upload,
  User,
  Phone,
  RotateCw,
  Check,
  X,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { IAssistanceRequest, IVolunteerProfile, RequestCategory } from '@/types';

export default function VolunteerDashboard() {
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState<IVolunteerProfile | null>(null);
  const [allRequests, setAllRequests] = useState<IAssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // KYC Upload Modal State
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [docType, setDocType] = useState('Aadhaar Card');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // Capabilities Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCapabilities, setSelectedCapabilities] = useState<RequestCategory[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const allCategories: RequestCategory[] = [
    'Grocery Pickup',
    'Medicine Pickup',
    'Hospital/Medical Assistance',
    'Transport Assistance',
    'Home Visit',
    'Companionship',
    'Other',
  ];

  const fetchData = async () => {
    try {
      // 1. Fetch current profile
      const profRes = await fetch('/api/auth/me');
      const profData = await profRes.json();
      if (profData.success && profData.user?.volunteerProfile) {
        setProfile(profData.user.volunteerProfile);
        setSelectedCapabilities(profData.user.volunteerProfile.capabilities || []);
      }

      // 2. Fetch requests
      const reqRes = await fetch('/api/requests');
      const reqData = await reqRes.json();
      if (reqData.success) {
        setAllRequests(reqData.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const kycStatus = profile?.kycStatus || user?.kycStatus || 'PENDING_KYC';
  const isApproved = kycStatus === 'APPROVED';

  // Filter requests
  // Available: status = MATCHING or PENDING, user has not declined, and either assigned to none or notified
  const availableRequests = isApproved
    ? allRequests.filter(
        (r) =>
          (r.status === 'MATCHING' || r.status === 'PENDING') &&
          !r.assignedVolunteerId &&
          !(r.declinedVolunteers || []).map(String).includes(user?.id || '')
      )
    : [];

  // Active tasks for this volunteer
  const activeTasks = allRequests.filter(
    (r) =>
      (r.status === 'ACTIVE' || r.status === 'ASSIGNED' || r.status === 'COMPLETION_PENDING') &&
      ((typeof r.assignedVolunteerId === 'object' ? r.assignedVolunteerId?._id : r.assignedVolunteerId) === user?.id)
  );

  // Completed tasks by this volunteer
  const completedTasks = allRequests.filter(
    (r) =>
      r.status === 'COMPLETED' &&
      ((typeof r.assignedVolunteerId === 'object' ? r.assignedVolunteerId?._id : r.assignedVolunteerId) === user?.id)
  );

  // ACCEPT REQUEST HANDLER
  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch('/api/matching/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('You have accepted this assistance request!');
        fetchData();
      } else {
        alert(data.error || 'Failed to accept request.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // DECLINE REQUEST HANDLER
  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch('/api/matching/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to decline request.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // MARK TASK COMPLETED
  const handleMarkComplete = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/tasks/${requestId}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert('Task marked as completed! Requester has been notified to provide their confirmation code.');
        fetchData();
      } else {
        alert(data.error || 'Could not complete task.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // KYC UPLOAD HANDLER
  const handleKycUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an identity document file.');
      return;
    }

    setUploadLoading(true);
    setUploadMsg('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('documentType', docType);

      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setUploadLoading(false);

      if (data.success) {
        setUploadMsg('KYC document submitted successfully! A coordinator will review it shortly.');
        setTimeout(() => {
          setIsKycModalOpen(false);
          refreshUser();
          fetchData();
        }, 1500);
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch (err: any) {
      setUploadLoading(false);
      alert('Upload error: ' + err.message);
    }
  };

  // CAPABILITIES UPDATE HANDLER
  const handleUpdateCapabilities = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/volunteers/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capabilities: selectedCapabilities }),
      });
      const data = await res.json();
      setSettingsLoading(false);
      if (data.success) {
        alert('Capabilities updated successfully!');
        setIsSettingsOpen(false);
        fetchData();
      }
    } catch (err: any) {
      setSettingsLoading(false);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Profile Overview */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs uppercase font-bold tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Volunteer Portal
            </span>
            <KycBadge status={kycStatus} size="sm" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.name || 'Volunteer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Primary Area: {profile?.address || user?.address || 'Bangalore, Karnataka'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-2"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            Capabilities & Schedule
          </button>

          {!isApproved && (
            <button
              onClick={() => setIsKycModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload / Update KYC Document
            </button>
          )}
        </div>
      </div>

      {/* KYC NOTICE BANNER IF NOT APPROVED */}
      {!isApproved && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-amber-900">
              {kycStatus === 'PENDING_KYC'
                ? 'KYC Verification In Progress'
                : kycStatus === 'REJECTED'
                ? 'KYC Document Rejected'
                : 'Account Verification Required'}
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {kycStatus === 'PENDING_KYC'
                ? 'Your uploaded identity document is currently being reviewed by our community coordinator. You will be able to receive and accept assistance requests once approved.'
                : kycStatus === 'REJECTED'
                ? `Reason: ${profile?.kycRejectionReason || 'Document could not be verified'}. Please upload a clear valid government ID.`
                : 'Only KYC-approved volunteers are eligible for assistance matching to safeguard vulnerable community members.'}
            </p>
            <button
              onClick={() => setIsKycModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 underline"
            >
              Upload Identity Document Now →
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available Requests</div>
            <div className="text-3xl font-black text-teal-700 mt-1">{availableRequests.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Radio className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Tasks</div>
            <div className="text-3xl font-black text-indigo-600 mt-1">{activeTasks.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed Tasks</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">
              {profile?.completedTasks || completedTasks.length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SECTION 1: AVAILABLE REQUESTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            Available Assistance Requests Nearby
          </h2>
          <button
            onClick={fetchData}
            className="text-xs text-teal-700 hover:text-teal-900 font-medium flex items-center gap-1"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {!isApproved ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            Available requests are hidden until your KYC document is approved by a coordinator.
          </div>
        ) : availableRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            No matching assistance requests nearby right now. You will receive an in-app notification when a requester needs support in your area!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white p-6 rounded-3xl border-2 border-teal-500/40 shadow-md space-y-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-teal-600 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                  New Assistance Request
                </div>

                <div>
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                    {req.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{req.description}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold text-slate-800">~1.8 km distance</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{req.preferredDate}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Preferred: {req.preferredTime}</span>
                  </div>
                  <div className="col-span-2 text-slate-500 text-[11px] truncate">
                    Approx: {req.address}
                  </div>
                </div>

                {/* ACCEPT / DECLINE BUTTONS */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleAccept(req._id)}
                    disabled={actionLoading === req._id}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5 uppercase tracking-wider"
                  >
                    <Check className="w-4 h-4" />
                    Accept Request
                  </button>

                  <button
                    onClick={() => handleDecline(req._id)}
                    disabled={actionLoading === req._id}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 uppercase"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: ACTIVE TASKS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          Active Tasks Under Your Care
        </h2>

        {activeTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
            You currently have no active ongoing tasks.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTasks.map((t) => {
              const requester = typeof t.requesterId === 'object' ? t.requesterId : null;
              const isCompletionPending = t.status === 'COMPLETION_PENDING';

              return (
                <div
                  key={t._id}
                  className={`bg-white p-6 rounded-3xl border shadow-sm space-y-4 ${
                    isCompletionPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                        {t.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{t.description}</h3>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-teal-600" />
                        Requester: {(requester as any)?.name || 'Community Member'}
                      </span>
                      <span className="text-slate-500">{(requester as any)?.phone}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{t.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        {t.preferredDate} • {t.preferredTime}
                      </span>
                    </div>
                  </div>

                  {isCompletionPending ? (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium border border-amber-200 text-center">
                      Waiting for requester to enter confirmation code ({t.confirmationCode}).
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMarkComplete(t._id)}
                      disabled={actionLoading === t._id}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Task Completed
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: COMPLETED TASK HISTORY */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          Completed Task History
        </h2>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-4">Task Category</th>
                  <th className="p-4">Date Completed</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Verification Code</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No completed tasks yet. Completed volunteer missions will appear here.
                    </td>
                  </tr>
                ) : (
                  completedTasks.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-900">{t.category}</td>
                      <td className="p-4 text-slate-600">{t.preferredDate}</td>
                      <td className="p-4 text-slate-600 truncate max-w-xs">{t.address}</td>
                      <td className="p-4 font-mono font-bold text-teal-800">{t.confirmationCode}</td>
                      <td className="p-4 text-right">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 text-[11px]">
                          Completed ✓
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* KYC UPLOAD MODAL */}
      {isKycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Volunteer KYC Verification</h3>
              <p className="text-xs text-slate-500">
                Upload a government-issued identity document for coordinator approval.
              </p>
            </div>

            {uploadMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200">
                {uploadMsg}
              </div>
            )}

            <form onSubmit={handleKycUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Select Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Other Government ID">Other Government ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Identity Document File (PDF, PNG, JPG, Max 5MB)
                </label>
                <input
                  type="file"
                  required
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                🔒 Documents are stored in an encrypted private vault and accessible exclusively to authenticated coordinators.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsKycModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  {uploadLoading ? 'Uploading...' : 'Submit Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAPABILITIES & SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Task Capabilities & Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the assistance categories you are willing and able to support.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {allCategories.map((cat) => {
                const isSelected = selectedCapabilities.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCapabilities(selectedCapabilities.filter((c) => c !== cat));
                      } else {
                        setSelectedCapabilities([...selectedCapabilities, cat]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 font-semibold shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateCapabilities}
                disabled={settingsLoading}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                {settingsLoading ? 'Saving...' : 'Save Capabilities'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
