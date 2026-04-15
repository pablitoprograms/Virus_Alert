
"use client";

import React, { useState, useTransition, useEffect } from 'react';
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
  Search
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

const WorldMap = dynamic(() => import('./WorldMap').then((mod) => mod.WorldMap), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#000000] flex items-center justify-center text-white/20 text-xs font-black uppercase tracking-[0.4em]">Cargando red satelital...</div>
});

const OutbreakHeatmap = dynamic(() => import('./OutbreakHeatmap').then((mod) => mod.OutbreakHeatmap), {
  ssr: false
});

const RecentAlerts = dynamic(() => import('./RecentAlerts').then((mod) => mod.RecentAlerts), {
  ssr: false
});

type DashboardView = 'dashboard' | 'map' | 'reports';
type PriorityLevel = 'High' | 'Medium' | 'Low';

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

const DISEASES_LIST = [
  "Antrax", "Botulismo", "Brucelosis", "Chikungunya", "Cólera", "COVID-19", 
  "Dengue", "Difteria", "Ébola", "Encefalitis Japonesa", "Fiebre Amarilla", 
  "Fiebre de Lassa", "Fiebre de Marburgo", "Fiebre del Nilo Occidental", 
  "Fiebre Hemorrágica de Crimea-Congo", "Fiebre Tifoidea", "Giardiasis", "Gonorrea", 
  "Gripe A (H1N1)", "Gripe Aviar (H5N1)", "Hepatitis A", "Hepatitis B", "Hepatitis C", 
  "Herpes Zóster", "Legionelosis", "Lepra", "Leptospirosis", "Listeriosis", 
  "Malaria", "Meningitis Meningocócica", "Mpox (Viruela del Mono)", 
  "Neumonía Neumocócica", "Peste Bubónica", "Polio", "Rabia", "Rubéola", 
  "Salmonelosis", "Sarampión", "SARS", "Shigelosis", "Sífilis", "Tetanos", 
  "Tos Ferina", "Toxoplasmosis", "Tuberculosis", "Tularemia", "Varicela", 
  "VIH/SIDA", "Virus del Zika"
].sort((a, b) => a.localeCompare(b, 'es'));

const SYMPTOMS_LIST = [
  "Anorexia", "Artralgia (Dolor articular)", "Cefalea (Dolor de cabeza)", 
  "Cianosis (Coloración azulada)", "Congestión nasal", "Conjuntivitis", 
  "Convulsiones", "Deshidratación", "Diarrea acuosa", "Diarrea con sangre", 
  "Dificultad respiratoria (Disnea)", "Dolor abdominal", "Dolor de garganta", 
  "Dolor lumbar", "Dolor muscular (Mialgia)", "Dolor torácico", 
  "Erupciones cutáneas (Exantema)", "Escalofríos", "Estornudos", 
  "Fatiga extrema (Astenia)", "Fiebre alta", "Hemorragias", 
  "Ictericia (Piel amarillenta)", "Inflamación de ganglios (Linfadenopatía)", 
  "Mareos", "Náuseas", "Parálisis", "Pérdida de olfato (Anosmia)", 
  "Pérdida de gusto (Ageusia)", "Rigidez de nuca", "Sangrado de encías", 
  "Sudoración nocturna", "Tos con sangre (Hemoptisis)", "Tos seca", "Vómitos"
].sort((a, b) => a.localeCompare(b, 'es'));

