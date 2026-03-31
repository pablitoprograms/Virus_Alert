
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

const PROVINCIA_COORDINATES: Record<string, [number, number]> = {
  "Madrid": [40.4168, -3.7038],
  "Barcelona": [41.3851, 2.1734],
  "Valencia": [39.4699, -0.3763],
  "Sevilla": [37.3891, -5.9845],
  "Zaragoza": [41.6488, -0.8891],
  "Málaga": [36.7213, -4.4214],
  "Murcia": [37.9922, -1.1307],
  "Palma": [39.5696, 2.6502],
  "Las Palmas": [28.1235, -15.4363],
  "Bilbao": [43.2630, -2.9350],
  "Alicante": [38.3452, -0.4815],
  "Córdoba": [37.8882, -4.7794],
  "Valladolid": [41.6523, -4.7245],
  "Vigo": [42.2406, -8.7207],
  "Gijón": [43.5357, -5.6615],
  "Vitoria": [42.8467, -2.6716],
  "A Coruña": [43.3623, -8.4115],
  "Elche": [38.2669, -0.6983],
  "Granada": [37.1773, -3.5986],
  "Tarragona": [41.1189, 1.2445],
  "San Sebastián": [43.3183, -1.9812],
  "Oviedo": [43.3603, -5.8448],
  "Santa Cruz de Tenerife": [28.4636, -16.2518],
  "Pamplona": [42.8125, -1.6458],
  "Almería": [36.8340, -2.4637],
  "Fuenlabrada": [40.2842, -3.7939],
  "Leganés": [40.3275, -3.7635],
  "San Cristóbal de La Laguna": [28.4871, -16.3159],
  "Logroño": [42.4627, -2.4450]
};

const TIPOS_ENFERMEDAD = [
  "COVID-1.0", "Gripe A (H1N1)", "Bronquitis Aguda", "Neumonía Atípica", 
  "Gastroenteritis Viral", "Dengue Hemorrágico", "Zika Virus", 
  "Sarampión", "Malaria Falciparum", "Cólera", "Viruela del Mono", 
  "Fiebre del Nilo Occidental"
].sort();

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
      diseaseName: "Gripe A (H1N1)",
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
      diseaseName: "Bronquitis Aguda",
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
      diseaseName: "Neumonía Atípica",
      locationDescription: "Sevilla, España",
      latitude: 37.3891,
      longitude: -5.9845,
      category: "Bacterial",
      priority: "High",
      intensity: 75,
      status: "New",
      reportedDate: new Date().toISOString()
    }
  ]
};

