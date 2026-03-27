"use client";

import React, { useState, useRef, useEffect } from 'react';
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

  // Simplified high-res SVG paths for continents
  // Real high-res GeoJSON would be better, but this serves as a robust interactive base
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-[#141518] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="absolute inset-0 transition-transform duration-200 ease-out flex items-center justify-center"
        style={{ 
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center center'
        }}
      >
        <svg 
          viewBox="0 0 1000 500" 
          className="w-full h-auto max-h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Graticule / Grid */}
          <g className="stroke-white/5 stroke-[0.5] fill-none">
            {Array.from({ length: 18 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * (1000 / 18)} y1="0" x2={i * (1000 / 18)} y2="500" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * (500 / 9)} x2="1000" y2={i * (500 / 9)} />
            ))}
          </g>

          {/* Continents - High Contrast Dark Mode Shapes */}
          <path 
            className="fill-[#1e2025] hover:fill-[#252830] transition-colors stroke-[#2a2d35] stroke-[0.5]"
            d="M200,100 L250,110 L280,150 L300,250 L250,350 L200,400 L150,350 L120,250 L150,150 Z 
               M400,80 L500,70 L600,80 L700,100 L800,150 L850,250 L800,350 L700,450 L600,420 L500,430 L400,400 L350,300 L370,200 Z
               M450,250 L500,240 L550,250 L570,300 L550,350 L500,380 L450,350 Z
               M750,300 L820,310 L850,350 L820,400 L750,390 L730,350 Z" 
            // Note: These are rough placeholders. In a production app, we would use D3-geo or similar to render paths from GeoJSON.
          />
          
          {/* Detailed SVG Map Paths for visual quality (Illustrative) */}
          <g className="fill-[#1e2025] stroke-[#2a2d35] stroke-[0.5]">
            {/* North America */}
            <path d="M124 104l24 16 12 36-4 44-32 20-36-4-32-40 4-36 32-16 32-20z" />
            {/* South America */}
            <path d="M228 268l44 32 8 48-16 48-44 32-48-16-16-60 16-64 56-20z" />
            {/* Africa */}
            <path d="M468 184l64-8 48 24 12 60-8 64-44 68-52-12-52-44 4-64 28-88z" />
            {/* Eurasia */}
            <path d="M408 104l92-36 120-16 116 28 84 88 12 72-52 68-100-24-96-8-96-36-80-136z" />
            {/* Australia */}
            <path d="M784 316l56 12 40 44-24 52-64 12-40-36 32-84z" />
            {/* Greenland */}
            <path d="M268 32l36 8 20 40-12 36-40 12-32-36 28-60z" />
          </g>

          {/* Children are heatmap clusters rendered at relative coords */}
          {children}
        </svg>
      </div>

      {/* Subtle Map Controls */}
      <div className="absolute right-6 top-6 flex flex-col gap-2">
        <MapControl icon={<Plus size={18} />} onClick={() => handleZoom(0.5)} tooltip="Zoom In" />
        <MapControl icon={<Minus size={18} />} onClick={() => handleZoom(-0.5)} tooltip="Zoom Out" />
        <MapControl icon={<Maximize2 size={18} />} onClick={resetMap} tooltip="Reset View" />
        <div className="h-px bg-white/10 my-2" />
        <MapControl icon={<MousePointer2 size={18} />} onClick={() => {}} tooltip="Select Layer" active />
      </div>

      {/* Legend */}
      <div className="absolute left-6 bottom-32 flex flex-col gap-3 p-4 bg-[#141518]/80 backdrop-blur-md rounded-xl border border-white/5 shadow-2xl">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Intensity</h3>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#FFCC00] shadow-[0_0_8px_#FFCC00]" />
          <span className="text-xs text-white/80 font-medium">Monitoring</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#FF6600] shadow-[0_0_12px_#FF6600]" />
          <span className="text-xs text-white/80 font-medium">Active Outbreak</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#E60000] shadow-[0_0_15px_#E60000]" />
          <span className="text-xs text-white/80 font-medium">High Alert</span>
        </div>
      </div>
    </div>
  );
}

function MapControl({ icon, onClick, tooltip, active = false }: { icon: React.ReactNode, onClick: () => void, tooltip: string, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      title={tooltip}
      className={cn(
        "w-10 h-10 flex items-center justify-center rounded-lg transition-all border border-white/5",
        active 
          ? "bg-[#54BBDA] text-[#141518] shadow-[0_0_15px_rgba(84,187,218,0.3)]" 
          : "bg-[#1e2025]/80 text-white/60 hover:bg-[#252830] hover:text-white"
      )}
    >
      {icon}
    </button>
  );
}
