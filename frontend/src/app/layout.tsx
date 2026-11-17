import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'DATAGUARD AI — Autonomous Data Protection & Secure Intelligence Platform',
  description: 'Enterprise data protection platform for document intelligence, sensitive data detection, risk scoring, protection actions, and immutable audit logs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-zinc-950 text-zinc-100 antialiased overflow-x-hidden">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
