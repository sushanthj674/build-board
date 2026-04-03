import Dashboard from '@/components/Dashboard';
import FloatingMenu from '@/components/FloatingMenu';
import { RepoProvider } from '@/context/RepoContext';
import { Toaster } from 'sonner';

export default function Home() {
  return (
    <RepoProvider>
      <main className="min-h-screen relative overflow-hidden">
        <Toaster position="top-center" theme="dark" closeButton richColors />
        {/* Background Orbs */}
        <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neutral-900 rounded-full blur-[150px] opacity-20"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neutral-900 rounded-full blur-[150px] opacity-20"></div>
        </div>

        <Dashboard />
        <FloatingMenu />
      </main>
    </RepoProvider>
  );
}
