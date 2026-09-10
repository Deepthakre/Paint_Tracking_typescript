import type { ReactNode } from 'react';
import TopBar from './TopBar';

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <TopBar />
      <main className="max-w-[1180px] mx-auto px-6 py-7">{children}</main>
    </div>
  );
}
