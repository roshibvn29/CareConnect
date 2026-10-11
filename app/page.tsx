'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  HeartHandshake,
  ShieldCheck,
  MapPin,
  KeyRound,
  Users,
  ArrowRight,
  Clock,
  Sparkles,
  ShoppingBag,
  Pill,
  Car,
  Heart,
  Home,
  CheckCircle,
} from 'lucide-react';

export default function HomePage() {
  const { user, switchDemoAccount } = useAuth();

  const categories = [
    { title: 'Medicine Pickup', icon: Pill, color: 'text-rose-600 bg-rose-50' },
    { title: 'Grocery Pickup', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Hospital Accompaniment', icon: Heart, color: 'text-sky-600 bg-sky-50' },
    { title: 'Transport Assistance', icon: Car, color: 'text-amber-600 bg-amber-50' },
    { title: 'Home Visits & Companionship', icon: Home, color: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-slate-50 to-slate-50 py-16 sm:py-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Volunteer-to-Community Assistance Matching System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
            Safe, Verified Community Help When You Need It Most
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            CareConnect connects elderly citizens, individuals with disabilities, and their caregivers with verified local volunteers for essential everyday tasks.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/requests/create"
              className="px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-base shadow-lg shadow-teal-600/25 transition-all flex items-center gap-2 group"
            >
              Request Assistance Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/register"
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-200 shadow-sm transition-all"
            >
              Join as a Volunteer
            </Link>
          </div>

          {/* Quick Demo Personas Banner */}
          <div className="mt-12 max-w-4xl mx-auto bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-600" />
              Instant Demo Access (Click to Experience Live Role):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => switchDemoAccount('requester', 'kamala@careconnect.org')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition text-xs group"
              >
                <div className="font-semibold text-slate-900 group-hover:text-teal-800 flex items-center justify-between">
                  <span>Kamala Devi</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">Requester</span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">Elderly citizen requesting medicine/grocery</div>
              </button>

              <button
                onClick={() => switchDemoAccount('volunteer', 'rahul@careconnect.org')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition text-xs group"
              >
                <div className="font-semibold text-slate-900 group-hover:text-teal-800 flex items-center justify-between">
                  <span>Rahul Verma</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Volunteer</span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">Verified volunteer (14 completed tasks)</div>
              </button>

              <button
                onClick={() => switchDemoAccount('coordinator', 'admin@careconnect.org')}
                className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-left transition text-xs group"
              >
                <div className="font-semibold text-slate-900 group-hover:text-teal-800 flex items-center justify-between">
                  <span>Sarah Jenkins</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">Coordinator</span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">Admin dashboard, KYC approvals & dispatch</div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Task Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Assistance Categories Supported
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            CareConnect addresses day-to-day vulnerability by dispatching trusted local volunteers for specific tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition text-center flex flex-col items-center justify-center gap-3"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm text-slate-900">{c.title}</h3>
              </div>
            );
          })}
        </div>
      </section>

      {/* Key Architectural Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Strict KYC Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every volunteer must submit an authenticated identity document (Aadhaar, DL, Passport). Only APPROVED volunteers can accept community requests.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dynamic Search Radius</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Matching starts within 2 km of the requester. If unanswered, the search radius systematically expands to 5 km, 10 km, and 15 km until a match is found.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirmation Code Safety</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tasks cannot be marked completed unilaterally. The requester verifies task completion by entering a unique confirmation code (e.g. CARE-4821).
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          <p className="font-medium text-slate-700">CareConnect • Community Assistance Matching Platform</p>
          <p className="mt-1">Built with Next.js, TypeScript, Tailwind CSS, and MongoDB Geospatial Matching.</p>
        </div>
      </footer>
    </div>
  );
}
