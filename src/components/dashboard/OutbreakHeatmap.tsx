"use client";

import React from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { cn } from "@/lib/utils";

interface Outbreak {
  diseaseName: string;
  locationDescription: string;
  latitude?: number; // Opcional por si viene como lat
  longitude?: number; // Opcional por si viene como lng
  lat?: number;
  lng?: number;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
}

interface OutbreakHeatmapProps {
  // Aceptamos tanto el objeto con clusters como un array directo para evitar errores
  data: { outbreakClusters: Outbreak[] } | Outbreak[] | null;
  onSelectCluster: (cluster: Outbreak) => void;
}

export function OutbreakHeatmap({ data, onSelectCluster }: OutbreakHeatmapProps) {
  // 1. Normalizamos los datos: extraemos el array sin importar cómo venga
  const clusters = Array.isArray(data) 
    ? data 
    : data?.outbreakClusters 
      ? data.outbreakClusters 
      : [];

  if (clusters.length === 0) return null;

  return (
    <>
      {clusters.map((cluster, idx) => {
        // 2. Extraemos las coordenadas de forma segura (soporta lat/latitude y lng/longitude)
        const lat = cluster.latitude ?? cluster.lat;
        const lng = cluster.longitude ?? cluster.lng;

        // Si no hay coordenadas válidas, saltamos este punto
        if (lat === undefined || lng === undefined) return null;

        return (
          <CircleMarker
            key={`${lat}-${lng}-${idx}`}
            center={[lat, lng]}
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
              <div className="text-center p-1 bg-black/80 backdrop-blur-md rounded-lg">
                <p className="font-black text-[9px] uppercase tracking-widest text-[#22c55e] mb-0.5">
                  {cluster.locationDescription}
                </p>
                <p className="font-bold text-xs text-white">
                  {cluster.diseaseName}
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    cluster.priority === 'High' ? "bg-red-500" : cluster.priority === 'Medium' ? "bg-orange-500" : "bg-yellow-500"
                  )} />
                  <p className="text-[10px] text-white/60 uppercase font-black tracking-tighter">
                    {cluster.status || "ACTIVO"}
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}