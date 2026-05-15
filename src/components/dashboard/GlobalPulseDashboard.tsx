"use client";
import React, { useState, useTransition, useEffect, useMemo } from 'react';
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
  UserCircle,
  MapPin,
  Calendar,
  Info,
  ShieldAlert,
  Loader2,
  Navigation,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  BrainCircuit,
  Stethoscope,
  Search,
  Zap,
  Terminal,
  ShieldCheck,
  ShieldQuestion,
  X,
  Cpu,
  Clock,
  HeartPulse,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useConfig } from './ConfigContext';
import { SettingsDashboard } from './SettingsDashboard';

// Importaciones dinámicas para componentes pesados
const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });
const OutbreakHeatmap = dynamic(() => import('./OutbreakHeatmap').then((mod) => mod.OutbreakHeatmap), { ssr: false });
const RecentAlerts = dynamic(() => import('./RecentAlerts').then((mod) => mod.RecentAlerts), { ssr: false });

// Busca esta línea y déjala así:
type DashboardView = 'dashboard' | 'map' | 'reports' | 'settings' | 'wiki';
type PriorityLevel = 'High' | 'Medium' | 'Low';

export default function GlobalPulseDashboard() {
  //--- ESTADOS DE NAVEGACIÓN Y UI
  const [isPanelsHidden, setIsPanelsHidden] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [selectedOutbreak, setSelectedOutbreak] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { t } = useConfig();

  //--- ESTADOS DEL MÓDULO DE INFORME (WIZARD)
  const [wizardStep, setWizardStep] = useState(1);
  const [reportDescription, setReportDescription] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  //--- ESTADOS DEL MÓDULO DE PROTOCOLOS (IA)
  const [selectedWikiDisease, setSelectedWikiDisease] = useState("");
  const [recommendations, setRecommendations] = useState("");
  // Fases: 'selector' | 'warning' | 'result'
  const [wikiStep, setWikiStep] = useState<'selector' | 'warning' | 'result'>('selector');
  const [radarData, setRadarData] = useState<any>(null);
  const [isLoadingWiki, setIsLoadingWiki] = useState(false);

// --- LE CAMBIAMOS EL NOMBRE PARA EVITAR ERRORES DE REPETICIÓN
// --- PASO A: El usuario elige en el selector
  const consultarIA = (enfermedad: string) => {
    if (!enfermedad) return;
    setSelectedWikiDisease(enfermedad);
    setWikiStep('warning'); // Solo cambiamos a la pantalla de aviso
  };

  // --- PASO B: El usuario acepta el aviso y llamamos a Python
  const confirmarGeneracionIA = async () => {
    setWikiStep('result'); // Cambiamos a la pantalla de carga/resultado
    setIsLoadingWiki(true);
    setRecommendations(""); 

    try {
      const response = await fetch('http://localhost:5000/api/protocolos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enfermedad: selectedWikiDisease }),
      });

      const data = await response.json();
      setRecommendations(data.protocolo);
    } catch (error) {
      console.error("Error:", error);
      setRecommendations("ERROR: No se pudo conectar con el servidor de IA.");
    } finally {
      setIsLoadingWiki(false);
    }
  };

  const cargarRadar = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/reportes-reales');
    const data = await res.json();
    setRadarData(data); // Aquí guardamos lo que Python encuentra en Google News
  } catch (err) {
    console.error("Error cargando radar:", err);
  }
};

// Esto hace que se cargue solo al abrir la página
useEffect(() => {
  cargarRadar();
}, []);

  //--- SINCRONIZACIÓN CON FIREBASE
  const outbreaksQuery = useMemoFirebase(() => {
    return query(collection(db, 'outbreaks'), orderBy('reportedDate', 'desc'), limit(100));
  }, [db]);
// 1. Primero se definen los datos de Firebase
const { data: outbreaks } = useCollection(outbreaksQuery);