export default function GlobalPulseDashboard() {
  const [isPanelsHidden, setIsPanelsHidden] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [selectedOutbreak, setSelectedOutbreak] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [reportDescription, setReportDescription] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSuggestedDisease, setAiSuggestedDisease] = useState<string | null>(null);

  // Firestore Data
  const outbreaksQuery = useMemoFirebase(() => {
    return query(collection(db, 'outbreaks'), orderBy('reportedDate', 'desc'), limit(50));
  }, [db]);
  const { data: outbreaks } = useCollection(outbreaksQuery);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has salido de la terminal VirusAlert correctamente." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cerrar la sesión." });
    }
  };

  const handleDeleteOutbreak = (id: string) => {
    if (!id) return;
    startTransition(() => {
      const docRef = doc(db, 'outbreaks', id);
      deleteDocumentNonBlocking(docRef);
      setSelectedOutbreak(null);
      toast({ title: "Registro Eliminado", description: "El informe ha sido borrado de la red." });
    });
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAutodetectLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "No disponible", description: "Tu navegador no soporta geolocalización." });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let closest = "";
        let minDistance = Infinity;
        for (const [name, [pLat, pLng]] of Object.entries(PROVINCIA_COORDINATES)) {
          const dist = Math.sqrt(Math.pow(latitude - pLat, 2) + Math.pow(longitude - pLng, 2));
          if (dist < minDistance) {
            minDistance = dist;
            closest = name;
          }
        }
        setSelectedProvince(closest);
        setIsLocating(false);
        toast({ title: "Ubicación Detectada", description: `Te encuentras cerca de ${closest}.` });
      },
      () => {
        setIsLocating(false);
        toast({ variant: "destructive", title: "Error", description: "No se pudo acceder a tu ubicación." });
      }
    );
  };

  // Heuristic logic for AI suggestion
  const getAiSuggestion = (symptoms: string[]) => {
    if (symptoms.includes('Fiebre alta') && symptoms.includes('Tos seca') && symptoms.includes('Pérdida de olfato (Anosmia)')) {
      return "COVID-19";
    }
    if (symptoms.includes('Fiebre alta') && symptoms.includes('Artralgia (Dolor articular)') && symptoms.includes('Erupciones cutáneas (Exantema)')) {
      return "Dengue";
    }
    if (symptoms.includes('Fiebre alta') && symptoms.includes('Hemorragias')) {
      return "Ébola";
    }
    if (symptoms.includes('Fiebre alta') && symptoms.includes('Diarrea acuosa') && symptoms.includes('Deshidratación')) {
      return "Cólera";
    }
    return "Virus no identificado";
  };

  const nextStep = () => {
    if (wizardStep === 1) {
      setIsAiAnalyzing(true);
      setWizardStep(2);
      setTimeout(() => {
        const suggestion = getAiSuggestion(selectedSymptoms);
        setAiSuggestedDisease(suggestion);
        if (suggestion !== "Virus no identificado") {
          setSelectedDisease(suggestion);
        }
        setIsAiAnalyzing(false);
        setWizardStep(3);
      }, 2500);
    } else {
      setWizardStep(prev => prev + 1);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvince || !selectedDisease || !selectedPriority) return;

    startTransition(() => {
      const coords = PROVINCIA_COORDINATES[selectedProvince];
      const newOutbreak = {
        diseaseName: selectedDisease,
        locationDescription: `${selectedProvince}, España`,
        latitude: coords[0],
        longitude: coords[1],
        countryCode: 'ES',
        category: "Viral",
        priority: selectedPriority,
        intensityLevel: selectedPriority === 'High' ? 85 : selectedPriority === 'Medium' ? 60 : 35,
        status: "New",
        symptoms: selectedSymptoms,
        description: reportDescription,
        reportedDate: new Date().toISOString()
      };

      addDocumentNonBlocking(collection(db, 'outbreaks'), newOutbreak);

      setWizardStep(1);
      setReportDescription("");
      setSelectedDisease("");
      setSelectedProvince("");
      setSelectedPriority(null);
      setSelectedSymptoms([]);
      setAiSuggestedDisease(null);
      setCurrentView('dashboard');

      toast({
        title: "Transmitiendo datos cifrados...",
        description: `Protocolo ${selectedPriority} activado en ${selectedProvince}.`,
      });
    });
  };

  const isStepValid = () => {
    switch (wizardStep) {
      case 1: return selectedSymptoms.length > 0;
      case 2: return false; // Transitioning
      case 3: return !!selectedDisease;
      case 4: return !!selectedPriority && !!selectedProvince && reportDescription.length > 10;
      default: return false;
    }
  };

  return (
    <div className="relative h-screen w-screen flex bg-[#000000] text-white overflow-hidden font-body">
      
      {isPanelsHidden && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsPanelsHidden(false)}
          className="absolute top-6 left-6 z-50 bg-[#0c0d0f]/80 backdrop-blur-md border border-white/10 hover:bg-[#1a1b1e] transition-all shadow-2xl rounded-full"
        >
          <Menu size={20} className="text-[#22c55e]" />
        </Button>
      )}

      <aside className={cn(
        "relative z-40 flex flex-col bg-[#000000] border-r border-white/5 transition-all duration-500 ease-in-out shadow-2xl",
        isPanelsHidden ? "w-0 -translate-x-full opacity-0 overflow-hidden" : "w-72 translate-x-0 opacity-100"
      )}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#166534] to-[#22c55e] flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Globe className="text-[#0a0a0c]" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">VirusAlert</h1>
            <p className="text-[9px] font-bold text-[#22c55e] uppercase tracking-widest">Sistemas España</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Alertas Recientes" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<Globe size={20} />} label="Mapa Táctico" active={currentView === 'map'} onClick={() => setCurrentView('map')} />
          <NavItem icon={<FileText size={20} />} label="Informes" active={currentView === 'reports'} onClick={() => { setCurrentView('reports'); setWizardStep(1); }} />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="bg-white/[0.02] rounded-2xl p-4 flex items-center gap-3 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/10 shrink-0">
              <UserCircle size={24} className="text-white/40" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none mb-1">Operador</p>
              <p className="text-xs font-bold text-white/70 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl py-6">
            <LogOut size={18} />
            <span className="text-[11px] font-black tracking-widest uppercase">Cerrar Sesión</span>
          </Button>
        </div>

        <div className="p-6 border-t border-white/5">
          <Button variant="ghost" onClick={() => setIsPanelsHidden(true)} className="w-full justify-start gap-3 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-white py-6 rounded-xl">
            <PanelLeftClose size={18} /> Ocultar Paneles
          </Button>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-row min-w-0 bg-[#000000]">
        
        <header className="absolute top-0 left-0 w-full z-20 px-8 py-8 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto">
            <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-1">Vigilancia Nacional</h2>
            <p className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
              {currentView === 'dashboard' ? 'Alertas Críticas' : 
               currentView === 'map' ? 'Mapa Táctico' : 'Diagnóstico por IA'}
            </p>
          </div>
        </header>

        <div className="w-full h-full relative">
          {currentView === 'dashboard' ? (
            <div className="absolute inset-0 p-8 pt-36 overflow-hidden z-10 flex justify-center items-start">
              <div className="w-full max-w-4xl h-[calc(100vh-250px)] bg-[#0c0d0f]/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <RecentAlerts outbreaks={outbreaks || []} onSelect={(alert) => setSelectedOutbreak(alert)} onDelete={handleDeleteOutbreak} />
              </div>
            </div>
          ) : currentView === 'reports' ? (
            <div className="absolute inset-0 p-4 pt-24 z-10 flex flex-col items-center justify-center">
              <div className="w-full max-w-3xl max-h-[85vh] bg-[#0c0d0f] border border-white/5 rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden relative">
                
                <div className="px-8 pt-8 pb-4 space-y-3 shrink-0">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest">Paso {wizardStep === 2 ? 1 : wizardStep > 2 ? wizardStep - 1 : wizardStep} de 3</span>
                    <span className="text-[9px] font-bold text-white/20 uppercase">{Math.round((wizardStep/4)*100)}% Completado</span>
                  </div>
                  <Progress value={(wizardStep / 4) * 100} className="h-1 bg-white/5" />
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                  <form onSubmit={handleReportSubmit} className="space-y-6">
                    
                    {wizardStep === 1 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold">Entrada de Síntomas</h3>
                          <p className="text-xs text-white/40">Seleccione todos los síntomas detectados en el foco.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {SYMPTOMS_LIST.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSymptom(s)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border",
                                selectedSymptoms.includes(s) 
                                  ? "bg-[#22c55e] border-[#22c55e] text-black shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                              )}
                            >{s}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {wizardStep === 2 && (
                      <div className="h-64 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
                        <div className="relative">
                          <BrainCircuit size={48} className="text-[#22c55e] animate-pulse" />
                          <div className="absolute inset-0 border-4 border-[#22c55e]/20 rounded-full animate-ping scale-150" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.4em] text-[#22c55e]">Analizando síntomas...</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">Consultando base de datos VirusAlert</p>
                        </div>
                      </div>
                    )}

                    {wizardStep === 3 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold">Validación Médica</h3>
                          <p className="text-xs text-white/40">La IA ha analizado los síntomas y sugiere lo siguiente.</p>
                        </div>

                        {aiSuggestedDisease && (
                          <div className={cn(
                            "p-6 rounded-3xl border border-teal-500/20 bg-teal-500/5 space-y-3",
                            aiSuggestedDisease === "Virus no identificado" && "border-violet-500/20 bg-violet-500/5"
                          )}>
                            <div className="flex items-center gap-3">
                              <Search size={18} className="text-[#22c55e]" />
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Análisis automático VirusAlert</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-white/60">Basado en {selectedSymptoms.length} síntomas analizados, existe una alta probabilidad de:</p>
                              <h4 className="text-2xl font-black text-[#22c55e] uppercase tracking-tight">{aiSuggestedDisease}</h4>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 pt-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Confirmar o Cambiar Patógeno</Label>
                          <Select value={selectedDisease} onValueChange={setSelectedDisease}>
                            <SelectTrigger className="h-12 bg-white/[0.03] border-white/10 rounded-xl text-base font-medium">
                              <SelectValue placeholder="Seleccionar patógeno..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0c0d0f] border-white/10 text-white max-h-[300px]">
                              {DISEASES_LIST.map(d => (
                                <SelectItem key={d} value={d} className="py-2.5 focus:bg-[#22c55e]/10">{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {wizardStep === 4 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold">Nivel de Riesgo y Ubicación</h3>
                          <p className="text-xs text-white/40">Determine la gravedad y finalice con la localización exacta.</p>
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Gravedad de la Alerta</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <RiskButtonSmall 
                              active={selectedPriority === 'Low'} 
                              color="yellow" 
                              label="Vigilancia" 
                              onClick={() => setSelectedPriority('Low')} 
                            />
                            <RiskButtonSmall 
                              active={selectedPriority === 'Medium'} 
                              color="orange" 
                              label="Alerta" 
                              onClick={() => setSelectedPriority('Medium')} 
                            />
                            <RiskButtonSmall 
                              active={selectedPriority === 'High'} 
                              color="red" 
                              label="Emergencia" 
                              onClick={() => setSelectedPriority('High')} 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Provincia de Origen</Label>
                            <div className="flex gap-2">
                              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                                <SelectTrigger className="h-12 bg-white/[0.03] border-white/10 rounded-xl flex-1">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0c0d0f] border-white/10 text-white">
                                  {Object.keys(PROVINCIA_COORDINATES).sort().map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleAutodetectLocation}
                                disabled={isLocating}
                                className="h-12 w-12 rounded-xl border-white/10 bg-white/5 hover:bg-[#22c55e]/10"
                              >
                                {isLocating ? <Loader2 className="animate-spin text-[#22c55e]" size={18} /> : <Navigation size={18} className="text-[#22c55e]" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Descripción Clínica</Label>
                            <Textarea 
                              placeholder="Mínimo 10 caracteres describiendo el foco..." 
                              className="min-h-[80px] bg-white/[0.03] border-white/10 rounded-xl p-3 text-sm resize-none"
                              value={reportDescription}
                              onChange={(e) => setReportDescription(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {wizardStep !== 2 && (
                      <div className="flex gap-3 pt-2">
                        {wizardStep > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setWizardStep(wizardStep === 3 ? 1 : prev => prev - 1)}
                            className="h-12 flex-1 text-white/40 hover:text-white hover:bg-white/5 rounded-xl font-bold uppercase tracking-widest text-[9px]"
                          >
                            <ChevronLeft size={14} className="mr-1" /> Anterior
                          </Button>
                        )}
                        
                        {wizardStep < 4 ? (
                          <Button 
                            type="button" 
                            disabled={!isStepValid()}
                            onClick={nextStep}
                            className="h-12 flex-[2] bg-[#22c55e] hover:bg-[#22c55e]/90 text-black rounded-xl font-black uppercase tracking-[0.2em] text-[9px] shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                          >
                            {wizardStep === 1 ? 'Iniciar Análisis IA' : 'Siguiente'} <ChevronRight size={14} className="ml-1" />
                          </Button>
                        ) : (
                          <Button 
                            type="submit"
                            disabled={!isStepValid() || isPending}
                            className="h-12 flex-[2] bg-[#22c55e] hover:bg-[#22c55e]/90 text-black rounded-xl font-black uppercase tracking-[0.2em] text-[9px] shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                          >
                            {isPending ? <Loader2 className="animate-spin mr-2" size={14} /> : <Send size={14} className="mr-2" />}
                            Emitir Informe Crítico
                          </Button>
                        )}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <WorldMap>
              <OutbreakHeatmap data={outbreaks ? { outbreakClusters: outbreaks } : null} onSelectCluster={(cluster) => setSelectedOutbreak(cluster)} />
            </WorldMap>
          )}
        </div>

        <Dialog open={!!selectedOutbreak} onOpenChange={() => setSelectedOutbreak(null)}>
          <DialogContent className="bg-[#000000] border-white/10 text-white max-w-lg rounded-[2.5rem] overflow-hidden p-0 shadow-2xl">
            {selectedOutbreak && (
              <div className="flex flex-col">
                <div className={cn(
                  "h-48 p-10 flex flex-col justify-end relative overflow-hidden",
                  selectedOutbreak.priority === 'High' ? "bg-red-600/10" : "bg-orange-500/10"
                )}>
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                     <ShieldAlert size={120} />
                  </div>
                  <Badge className={cn(
                    "w-fit mb-4 uppercase font-black tracking-[0.2em] px-4 py-1.5 rounded-lg text-[9px]",
                    selectedOutbreak.priority === 'High' ? "bg-red-600" : "bg-orange-500"
                  )}>
                    {selectedOutbreak.priority === 'High' ? 'Nivel Crítico' : 'Alerta'}
                  </Badge>
                  <DialogTitle className="text-4xl font-black tracking-tighter leading-none">{selectedOutbreak.diseaseName}</DialogTitle>
                  <p className="text-white/40 text-xs mt-2 uppercase font-bold tracking-widest flex items-center gap-2">
                     <MapPin size={12} className="text-[#22c55e]" /> {selectedOutbreak.locationDescription}
                  </p>
                </div>
                
                <div className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <InfoItem icon={<Activity size={18} className="text-[#22c55e]" />} label="Estado" value={selectedOutbreak.status} />
                    <InfoItem icon={<Calendar size={18} className="text-[#22c55e]" />} label="Registro" value={new Date(selectedOutbreak.reportedDate).toLocaleDateString()} />
                  </div>
                  <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5">
                    <h4 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.3em] mb-3">Análisis Clínico</h4>
                    <p className="text-sm text-white/60 leading-relaxed">{selectedOutbreak.description || "Sin descripción adicional."}</p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 text-red-500 hover:text-red-400 font-black uppercase tracking-widest h-14 rounded-2xl text-[10px]" onClick={() => handleDeleteOutbreak(selectedOutbreak.id)}>
                      <Trash2 size={16} className="mr-2" /> Borrar
                    </Button>
                    <Button className="flex-[2] bg-[#22c55e] text-black font-black uppercase tracking-widest h-14 rounded-2xl text-[10px]" onClick={() => setSelectedOutbreak(null)}>Cerrar</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {isPending && (
          <div className="absolute inset-0 z-50 bg-[#000000]/80 backdrop-blur-2xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-8 text-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-[3px] border-[#22c55e]/10 rounded-full" />
                <div className="absolute inset-0 border-t-[3px] border-[#22c55e] rounded-full animate-spin shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
                <Globe className="absolute inset-0 m-auto text-[#22c55e]/50 animate-pulse" size={32} />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-black text-[#22c55e] uppercase tracking-[0.6em] block animate-pulse">Transmitiendo datos cifrados</span>
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] block">Protocolo de seguridad activo</span>
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
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative",
      active ? "bg-[#22c55e]/10 text-[#22c55e] shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" : "text-white/30 hover:text-white hover:bg-white/5"
    )}>
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-[#22c55e] drop-shadow-[0_0_8px_#22c55e]" : "text-white/20")}>{icon}</span>
      <span className={cn("text-[11px] font-black tracking-widest uppercase", active ? "text-[#22c55e]" : "")}>{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_12px_#22c55e]" />}
    </button>
  );
}

function RiskButtonSmall({ active, color, label, onClick }: { active: boolean, color: 'red' | 'orange' | 'yellow', label: string, onClick: () => void }) {
  const colors = {
    red: "border-red-600/20 text-red-600 bg-red-600/5",
    orange: "border-orange-500/20 text-orange-500 bg-orange-500/5",
    yellow: "border-yellow-500/20 text-yellow-500 bg-yellow-500/5"
  };
  const activeColors = {
    red: "bg-red-600 text-white border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.3)]",
    orange: "bg-orange-500 text-black border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]",
    yellow: "bg-yellow-500 text-black border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
  };

  return (
    <button 
      type="button" 
      onClick={onClick}
      className={cn(
        "w-full py-3 border rounded-xl text-center transition-all duration-300",
        active ? activeColors[color] : colors[color]
      )}
    >
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-white/30">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-sm font-bold text-white/90">{value}</p>
    </div>
  );
}
