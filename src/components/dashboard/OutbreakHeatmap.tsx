
"use client";

import React from 'react';
import { IdentifyOutbreaksOutput } from '@/ai/flows/identify-outbreaks-flow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface OutbreakHeatmapProps {
  data: IdentifyOutbreaksOutput | null;
}

export function OutbreakHeatmap({ data }: OutbreakHeatmapProps) {
  if (!data || !data.outbreakClusters) return null;

  const mapCoords = (lat: number, lng: number) => {
    const x = (lng + 180) * (1000 / 360);
    const y = (90 - lat) * (500 / 180);
    return { x, y };
  };

  return (
    <g>
      {data.outbreakClusters.map((cluster, idx) => {
        const { x, y } = mapCoords(cluster.latitude, cluster.longitude);
        const intensityScale = cluster.intensity / 100;
        const radius = 6 + (intensityScale * 12);
        
        const isHigh = cluster.priority === 'High';
        const isMedium = cluster.priority === 'Medium';

        return (
          <foreignObject key={idx} x={x - radius * 2} y={y - radius * 2} width={radius * 4} height={radius * 4}>
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative w-full h-full flex items-center justify-center cursor-pointer group">
                    {/* Pulsating Glow - Bright Red for High Priority */}
                    <div 
                      className={cn(
                        "absolute rounded-full opacity-40 blur-xl animate-pulse",
                        isHigh ? "bg-red-600 shadow-[0_0_30px_#ef4444]" : isMedium ? "bg-orange-500" : "bg-yellow-400"
                      )}
                      style={{ 
                        width: `${radius * 3}px`, 
                        height: `${radius * 3}px`,
                        animationDuration: isHigh ? '1.5s' : '3s'
                      }}
                    />
                    
                    {/* Core Point - Bright Red and White Border */}
                    <div 
                      className={cn(
                        "rounded-full border-2 border-white/80 shadow-2xl relative z-10 transition-all duration-300 group-hover:scale-150 group-hover:border-white",
                        isHigh ? "bg-red-600" : isMedium ? "bg-orange-500" : "bg-yellow-400"
                      )}
                      style={{ 
                        width: `${radius}px`, 
                        height: `${radius}px`
                      }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="p-4 bg-[#0f1012] border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl">
                  <div className="space-y-2 min-w-[140px]">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-white">{cluster.diseaseName}</span>
                      <span className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest",
                        isHigh ? "bg-red-500 text-white" : "bg-orange-500/20 text-orange-400"
                      )}>
                        {isHigh ? 'Crítico' : isMedium ? 'Alerta' : 'Bajo'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed">{cluster.locationDescription}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-[10px] font-bold text-[#54BBDA] uppercase tracking-tighter">{cluster.status}</span>
                      <span className="text-[10px] text-white/30 italic">
                        {new Date(cluster.reportedDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </foreignObject>
        );
      })}
    </g>
  );
}
