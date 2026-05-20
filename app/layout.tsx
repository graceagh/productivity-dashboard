import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Productivity Dashboard',
  description: 'Personal productivity dashboard — tasks, habits, notes, goals',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
