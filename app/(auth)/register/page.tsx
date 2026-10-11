'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeartHandshake, User, Mail, Phone, Lock, MapPin, ArrowRight, Loader2, CheckSquare } from 'lucide-react';
import { UserRole, RequestCategory } from '@/types';

export default function RegisterPage() {
  const [role, setRole] = useState<UserRole>('requester');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [address, setAddress] = useState('Bangalore, Karnataka');
  const [selectedCapabilities, setSelectedCapabilities] = useState<RequestCategory[]>([
    'Grocery Pickup',
    'Medicine Pickup',
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const allCategories: RequestCategory[] = [
    'Grocery Pickup',
    'Medicine Pickup',
    'Hospital/Medical Assistance',
    'Transport Assistance',
    'Home Visit',
    'Companionship',
    'Other',
  ];

  const toggleCapability = (cat: RequestCategory) => {
    if (selectedCapabilities.includes(cat)) {
      setSelectedCapabilities(selectedCapabilities.filter((c) => c !== cat));
    } else {
      setSelectedCapabilities([...selectedCapabilities, cat]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name,
          email,
          phone,
          password,
          address,
          capabilities: role === 'volunteer' ? selectedCapabilities : undefined,
          latitude: 12.9299,
          longitude: 77.585,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        if (role === 'volunteer') {
          router.push('/volunteer');
        } else {
          router.push('/requester');
        }
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Error connecting to server.');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create CareConnect Account</h2>
          <p className="text-xs text-slate-500">Join as an assistance requester or community volunteer</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('requester')}
            className={`py-2.5 text-xs font-bold rounded-xl transition ${
              role === 'requester'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            I Need Assistance (Requester)
          </button>
          <button
            type="button"
            onClick={() => setRole('volunteer')}
            className={`py-2.5 text-xs font-bold rounded-xl transition ${
              role === 'volunteer'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            I Want to Help (Volunteer)
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'volunteer' ? 'e.g. Rahul Verma' : 'e.g. Kamala Devi'}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Address / Area</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Neighborhood, City (e.g. Jayanagar, Bangalore)"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Volunteer specific task capability selection */}
          {role === 'volunteer' && (
            <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 space-y-2">
              <label className="block text-xs font-bold text-teal-900">
                Select Task Types You Can Perform:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {allCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCapability(cat)}
                    className={`p-2 rounded-xl text-left border flex items-center gap-2 transition ${
                      selectedCapabilities.includes(cat)
                        ? 'bg-teal-600 text-white border-teal-600 font-semibold shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-teal-700 mt-2">
                Note: You will be asked to upload an identity document (KYC) before receiving matching requests.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Registration'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-teal-600 hover:text-teal-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
