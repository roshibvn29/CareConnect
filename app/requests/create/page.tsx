'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LocationSelectorMap from '@/components/map/LocationSelectorMap';
import {
  ShoppingBag,
  Pill,
  Heart,
  Car,
  Home,
  Users,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import { RequestCategory } from '@/types';

export default function CreateRequestPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<RequestCategory>('Medicine Pickup');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [preferredTime, setPreferredTime] = useState('Morning (9:00 AM - 12:00 PM)');
  const [customTime, setCustomTime] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string }>({
    latitude: 12.9299,
    longitude: 77.585,
    address: '4th Block, Jayanagar, Bangalore',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categoryList: { title: RequestCategory; desc: string; icon: any }[] = [
    { title: 'Medicine Pickup', desc: 'Prescription medicines and pharmacy supplies', icon: Pill },
    { title: 'Grocery Pickup', desc: 'Daily essentials, fruits, vegetables, and milk', icon: ShoppingBag },
    { title: 'Hospital/Medical Assistance', desc: 'OPD appointments, accompaniment, doctor visits', icon: Heart },
    { title: 'Transport Assistance', desc: 'Auto/cab assistance, visiting bank or post office', icon: Car },
    { title: 'Home Visit', desc: 'General checking-in, light household assistance', icon: Home },
    { title: 'Companionship', desc: 'Friendly conversation, reading, playing board games', icon: Users },
    { title: 'Other', desc: 'Any other non-emergency everyday community support', icon: HelpCircle },
  ];

  const timeSlots = [
    'Morning (9:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 4:00 PM)',
    'Evening (4:00 PM - 7:00 PM)',
    'Night (7:00 PM - 9:00 PM)',
    'Custom Time',
  ];

  const handleNext = () => {
    setError('');
    if (step === 2 && !description.trim()) {
      setError('Please provide a brief description of the task.');
      return;
    }
    if (step === 3 && preferredTime === 'Custom Time' && !customTime.trim()) {
      setError('Please enter your custom preferred time.');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const finalTime = preferredTime === 'Custom Time' ? customTime : preferredTime;
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description,
          preferredDate,
          preferredTime: finalTime,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        router.push(`/requester?created=${data.request._id}`);
      } else {
        setError(data.error || 'Failed to create assistance request.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Network error.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Stepper Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Request Community Assistance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete the 4 simple steps to match with a verified nearby volunteer.
        </p>

        {/* Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, label: 'Task Category' },
            { num: 2, label: 'Description' },
            { num: 3, label: 'Date & Time' },
            { num: 4, label: 'Location' },
          ].map((s) => (
            <div key={s.num} className="text-center">
              <div
                className={`h-2 rounded-full transition-all ${
                  step >= s.num ? 'bg-teal-600' : 'bg-slate-200'
                }`}
              />
              <span
                className={`text-[11px] font-semibold mt-1.5 block ${
                  step >= s.num ? 'text-teal-800' : 'text-slate-400'
                }`}
              >
                {s.num}. {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl border border-rose-200">
          {error}
        </div>
      )}

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Step 1: What type of assistance do you need?</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose the primary category for this request.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categoryList.map((c) => {
              const Icon = c.icon;
              const isSelected = category === c.title;
              return (
                <button
                  key={c.title}
                  type="button"
                  onClick={() => setCategory(c.title)}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">{c.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2"
            >
              Continue to Step 2
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: TASK DESCRIPTION */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Step 2: Describe the assistance in detail</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Include specific items, pharmacy name, hospital department, or specific needs.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Task Details
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Need monthly heart medications picked up from Apollo Pharmacy near 5th cross. Prescription will be handed over, payment ready in cash/UPI."
              className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-start gap-3">
            <FileText className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-800 leading-relaxed">
              <span className="font-bold">Tip:</span> Volunteers appreciate clear notes on walking assistance, heavy grocery bag weight limits, or pharmacy bill pickup details.
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2"
            >
              Continue to Step 3
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Step 3: When do you need this help?</h2>
            <p className="text-xs text-slate-500 mt-0.5">Select your preferred date and convenient time slot.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Preferred Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Time Slot
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none appearance-none"
                >
                  {timeSlots.map((ts) => (
                    <option key={ts} value={ts}>
                      {ts}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {preferredTime === 'Custom Time' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Specify Exact Time
              </label>
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="e.g. Exactly 3:30 PM after lunch"
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2"
            >
              Continue to Step 4 (Location)
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: LOCATION MAP & CONFIRMATION */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 4: Select Assistance Location</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Our matching system uses this location to find nearby verified volunteers starting at 2 km radius.
              </p>
            </div>

            <LocationSelectorMap
              initialLat={location.latitude}
              initialLng={location.longitude}
              initialAddress={location.address}
              onLocationSelect={(selected) => setLocation(selected)}
            />

            {/* Summary Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 text-sm">Request Summary:</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Task:</span> {category}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Date/Time:</span> {preferredDate} ({preferredTime})
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-slate-800">Address:</span> {location.address}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-7 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/25 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {loading ? 'Initiating Matching...' : 'Submit & Start Volunteer Matching'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
