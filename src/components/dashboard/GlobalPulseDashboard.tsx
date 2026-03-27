"use client";

import React, { useEffect, useState, useTransition } from 'react';
import { WorldMap } from './WorldMap';
import { OutbreakHeatmap } from './OutbreakHeatmap';
import { TimelineSlider } from './TimelineSlider';
import { identifyOutbreaks, IdentifyOutbreaksOutput } from '@/ai/flows/identify-outbreaks-flow';
import { RAW_HEALTH_REPORTS } from '@/lib/mock-health-reports';
import { Activity, ShieldAlert, Zap, Globe, Info } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function GlobalPulseDashboard() {
  const [outbreakData, setOutbreakData] = useState<IdentifyOutbreaksOutput | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Process initial raw data via GenAI
    startTransition(async () => {
      try {
        const results = await identifyOutbreaks({
          rawData: RAW_HEALTH_REPORTS,
          currentTime: new Date().toISOString()
        });
        setOutbreakData(results);
      } catch (err) {
        console.error("Failed to load outbreak clusters:", err);
      }
    });
  }, []);

  return (
    <div className="relative h-screen w-screen flex flex-col bg-[#141518] text-white overflow-hidden">
      {/* Top Header Navigation */}
      <header className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-8 py-6 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-[#7381C0] flex items-center justify-center shadow-[0_0_20px_rgba(115,129,192,0.4)]">
            <Globe className="text-[#141518]" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">GlobalPulse</h1>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#54BBDA] animate-pulse" />
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Biosurveillance Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 pointer-events-auto">
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
            <a href="#" className="text-[#54BBDA] hover:text-[#54BBDA]/80 transition-colors">Overview</a>
            <a href="#" className="hover:text-white transition-colors">Live Feed</a>
            <a href="#" className="hover:text-white transition-colors">Reports</a>
            <a href="#" className="hover:text-white transition-colors">Forecasting</a>
          </nav>
          <div className="h-8 w-px bg-white/10" />
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold transition-all backdrop-blur-md">
            Emergency Console
          </button>
        </div>
      </header>

      {/* Main Map Content */}
      <main className="flex-1 relative">
        <WorldMap>
          <OutbreakHeatmap data={outbreakData} />
        </WorldMap>

        {/* Sidebar Statistics Panel */}
        <div className="absolute right-8 bottom-32 w-80 z-20 space-y-4">
          <StatCard 
            label="Active Clusters" 
            value={outbreakData?.outbreakClusters.length.toString() || "--"} 
            icon={<Activity size={18} />} 
            color="text-[#54BBDA]"
          />
          <StatCard 
            label="High Priority" 
            value={outbreakData?.outbreakClusters.filter(c => c.priority === 'High').length.toString() || "--"} 
            icon={<ShieldAlert size={18} />} 
            color="text-[#E60000]"
          />
          <div className="p-6 bg-[#141518]/60 backdrop-blur-xl border border-white/5 rounded-2xl space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">Regional Insight</h3>
                <Zap size={14} className="text-[#54BBDA]" />
             </div>
             <div className="space-y-3">
                {outbreakData?.outbreakClusters.slice(0, 3).map((cluster, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-white group-hover:text-[#54BBDA] transition-colors">{cluster.diseaseName}</span>
                      <span className="text-[10px] text-white/40">{cluster.locationDescription.split(',')[0]}</span>
                    </div>
                    <div className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded bg-white/5",
                      cluster.priority === 'High' ? 'text-red-500' : 'text-orange-500'
                    )}>
                      {cluster.intensity}%
                    </div>
                  </div>
                ))}
             </div>
             <button className="w-full py-2 bg-[#7381C0]/10 hover:bg-[#7381C0]/20 text-[#7381C0] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
               View Full Report
             </button>
          </div>
        </div>

        {/* Loading State Overlay */}
        {isPending && (
          <div className="absolute inset-0 z-30 bg-[#141518]/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-t-2 border-r-2 border-[#54BBDA] rounded-full animate-spin" />
              <span className="text-xs font-bold text-[#54BBDA] uppercase tracking-widest animate-pulse">Syncing Global Data...</span>
            </div>
          </div>
        )}
      </main>

      {/* Date Slider Controls */}
      <TimelineSlider />
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="p-6 bg-[#141518]/60 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
        <div className={cn("text-2xl font-bold tracking-tight", color)}>{value}</div>
      </div>
      <div className={cn("p-3 rounded-xl bg-white/5", color)}>
        {icon}
      </div>
    </div>
  );
}
