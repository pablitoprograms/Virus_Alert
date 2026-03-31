
"use client";

import React, { useState } from 'react';
import { IdentifyOutbreaksOutput } from '@/ai/flows/identify-outbreaks-flow';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, Calendar, Activity, Info, ShieldAlert } from "lucide-react";

interface OutbreakHeatmapProps {
  data: IdentifyOutbreaksOutput | null;
}

export function OutbreakHeatmap({ data }: OutbreakHeatmapProps) {
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);

  if (!data || !data.outbreakClusters) return null;

  return (
    <>
      {data.outbreakClusters.map((cluster, idx) => (
        <OutbreakMarker 
          key={idx} 
          cluster={cluster} 
          onClick={() => setSelectedCluster(cluster)} 
        />
      ))}

      <Dialog open={!!selectedCluster} onOpenChange={() => setSelectedCluster(null)}>
        <DialogContent className="bg-[#0c0d0f] border-white/10 text-white max-w-lg rounded-[2.5rem] overflow-hidden p-0 shadow-[0_48px_96px_rgba(0,0,0,0.8)] border-white/5">
          {selectedCluster && (
            <div className="flex flex-col">
              <div className={cn(
                "h-48 p-10 flex flex-col justify-end relative overflow-hidden",
                selectedCluster.priority === 'High' ? "bg-red-600/10" : "bg-orange-500/10"
              )}>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                   <ShieldAlert size={120} />
                </div>
                
                <Badge className={cn(
                  "w-fit mb-4 uppercase font-black tracking-[0.2em] px-4 py-1.5 rounded-lg text-[9px]",
                  selectedCluster.priority === 'High' ? "bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                )}>
                  {selectedCluster.priority === 'High' ? 'Nivel Crítico' : 'Alerta de Vigilancia'}
                </Badge>
                <DialogTitle className="text-4xl font-black tracking-tighter leading-none">{selectedCluster.diseaseName}</DialogTitle>
                <p className="text-white/40 text-xs mt-2 uppercase font-bold tracking-widest flex items-center gap-2">
                   <MapPin size={12} className="text-[#54BBDA]" /> {selectedCluster.locationDescription}
                </p>
              </div>
              
              <div className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <InfoItem icon={<Activity size={18} className="text-[#54BBDA]" />} label="Estado Operativo" value={selectedCluster.status} />
                  <InfoItem icon={<Calendar size={18} className="text-[#54BBDA]" />} label="Fecha de Registro" value={new Date(selectedCluster.reportedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} />
                  <InfoItem icon={<AlertCircle size={18} className="text-[#54BBDA]" />} label="Índice de Intensidad" value={`${selectedCluster.intensity}%`} />
                  <InfoItem icon={<ShieldAlert size={18} className="text-[#54BBDA]" />} label="Categoría" value={selectedCluster.category} />
                </div>

                <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 relative group transition-all hover:bg-white/[0.05]">
                  <h4 className="text-[10px] font-black text-[#54BBDA] uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                    <Info size={14} /> Análisis Biosurv IA
                  </h4>
                  <p className="text-sm text-white/60 leading-relaxed font-medium">
                    Protocolos de detección automatizada sugieren una propagación activa en <span className="text-white">{selectedCluster.locationDescription}</span>. Se requiere monitoreo constante de infraestructuras críticas y centros de salud regionales.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5 text-white/60 font-black uppercase tracking-widest h-14 rounded-2xl text-[10px]"
                    onClick={() => setSelectedCluster(null)}
                  >
                    Ignorar
                  </Button>
                  <Button 
                    className="flex-[2] bg-[#54BBDA] hover:bg-[#54BBDA]/90 text-[#0a0a0c] font-black uppercase tracking-widest h-14 rounded-2xl text-[10px] shadow-[0_0_20px_rgba(84,187,218,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => setSelectedCluster(null)}
                  >
                    Desplegar Protocolo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function OutbreakMarker({ cluster, onClick }: { cluster: any, onClick: () => void }) {
  const intensityScale = cluster.intensity / 100;
  const size = 24 + (intensityScale * 48);
  const isHigh = cluster.priority === 'High';
  const isMedium = cluster.priority === 'Medium';

  return (
    <AdvancedMarker
      position={{ lat: cluster.latitude, lng: cluster.longitude }}
      onClick={onClick}
    >
      <div className="relative flex items-center justify-center cursor-pointer group" style={{ width: size, height: size }}>
        {/* Pulsating Glow */}
        <div 
          className={cn(
            "absolute inset-0 rounded-full animate-pulse opacity-40 blur-xl transition-all duration-500 group-hover:opacity-80 group-hover:scale-125",
            isHigh ? "bg-red-600" : isMedium ? "bg-orange-500" : "bg-yellow-400"
          )}
        />
        
        {/* Ring */}
        <div className={cn(
          "absolute inset-0 rounded-full border-2 opacity-20 animate-ping duration-[3s]",
          isHigh ? "border-red-600" : isMedium ? "border-orange-500" : "border-yellow-400"
        )} />

        {/* Core Point */}
        <div 
          className={cn(
            "relative w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-500 group-hover:scale-[1.8] group-hover:border-4",
            isHigh ? "bg-red-600" : isMedium ? "bg-orange-500" : "bg-yellow-400"
          )}
        />
        
        {/* Label on Hover */}
        <div className="absolute top-full mt-3 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl scale-75 group-hover:scale-100">
           <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{cluster.diseaseName}</span>
        </div>
      </div>
    </AdvancedMarker>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-white/30">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-sm font-bold tracking-tight text-white/90">{value}</p>
    </div>
  );
}
