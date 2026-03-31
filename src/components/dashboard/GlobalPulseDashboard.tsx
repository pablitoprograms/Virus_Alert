"use client";

import React, { useState, useTransition, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { identifyOutbreaks, IdentifyOutbreaksOutput } from '@/ai/flows/identify-outbreaks-flow';
import { RAW_HEALTH_REPORTS } from '@/lib/mock-health-reports';
import { 
  LayoutDashboard, 
  Globe, 
  FileText, 
  PanelLeftClose, 
  Activity,
  Menu,
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Importación dinámica para evitar errores de SSR con Leaflet
const WorldMap = dynamic(() => import('./WorldMap').then((mod) => mod.WorldMap), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#060608] flex items-center justify-center text-white/20">Cargando mapa táctico...</div>
});

const OutbreakHeatmap = dynamic(() => import('./OutbreakHeatmap').then((mod) => mod.OutbreakHeatmap), {
  ssr: false
});

const RecentAlerts = dynamic(() => import('./RecentAlerts').then((mod) => mod.RecentAlerts), {
  ssr: false
});

type DashboardView = 'dashboard' | 'map' | 'reports';

export default function GlobalPulseDashboard() {
  const [outbreakData, setOutbreakData] = useState<IdentifyOutbreaksOutput | null>(null);
  const [isPanelsHidden, setIsPanelsHidden] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const results = await identifyOutbreaks({
          rawData: RAW_HEALTH_REPORTS,
          currentTime: new Date().toISOString()
        });
        setOutbreakData(results);
      } catch (err) {
        console.error("Error al cargar datos de brotes:", err);
      }
    });
  }, []);

  const activeClustersCount = outbreakData?.outbreakClusters.length || 0;
  const highPriorityCount = outbreakData?.outbreakClusters.filter(c => c.priority === 'High').length || 0;

  const handleNavClick = (view: DashboardView) => {
    setCurrentView(view);
    if (view === 'map') {
      setIsPanelsHidden(true);
    } else {
      setIsPanelsHidden(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex bg-[#060608] text-white overflow-hidden font-body">
      
      {/* Botón Flotante para Mostrar Paneles */}
      {isPanelsHidden && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => {
            setIsPanelsHidden(false);
            if (currentView === 'map') setCurrentView('dashboard');
          }}
          className="absolute top-6 left-6 z-50 bg-[#1e2025]/80 backdrop-blur-md border border-white/10 hover:bg-[#252830] transition-all shadow-2xl rounded-full"
          title="Mostrar Paneles"
        >
          <Menu size={20} className="text-[#54BBDA]" />
        </Button>
      )}

      {/* Barra Lateral */}
      <aside 
        className={cn(
          "relative z-40 flex flex-col bg-[#0c0d0f] border-r border-white/5 transition-all duration-500 ease-in-out shadow-2xl",
          isPanelsHidden ? "w-0 -translate-x-full opacity-0 overflow-hidden" : "w-72 translate-x-0 opacity-100"
        )}
      >
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7381C0] to-[#54BBDA] flex items-center justify-center shadow-[0_0_20px_rgba(115,129,192,0.3)]">
            <Globe className="text-[#0a0a0c]" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">GlobalPulse</h1>
            <p className="text-[9px] font-bold text-[#54BBDA] uppercase tracking-widest">Biosurv IA Activo</p>
          </div>
        </div>

        <div className="px-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setIsPanelsHidden(true)}
            className="w-full justify-start gap-3 text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/5 py-6 rounded-xl"
          >
            <PanelLeftClose size={18} />
            Esconder Paneles
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Panel de Control" 
            active={currentView === 'dashboard'} 
            onClick={() => handleNavClick('dashboard')}
          />
          <NavItem 
            icon={<Globe size={20} />} 
            label="Mapa Global" 
            active={currentView === 'map'} 
            onClick={() => handleNavClick('map')}
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Informes" 
            active={currentView === 'reports'} 
            onClick={() => handleNavClick('reports')}
          />
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <div className="bg-[#1e2025]/40 rounded-2xl p-4 space-y-4 border border-white/5">
            <div className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <span>Estado Global</span>
              <Activity size={12} className="text-[#54BBDA]" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Clústeres Activos</span>
                <span className="font-bold text-[#54BBDA]">{activeClustersCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Prioridad Alta</span>
                <span className="font-bold text-red-500">{highPriorityCount}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <header className="absolute top-0 left-0 w-full z-20 px-8 py-8 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto">
            <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-1">Visualización en Tiempo Real</h2>
            <p className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
              {currentView === 'dashboard' ? 'Monitor de Brotes Pandémicos' : 
               currentView === 'map' ? 'Mapa Táctico Global' : 'Base de Datos de Informes'}
            </p>
          </div>
          
          {!isPanelsHidden && (
            <div className="flex gap-4 pointer-events-auto">
               <div className="px-5 py-2.5 bg-[#1a1b1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3 shadow-2xl">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Alerta de Nivel 4</span>
               </div>
            </div>
          )}
        </header>

        <div className="flex-1 relative overflow-hidden bg-[#060608]">
          {currentView === 'reports' ? (
            <div className="absolute inset-0 bg-[#060608] p-8 pt-36 overflow-auto">
              <div className="max-w-6xl mx-auto bg-[#0c0d0f] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
                <div className="p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <h3 className="text-2xl font-bold flex items-center gap-4">
                    <FileText className="text-[#54BBDA]" size={28} />
                    Registro Detallado de Brotes
                  </h3>
                  <Badge variant="outline" className="border-[#54BBDA]/20 text-[#54BBDA] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {outbreakData?.outbreakClusters.length} Registros Activos
                  </Badge>
                </div>
                <Table>
                  <TableHeader className="bg-white/[0.01]">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-white/30 font-black uppercase tracking-widest text-[10px] py-6 pl-10">Enfermedad</TableHead>
                      <TableHead className="text-white/30 font-black uppercase tracking-widest text-[10px]">Ubicación</TableHead>
                      <TableHead className="text-white/30 font-black uppercase tracking-widest text-[10px]">Estado</TableHead>
                      <TableHead className="text-white/30 font-black uppercase tracking-widest text-[10px]">Prioridad</TableHead>
                      <TableHead className="text-white/30 font-black uppercase tracking-widest text-[10px]">Intensidad</TableHead>
                      <TableHead className="text-white/30 font-black uppercase tracking-widest text-[10px] pr-10">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outbreakData?.outbreakClusters.map((cluster, i) => (
                      <TableRow key={i} className="border-white/5 hover:bg-white/[0.03] transition-colors group">
                        <TableCell className="font-bold text-base pl-10 py-6 group-hover:text-[#54BBDA] transition-colors">{cluster.diseaseName}</TableCell>
                        <TableCell className="text-white/50 text-xs font-medium">{cluster.locationDescription}</TableCell>
                        <TableCell>
                          <span className="text-[10px] font-black text-[#54BBDA] uppercase tracking-widest">{cluster.status}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[9px] uppercase font-black px-3 py-1 rounded-md",
                            cluster.priority === 'High' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                          )}>
                            {cluster.priority === 'High' ? 'Crítico' : 'Alerta'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-1000", cluster.priority === 'High' ? "bg-red-500" : "bg-orange-500")}
                                style={{ width: `${cluster.intensity}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-white/40">{cluster.intensity}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/40 text-xs font-mono pr-10">
                          {new Date(cluster.reportedDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <WorldMap>
              <OutbreakHeatmap data={outbreakData} />
            </WorldMap>
          )}
        </div>

        {/* Panel de Alertas Recientes */}
        <div 
          className={cn(
            "transition-all duration-1000 ease-in-out",
            isPanelsHidden ? "h-0 opacity-0 overflow-hidden" : "h-72 opacity-100"
          )}
        >
          <RecentAlerts outbreaks={outbreakData?.outbreakClusters || []} />
        </div>

        {/* Overlay de Carga */}
        {isPending && (
          <div className="absolute inset-0 z-50 bg-[#060608]/80 backdrop-blur-2xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-[3px] border-[#54BBDA]/10 rounded-full" />
                <div className="absolute inset-0 border-t-[3px] border-[#54BBDA] rounded-full animate-spin shadow-[0_0_20px_rgba(84,187,218,0.4)]" />
                <Globe className="absolute inset-0 m-auto text-[#54BBDA]/50 animate-pulse" size={32} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-black text-[#54BBDA] uppercase tracking-[0.6em] animate-pulse">Sincronizando Red Global</span>
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Accediendo a terminales Biosurv...</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group",
        active 
          ? "bg-[#54BBDA]/10 text-[#54BBDA] shadow-[inset_0_0_20px_rgba(84,187,218,0.05)]" 
          : "text-white/30 hover:text-white hover:bg-white/5"
      )}
    >
      <span className={cn(
        "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
        active ? "text-[#54BBDA] scale-110" : "text-white/20"
      )}>
        {icon}
      </span>
      <span className="text-[11px] font-black tracking-widest uppercase">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#54BBDA] shadow-[0_0_12px_#54BBDA]" />}
    </button>
  );
}
