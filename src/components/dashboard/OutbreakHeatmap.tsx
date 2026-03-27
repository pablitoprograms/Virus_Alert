"use client";

import React from 'react';
import { IdentifyOutbreaksOutput } from '@/ai/flows/identify-outbreaks-flow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OutbreakHeatmapProps {
  data: IdentifyOutbreaksOutput | null;
}

export function OutbreakHeatmap({ data }: OutbreakHeatmapProps) {
  if (!data || !data.outbreakClusters) return null;

  // Coordinate mapping function (Simple equirectangular projection)
  // Maps -180...180 to 0...1000 and -90...90 to 500...0
  const mapCoords = (lat: number, lng: number) => {
    const x = (lng + 180) * (1000 / 360);
    const y = (90 - lat) * (500 / 180);
    return { x, y };
  };

  return (
    <g>
      {data.outbreakClusters.map((cluster, idx) => {
        const { x, y } = mapCoords(cluster.latitude, cluster.longitude);
        const radius = 5 + (cluster.intensity / 10);
        
        const colorClass = 
          cluster.priority === 'High' ? 'heatmap-high' : 
          cluster.priority === 'Medium' ? 'heatmap-medium' : 
          'heatmap-low';

        return (
          <foreignObject key={idx} x={x - radius * 2} y={y - radius * 2} width={radius * 4} height={radius * 4}>
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative w-full h-full flex items-center justify-center cursor-pointer group">
                    {/* Outer Glow */}
                    <div 
                      className={cn(
                        "absolute w-full h-full rounded-full opacity-20 blur-xl heatmap-pulse",
                        cluster.priority === 'High' ? 'bg-[#E60000]' : cluster.priority === 'Medium' ? 'bg-[#FF6600]' : 'bg-[#FFCC00]'
                      )}
                    />
                    {/* Core Point */}
                    <div 
                      className={cn(
                        "w-2 h-2 rounded-full border border-white/40 shadow-lg relative z-10 transition-transform group-hover:scale-150",
                        cluster.priority === 'High' ? 'bg-[#E60000]' : cluster.priority === 'Medium' ? 'bg-[#FF6600]' : 'bg-[#FFCC00]'
                      )}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="p-3 bg-[#1e2025] border-white/10 shadow-2xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{cluster.diseaseName}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold",
                        cluster.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                      )}>
                        {cluster.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/60">{cluster.locationDescription}</p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[10px] text-[#54BBDA]">{cluster.status}</span>
                      <span className="text-[10px] text-white/40">{new Date(cluster.reportedDate).toLocaleDateString()}</span>
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

import { cn } from "@/lib/utils";
