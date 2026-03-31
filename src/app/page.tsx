'use client';

import GlobalPulseDashboard from '@/components/dashboard/GlobalPulseDashboard';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { useUser } from '@/firebase';
import { Globe } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="h-screen w-screen bg-[#060608] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-t-2 border-[#54BBDA] rounded-full animate-spin shadow-[0_0_15px_#54BBDA]" />
            <Globe className="absolute inset-0 m-auto text-[#54BBDA]/30 animate-pulse" size={32} />
          </div>
          <span className="text-[10px] font-black text-[#54BBDA] uppercase tracking-[0.5em] animate-pulse">Iniciando Sistemas</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <GlobalPulseDashboard />;
}
