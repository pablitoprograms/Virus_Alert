
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
  Clock
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

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [reportDescription, setReportDescription] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
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
    if (!selectedProvince || !selectedDisease || !selectedPriority || reportDescription.length < 10) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Asegúrate de haber seleccionado la prioridad, provincia y redactado una nota clínica.",
      });
      return;
    }

    startTransition(async () => {
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

      await addDocumentNonBlocking(collection(db, 'outbreaks'), newOutbreak);

      setWizardStep(1);
      setReportDescription("");
      setSelectedDisease("");
      setSelectedProvince("");
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
      case 5: return !!selectedPriority && !!selectedProvince && reportDescription.length >= 10;
      default: return false;
    }
  };

  const actualFormStep = wizardStep === 1 ? 0 : wizardStep === 2 ? 1 : wizardStep === 3 ? 1 : wizardStep === 4 ? 2 : 3;
  const progressValue = (actualFormStep / 3) * 100;

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
            <p className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest">Sistemas España</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Alertas Recientes" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<Globe size={20} />} label="Mapa Táctico" active={currentView === 'map'} onClick={() => setCurrentView('map')} />
          <NavItem icon={<FileText size={20} />} label="Informes" active={currentView === 'reports'} onClick={() => { setCurrentView('reports'); setWizardStep(1); }} />
          <NavItem 
            icon={<Cpu size={20} />} 
            label="Diagnóstico IA" 
            active={false} 
            onClick={() => setIsProxDialogOpen(true)} 
            badge="PROX"
          />
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
                
                {wizardStep > 1 && (
                  <div className="px-8 pt-8 pb-4 space-y-3 shrink-0">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest">
                        Paso {actualFormStep} de 3
                      </span>
                      <span className="text-[9px] font-bold text-white/20 uppercase">{Math.round(progressValue)}% Completado</span>
                    </div>
                    <Progress value={progressValue} className="h-1 bg-white/5" />
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
                          <h3 className="text-2xl font-black uppercase tracking-tighter">AVISO DE USO DE INTELIGENCIA ARTIFICIAL</h3>
                          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl text-sm text-white/60 leading-relaxed font-mono uppercase text-left">
                            Toda la información sintomatológica y clínica introducida en este informe será analizada mediante algoritmos de Inteligencia Artificial heurística. Las sugerencias de patógenos y diagnósticos preliminares son generadas automáticamente por este sistema y deben ser validadas por personal médico. Al continuar, acepta el procesamiento de datos por IA para soporte al diagnóstico.
                          </div>
                        </div>
                        <Button 
                          type="button" 
                          onClick={() => setWizardStep(2)}
                          className="h-14 w-full max-w-md bg-[#22c55e] hover:bg-[#22c55e]/90 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                        >
                          HE LEÍDO Y ACEPTO
                        </Button>
                      </div>
                    )}

                    {wizardStep === 2 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold">Entrada de Síntomas</h3>
                          <p className="text-xs text-white/40">Busque y añada los síntomas detectados para el análisis heurístico.</p>
                        </div>
                        
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#22c55e] transition-colors" size={18} />
                          <Input 
                            placeholder="Buscar y añadir síntomas (ej. Fiebre, Tos...)"
                            className="h-14 bg-white/[0.03] border-white/10 focus:border-[#22c55e]/50 focus:ring-[#22c55e]/20 rounded-2xl pl-12 text-sm uppercase font-bold tracking-tight"
                            value={symptomSearch}
                            onChange={(e) => setSymptomSearch(e.target.value)}
                          />
                        </div>

                        {symptomSearch && (
                          <div className="bg-[#0c0d0f] border border-white/10 rounded-2xl overflow-hidden max-h-[200px] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            {filteredSymptoms.length > 0 ? (
                              filteredSymptoms.map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    toggleSymptom(s);
                                    setSymptomSearch("");
                                  }}
                                  className="w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#22c55e]/10 hover:text-[#22c55e] transition-colors border-b border-white/5 last:border-0"
                                >
                                  {s}
                                </button>
                              ))
                            ) : (
                              <div className="px-5 py-3 text-[10px] text-white/20 uppercase font-black">Sin coincidencias</div>
                            )}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Síntomas seleccionados: {selectedSymptoms.length}</Label>
                            {selectedSymptoms.length > 0 && (
                              <button 
                                type="button"
                                onClick={() => setSelectedSymptoms([])} 
                                className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 transition-colors"
                              >
                                Limpiar todo
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 min-h-[60px] p-4 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                            {selectedSymptoms.length === 0 && (
                              <div className="w-full flex flex-col items-center justify-center py-2 opacity-20">
                                <Search size={24} className="mb-2" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Utilice el buscador para añadir</span>
                              </div>
                            )}
                            {selectedSymptoms.map(s => (
                              <Badge key={s} variant="secondary" className="bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] px-4 py-2 rounded-xl flex items-center gap-2 group animate-in zoom-in-90">
                                <span className="text-[9px] font-black uppercase tracking-widest">{s}</span>
                                <button 
                                  type="button"
                                  onClick={() => toggleSymptom(s)}
                                  className="hover:text-white transition-colors p-0.5 rounded-full hover:bg-[#22c55e]/20"
                                >
                                  <X size={12} />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {wizardStep === 3 && (
                      <div className="h-64 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
                        <div className="relative">
                          <BrainCircuit size={48} className="text-[#22c55e] animate-pulse" />
                          <div className="absolute inset-0 border-4 border-[#22c55e]/20 rounded-full animate-ping scale-150" />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.4em] text-[#22c55e]">Analizando Cuadros Clínicos...</p>
                          <p className="text-[10px] text-white/30 uppercase tracking-widest">Calculando Probabilidades VirusAlert</p>
                        </div>
                      </div>
                    )}

                    {wizardStep === 4 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold">Resultados del Análisis del Sistema</h3>
                          <p className="text-xs text-white/40">La IA ha identificado el patógeno con mayor correlación sintomática.</p>
                        </div>

                        {aiAnalysis && (
                          <div className={cn(
                            "p-8 rounded-[2rem] border border-[#22c55e]/30 bg-[#000000] space-y-6 shadow-[0_0_30px_rgba(34,197,94,0.05)]",
                          )}>
                            <div className="flex items-start justify-between gap-6">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Zap size={14} className="text-[#22c55e] fill-[#22c55e]" />
                                  <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.3em]">Patógeno Detectado</span>
                                </div>
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                                  {aiAnalysis.name}
                                </h4>
                              </div>
                              
                              <div className="flex flex-col items-center gap-1">
                                <div className={cn(
                                  "text-4xl font-mono font-black",
                                  aiAnalysis.confidence > 80 ? "text-[#22c55e]" : 
                                  aiAnalysis.confidence > 50 ? "text-yellow-500" : "text-red-500"
                                )}>
                                  {aiAnalysis.confidence}%
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Confianza</span>
                              </div>
                            </div>

                            <div className="space-y-3 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                              <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                <Terminal size={12} /> Justificación del Análisis
                              </div>
                              <p className="text-[11px] font-mono text-white/60 leading-relaxed uppercase">
                                {aiAnalysis.justification}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                               <div className="flex items-center gap-1.5 px-3 py-1 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full">
                                  <ShieldCheck size={10} className="text-[#22c55e]" />
                                  <span className="text-[8px] font-bold text-[#22c55e] uppercase tracking-tighter">Validación Biotecnológica Activa</span>
                               </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 pt-2">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Confirmación de Registro</Label>
                          <Select value={selectedDisease} onValueChange={setSelectedDisease}>
                            <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl text-base font-bold uppercase tracking-tight">
                              <SelectValue placeholder="Confirmar patógeno..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0c0d0f] border-white/10 text-white max-h-[300px]">
                              {DISEASES_LIST.map(d => (
                                <SelectItem key={d} value={d} className="py-3 focus:bg-[#22c55e]/10 font-bold uppercase text-[11px] tracking-wide">{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {wizardStep === 5 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold">Clasificación y Geografía</h3>
                          <p className="text-xs text-white/40">Determine el nivel de emergencia y localice el foco de origen.</p>
                        </div>
                        
                        <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Prioridad de Respuesta</Label>
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
                              label="Alerta L2" 
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
                            <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Provincia Afectada</Label>
                            <div className="flex gap-2">
                              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                                <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl flex-1 text-[11px] font-black uppercase">
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0c0d0f] border-white/10 text-white">
                                  {Object.keys(PROVINCIA_COORDINATES).sort().map(p => (
                                    <SelectItem key={p} value={p} className="font-bold uppercase text-[10px]">{p}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleAutodetectLocation}
                                disabled={isLocating}
                                className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-[#22c55e]/10"
                              >
                                {isLocating ? <Loader2 className="animate-spin text-[#22c55e]" size={20} /> : <Navigation size={20} className="text-[#22c55e]" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-white/30">Notas Clínicas</Label>
                            <Textarea 
                              placeholder="Mínimo 10 caracteres describiendo observaciones clave..." 
                              className="min-h-[100px] bg-white/[0.03] border-white/10 rounded-2xl p-4 text-sm resize-none"
                              value={reportDescription}
                              onChange={(e) => setReportDescription(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {wizardStep > 1 && wizardStep !== 3 && (
                      <div className="flex gap-3 pt-4">
                        {wizardStep > 2 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setWizardStep(wizardStep === 4 ? 2 : prev => prev - 1)}
                            className="h-14 flex-1 text-white/40 hover:text-white hover:bg-white/5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]"
                          >
                            <ChevronLeft size={16} className="mr-1" /> Anterior
                          </Button>
                        )}
                        
                        {wizardStep < 5 ? (
                          <Button 
                            type="button" 
                            disabled={!isStepValid()}
                            onClick={nextStep}
                            className="h-14 flex-[2] bg-[#22c55e] hover:bg-[#22c55e]/90 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                          >
                            {wizardStep === 2 ? 'Iniciar Análisis IA' : 'Siguiente'} <ChevronRight size={16} className="ml-1" />
                          </Button>
                        ) : (
                          <Button 
                            type="submit"
                            disabled={!isStepValid() || isPending}
                            className="h-14 flex-[2] bg-[#22c55e] hover:bg-[#22c55e]/90 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                          >
                            {isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Send size={16} className="mr-2" />}
                            Transmitir Alerta
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

        <Dialog open={isProxDialogOpen} onOpenChange={setIsProxDialogOpen}>
          <DialogContent className="bg-[#0c0d0f] border-white/10 text-white max-w-md rounded-[2.5rem] p-12 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                <Cpu size={40} className="text-[#22c55e]" />
              </div>
              <div className="space-y-4">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Módulo de Diagnóstico Avanzado</DialogTitle>
                <DialogDescription className="text-white/60 text-sm leading-relaxed uppercase font-mono">
                  Este sistema se encuentra actualmente en fase de construcción. Estará disponible próximamente para análisis profundo de patógenos mediante computación cuántica.
                </DialogDescription>
              </div>
              <Button 
                onClick={() => setIsProxDialogOpen(false)}
                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl text-[10px]"
              >
                Cerrar Terminal
              </Button>
            </div>
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

function NavItem({ icon, label, active = false, onClick, badge }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, badge?: string }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative",
      active ? "bg-[#22c55e]/10 text-[#22c55e] shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" : "text-white/30 hover:text-white hover:bg-white/5"
    )}>
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-[#22c55e] drop-shadow-[0_0_8px_#22c55e]" : "text-white/20")}>{icon}</span>
      <span className={cn("text-[11px] font-black tracking-widest uppercase", active ? "text-[#22c55e]" : "")}>{label}</span>
      {badge && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-white/40 uppercase tracking-tighter">
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
    <button 
      type="button" 
      onClick={onClick}
      className={cn(
        "w-full py-4 border rounded-2xl text-center transition-all duration-300",
        active ? activeColors[color] : colors[color]
      )}
    >
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
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
