'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'coordinator') {
        router.push('/coordinator');
      } else if (user.role === 'volunteer') {
        router.push('/volunteer');
      } else {
        router.push('/requester');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">
      Routing to your dashboard...
    </div>
  );
}
