
"use client";

import React, { useState, useCallback } from 'react';
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
import { MapPin, AlertCircle, Calendar, Activity, Info } from "lucide-react";

interface OutbreakHeatmapProps {
  data: IdentifyOutbreaksOutput | null;
}

export function OutbreakHeatmap({ data }: OutbreakHeatmapProps) {
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const map = useMap();

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
                    Detección automatizada basada en informes epidemiológicos globales. Se recomienda vigilancia activa en {selectedCluster.locationDescription.split(',')[0]}.
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

function OutbreakMarker({ cluster, onClick }: { cluster: any, onClick: () => void }) {
  const intensityScale = cluster.intensity / 100;
  const size = 20 + (intensityScale * 40);
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
            "absolute inset-0 rounded-full animate-pulse opacity-40 blur-md transition-all duration-300 group-hover:opacity-70",
            isHigh ? "bg-red-600" : isMedium ? "bg-orange-500" : "bg-yellow-400"
          )}
        />
        
        {/* Core Point */}
        <div 
          className={cn(
            "relative w-3 h-3 rounded-full border border-white/80 shadow-2xl transition-all duration-300 group-hover:scale-150",
            isHigh ? "bg-red-600" : isMedium ? "bg-orange-500" : "bg-yellow-400"
          )}
        />
      </div>
    </AdvancedMarker>
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
