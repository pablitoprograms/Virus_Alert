
"use client";

import React, { useState } from 'react';
import { IdentifyOutbreaksOutput } from '@/ai/flows/identify-outbreaks-flow';
import { cn } from "@/lib/utils";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, Calendar, Activity, Info } from "lucide-react";

interface OutbreakHeatmapProps {
  data: IdentifyOutbreaksOutput | null;
}

export function OutbreakHeatmap({ data }: OutbreakHeatmapProps) {
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);

  if (!data || !data.outbreakClusters) return null;

  // Coordenadas fijas para el viewBox del SVG de 1000x500
  const mapCoords = (lat: number, lng: number) => {
    const x = (lng + 180) * (1000 / 360);
    const y = (90 - lat) * (500 / 180);
    return { x, y };
  };

  return (
    <>
      <g>
        {data.outbreakClusters.map((cluster, idx) => {
          const { x, y } = mapCoords(cluster.latitude, cluster.longitude);
          const intensityScale = cluster.intensity / 100;
          const radius = 6 + (intensityScale * 12);
          
          const isHigh = cluster.priority === 'High';
          const isMedium = cluster.priority === 'Medium';

          return (
            <g 
              key={idx} 
              className="cursor-pointer group"
              onClick={() => setSelectedCluster(cluster)}
            >
              {/* Pulsating Glow - Usando elementos SVG nativos para evitar desplazamientos */}
              <circle
                cx={x}
                cy={y}
                r={radius * 2}
                className={cn(
                  "animate-pulse opacity-20 blur-[8px]",
                  isHigh ? "fill-red-600" : isMedium ? "fill-orange-500" : "fill-yellow-400"
                )}
              />
              
              {/* Core Point */}
              <circle
                cx={x}
                cy={y}
                r={radius / 2}
                className={cn(
                  "stroke-white/80 stroke-2 shadow-2xl transition-all duration-300 group-hover:r-8",
                  isHigh ? "fill-red-600" : isMedium ? "fill-orange-500" : "fill-yellow-400"
                )}
              />

              {/* Invisibile touch target - Larger for mobile */}
              <circle
                cx={x}
                cy={y}
                r={20}
                className="fill-transparent"
              />
            </g>
          );
        })}
      </g>

      <Dialog open={!!selectedCluster} onOpenChange={() => setSelectedCluster(null)}>
        <DialogContent className="bg-[#0f1012] border-white/10 text-white max-w-md rounded-3xl overflow-hidden p-0 shadow-2xl">
          {selectedCluster && (
            <div className="flex flex-col">
              <div className={cn(
                "h-32 p-8 flex flex-col justify-end",
                selectedCluster.priority === 'High' ? "bg-gradient-to-t from-[#0f1012] to-red-600/20" : "bg-gradient-to-t from-[#0f1012] to-orange-500/20"
              )}>
                <Badge className={cn(
                  "w-fit mb-2 uppercase font-black tracking-widest px-3 py-1",
                  selectedCluster.priority === 'High' ? "bg-red-500" : "bg-orange-500"
                )}>
                  {selectedCluster.priority === 'High' ? 'Nivel Crítico' : 'Alerta'}
                </Badge>
                <DialogTitle className="text-3xl font-bold tracking-tight">{selectedCluster.diseaseName}</DialogTitle>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem icon={<MapPin size={16} />} label="Ubicación" value={selectedCluster.locationDescription} />
                  <InfoItem icon={<Activity size={16} />} label="Estado" value={selectedCluster.status} />
                  <InfoItem icon={<Calendar size={16} />} label="Reportado" value={new Date(selectedCluster.reportedDate).toLocaleDateString('es-ES')} />
                  <InfoItem icon={<AlertCircle size={16} />} label="Intensidad" value={`${selectedCluster.intensity}%`} />
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Info size={12} /> Análisis de IA
                  </h4>
                  <p className="text-sm text-white/70 leading-relaxed italic">
                    Detección automatizada basada en informes epidemiológicos. Se recomienda monitoreo constante y despliegue de recursos en {selectedCluster.locationDescription.split(',')[0]}.
                  </p>
                </div>

                <Button 
                  className="w-full bg-[#54BBDA] hover:bg-[#54BBDA]/80 text-[#0a0a0c] font-bold rounded-xl py-6"
                  onClick={() => setSelectedCluster(null)}
                >
                  Cerrar Detalles
                </Button>
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
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-white/40">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
