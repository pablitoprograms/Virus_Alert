"use client";

import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { cn } from "@/lib/utils";
import 'leaflet/dist/leaflet.css';

interface WorldMapProps {
  children?: React.ReactNode;
}

export function WorldMap({ children }: WorldMapProps) {
  return (
    <div className="relative w-full h-full bg-[#0a0a0c] overflow-hidden select-none">
      <MapContainer 
        center={[40.4168, -3.7038]} // Centrado en Madrid
        zoom={6} // Zoom enfocado en España
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; Esri'
        />
        {children}
      </MapContainer>

      {/* Leyenda de Severidad */}
      <div className="absolute left-8 bottom-8 flex flex-col gap-4 p-6 bg-[#0f1012]/90 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl min-w-[220px] hidden sm:flex z-30 pointer-events-none">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Estado de Brotes España</h3>
        <div className="space-y-3">
          <LegendItem color="bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]" label="Emergencia Crítica" />
          <LegendItem color="bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" label="Alerta de Nivel 2" />
          <LegendItem color="bg-yellow-400" label="Vigilancia Activa" />
        </div>
      </div>
      
      {/* Capa de atmósfera oscura */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-t from-[#060608]/60 via-transparent to-[#060608]/40" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-3 h-3 rounded-full", color)} />
      <span className="text-[11px] font-bold text-white/80 uppercase tracking-tight">{label}</span>
    </div>
  );
}