const uniqueDiseases = React.useMemo(() => {
  // 1. Nombres de Firebase
  const firebaseData = (outbreaks as any[]) || [];
  const firebaseNames = firebaseData.map(item => 
    (item.diseaseName || item.disease || "").trim()
  );

  // 2. Nombres del Radar (Python)
  const apiNames = (radarData?.detalle_brotes as any[])?.map(item => 
    (item.enfermedad || "").trim()
  ) || [];

  // 3. Unimos todo, quitamos repetidos y pasamos a Mayúsculas para que quede bonito
  const total = [...firebaseNames, ...apiNames];
  
  return Array.from(new Set(total.map(n => n.toUpperCase())))
    .filter(n => n !== "")
    .sort();
}, [outbreaks, radarData]);

  //--- LÓGICA DE BORRADO ---
  const handleDeleteOutbreak = (id: string) => {
    // 1. Log de depuración para ver qué datos llegan realmente
    console.log("Validando usuario:", user);

    // 2. Comprobación: clave admin
    const inputPassword = window.prompt("Introduce la clave de administrador:");
    const isAdmin = inputPassword === 'virus_alert_admin';

    if (!isAdmin) {
      return toast({ 
        variant: "destructive", 
        title: "Acceso Denegado", 
        description: "Solo el personal de nivel ADMIN puede purgar registros del sistema." 
      });
    }

    // 3. Ejecución del borrado
    startTransition(async () => {
      try {
        await deleteDocumentNonBlocking(doc(db, 'outbreaks', id));
        setSelectedOutbreak(null);
        toast({ title: "Registro Eliminado", description: "El brote ha sido removido del sistema global." });
      } catch (err) {
        console.error("Error al borrar:", err);
        toast({ variant: "destructive", title: "Error de Sistema", description: "No se pudo eliminar el registro." });
      }
    });
  };

  // --- PEGAR AQUÍ EL PASO 3 ---
  const obtenerProtocolosIA = async (enfermedad: string) => {
    if (!enfermedad) return;
    setIsLoadingWiki(true);
    setRecommendations(""); 

    try {
      const res = await fetch("http://localhost:5000/api/protocolos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enfermedad })
      });

      if (!res.ok) throw new Error("Error en servidor");
      
      const data = await res.json();
      setRecommendations(data.protocolo);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de Enlace",
        description: "No se pudo conectar con el motor de protocolos local."
      });
    } finally {
      setIsLoadingWiki(false);
    }
  };

  //--- AUTOCOMPLETADO GEOGRÁFICO
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (locationSearch.length > 2 && !selectedCoords) {
        handleSearchLocation();
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [locationSearch, selectedCoords]);

  const handleSearchLocation = async () => {
    setIsSearchingLoc(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)}&format=json&limit=5`);
      const data = await res.json();
      setLocationResults(data);
    } catch (err) {
      console.error("Error Nominatim:", err);
    } finally {
      setIsSearchingLoc(false);
    }
  };

  const selectLocation = (res: any) => {
    setSelectedProvince(res.display_name);
    setSelectedCoords([parseFloat(res.lat), parseFloat(res.lon)]);
    setLocationResults([]);
    setLocationSearch(res.display_name);
  };

  // CONTROLADOR DEL WIZARD E IA ---
  const nextStep = async () => {
    if (wizardStep === 2) {
      if (!selectedSymptoms[0] || selectedSymptoms[0].length < 10) return;
      setIsAiAnalyzing(true);
      setWizardStep(3);
      try {
        const response = await fetch("http://localhost:5000/api/diagnostico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sintomas: selectedSymptoms[0] })
        });
        const data = await response.json();
        
        // Parseo exacto al original para no romper el motor
        const result = typeof data.respuesta_ia === 'string' ? JSON.parse(data.respuesta_ia) : data.respuesta_ia;
        
        setAiAnalysis(result);
        setSelectedDisease(result.enfermedad);
        
        // REQUISITO: SINCRONIZACIÓN DE DESCRIPCIÓN
        setReportDescription(result.justificacion); 

        setWizardStep(4);
      } catch (error) {
        setWizardStep(2);
        toast({ variant: "destructive", title: "Error de IA", description: "No se pudo conectar con el motor local." });
      } finally {
        setIsAiAnalyzing(false);
      }
    } else {
      setWizardStep(prev => prev + 1);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const newOutbreak = {
        diseaseName: selectedDisease.toUpperCase(),
        locationDescription: selectedProvince,
        latitude: selectedCoords?.[0],
        longitude: selectedCoords?.[1],
        priority: selectedPriority,
        reportedDate: new Date().toISOString(),
        description: reportDescription,
        status: "Confirmed",
        reporter: user?.email || "Sistema_Táctico"
      };
      await addDocumentNonBlocking(collection(db, 'outbreaks'), newOutbreak);
      setWizardStep(1);
      setReportDescription("");
      setSelectedDisease("");
      setSelectedCoords(null);
      setLocationSearch("");
      setCurrentView('dashboard');
      toast({ title: "Informe Sincronizado", description: "Brote publicado en la red global." });
    });
  };

  return (
    <div className="relative h-screen w-screen flex bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden transition-colors duration-300">
      {/* SIDEBAR */}
      <aside className={cn(
        "relative z-40 flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)] transition-all duration-500",
        isPanelsHidden ? "w-0 -translate-x-full opacity-0" : "w-72 translate-x-0"
      )}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#166534] to-[#22c55e] flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Globe className="text-black" size={22} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VirusAlert</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
           <NavItem icon={<LayoutDashboard size={20} />} label={t.alerts} active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
           <NavItem icon={<Globe size={20} />} label={t.map} active={currentView === 'map'} onClick={() => setCurrentView('map')} />
           
           {/* NUEVO BOTÓN DE PROTOCOLOS */}
           <NavItem 
             icon={<ShieldCheck size={20} />} 
             label="Protocolos" 
             active={currentView === 'wiki'} 
             onClick={() => setCurrentView('wiki')} 
           />

           <NavItem icon={<FileText size={20} />} label={t.reports} active={currentView === 'reports'} onClick={() => { setCurrentView('reports'); setWizardStep(1); }} />
           <NavItem icon={<Settings size={20} />} label={t.settings} active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>
        {/* INFO SESIÓN */}
        <div className="p-4 border-t border-[var(--border)] space-y-2">
          {user && (
            <div className="px-4 py-3 bg-[var(--bg-app)] rounded-xl border border-[var(--border)] flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <div className="overflow-hidden">
                <p className="text-[9px] font-black uppercase opacity-40">Agente Operativo</p>
                <p className="text-[10px] font-bold truncate">{user.email}</p>
              </div>
            </div>
          )}
          <Button variant="ghost" onClick={() => signOut(auth)} className="w-full justify-start gap-3 text-red-500 rounded-xl py-6">
            <LogOut size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">{t.logout}</span>
          </Button>
          <Button variant="ghost" onClick={() => setIsPanelsHidden(true)} className="w-full justify-start gap-3 text-xs font-bold uppercase opacity-40 py-6">
            <PanelLeftClose size={18} /> {t.hide_panels}
          </Button>
        </div>
      </aside>

      {/* AREA PRINCIPAL */}
      <main className="flex-1 relative flex flex-col min-w-0">
        <header className="px-8 py-8 z-20">
          <h2 className="text-xs font-black text-[var(--text-main)] opacity-30 uppercase tracking-[0.4em] mb-1">{t.national_surveillance}</h2>
          <p className="text-3xl font-bold">
            {currentView === 'dashboard' ? t.critical_alerts : currentView === 'map' ? t.map : currentView === 'settings' ? t.system_settings : "Protocolo de Campo"}
          </p>
        </header>

        <div className="flex-1 relative">
          {currentView === 'dashboard' ? (
            <div className="absolute inset-0 p-8 z-10 flex justify-center items-start">
              <div className="w-full max-w-4xl h-[calc(100vh-250px)] bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-[2.5rem] overflow-hidden">
                <RecentAlerts outbreaks={outbreaks || []} onSelect={(alert) => setSelectedOutbreak(alert)} onDelete={handleDeleteOutbreak} />
              </div>
            </div>
          ) : currentView === 'map' ? (
            <WorldMap />
          ) : currentView === 'settings' ? (
            <div className="absolute inset-0 overflow-y-auto">
            <div className="animate-in fade-in duration-500">
              <SettingsDashboard />
            </div>
            </div>
          
          /* --- VISTA DE WIKI (CORREGIDA) --- */
          ) : currentView === 'wiki' ? (
            <div className="absolute inset-0 overflow-y-auto">
            <div className="p-8 max-w-6xl mx-auto">
              <div className="mb-12">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                  Vigilancia Nacional <span className="text-[#22c55e]">Protocolo de Campo</span>
                </h1>
              </div>

              <div className="bg-[#121212] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                
                {/* --- PANTALLA 1: EL SELECTOR --- */}
                {wikiStep === 'selector' && (
                  <div className="space-y-10 animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-[#22c55e]/10 rounded-2xl text-[#22c55e]">
                        <ShieldCheck size={40} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white uppercase">Centro de Protocolos</h2>
                        <p className="text-[#22c55e] text-xs font-bold tracking-[0.3em] uppercase opacity-70">Inteligencia Epidemiológica Activa</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase opacity-40 ml-2 tracking-widest text-[#22c55e]">
                        Seleccionar Amenaza Detectada
                      </label>
                      <Select onValueChange={consultarIA}>
                        <SelectTrigger className="h-20 bg-black/40 border-2 border-white/10 rounded-[1.5rem] text-xl font-black uppercase">
                          <SelectValue placeholder="--- ELEGIR PATÓGENO ---" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121212] border-white/10 text-white">
                          {uniqueDiseases.map((disease) => (
                            <SelectItem key={disease} value={disease} className="focus:bg-[#22c55e]/20 uppercase font-bold">
                              {disease}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* --- PANTALLA 2: LA ADVERTENCIA --- */}
                {wikiStep === 'warning' && (
                  <div className="py-10 text-center space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="inline-block p-6 bg-yellow-500/10 rounded-full text-yellow-500 mb-2">
                      <Terminal size={60} className="animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black text-white uppercase">Aviso de Seguridad</h2>
                      <p className="text-white/60 max-w-lg mx-auto text-lg">
                        Vas a generar un protocolo táctico para: <br/>
                        <span className="text-yellow-500 font-black text-2xl">{selectedWikiDisease}</span>
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 max-w-md mx-auto text-xs text-white/40 uppercase tracking-widest leading-loose">
                      ⚠️ El contenido siguiente es generado por un núcleo de IA. Debe ser supervisado por autoridades sanitarias competentes antes de su aplicación en campo.
                    </div>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => setWikiStep('selector')} variant="ghost" className="hover:bg-white/5 text-white/50 font-bold uppercase">
                        Cancelar
                      </Button>
                      <Button onClick={confirmarGeneracionIA} className="bg-yellow-500 hover:bg-yellow-600 text-black font-black px-12 py-6 rounded-2xl text-lg uppercase transition-all hover:scale-105">
                        Confirmar y Generar
                      </Button>
                    </div>
                  </div>
                )}

                {/* --- PANTALLA 3: EL RESULTADO --- */}
                {wikiStep === 'result' && (
                  <div className="space-y-6 animate-in fade-in duration-700">
                    <div className="flex justify-between items-center border-b border-white/5 pb-6">
                      <div className="flex items-center gap-4">
                        <Cpu className="text-[#22c55e]" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Protocolo IA: {selectedWikiDisease}</h3>
                      </div>
                      <Button onClick={() => setWikiStep('selector')} variant="outline" className="border-white/10 text-xs font-bold uppercase hover:bg-white/5">
                        ← Nueva Consulta
                      </Button>
                    </div>

                    <div className="bg-black/40 rounded-[2rem] p-8 min-h-[400px] relative border border-white/5">
                      {isLoadingWiki ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                          <Loader2 className="animate-spin text-[#22c55e]" size={50} />
                          <p className="text-[#22c55e] font-black text-xs uppercase tracking-[0.4em] animate-pulse">Procesando Datos Tácticos...</p>
                        </div>
                      ) : (
                        <div className="prose prose-invert max-w-none">
                          <div className="font-mono text-sm leading-relaxed text-[#22c55e]/90 whitespace-pre-wrap">
                            {recommendations}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          ) : currentView === 'reports' ? (
            <div className="absolute inset-0 p-4 z-10 flex flex-col items-center justify-center">
              {/* AQUÍ SIGUE TU WIZARD DE DIAGNÓSTICO... */}
              <div className="w-full max-w-3xl max-h-[85vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden">
                <div className="px-8 pt-8">
                  <Progress value={(wizardStep / 5) * 100} className="h-1 bg-[var(--border)]" />
                </div>
                <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                  {/* PASO 1: AVISO */}
                  {wizardStep === 1 && (
                    <div className="space-y-8 text-center animate-in zoom-in duration-300">
                      <div className="w-20 h-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/30 mx-auto">
                        <ShieldCheck size={40} className="text-[#22c55e]" />
                      </div>
                      <h3 className="text-3xl font-black uppercase">Diagnóstico IA</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="p-4 bg-[var(--bg-app)] border border-[var(--border)] rounded-xl">
                          <p className="text-[10px] font-black uppercase text-[#22c55e] mb-1">Privacidad</p>
                          <p className="text-[11px] opacity-60 uppercase">Procesamiento local. Datos cifrados de punto a punto.</p>
                        </div>
                        <div className="p-4 bg-[var(--bg-app)] border border-[var(--border)] rounded-xl">
                          <p className="text-[10px] font-black uppercase text-yellow-500 mb-1">Aviso</p>
                          <p className="text-[11px] opacity-60 uppercase">Este sistema es de apoyo estadístico, no sustituye criterio médico.</p>
                        </div>
                      </div>
                      <Button onClick={() => setWizardStep(2)} className="h-14 w-full bg-[#22c55e] text-black rounded-2xl font-black uppercase">ACEPTAR PROTOCOLO</Button>
                    </div>
                  )}

                  {/* PASO 2: SÍNTOMAS */}
                  {wizardStep === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right">
                      <h3 className="text-xl font-bold uppercase tracking-tight">Entrada de Cuadro Clínico</h3>
                      
                      {/* REQUISITO: MEJORA DE UX (GUÍA) */}
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
                        <Info size={18} className="text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-blue-500 mb-1">Guía de Entrada</p>
                          <p className="text-[11px] opacity-80 uppercase leading-relaxed">
                            EJEMPLO REAL: <span className="font-bold">"Paciente con fiebre de 40°C, manchas rojas y dolor nucal"</span>.
                          </p>
                        </div>
                      </div>

                      <Textarea 
                        placeholder="DESCRIBA LOS SÍNTOMAS DETALLADAMENTE..." 
                        className="w-full min-h-[180px] bg-[var(--bg-app)] border border-[var(--border)] rounded-[2rem] p-6 text-sm uppercase font-mono resize-none focus:ring-[#22c55e]" 
                        value={selectedSymptoms[0] || ""} 
                        onChange={(e) => setSelectedSymptoms([e.target.value])}
                      />
                      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-[10px] opacity-50 italic uppercase">
                        Nota: Ingrese fiebre, erupciones, fatiga o dolores específicos para mayor precisión.
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setWizardStep(1)} className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px]">Atrás</Button>
                        <Button onClick={nextStep} disabled={!selectedSymptoms[0] || selectedSymptoms[0].length < 15} className="h-14 flex-[2] bg-[#22c55e] text-black rounded-2xl font-black uppercase">Analizar Patrones</Button>
                      </div>
                    </div>
                  )}

                  {/* PASO 3: CARGA */}
                  {wizardStep === 3 && (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4">
                      <BrainCircuit size={60} className="text-[#22c55e] animate-bounce" />
                      <p className="text-xs font-black uppercase tracking-[0.4em] text-[#22c55e]">Consultando Neuronas Locales...</p>
                    </div>
                  )}

                  {/* PASO 4: RESULTADO IA */}
                  {wizardStep === 4 && (
                    <div className="space-y-6 animate-in zoom-in">
                      {aiAnalysis && (
                        <div className="p-8 rounded-[2.5rem] border border-[#22c55e]/30 bg-[var(--bg-app)] space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest">Resultado Probabilistico</span>
                            <Badge className="bg-[#22c55e] text-black font-black">{aiAnalysis.intensidad || aiAnalysis.confidence || 85}%</Badge>
                          </div>
                          <h4 className="text-4xl font-black uppercase tracking-tighter">{aiAnalysis.enfermedad}</h4>
                          <div className="text-[11px] opacity-70 bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] leading-relaxed uppercase font-mono">
                            {aiAnalysis.justificacion}
                          </div>
                        </div>
                      )}
                      <Button onClick={() => setWizardStep(5)} className="h-14 w-full bg-[#22c55e] text-black rounded-2xl font-black uppercase">Validar y Ubicar</Button>
                    </div>
                  )}

                  {/* PASO 5: LOGÍSTICA */}
                  {wizardStep === 5 && (
                    <div className="space-y-6 animate-in slide-in-from-right">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-30 px-2">Prioridad de Alerta</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => setSelectedPriority('Low')} className={cn("h-12 rounded-xl border text-[10px] font-black uppercase transition-all", selectedPriority === 'Low' ? "bg-yellow-500 text-black border-yellow-500" : "bg-[var(--bg-app)] border-[var(--border)] opacity-40")}>Baja</button>
                          <button onClick={() => setSelectedPriority('Medium')} className={cn("h-12 rounded-xl border text-[10px] font-black uppercase transition-all", selectedPriority === 'Medium' ? "bg-orange-500 text-black border-orange-500" : "bg-[var(--bg-app)] border-[var(--border)] opacity-40")}>Media</button>
                          <button onClick={() => setSelectedPriority('High')} className={cn("h-12 rounded-xl border text-[10px] font-black uppercase transition-all", selectedPriority === 'High' ? "bg-red-600 text-white border-red-600" : "bg-[var(--bg-app)] border-[var(--border)] opacity-40")}>Crítica</button>
                        </div>
                      </div>
                      <div className="space-y-2 relative">
                        <Label className="text-[10px] font-black uppercase opacity-30 px-2">Localización del Brote</Label>
                        <Input placeholder="BUSCAR CIUDAD..." className="h-14 bg-[var(--bg-app)] border-[var(--border)] rounded-2xl font-bold uppercase" value={locationSearch} onChange={(e) => { setLocationSearch(e.target.value); if (selectedCoords) setSelectedCoords(null); }} />
                        {locationResults.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden">
                            {locationResults.map((res, i) => (
                              <button key={i} onClick={() => selectLocation(res)} className="w-full p-4 text-left text-[10px] font-bold uppercase hover:bg-[#22c55e]/10 border-b border-[var(--border)] last:border-0">
                                {res.display_name}
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedCoords && <p className="text-[9px] text-[#22c55e] font-black uppercase mt-1 px-2">✓ Punto GPS Confirmado: {selectedProvince}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase opacity-30 px-2">Observaciones de Campo</Label>
                        <Textarea value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} className="h-20 bg-[var(--bg-app)] border-[var(--border)] rounded-2xl text-[10px] uppercase" placeholder="NOTAS ADICIONALES..." />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setWizardStep(4)} className="h-14 flex-1 rounded-2xl font-black uppercase text-[10px]">Atrás</Button>
                        <Button onClick={handleReportSubmit} disabled={!selectedPriority || !selectedCoords || isPending} className="h-14 flex-[2] bg-[#22c55e] text-black rounded-2xl font-black uppercase">Publicar Informe</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* --- CIERRE FINAL (Default) --- */
            <div className="flex-1" />
          )}
        </div>

        {/* DIÁLOGO DE DETALLE */}
        <Dialog open={!!selectedOutbreak} onOpenChange={() => setSelectedOutbreak(null)}>
          <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] max-w-lg rounded-[2.5rem] overflow-hidden p-0 shadow-2xl">
            {selectedOutbreak && (
              <div className="flex flex-col">
                <div className={cn("h-40 p-8 flex flex-col justify-end", 
                  selectedOutbreak.priority === 'High' ? "bg-red-500/20" : 
                  selectedOutbreak.priority === 'Medium' ? "bg-orange-500/20" : "bg-yellow-500/20")}>
                  <Badge className="w-fit mb-2 uppercase font-black">{selectedOutbreak.priority}</Badge>
                  <DialogTitle className="text-3xl font-black uppercase leading-tight tracking-tighter">{selectedOutbreak.diseaseName}</DialogTitle>
                  <p className="opacity-60 text-[10px] font-bold uppercase mt-1 flex items-center gap-1"><MapPin size={10} /> {selectedOutbreak.locationDescription}</p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="p-4 bg-[var(--bg-app)] rounded-2xl border border-[var(--border)] text-xs opacity-80 uppercase leading-relaxed font-mono">
                    {selectedOutbreak.description || "Sin descripción de campo disponible."}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl h-12 uppercase font-black text-[10px]" onClick={() => setSelectedOutbreak(null)}>Cerrar</Button>
                    <Button variant="destructive" className="flex-1 rounded-xl h-12 uppercase font-black text-[10px] gap-2 shadow-lg shadow-red-500/20" onClick={() => handleDeleteOutbreak(selectedOutbreak.id)}>
                      <Trash2 size={14} /> Eliminar Registro
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* BOTÓN REVELAR PANELES */}
      {isPanelsHidden && (
        <Button variant="secondary" size="icon" onClick={() => setIsPanelsHidden(false)} className="absolute top-6 left-6 z-50 bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border)] rounded-full">
          <Menu size={20} className="text-[#22c55e]" />
        </Button>
      )}
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300",
      active ? "bg-[#22c55e]/10 text-[#22c55e] shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]" : "text-[var(--text-main)] opacity-40 hover:opacity-100"
    )}>
      <span>{icon}</span>
      <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_10px_#22c55e]" />}
    </button>
  );
}