"use client";

import React, { useEffect, useState } from "react";
import { Activity, Trash2, Globe, User, ShieldAlert } from "lucide-react"; 
import { Button } from "@/components/ui/button";

interface Outbreak {
  id: string;
  diseaseName: string;
  locationDescription: string;
  priority: "High" | "Medium" | "Low";
  status: string;
  reportedDate: string;
  intensityLevel: number;
  sourceType?: 'api' | 'user';
}

export function RecentAlerts({
  outbreaks,
  onSelect,
  onDelete,
}: {
  outbreaks: any[];
  onSelect: (o: Outbreak) => void;
  onDelete: (id: string) => void;
}) {
  const [apiAlerts, setApiAlerts] = useState<Outbreak[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/reportes-reales");
        const data = await res.json();
        const mapped: Outbreak[] = (data.detalle_brotes || []).map((b: any, i: number) => ({
          id: `api-${i}`,
          diseaseName: b.enfermedad || "Unknown",
          locationDescription: b.pais || "España (Vigilancia)",
          priority: b.afectados > 1000 ? "High" : b.afectados > 200 ? "Medium" : "Low",
          status: "active",
          reportedDate: b.fecha_reporte || new Date().toLocaleDateString(),
          intensityLevel: Math.min(100, (b.afectados || 0) / 50),
          sourceType: 'api'
        }));
        setApiAlerts(mapped);
      } catch (err) {
        console.error("Error API:", err);
      }
    };
    fetchData();
  }, []);

  // Combinar e ORDENAR ALFABETICAMENTE
  const all = [
    ...apiAlerts, 
    ...(outbreaks || []).map(o => ({ ...o, sourceType: 'user' }))
  ].sort((a, b) => a.diseaseName.localeCompare(b.diseaseName));

  return (
    <div className="p-8 flex flex-col h-full space-y-8 bg-black/40">
      
      <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
        <div className="flex items-center justify-between opacity-50 mb-4 px-4">
          <span className="text-xs font-black uppercase tracking-[0.3em]">Monitorização de Surtos Ativos</span>
          <Activity size={18} className="text-[#22c55e]" />
        </div>

        {all.length === 0 ? (
          <div className="text-white/20 text-sm text-center py-32 border-2 border-dashed border-white/5 rounded-[3rem] italic">
            A aguardar sinais de satélite...
          </div>
        ) : (
          all.map((o) => (
            <div
              key={o.id}
              className={`p-8 rounded-[2.5rem] border-2 transition-all hover:scale-[1.01] flex flex-col gap-6 ${
                o.sourceType === 'api' 
                  ? 'bg-blue-950/20 border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.05)]' 
                  : 'bg-zinc-900/90 border-white/10 shadow-xl'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="space-y-3 cursor-pointer flex-1" onClick={() => onSelect(o)}>
                  <div className="flex items-center gap-4">
                    {/* ETIQUETA DE ORIGEM MAIS VISÍVEL */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 font-black text-[10px] uppercase tracking-wider ${
                      o.sourceType === 'api' 
                        ? 'border-blue-500/40 bg-blue-500/20 text-blue-300' 
                        : 'border-[#22c55e]/40 bg-[#22c55e]/20 text-[#22c55e]'
                    }`}>
                      {o.sourceType === 'api' ? <Globe size={14}/> : <ShieldAlert size={14}/>}
                      {o.sourceType === 'api' ? 'Dados Globais' : 'Terminal Local'}
                    </div>

                    <h4 className="font-black text-xl tracking-tight uppercase text-white/90 group-hover:text-[#22c55e]">
                      {o.diseaseName}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm opacity-50 font-bold uppercase tracking-wide ml-1">
                    <span className="text-[#22c55e]">●</span> {o.locationDescription}
                  </div>
                </div>
                
                <div className="flex items-center gap-5">
                  <span className={`text-xs px-5 py-2.5 rounded-2xl font-black tracking-[0.15em] uppercase border-2 ${
                    o.priority === 'High' 
                      ? 'bg-red-500/20 text-red-500 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                      : o.priority === 'Medium'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                  }`}>
                    {o.priority}
                  </span>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(o.id);
                    }}
                    className="h-12 w-12 rounded-2xl hover:bg-red-500/20 hover:text-red-500 text-white/20 hover:opacity-100 transition-all border border-transparent hover:border-red-500/50"
                  >
                    <Trash2 size={20} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}