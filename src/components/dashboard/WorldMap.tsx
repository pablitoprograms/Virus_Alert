"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { cn } from "@/lib/utils";
import 'leaflet/dist/leaflet.css';

interface WorldMapProps {
  children?: React.ReactNode;
}

export function WorldMap({ children }: WorldMapProps) {
  const [datosSalud, setDatosSalud] = useState<any>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/reportes-reales')
      .then(res => res.json())
      .then(data => {
        setDatosSalud(data);
        console.log("Datos de Flask recibidos:", data);
      })
      .catch(err => console.error("Error conectando con Flask:", err));
  }, []);

  return (
    <div className="relative w-full h-full bg-[#0a0a0c] overflow-hidden select-none">
      <MapContainer 
        center={[40.4168, -3.7038]} 
        zoom={6} 
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

      {/* Leyenda Dinámica Mejorada */}
      <div className="absolute left-8 bottom-8 flex flex-col gap-4 p-6 bg-[#0f1012]/90 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl min-w-[240px] hidden sm:flex z-30 pointer-events-none">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
          {datosSalud ? 'Sistema Sincronizado' : 'Conectando con Flask...'}
        </h3>
        
        <div className="space-y-3">
          {datosSalud ? (
            <>
              {/* Bloque de Estadísticas Reales */}
              <div className="flex flex-col gap-1.5 mb-4 border-b border-white/5 pb-4">
                <div className="text-white text-[11px] flex justify-between">
                  <span className="text-red-500 font-bold">CASOS HOY:</span> 
                  <span>{datosSalud.hoy.toLocaleString()}</span>
                </div>
                <div className="text-white text-[11px] flex justify-between">
                  <span className="text-blue-400 font-bold">TOTAL ACUM.:</span> 
                  <span>{datosSalud.total_casos.toLocaleString()}</span>
                </div>
                <div className="text-white text-[11px] flex justify-between">
                  <span className="text-green-500 font-bold">RECUPERADOS:</span> 
                  <span>{datosSalud.recuperados.toLocaleString()}</span>
                </div>
              </div>

              {/* Estados de Alerta */}
              <div className="space-y-3">
                <LegendItem color="bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]" label="Emergencia Crítica" />
                <LegendItem color="bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" label="Alerta de Nivel 2" />
                <LegendItem color="bg-yellow-400" label="Vigilancia Activa" />
              </div>
            </>
          ) : (
            <div className="animate-pulse flex space-x-2 items-center">
              <div className="rounded-full bg-white/10 h-2 w-2"></div>
              <p className="text-white/50 text-[10px]">Esperando respuesta del backend...</p>
            </div>
          )}
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
      <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
      <span className="text-[10px] font-bold text-white/80 uppercase tracking-tight">{label}</span>
    </div>
  );
}