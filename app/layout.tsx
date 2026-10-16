import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import Navbar from '@/components/common/Navbar';
import SettingsModal from '@/components/common/SettingsModal';

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <SettingsProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 pb-16">{children}</main>
            <SettingsModal />
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
