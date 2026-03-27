
"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, MapPin } from 'lucide-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Outbreak {
  diseaseName: string;
  locationDescription: string;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  reportedDate: string;
  intensity: number;
}

export function RecentAlerts({ outbreaks }: { outbreaks: Outbreak[] }) {
  return (
    <div className="w-full h-full bg-[#0f1012] border-t border-white/5 p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-orange-500" size={18} />
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">Alertas Recientes</h3>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Prioridad Crítica</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-tighter">En Observación</span>
           </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-md">
        <div className="flex w-max space-x-4 pb-4">
          {outbreaks.map((outbreak, i) => (
            <AlertCard key={i} outbreak={outbreak} />
          ))}
          {outbreaks.length === 0 && (
            <div className="flex items-center justify-center w-[400px] h-32 text-white/20 border border-dashed border-white/10 rounded-2xl">
              Sin alertas críticas pendientes
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" className="bg-white/5" />
      </ScrollArea>
    </div>
  );
}

function AlertCard({ outbreak }: { outbreak: Outbreak }) {
  const isHigh = outbreak.priority === 'High';

  return (
    <div className={cn(
      "w-80 p-5 rounded-2xl border transition-all duration-300 group cursor-pointer",
      isHigh 
        ? "bg-red-500/5 border-red-500/10 hover:border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.05)]" 
        : "bg-white/2 rounded-2xl border-white/5 hover:border-white/20"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white group-hover:text-[#54BBDA] transition-colors truncate max-w-[180px]">
            {outbreak.diseaseName}
          </h4>
          <div className="flex items-center gap-1.5 text-white/40">
            <MapPin size={10} />
            <span className="text-[10px] truncate max-w-[150px]">{outbreak.locationDescription}</span>
          </div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest",
          isHigh ? "bg-red-500 text-white" : "bg-orange-500/20 text-orange-400 border border-orange-500/20"
        )}>
          {isHigh ? 'Crítico' : 'Alerta'}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-white/30">
          <Clock size={10} />
          <span className="text-[10px]">{new Date(outbreak.reportedDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-bold text-white/40">Intensidad</span>
           <span className={cn("text-xs font-bold", isHigh ? "text-red-400" : "text-orange-400")}>
             {outbreak.intensity}%
           </span>
        </div>
      </div>
    </div>
  );
}
