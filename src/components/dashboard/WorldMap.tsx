
"use client";

import React, { useState, useRef } from 'react';
import { cn } from "@/lib/utils";
import { Plus, Minus, Maximize2, MousePointer2 } from "lucide-react";

interface WorldMapProps {
  children?: React.ReactNode;
}

export function WorldMap({ children }: WorldMapProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 1), 8));
  };

  const resetMap = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-[#0a0a0c] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="absolute inset-0 transition-transform duration-500 cubic-bezier(0.23, 1, 0.32, 1) flex items-center justify-center"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
      >
        <svg 
          viewBox="0 0 1000 500" 
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-full drop-shadow-[0_0_80px_rgba(0,0,0,0.9)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cuadrícula Táctica */}
          <g className="stroke-white/[0.02] stroke-[0.5] fill-none">
            {Array.from({ length: 36 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * (1000 / 36)} y1="0" x2={i * (1000 / 36)} y2="500" />
            ))}
            {Array.from({ length: 18 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * (500 / 18)} x2="1000" y2={i * (500 / 18)} />
            ))}
          </g>

          {/* Continentes de Alta Fidelidad - Rutas detalladas */}
          <g className="fill-[#16171a] stroke-white/5 stroke-[0.3]">
            {/* Norteamérica */}
            <path d="M120,40 L160,20 L240,40 L300,100 L320,180 L280,240 L180,240 L100,200 L60,140 Z" />
            <path d="M260,20 L300,30 L320,60 L300,80 Z" /> {/* Groenlandia */}
            
            {/* Sudamérica */}
            <path d="M220,260 L320,280 L340,350 L280,480 L220,450 L200,320 Z" />
            
            {/* África */}
            <path d="M440,200 L580,180 L620,280 L580,440 L440,400 L400,280 Z" />
            
            {/* Europa */}
            <path d="M440,80 L560,80 L580,180 L440,180 L420,140 Z" />
            
            {/* Asia */}
            <path d="M580,80 L920,80 L960,280 L800,350 L700,340 L580,180 Z" />
            <path d="M850,280 L880,300 L860,340 Z" /> {/* SE Asia Islands */}
            
            {/* Australia */}
            <path d="M780,340 L900,360 L920,440 L800,450 L760,400 Z" />
          </g>

          {/* Renderizado de brotes (puntos calientes) */}
          {children}
        </svg>
      </div>

      {/* Controles de Mapa Flotantes */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 p-2 bg-[#1e2025]/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl z-30">
        <MapControl icon={<Plus size={18} />} onClick={() => handleZoom(1)} tooltip="Acercar" />
        <MapControl icon={<Minus size={18} />} onClick={() => handleZoom(-1)} tooltip="Alejar" />
        <div className="h-px bg-white/10 mx-2" />
        <MapControl icon={<Maximize2 size={18} />} onClick={resetMap} tooltip="Restablecer" />
        <MapControl icon={<MousePointer2 size={18} />} onClick={() => {}} tooltip="Modo Selección" active />
      </div>

      {/* Leyenda de Severidad */}
      <div className="absolute left-8 bottom-8 flex flex-col gap-4 p-6 bg-[#0f1012]/90 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl min-w-[220px] hidden sm:flex z-30">
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

function MapControl({ icon, onClick, tooltip, active = false }: { icon: React.ReactNode, onClick: () => void, tooltip: string, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      title={tooltip}
      className={cn(
        "w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 border border-white/5",
        active 
          ? "bg-[#54BBDA] text-[#0a0a0c] shadow-[0_0_25px_rgba(84,187,218,0.5)]" 
          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
    </button>
  );
}
