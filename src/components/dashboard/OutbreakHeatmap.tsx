"use client";

import React, { useState } from 'react';
import { IdentifyOutbreaksOutput } from '@/ai/flows/identify-outbreaks-flow';
import { CircleMarker, Popup } from 'react-leaflet';
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
        <CircleMarker
          key={idx}
          center={[cluster.latitude, cluster.longitude]}
          radius={12 + (cluster.intensity / 8)}
          eventHandlers={{
            click: () => setSelectedCluster(cluster),
          }}
          pathOptions={{
            fillColor: cluster.priority === 'High' ? '#ef4444' : cluster.priority === 'Medium' ? '#f97316' : '#facc15',
            fillOpacity: 0.9,
            color: 'white',
            weight: 3,
            className: cn(
              "heatmap-pulse cursor-pointer",
              cluster.priority === 'High' ? "marker-glow-high" : cluster.priority === 'Medium' ? "marker-glow-medium" : "marker-glow-low"
            )
          }}
        >
          <Popup className="bg-[#0c0d0f] border-none">
            <div className="p-2 text-[#0a0a0c]">
              <p className="font-black text-[10px] uppercase tracking-widest mb-1">{cluster.locationDescription}</p>
              <p className="font-bold text-sm text-red-600">{cluster.diseaseName}</p>
            </div>
          </Popup>
        </CircleMarker>
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
                    <Info size={14} /> Análisis Biosurv España
                  </h4>
                  <p className="text-sm text-white/60 leading-relaxed font-medium">
                    Los protocolos de vigilancia en <span className="text-white">{selectedCluster.locationDescription}</span> muestran una anomalía de intensidad {selectedCluster.intensity}%. Se recomienda activar protocolos regionales de contención fase 2.
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