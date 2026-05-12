import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function PageLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
