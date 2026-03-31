"use client";

import React, { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { 
  LayoutDashboard, 
  Globe, 
  FileText, 
  PanelLeftClose, 
  Activity,
  Menu,
  Send,
  AlertCircle,
  LogOut,
  UserCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

// Importación dinámica para evitar errores de SSR con Leaflet
const WorldMap = dynamic(() => import('./WorldMap').then((mod) => mod.WorldMap), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#060608] flex items-center justify-center text-white/20 text-xs font-black uppercase tracking-[0.4em]">Cargando red satelital...</div>
});

const OutbreakHeatmap = dynamic(() => import('./OutbreakHeatmap').then((mod) => mod.OutbreakHeatmap), {
  ssr: false
});

const RecentAlerts = dynamic(() => import('./RecentAlerts').then((mod) => mod.RecentAlerts), {
  ssr: false
});

type DashboardView = 'dashboard' | 'map' | 'reports';

const PROVINCIAS_ESPANA = [
  "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", 
  "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", 
  "Gijón", "Hospitalet de Llobregat", "Vitoria", "A Coruña", "Elche", "Granada",
  "Tarragona", "San Sebastián", "Oviedo", "Santa Cruz de Tenerife", "Pamplona",
  "Almería", "Fuenlabrada", "Leganés", "San Cristóbal de La Laguna", "Logroño"
].sort();

const TIPOS_ENFERMEDAD = [
  "COVID-1.0", "Gripe A", "Bronquitis", "Neumonía Atípica", "Gastroenteritis Viral", "Dengue", "Zika", "Sarampión"
];

const MOCK_SPAIN_DATA = {
  outbreakClusters: [
    {
      diseaseName: "COVID-1.0",
      locationDescription: "Madrid, España",
      latitude: 40.4168,
      longitude: -3.7038,
      category: "Viral",
      priority: "High",
      intensity: 85,
      status: "Active",
      reportedDate: new Date().toISOString()
    },
    {
      diseaseName: "Gripe A",
      locationDescription: "Barcelona, España",
      latitude: 41.3851,
      longitude: 2.1734,
      category: "Viral",
      priority: "Medium",
      intensity: 60,
      status: "Monitoring",
      reportedDate: new Date().toISOString()
    },
    {
      diseaseName: "Bronquitis",
      locationDescription: "Valencia, España",
      latitude: 39.4699,
      longitude: -0.3763,
      category: "Other",
      priority: "Low",
      intensity: 40,
      status: "Contained",
      reportedDate: new Date().toISOString()
    },
    {
      diseaseName: "Neumonía",
      locationDescription: "Sevilla, España",
      latitude: 37.3891,
      longitude: -5.9845,
      category: "Bacterial",
      priority: "High",
      intensity: 75,
      status: "New",
      reportedDate: new Date().toISOString()
    },
    {
      diseaseName: "Gripe Estacional",
      locationDescription: "Bilbao, España",
      latitude: 43.2630,
      longitude: -2.9350,
      category: "Viral",
      priority: "Medium",
      intensity: 55,
      status: "Active",
      reportedDate: new Date().toISOString()
    }
  ]
};

export default function GlobalPulseDashboard() {
  const [outbreakData] = useState(MOCK_SPAIN_DATA);
  const [isPanelsHidden, setIsPanelsHidden] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [isPending] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();

  const activeClustersCount = outbreakData.outbreakClusters.length;
  const highPriorityCount = outbreakData.outbreakClusters.filter(c => c.priority === 'High').length;

  const handleNavClick = (view: DashboardView) => {
    setCurrentView(view);
    if (view === 'map') {
      setIsPanelsHidden(true);
    } else {
      setIsPanelsHidden(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Sesión Cerrada",
        description: "Has salido de la terminal VirusAlert correctamente.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión.",
      });
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Informe Enviado",
      description: "El reporte médico ha sido registrado y está siendo analizado por VirusAlert IA.",
    });
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
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">VirusAlert</h1>
            <p className="text-[9px] font-bold text-[#54BBDA] uppercase tracking-widest">Nodos España Activos</p>
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
            label="Panel España" 
            active={currentView === 'dashboard'} 
            onClick={() => handleNavClick('dashboard')}
          />
          <NavItem 
            icon={<Globe size={20} />} 
            label="Mapa Táctico" 
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

        {/* Perfil de Usuario y Logout */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="bg-white/[0.02] rounded-2xl p-4 flex items-center gap-3 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/10 shrink-0">
              <UserCircle size={24} className="text-white/40" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none mb-1">Operador Autenticado</p>
              <p className="text-xs font-bold text-white/70 truncate">{user?.isAnonymous ? 'Invitado Temporal' : user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl py-6"
          >
            <LogOut size={18} />
            <span className="text-[11px] font-black tracking-widest uppercase">Cerrar Sesión</span>
          </Button>
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="bg-[#1e2025]/40 rounded-2xl p-4 space-y-4 border border-white/5">
            <div className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <span>Estado Península</span>
              <Activity size={12} className="text-[#54BBDA]" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Focos Activos</span>
                <span className="font-bold text-[#54BBDA]">{activeClustersCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Emergencias</span>
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
            <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-1">Vigilancia Nacional</h2>
            <p className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
              {currentView === 'dashboard' ? 'Monitor de Brotes Pandémicos' : 
               currentView === 'map' ? 'Mapa Táctico España' : 'Central de Informes'}
            </p>
          </div>
          
          {!isPanelsHidden && (
            <div className="flex gap-4 pointer-events-auto">
               <div className="px-5 py-2.5 bg-[#1a1b1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3 shadow-2xl">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_#ef4444]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Alerta Nivel 4: España</span>
               </div>
            </div>
          )}
        </header>

        <div className="flex-1 relative overflow-hidden bg-[#060608]">
          {currentView === 'reports' ? (
            <div className="absolute inset-0 bg-[#060608] p-8 pt-36 overflow-auto">
              <div className="max-w-3xl mx-auto bg-[#0c0d0f] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
                <div className="p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <h3 className="text-2xl font-bold flex items-center gap-4">
                    <FileText className="text-[#54BBDA]" size={28} />
                    Reporte de Incidencia Médica
                  </h3>
                </div>
                <form onSubmit={handleReportSubmit} className="p-10 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-white/40">Descripción del Problema Médico</Label>
                    <Textarea 
                      placeholder="Describa los síntomas observados, duración y gravedad..." 
                      className="min-h-[150px] bg-white/[0.03] border-white/10 rounded-2xl focus:ring-[#54BBDA] text-base p-6"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-white/40">Tipo de Enfermedad</Label>
                      <Select required>
                        <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl">
                          <SelectValue placeholder="Seleccionar tipo..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e2025] border-white/10 text-white">
                          {TIPOS_ENFERMEDAD.map(tipo => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-white/40">Ubicación (Provincias España)</Label>
                      <Select required>
                        <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl">
                          <SelectValue placeholder="Seleccionar provincia..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e2025] border-white/10 text-white">
                          {PROVINCIAS_ESPANA.map(prov => (
                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-6 bg-[#54BBDA]/5 rounded-3xl border border-[#54BBDA]/10 flex gap-4 items-start">
                    <AlertCircle className="text-[#54BBDA] shrink-0" size={20} />
                    <p className="text-xs text-[#54BBDA]/70 font-medium leading-relaxed">
                      Este informe será analizado instantáneamente por el motor VirusAlert IA para actualizar los mapas de calor y alertar a los centros de salud regionales de forma automática.
                    </p>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-16 bg-[#54BBDA] hover:bg-[#54BBDA]/90 text-[#0a0a0c] font-black uppercase tracking-[0.2em] rounded-2xl text-xs shadow-[0_0_20px_rgba(84,187,218,0.3)]"
                  >
                    <Send size={18} className="mr-2" /> Enviar Reporte Táctico
                  </Button>
                </form>
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
          <RecentAlerts outbreaks={outbreakData.outbreakClusters} />
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
                <span className="text-[11px] font-black text-[#54BBDA] uppercase tracking-[0.6em] animate-pulse">Analizando Datos España</span>
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Sincronizando con nodos regionales...</span>
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
