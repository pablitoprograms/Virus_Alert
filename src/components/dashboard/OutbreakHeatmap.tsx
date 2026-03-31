
"use client";

import React from 'react';
import { IdentifyOutbreaksOutput } from '@/ai/flows/identify-outbreaks-flow';
import { CircleMarker, Popup } from 'react-leaflet';
import { cn } from "@/lib/utils";

interface OutbreakHeatmapProps {
  data: IdentifyOutbreaksOutput | null;
  onSelectCluster: (cluster: any) => void;
}

export function OutbreakHeatmap({ data, onSelectCluster }: OutbreakHeatmapProps) {
  if (!data || !data.outbreakClusters) return null;

  return (
    <>
      {data.outbreakClusters.map((cluster, idx) => (
        <CircleMarker
          key={`${cluster.latitude}-${cluster.longitude}-${idx}`}
          center={[cluster.latitude, cluster.longitude]}
          radius={12}
          eventHandlers={{
            click: () => onSelectCluster(cluster),
          }}
          pathOptions={{
            fillColor: cluster.priority === 'High' ? '#ef4444' : cluster.priority === 'Medium' ? '#f97316' : '#facc15',
            fillOpacity: 1,
            color: '#ffffff',
            weight: 2,
            className: cn(
              "cursor-pointer no-transition",
              cluster.priority === 'High' ? "marker-glow-high" : cluster.priority === 'Medium' ? "marker-glow-medium" : "marker-glow-low"
            )
          }}
        >
          <Popup closeButton={false} offset={[0, -10]}>
            <div className="text-center p-1">
              <p className="font-black text-[9px] uppercase tracking-widest text-[#22c55e] mb-0.5">{cluster.locationDescription}</p>
              <p className="font-bold text-xs text-white">{cluster.diseaseName}</p>
              <p className="text-[10px] text-white/40 mt-1 uppercase font-bold">{cluster.status}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