export default function GlobalPulseDashboard() {
  const [outbreakData, setOutbreakData] = useState(MOCK_SPAIN_DATA);
  const [isPanelsHidden, setIsPanelsHidden] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();

  // Form states
  const [reportDescription, setReportDescription] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");

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
    
    if (!selectedProvince || !selectedDisease) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Por favor, selecciona una provincia y un tipo de enfermedad.",
      });
      return;
    }

    startTransition(() => {
      const coords = PROVINCIA_COORDINATES[selectedProvince];
      const newOutbreak = {
        diseaseName: selectedDisease,
        locationDescription: `${selectedProvince}, España`,
        latitude: coords[0],
        longitude: coords[1],
        category: "Viral" as const,
        priority: "High" as const,
        intensity: Math.floor(Math.random() * 40) + 60,
        status: "New" as const,
        reportedDate: new Date().toISOString()
      };

      setOutbreakData(prev => ({
        ...prev,
        outbreakClusters: [newOutbreak, ...prev.outbreakClusters]
      }));

      // Limpiar formulario y volver al panel
      setReportDescription("");
      setSelectedDisease("");
      setSelectedProvince("");
      setCurrentView('dashboard');

      toast({
        title: "Informe Procesado",
        description: `Se ha registrado un nuevo brote de ${selectedDisease} en ${selectedProvince}. El mapa táctico ha sido actualizado.`,
      });
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
          <Menu size={20} className="text-[#22c55e]" />
        </Button>
      )}

      {/* Barra Lateral Principal */}
      <aside 
        className={cn(
          "relative z-40 flex flex-col bg-[#0c0d0f] border-r border-white/5 transition-all duration-500 ease-in-out shadow-2xl",
          isPanelsHidden ? "w-0 -translate-x-full opacity-0 overflow-hidden" : "w-72 translate-x-0 opacity-100"
        )}
      >
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#166534] to-[#22c55e] flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Globe className="text-[#0a0a0c]" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">VirusAlert</h1>
            <p className="text-[9px] font-bold text-[#22c55e] uppercase tracking-widest">Nodos España Activos</p>
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
              <Activity size={12} className="text-[#22c55e]" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Focos Activos</span>
                <span className="font-bold text-[#22c55e]">{activeClustersCount}</span>
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
      <main className="flex-1 relative flex flex-row min-w-0">
        
        {/* Columna de Alertas Recientes (Ahora a la izquierda) */}
        <div 
          className={cn(
            "h-full transition-all duration-500 ease-in-out border-r border-white/5 bg-[#0c0d0f]/50 z-30",
            isPanelsHidden ? "w-0 opacity-0 overflow-hidden" : "w-80 opacity-100"
          )}
        >
          <RecentAlerts outbreaks={outbreakData.outbreakClusters} />
        </div>

        {/* Área del Mapa y Cabecera */}
        <div className="flex-1 relative overflow-hidden bg-[#060608]">
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

          <div className="w-full h-full relative">
            {currentView === 'reports' ? (
              <div className="absolute inset-0 bg-[#060608] p-8 pt-36 overflow-auto z-10">
                <div className="max-w-3xl mx-auto bg-[#0c0d0f] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
                  <div className="p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="text-2xl font-bold flex items-center gap-4">
                      <FileText className="text-[#22c55e]" size={28} />
                      Reporte de Incidencia Médica
                    </h3>
                  </div>
                  <form onSubmit={handleReportSubmit} className="p-10 space-y-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-white/40">Descripción del Problema Médico</Label>
                      <Textarea 
                        placeholder="Describa los síntomas observados, duración y gravedad..." 
                        className="min-h-[150px] bg-white/[0.03] border-white/10 rounded-2xl focus:ring-[#22c55e] text-base p-6"
                        required
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-white/40">Tipo de Enfermedad</Label>
                        <Select required value={selectedDisease} onValueChange={setSelectedDisease}>
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
                        <Select required value={selectedProvince} onValueChange={setSelectedProvince}>
                          <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl">
                            <SelectValue placeholder="Seleccionar provincia..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1e2025] border-white/10 text-white">
                            {Object.keys(PROVINCIA_COORDINATES).sort().map(prov => (
                              <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-6 bg-[#22c55e]/5 rounded-3xl border border-[#22c55e]/10 flex gap-4 items-start">
                      <AlertCircle className="text-[#22c55e] shrink-0" size={20} />
                      <p className="text-xs text-[#22c55e]/70 font-medium leading-relaxed">
                        Este informe será analizado instantáneamente por el motor VirusAlert IA para actualizar los mapas de calor y alertar a los centros de salud regionales de forma automática.
                      </p>
                    </div>

                    <Button 
                      type="submit"
                      className="w-full h-16 bg-[#22c55e] hover:bg-[#22c55e]/90 text-[#0a0a0c] font-black uppercase tracking-[0.2em] rounded-2xl text-xs shadow-[0_0_20px_rgba(34,197,94,0.3)]"
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
        </div>

        {/* Overlay de Carga */}
        {isPending && (
          <div className="absolute inset-0 z-50 bg-[#060608]/80 backdrop-blur-2xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-[3px] border-[#22c55e]/10 rounded-full" />
                <div className="absolute inset-0 border-t-[3px] border-[#22c55e] rounded-full animate-spin shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
                <Globe className="absolute inset-0 m-auto text-[#22c55e]/50 animate-pulse" size={32} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-black text-[#22c55e] uppercase tracking-[0.6em] animate-pulse">Sincronizando Sistema</span>
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Actualizando coordenadas de satélite...</span>
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
          ? "bg-[#22c55e]/10 text-[#22c55e] shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" 
          : "text-white/30 hover:text-white hover:bg-white/5"
      )}
    >
      <span className={cn(
        "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
        active ? "text-[#22c55e] scale-110" : "text-white/20"
      )}>
        {icon}
      </span>
      <span className="text-[11px] font-black tracking-widest uppercase">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_12px_#22c55e]" />}
    </button>
  );
}
