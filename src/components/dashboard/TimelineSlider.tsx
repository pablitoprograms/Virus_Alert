"use client";

import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Play, Pause, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineSliderProps {
  onDateChange?: (date: Date) => void;
}

export function TimelineSlider({ onDateChange }: TimelineSliderProps) {
  const [value, setValue] = useState([80]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Simple mock timeline: Jan 2024 to Dec 2024
  const startDate = new Date(2024, 0, 1);
  const currentDate = new Date(startDate.getTime() + (value[0] * 3.65 * 24 * 60 * 60 * 1000));
  
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="w-full flex items-center gap-6 px-10 py-6 bg-[#141518]/90 backdrop-blur-xl border-t border-white/5">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#7381C0] text-[#141518] hover:bg-[#54BBDA] transition-all"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
        
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={10} /> Time Observation
          </span>
          <span className="text-sm font-bold text-white min-w-[120px]">{formattedDate}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center gap-4">
        <span className="text-[10px] text-white/30 font-medium">Jan 2024</span>
        <div className="flex-1 px-4">
          <Slider 
            value={value} 
            onValueChange={setValue} 
            max={100} 
            step={1}
            className="[&_[role=slider]]:bg-[#54BBDA] [&_[role=slider]]:border-[#54BBDA] [&_.relative_h-2]:bg-white/5"
          />
        </div>
        <span className="text-[10px] text-white/30 font-medium">Dec 2024</span>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-white/40 hover:text-white transition-colors"><ChevronLeft size={20} /></button>
        <button className="p-2 text-white/40 hover:text-white transition-colors"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}
