
"use client";

import React from 'react';
import { Map } from '@vis.gl/react-google-maps';
import { cn } from "@/lib/utils";

interface WorldMapProps {
  children?: React.ReactNode;
}

const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#141518" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#141518" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#2b2d33" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3e44" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0a0a0c" }]
  }
];

export function WorldMap({ children }: WorldMapProps) {
  return (
    <div className="relative w-full h-full bg-[#0a0a0c] overflow-hidden select-none">
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={{ lat: 20, lng: 0 }}
        defaultZoom={3}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        options={{
          styles: DARK_MAP_STYLE,
          backgroundColor: '#0a0a0c'
        }}
      >
        {children}
      </Map>

      {/* Leyenda de Severidad */}
      <div className="absolute left-8 bottom-8 flex flex-col gap-4 p-6 bg-[#0f1012]/90 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl min-w-[220px] hidden sm:flex z-30 pointer-events-none">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Estado de Brotes</h3>
        <div className="space-y-3">
          <LegendItem color="bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]" label="Emergencia Crítica" />
          <LegendItem color="bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" label="Alerta de Nivel 2" />
          <LegendItem color="bg-yellow-400" label="Vigilancia Activa" />
        </div>
      </div>
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
