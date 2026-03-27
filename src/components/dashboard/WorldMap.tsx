
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
    setZoom(prev => Math.min(Math.max(prev + delta, 1), 5));
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
        className="absolute inset-0 transition-transform duration-300 ease-out flex items-center justify-center"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
      >
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-auto max-h-full drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cuadrícula Refinada */}
          <g className="stroke-white/[0.03] stroke-[0.3] fill-none">
            {Array.from({ length: 24 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * (1000 / 24)} y1="0" x2={i * (1000 / 24)} y2="500" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * (500 / 12)} x2="1000" y2={i * (500 / 12)} />
            ))}
          </g>

          {/* Continentes - Estilo Oscuro y Profesional */}
          <g className="fill-[#16171a] stroke-white/10 stroke-[0.4]">
            {/* Norteamérica */}
            <path d="M124 104l24 16 12 36-4 44-32 20-36-4-32-40 4-36 32-16 32-20z" className="hover:fill-[#1e2025] transition-colors" />
            {/* Sudamérica */}
            <path d="M228 268l44 32 8 48-16 48-44 32-48-16-16-60 16-64 56-20z" className="hover:fill-[#1e2025] transition-colors" />
            {/* África */}
            <path d="M468 184l64-8 48 24 12 60-8 64-44 68-52-12-52-44 4-64 28-88z" className="hover:fill-[#1e2025] transition-colors" />
            {/* Eurasia */}
            <path d="M408 104l92-36 120-16 116 28 84 88 12 72-52 68-100-24-96-8-96-36-80-136z" className="hover:fill-[#1e2025] transition-colors" />
            {/* Australia */}
            <path d="M784 316l56 12 40 44-24 52-64 12-40-36 32-84z" className="hover:fill-[#1e2025] transition-colors" />
            {/* Groenlandia */}
            <path d="M268 32l36 8 20 40-12 36-40 12-32-36 28-60z" className="hover:fill-[#1e2025] transition-colors" />
          </g>

          {/* Renderizado de brotes (puntos calientes) */}
          {children}
        </svg>
      </div>

      {/* Controles de Mapa */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 p-2 bg-[#1e2025]/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
        <MapControl icon={<Plus size={18} />} onClick={() => handleZoom(0.5)} tooltip="Aumentar" />
        <MapControl icon={<Minus size={18} />} onClick={() => handleZoom(-0.5)} tooltip="Disminuir" />
        <div className="h-px bg-white/10 mx-2" />
        <MapControl icon={<Maximize2 size={18} />} onClick={resetMap} tooltip="Centrar Vista" />
        <MapControl icon={<MousePointer2 size={18} />} onClick={() => {}} tooltip="Seleccionar" active />
      </div>

      {/* Leyenda Profesional */}
      <div className="absolute left-8 bottom-8 flex flex-col gap-4 p-6 bg-[#0f1012]/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl min-w-[200px]">
        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Severidad del Brote</h3>
        <div className="space-y-3">
          <LegendItem color="bg-red-600 shadow-[0_0_12px_#ef4444]" label="Alerta Crítica" />
          <LegendItem color="bg-orange-500 shadow-[0_0_8px_#f97316]" label="Bajo Observación" />
          <LegendItem color="bg-yellow-400" label="Monitoreo" />
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
        "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border border-white/5",
        active 
          ? "bg-[#54BBDA] text-[#0a0a0c] shadow-[0_0_20px_rgba(84,187,218,0.4)]" 
          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
    </button>
  );
}
