import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/common/Navbar';

export const metadata: Metadata = {
  title: 'CareConnect - Volunteer-to-Community Assistance Matching System',
  description:
    'CareConnect connects elderly individuals and persons with disabilities with verified local volunteers for essential everyday assistance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-16">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
