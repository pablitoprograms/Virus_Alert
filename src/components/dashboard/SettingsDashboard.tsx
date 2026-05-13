"use client";

import React from 'react';
import { useConfig } from './ConfigContext';
import { Settings, Globe, Palette, Check } from 'lucide-react';
import { cn } from "@/lib/utils";

export function SettingsDashboard() {
  const { lang, setLang, theme, setTheme, t } = useConfig();

  const languages = [
    { code: 'ES', name: 'Español' },
    { code: 'EN', name: 'English' },
    { code: 'DE', name: 'Deutsch' }
  ];

  const themes = [
    { id: 'light', name: t.light, color: 'bg-white' },
    { id: 'dark', name: t.dark, color: 'bg-slate-900' },
    { id: 'purple', name: t.purple, color: 'bg-purple-900' }
  ];

  return (
    <div className="w-full h-full p-8 flex flex-col gap-8 overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-[#22c55e]/10 text-[#22c55e]">
          <Settings size={24} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-widest text-[var(--text-main)]">{t.title}</h2>
      </div>

      <div className="space-y-10">
        {/* SECCIÓN IDIOMA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--text-main)] opacity-50 mb-4">
            <Globe size={16} />
            <span className="text-xs font-bold uppercase tracking-tighter">{t.lang}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  "p-4 rounded-2xl border transition-all font-bold text-sm",
                  lang === l.code 
                    ? "bg-[#22c55e] text-black border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
                    : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-main)] opacity-70 hover:opacity-100 hover:border-white/20"
                )}
              >
                {l.name}
              </button>
            ))}
          </div>
        </section>

        {/* SECCIÓN TEMA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--text-main)] opacity-50 mb-4">
            <Palette size={16} />
            <span className="text-xs font-bold uppercase tracking-tighter">{t.theme}</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {themes.map((th) => (
              <button
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl border transition-all",
                  theme === th.id 
                    ? "border-[#22c55e] bg-[#22c55e]/5" 
                    : "border-[var(--border)] bg-[var(--bg-card)] hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-6 h-6 rounded-full border border-white/20", th.color)} />
                  <span className={cn("font-bold", theme === th.id ? "text-[var(--text-main)]" : "text-[var(--text-main)] opacity-60")}>
                    {th.name}
                  </span>
                </div>
                {theme === th.id && <Check size={18} className="text-[#22c55e]" />}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}