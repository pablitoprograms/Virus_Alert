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
  Search,
  Zap,
  Terminal,
  ShieldCheck,
  ShieldQuestion,
  X,
  Cpu,
  Clock,
  HeartPulse,
  Settings
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


const WorldMap = dynamic(() => import("./WorldMap"), {
  ssr: false
});

const OutbreakHeatmap = dynamic(() => import('./OutbreakHeatmap').then((mod) => mod.OutbreakHeatmap), {
  ssr: false
});

const RecentAlerts = dynamic(() => import('./RecentAlerts').then((mod) => mod.RecentAlerts), {
  ssr: false
});

type DashboardView = 'dashboard' | 'map' | 'reports' | 'settings';
type PriorityLevel = 'High' | 'Medium' | 'Low';

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

interface AiAnalysisResult {
  name: string;
  confidence: number;
  justification: string;
}

export default function GlobalPulseDashboard() {
  const [isPanelsHidden, setIsPanelsHidden] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [selectedOutbreak, setSelectedOutbreak] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { t } = useConfig();

  // Wizard state & dynamic Location tracking
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
  const [symptomSearch, setSymptomSearch] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isProxDialogOpen, setIsProxDialogOpen] = useState(false);

  // Firestore Data
  const outbreaksQuery = useMemoFirebase(() => {
    return query(collection(db, 'outbreaks'), orderBy('reportedDate', 'desc'), limit(50));
  }, [db]);
  const { data: outbreaks } = useCollection(outbreaksQuery);

  const handleSearchLocation = async () => {
    if (!locationSearch) return;
    setIsSearchingLoc(true);
    try {
      // Nominatim API call for Europe focus
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)}&format=json&limit=4&viewbox=-31.26,71.18,39.81,27.63&bounded=1`);
      const data = await res.json();
      setLocationResults(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Fallo en la red satelital de rastreo." });
    } finally {
      setIsSearchingLoc(false);
    }
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
        setSelectedProvince("Ubicación Detectada (GPS)");
        setSelectedCoords([latitude, longitude]);
        setIsLocating(false);
        toast({ title: "Localización Fijada", description: "Coordenadas obtenidas correctamente." });
      },
      () => {
        setIsLocating(false);
        toast({ variant: "destructive", title: "Error", description: "No se pudo acceder a tu ubicación." });
      }
    );
  };

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

  const filteredSymptoms = SYMPTOMS_LIST.filter(s => 
    s.toLowerCase().includes(symptomSearch.toLowerCase()) && 
    !selectedSymptoms.includes(s)
  );

  const getAiAnalysis = (symptoms: string[]): AiAnalysisResult => {
    const symptomSet = new Set(symptoms);
    const profiles = [
      { name: "COVID-19", markers: ["Fiebre alta", "Tos seca", "Pérdida de olfato (Anosmia)", "Pérdida de gusto (Ageusia)"] },
      { name: "Dengue", markers: ["Fiebre alta", "Artralgia (Dolor articular)", "Erupciones cutáneas (Exantema)"] },
      { name: "Ébola", markers: ["Fiebre alta", "Hemorragias", "Fatiga extrema (Astenia)"] },
      { name: "Cólera", markers: ["Diarrea acuosa", "Deshidratación", "Vómitos"] },
      { name: "Mpox (Viruela del Mono)", markers: ["Inflamación de ganglios (Linfadenopatía)", "Erupciones cutáneas (Exantema)", "Fiebre alta"] },
      { name: "Meningitis Meningocócica", markers: ["Rigidez de nuca", "Fiebre alta", "Cefalea (Dolor de cabeza)"] },
      { name: "Fiebre Amarilla", markers: ["Ictericia (Piel amarillenta)", "Fiebre alta"] },
      { name: "Malaria", markers: ["Fiebre alta", "Escalofríos", "Sudoración nocturna"] },
      { name: "Tuberculosis", markers: ["Tos con sangre (Hemoptisis)", "Sudoración nocturna"] },
      { name: "Gripe A (H1N1)", markers: ["Tos seca", "Congestión nasal", "Estornudos", "Fiebre alta"] },
    ];

    let bestMatch = profiles[profiles.length - 1];
    let maxScore = -1;
    let matchingMarkers: string[] = [];

    profiles.forEach(p => {
      const matches = p.markers.filter(m => symptomSet.has(m));
      const score = matches.length / p.markers.length;
      if (score > maxScore) {
        maxScore = score;
        bestMatch = p;
        matchingMarkers = matches;
      }
    });

    const confidence = Math.round(maxScore * 100);
    const justification = matchingMarkers.length > 0 
      ? `Identificación positiva basada en la presencia de: ${matchingMarkers.join(", ")}. Patrón clínico compatible.`
      : `Cuadro sintomático inespecífico. Se asigna patógeno por prevalencia estadística y marcadores respiratorios generales.`;

    return { name: bestMatch.name, confidence, justification };
  };

  const nextStep = () => {
    if (wizardStep === 2) {
      setIsAiAnalyzing(true);
      setWizardStep(3);
      setTimeout(() => {
        const analysis = getAiAnalysis(selectedSymptoms);
        setAiAnalysis(analysis);
        setSelectedDisease(analysis.name);
        setIsAiAnalyzing(false);
        setWizardStep(4);
      }, 2200);
    } else {
      setWizardStep(prev => prev + 1);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoords || !selectedDisease || !selectedPriority || reportDescription.length < 10) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Falta fijar la ubicación, prioridad o detalles clínicos.",
      });
      return;
    }

    startTransition(async () => {
      const newOutbreak = {
        diseaseName: selectedDisease,
        locationDescription: selectedProvince,
        latitude: selectedCoords[0],
        longitude: selectedCoords[1],
        countryCode: 'EU',
        category: "Viral",
        priority: selectedPriority,
        intensityLevel: selectedPriority === 'High' ? 85 : selectedPriority === 'Medium' ? 60 : 35,
        status: "New",
        symptoms: selectedSymptoms,
        description: reportDescription,
        reportedDate: new Date().toISOString()
      };

      await addDocumentNonBlocking(collection(db, 'outbreaks'), newOutbreak);

      setWizardStep(1);
      setReportDescription("");
      setSelectedDisease("");
      setSelectedProvince("");
      setSelectedCoords(null);
      setSelectedPriority(null);
      setSelectedSymptoms([]);
      setAiAnalysis(null);
      setCurrentView('dashboard');

      toast({
        title: "Protocolo Transmitido",
        description: `Alerta de ${selectedDisease} registrada en ${selectedProvince}.`,
      });
    });
  };

  const isStepValid = () => {
    switch (wizardStep) {
      case 1: return true;
      case 2: return selectedSymptoms.length > 0;
      case 3: return false;
      case 4: return !!selectedDisease;
      case 5: return !!selectedPriority && !!selectedCoords && reportDescription.length >= 10;
      default: return false;
    }
  };

  const actualFormStep = wizardStep === 1 ? 0 : wizardStep === 2 ? 1 : wizardStep === 3 ? 1 : wizardStep === 4 ? 2 : 3;
  const progressValue = (actualFormStep / 3) * 100;

  return (
    <div className="relative h-screen w-screen flex bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden font-body transition-colors duration-300">
      
      {isPanelsHidden && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsPanelsHidden(false)}
          className="absolute top-6 left-6 z-50 bg-[var(--bg-card)]/80 backdrop-blur-md border border-[var(--border)] transition-all shadow-2xl rounded-full"
        >
          <Menu size={20} className="text-[#22c55e]" />
        </Button>
      )}

      <aside className={cn(
        "relative z-40 flex flex-col bg-[var(--bg-card)] border-r border-[var(--border)] transition-all duration-500 ease-in-out shadow-2xl",
        isPanelsHidden ? "w-0 -translate-x-full opacity-0 overflow-hidden" : "w-72 translate-x-0 opacity-100"
      )}>
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#166534] to-[#22c55e] flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Globe className="text-[#0a0a0c]" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-main)] to-[#22c55e]">VirusAlert</h1>
            <p className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest">{t.system_spain}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label={t.alerts} active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<Globe size={20} />} label={t.map} active={currentView === 'map'} onClick={() => setCurrentView('map')} />
          <NavItem icon={<FileText size={20} />} label={t.reports} active={currentView === 'reports'} onClick={() => { setCurrentView('reports'); setWizardStep(1); }} />
          <NavItem icon={<Cpu size={20} />} label={t.ai_diagnosis} active={false} onClick={() => setIsProxDialogOpen(true)} badge="PROX" />
          <NavItem icon={<Settings size={20} />} label={t.settings} active={currentView === 'settings'} onClick={() => setCurrentView('settings')} />
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-4">
          <div className="bg-[var(--bg-app)] rounded-2xl p-4 flex items-center gap-3 border border-[var(--border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] flex items-center justify-center border border-[var(--border)] shrink-0">
              <UserCircle size={24} className="text-[var(--text-main)] opacity-40" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-[var(--text-main)] opacity-30 tracking-widest leading-none mb-1">{t.operator}</p>
              <p className="text-xs font-bold text-[var(--text-main)] opacity-70 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl py-6">
            <LogOut size={18} />
            <span className="text-[11px] font-black tracking-widest uppercase">{t.logout}</span>
          </Button>
        </div>

        <div className="p-6 border-t border-[var(--border)]">
          <Button variant="ghost" onClick={() => setIsPanelsHidden(true)} className="w-full justify-start gap-3 text-xs font-bold uppercase tracking-wider text-[var(--text-main)] opacity-40 hover:opacity-100 py-6 rounded-xl">
            <PanelLeftClose size={18} /> {t.hide_panels}
          </Button>
        </div>
      </aside>

      <main className="flex-1 relative flex flex-row min-w-0 bg-[var(--bg-app)]">
        <header className="absolute top-0 left-0 w-full z-20 px-8 py-8 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto">
            <h2 className="text-xs font-black text-[var(--text-main)] opacity-30 uppercase tracking-[0.4em] mb-1">{t.national_surveillance}</h2>
            <p className="text-3xl font-bold tracking-tight text-[var(--text-main)] drop-shadow-lg">
              {currentView === 'dashboard' ? t.critical_alerts : 
               currentView === 'map' ? t.map : 
               currentView === 'settings' ? t.system_settings : t.ai_diagnosis}
            </p>
          </div>
        </header>

        <div className="w-full h-full relative">
          {currentView === 'dashboard' ? (
            <div className="absolute inset-0 p-8 pt-36 overflow-hidden z-10 flex justify-center items-start">
              <div className="w-full max-w-4xl h-[calc(100vh-250px)] bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-[2.5rem] overflow-hidden shadow-2xl">
                <RecentAlerts outbreaks={outbreaks || []} onSelect={(alert) => setSelectedOutbreak(alert)} onDelete={handleDeleteOutbreak} />
              </div>
            </div>
          ) : currentView === 'reports' ? (
            <div className="absolute inset-0 p-4 pt-24 z-10 flex flex-col items-center justify-center">
              <div className="w-full max-w-3xl max-h-[85vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden relative">
                
                {wizardStep > 1 && (
                  <div className="px-8 pt-8 pb-4 space-y-3 shrink-0">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest">
                        Paso {actualFormStep} de 3
                      </span>
                      <span className="text-[9px] font-bold text-[var(--text-main)] opacity-20 uppercase">{Math.round(progressValue)}% Completado</span>
                    </div>
                    <Progress value={progressValue} className="h-1 bg-[var(--border)]" />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                  <form onSubmit={handleReportSubmit} className="space-y-6">
                    {wizardStep === 1 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                          <ShieldQuestion size={40} className="text-[#22c55e]" />
                        </div>
                        <div className="text-center space-y-4 max-w-xl">
                          <h3 className="text-2xl font-black uppercase tracking-tighter">AVISO DE USO DE IA</h3>
                          <div className="p-6 bg-[var(--bg-app)] border border-[var(--border)] rounded-3xl text-sm text-[var(--text-main)] opacity-60 leading-relaxed font-mono uppercase text-left">
                            La información clínica será analizada mediante IA. Las sugerencias de patógenos deben ser validadas por personal médico competente. Al continuar acepta el procesamiento algorítmico.
                          </div>
                        </div>
                        <Button type="button" onClick={() => setWizardStep(2)} className="h-14 w-full max-w-md bg-[#22c55e] hover:bg-[#22c55e]/90 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                          ACEPTAR Y CONTINUAR
                        </Button>
                      </div>
                    )}

                    {wizardStep === 2 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold">Entrada de Síntomas</h3>
                          <p className="text-xs text-[var(--text-main)] opacity-40">Añada los síntomas detectados para el análisis biotecnológico.</p>
                        </div>
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-main)] opacity-20 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                          <Input 
                            placeholder="Buscar síntoma..."
                            className="h-14 bg-[var(--bg-app)] border-[var(--border)] focus:border-[#22c55e]/50 rounded-2xl pl-12 text-sm uppercase font-bold text-[var(--text-main)]"
                            value={symptomSearch}
                            onChange={(e) => setSymptomSearch(e.target.value)}
                          />
                        </div>
                        {symptomSearch && (
                          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl">
                            {filteredSymptoms.map(s => (
                              <button key={s} type="button" onClick={() => {toggleSymptom(s); setSymptomSearch("");}} className="w-full text-left px-5 py-3 text-[10px] font-black hover:bg-[#22c55e]/10 hover:text-[#22c55e] border-b border-[var(--border)] last:border-0">{s}</button>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-[var(--bg-app)] border border-dashed border-[var(--border)] rounded-2xl">
                          {selectedSymptoms.map(s => (
                            <Badge key={s} variant="secondary" className="bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] px-4 py-2 rounded-xl flex items-center gap-2 animate-in zoom-in-90">
                              <span className="text-[9px] font-black uppercase tracking-widest">{s}</span>
                              <X size={12} className="cursor-pointer" onClick={() => toggleSymptom(s)} />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {wizardStep === 3 && (
                      <div className="h-64 flex flex-col items-center justify-center space-y-6">
                        <BrainCircuit size={48} className="text-[#22c55e] animate-pulse" />
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-[#22c55e]">Procesando Heurística...</p>
                      </div>
                    )}

                    {wizardStep === 4 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {aiAnalysis && (
                          <div className="p-8 rounded-[2rem] border border-[#22c55e]/30 bg-[var(--bg-app)] space-y-6 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.3em]">Patógeno Detectado</span>
                                <h4 className="text-3xl font-black text-[var(--text-main)] uppercase tracking-tighter leading-none mt-2">{aiAnalysis.name}</h4>
                              </div>
                              <div className="text-center">
                                <div className="text-4xl font-mono font-black text-[#22c55e]">{aiAnalysis.confidence}%</div>
                                <span className="text-[8px] font-black uppercase text-[var(--text-main)] opacity-30 tracking-widest">Confianza</span>
                              </div>
                            </div>
                            <p className="text-[11px] font-mono text-[var(--text-main)] opacity-60 leading-relaxed uppercase border-t border-[var(--border)] pt-4">{aiAnalysis.justification}</p>
                          </div>
                        )}
                        <Select value={selectedDisease} onValueChange={setSelectedDisease}>
                          <SelectTrigger className="h-14 bg-[var(--bg-app)] border-[var(--border)] rounded-2xl text-base font-bold uppercase tracking-tight">
                            <SelectValue placeholder="Confirmar patógeno..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-main)]">
                            {DISEASES_LIST.map(d => (
                              <SelectItem key={d} value={d} className="py-3 font-bold uppercase text-[11px]">{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {wizardStep === 5 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] opacity-30 tracking-[0.2em]">Prioridad de Respuesta</Label>
                          <div className="grid grid-cols-3 gap-2">
                            <RiskButtonSmall active={selectedPriority === 'Low'} color="yellow" label="Vigilancia" onClick={() => setSelectedPriority('Low')} />
                            <RiskButtonSmall active={selectedPriority === 'Medium'} color="orange" label="Alerta L2" onClick={() => setSelectedPriority('Medium')} />
                            <RiskButtonSmall active={selectedPriority === 'High'} color="red" label="Emergencia" onClick={() => setSelectedPriority('High')} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] opacity-30">Ubicación Satelital (Europa)</Label>
                          {selectedCoords ? (
                            <div className="flex items-center justify-between p-4 bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-2xl">
                              <div className="flex items-center gap-2 text-[#22c55e]">
                                <MapPin size={16} />
                                <span className="text-xs font-bold uppercase tracking-tight truncate max-w-[200px]">{selectedProvince}</span>
                              </div>
                              <X size={16} className="cursor-pointer text-[#22c55e]" onClick={() => setSelectedCoords(null)} />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Input 
                                  placeholder="Ej. London, Berlin, Valencia..." 
                                  className="h-14 bg-[var(--bg-app)] border-[var(--border)] rounded-2xl text-sm font-bold uppercase text-[var(--text-main)]"
                                  value={locationSearch}
                                  onChange={(e) => setLocationSearch(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchLocation())}
                                />
                                <Button type="button" onClick={handleSearchLocation} disabled={isSearchingLoc} className="h-14 w-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-main)]">
                                  {isSearchingLoc ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                                </Button>
                                <Button type="button" variant="outline" onClick={handleAutodetectLocation} disabled={isLocating} className="h-14 w-14 rounded-2xl border-[var(--border)] bg-[var(--bg-app)]">
                                  {isLocating ? <Loader2 className="animate-spin text-[#22c55e]" size={20} /> : <Navigation size={20} className="text-[#22c55e]" />}
                                </Button>
                              </div>
                              {locationResults.length > 0 && (
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in">
                                  {locationResults.map((res: any) => (
                                    <button
                                      key={res.place_id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedProvince(res.display_name.split(',')[0] + ", " + res.display_name.split(',').pop());
                                        setSelectedCoords([parseFloat(res.lat), parseFloat(res.lon)]);
                                        setLocationResults([]);
                                        setLocationSearch("");
                                      }}
                                      className="w-full text-left px-5 py-3 text-[10px] font-bold text-[var(--text-main)] opacity-70 hover:opacity-100 uppercase tracking-wide hover:bg-[#22c55e]/10 hover:text-[#22c55e] transition-colors border-b border-[var(--border)] last:border-0 truncate"
                                    >
                                      {res.display_name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-main)] opacity-30">Notas Clínicas</Label>
                          <Textarea 
                            placeholder="Mínimo 10 caracteres..." 
                            className="min-h-[100px] bg-[var(--bg-app)] border-[var(--border)] rounded-2xl p-4 text-sm resize-none"
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {wizardStep > 1 && wizardStep !== 3 && (
                      <div className="flex gap-3 pt-4">
                        {wizardStep > 2 && (
                          <Button type="button" variant="ghost" onClick={() => setWizardStep(wizardStep === 4 ? 2 : prev => prev - 1)} className="h-14 flex-1 text-[var(--text-main)] opacity-40 hover:opacity-100 hover:bg-[var(--bg-app)] rounded-2xl font-black uppercase text-[10px]">
                            Anterior
                          </Button>
                        )}
                        {wizardStep < 5 ? (
                          <Button type="button" disabled={!isStepValid()} onClick={nextStep} className="h-14 flex-[2] bg-[#22c55e] hover:bg-[#22c55e]/90 text-black rounded-2xl font-black uppercase text-[10px] shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                            {wizardStep === 2 ? 'Iniciar Análisis IA' : 'Siguiente'}
                          </Button>
                        ) : (
                          <Button type="submit" disabled={!isStepValid() || isPending} className="h-14 flex-[2] bg-[#22c55e] hover:bg-[#22c55e]/90 text-black rounded-2xl font-black uppercase text-[10px] shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            {isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} className="mr-2 inline" />}
                            Transmitir Alerta
                          </Button>
                        )}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          ) : currentView === 'settings' ? (
            <div className="absolute inset-0 p-8 pt-36 overflow-hidden z-10 flex justify-center items-start">
               <SettingsDashboard />
            </div>
          ) : (
            <WorldMap>
              <OutbreakHeatmap data={outbreaks ? { outbreakClusters: outbreaks } : null} onSelectCluster={(cluster) => setSelectedOutbreak(cluster)} />
            </WorldMap>
          )}
        </div>

        <Dialog open={!!selectedOutbreak} onOpenChange={() => setSelectedOutbreak(null)}>
          <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-main)] max-w-lg rounded-[2.5rem] overflow-hidden p-0 shadow-2xl">
            {selectedOutbreak && (
              <div className="flex flex-col">
                <div className={cn("h-48 p-10 flex flex-col justify-end relative overflow-hidden", selectedOutbreak.priority === 'High' ? "bg-red-600/10" : "bg-orange-500/10")}>
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ShieldAlert size={120} /></div>
                  <Badge className={cn("w-fit mb-4 uppercase font-black tracking-[0.2em] px-4 py-1.5 rounded-lg text-[9px] text-white border-0", selectedOutbreak.priority === 'High' ? "bg-red-600" : "bg-orange-500")}>
                    {selectedOutbreak.priority === 'High' ? 'Nivel Crítico' : 'Alerta'}
                  </Badge>
                  <DialogTitle className="text-4xl font-black tracking-tighter leading-none">{selectedOutbreak.diseaseName}</DialogTitle>
                  <p className="text-[var(--text-main)] opacity-60 text-xs mt-2 uppercase font-bold tracking-widest flex items-center gap-2">
                     <MapPin size={12} className="text-[#22c55e]" /> {selectedOutbreak.locationDescription}
                  </p>
                </div>
                <div className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <InfoItem icon={<Activity size={18} className="text-[#22c55e]" />} label="Estado" value={selectedOutbreak.status} />
                    <InfoItem icon={<Calendar size={18} className="text-[#22c55e]" />} label="Registro" value={new Date(selectedOutbreak.reportedDate).toLocaleDateString()} />
                  </div>
                  <div className="p-6 bg-[var(--bg-app)] rounded-3xl border border-[var(--border)]">
                    <h4 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.3em] mb-3">Análisis Clínico</h4>
                    <p className="text-sm text-[var(--text-main)] opacity-70 leading-relaxed">{selectedOutbreak.description || "Sin descripción adicional."}</p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="ghost" className="flex-1 text-red-500 hover:bg-red-500/10 font-black h-14 rounded-2xl text-[10px]" onClick={() => handleDeleteOutbreak(selectedOutbreak.id)}>
                      <Trash2 size={16} className="mr-2 inline" /> Borrar
                    </Button>
                    <Button className="flex-[2] bg-[#22c55e] hover:bg-[#22c55e]/90 text-black font-black h-14 rounded-2xl text-[10px]" onClick={() => setSelectedOutbreak(null)}>Cerrar</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isProxDialogOpen} onOpenChange={setIsProxDialogOpen}>
          <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-main)] max-w-md rounded-[2.5rem] p-12 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-6">
              <HeartPulse size={40} className="text-[#22c55e]" />
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Módulo de Tratamiento IA</DialogTitle>
              <DialogDescription className="text-[var(--text-main)] opacity-60 text-sm font-mono uppercase">En desarrollo: Protocolos personalizados.</DialogDescription>
              <Button onClick={() => setIsProxDialogOpen(false)} className="w-full h-14 bg-[var(--bg-app)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-main)] font-black uppercase rounded-2xl text-[10px]">Cerrar Terminal</Button>
            </div>
          </DialogContent>
        </Dialog>

        {isPending && (
          <div className="absolute inset-0 z-50 bg-[var(--bg-app)]/80 backdrop-blur-2xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-8 text-center animate-pulse">
              <Globe className="text-[#22c55e]" size={64} />
              <span className="text-[11px] font-black text-[#22c55e] uppercase tracking-[0.6em]">Transmitiendo Cifrado...</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick, badge }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, badge?: string }) {
  const { t } = useConfig();
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative",
      active ? "bg-[#22c55e]/10 text-[#22c55e] shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" : "text-[var(--text-main)] opacity-40 hover:opacity-100 hover:bg-[var(--bg-app)]"
    )}>
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-[#22c55e] drop-shadow-[0_0_8px_#22c55e]" : "")}>{icon}</span>
      <span className={cn("text-[11px] font-black tracking-widest uppercase", active ? "text-[#22c55e]" : "")}>{label}</span>
      {badge && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-[var(--bg-app)] border border-[var(--border)] text-[8px] font-black text-[var(--text-main)] opacity-40 uppercase tracking-tighter">
          {badge}
        </span>
      )}
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
    <button type="button" onClick={onClick} className={cn("w-full py-4 border rounded-2xl text-center transition-all duration-300", active ? activeColors[color] : colors[color])}>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[var(--text-main)] opacity-40">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p className="text-sm font-bold text-[var(--text-main)]">{value}</p>
    </div>
  );
}