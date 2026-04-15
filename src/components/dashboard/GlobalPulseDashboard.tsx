
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
  UserCircle,
  MapPin,
  Calendar,
  Info,
  ShieldAlert,
  Loader2,
  Navigation,
  Trash2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";

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

const TIPOS_ENFERMEDAD = [
  "COVID-1.0", "Gripe A (H1N1)", "Bronquitis Aguda", "Neumonía Atípica", 
  "Gastroenteritis Viral", "Dengue Hemorrágico", "Zika Virus", 
  "Sarampión", "Malaria Falciparum", "Cólera", "Viruela del Mono", 
  "Fiebre del Nilo Occidental"
].sort();

const SYMPTOMS_LIST = [
  "Fiebre", "Tos Seca", "Erupciones", "Dificultad Respiratoria", "Dolor Articular", "Fatiga Extrema"
];

export default function GlobalPulseDashboard() {
  const [isPanelsHidden, setIsPanelsHidden] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [selectedOutbreak, setSelectedOutbreak] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  // Firestore Data
  const outbreaksQuery = useMemoFirebase(() => {
    return query(collection(db, 'outbreaks'), orderBy('reportedDate', 'desc'), limit(50));
  }, [db]);
  const { data: outbreaks } = useCollection(outbreaksQuery);

  // Form states
  const [reportDescription, setReportDescription] = useState("");
  const [selectedDisease, setSelectedDisease] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>('Low');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);

  const activeClustersCount = outbreaks?.length || 0;
  const highPriorityCount = outbreaks?.filter(c => c.priority === 'High').length || 0;

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

  const handleDeleteOutbreak = (id: string) => {
    if (!id) return;
    
    startTransition(() => {
      const docRef = doc(db, 'outbreaks', id);
      deleteDocumentNonBlocking(docRef);
      setSelectedOutbreak(null);
      toast({
        title: "Registro Eliminado",
        description: "El informe ha sido borrado permanentemente de la red VirusAlert.",
      });
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

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvince || !selectedDisease) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Por favor, selecciona una provincia y un tipo de enfermedad." });
      return;
    }

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

      // Limpiar formulario y volver al panel
      setReportDescription("");
      setSelectedDisease("");
      setSelectedProvince("");
      setSelectedPriority('Low');
      setSelectedSymptoms([]);
      setCurrentView('dashboard');

      toast({
        title: "Transmitiendo datos cifrados...",
        description: `Protocolo ${selectedPriority} activado en ${selectedProvince}.`,
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
          onClick={() => setIsPanelsHidden(false)}
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
            label="Alertas Recientes" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem 
            icon={<Globe size={20} />} 
            label="Mapa Táctico" 
            active={currentView === 'map'} 
            onClick={() => setCurrentView('map')}
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Informes" 
            active={currentView === 'reports'} 
            onClick={() => setCurrentView('reports')}
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
        
        {/* Área del Contenido Variable */}
        <div className="flex-1 relative overflow-hidden bg-[#060608]">
          <header className="absolute top-0 left-0 w-full z-20 px-8 py-8 flex justify-between items-start pointer-events-none">
            <div className="pointer-events-auto">
              <h2 className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-1">Vigilancia Nacional</h2>
              <p className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
                {currentView === 'dashboard' ? 'Alertas Críticas España' : 
                 currentView === 'map' ? 'Mapa Táctico de Calor' : 'Central de Informes Médicos'}
              </p>
            </div>
          </header>

          <div className="w-full h-full relative">
            {currentView === 'dashboard' ? (
              <div className="absolute inset-0 bg-[#060608] p-8 pt-36 overflow-hidden z-10 flex justify-center items-start">
                <div className="w-full max-w-4xl h-[calc(100vh-250px)] bg-[#0c0d0f]/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <RecentAlerts outbreaks={outbreaks || []} onSelect={(alert) => setSelectedOutbreak(alert)} onDelete={handleDeleteOutbreak} />
                </div>
              </div>
            ) : currentView === 'reports' ? (
              <div className="absolute inset-0 bg-[#060608] p-8 pt-36 overflow-auto z-10 flex justify-center items-start pb-20">
                <div className="w-full max-w-3xl bg-[#0c0d0f] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
                  <div className="p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="text-2xl font-bold flex items-center gap-4">
                      <FileText className="text-[#22c55e]" size={28} />
                      Nuevo Informe de Incidencia
                    </h3>
                  </div>
                  <form onSubmit={handleReportSubmit} className="p-10 space-y-8">
                    {/* Selector de Gravedad */}
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-white/40">Nivel de Gravedad</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <Button 
                          type="button" 
                          variant={selectedPriority === 'Low' ? 'default' : 'outline'}
                          onClick={() => setSelectedPriority('Low')}
                          className={cn("h-16 rounded-2xl font-bold uppercase text-[10px] tracking-widest", 
                            selectedPriority === 'Low' ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "border-yellow-500/20 text-yellow-500")}
                        >Vigilancia</Button>
                        <Button 
                          type="button" 
                          variant={selectedPriority === 'Medium' ? 'default' : 'outline'}
                          onClick={() => setSelectedPriority('Medium')}
                          className={cn("h-16 rounded-2xl font-bold uppercase text-[10px] tracking-widest", 
                            selectedPriority === 'Medium' ? "bg-orange-500 hover:bg-orange-600 text-black" : "border-orange-500/20 text-orange-500")}
                        >Alerta</Button>
                        <Button 
                          type="button" 
                          variant={selectedPriority === 'High' ? 'default' : 'outline'}
                          onClick={() => setSelectedPriority('High')}
                          className={cn("h-16 rounded-2xl font-bold uppercase text-[10px] tracking-widest", 
                            selectedPriority === 'High' ? "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" : "border-red-600/20 text-red-600")}
                        >Emergencia</Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-white/40">Descripción del Problema Médico</Label>
                      <Textarea 
                        placeholder="Describa los síntomas observados, duración y gravedad detectada..." 
                        className="min-h-[120px] bg-white/[0.03] border-white/10 rounded-2xl focus:ring-[#22c55e] text-base p-6"
                        required
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                      />
                    </div>

                    {/* Selector de Síntomas */}
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-white/40">Sintomatología Detectada</Label>
                      <div className="flex flex-wrap gap-2">
                        {SYMPTOMS_LIST.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSymptom(s)}
                            className={cn(
                              "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                              selectedSymptoms.includes(s) 
                                ? "bg-[#22c55e] border-[#22c55e] text-black" 
                                : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                            )}
                          >{s}</button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-white/40">Tipo de Enfermedad</Label>
                        <Select required value={selectedDisease} onValueChange={setSelectedDisease}>
                          <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl">
                            <SelectValue placeholder="Seleccionar patógeno..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1e2025] border-white/10 text-white">
                            {TIPOS_ENFERMEDAD.map(tipo => (
                              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-white/40">Ubicación (Provincia)</Label>
                        <div className="flex gap-2">
                          <Select required value={selectedProvince} onValueChange={setSelectedProvince}>
                            <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 rounded-2xl flex-1">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e2025] border-white/10 text-white">
                              {Object.keys(PROVINCIA_COORDINATES).sort().map(prov => (
                                <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={handleAutodetectLocation}
                            disabled={isLocating}
                            className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                            title="Autodetectar Ubicación"
                          >
                            {isLocating ? <Loader2 className="animate-spin text-[#22c55e]" /> : <Navigation size={20} className="text-[#22c55e]" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit"
                      disabled={isPending}
                      className="w-full h-16 bg-[#22c55e] hover:bg-[#22c55e]/90 text-[#0a0a0c] font-black uppercase tracking-[0.2em] rounded-2xl text-xs shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50"
                    >
                      {isPending ? <Loader2 className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                      Emitir Informe Crítico
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <WorldMap>
                <OutbreakHeatmap data={outbreaks ? { outbreakClusters: outbreaks } : null} onSelectCluster={(cluster) => setSelectedOutbreak(cluster)} />
              </WorldMap>
            )}
          </div>
        </div>

        {/* Diálogo de Detalles de Brote */}
        <Dialog open={!!selectedOutbreak} onOpenChange={() => setSelectedOutbreak(null)}>
          <DialogContent className="bg-[#0c0d0f] border-white/10 text-white max-w-lg rounded-[2.5rem] overflow-hidden p-0 shadow-[0_48px_96px_rgba(0,0,0,0.8)] border-white/5">
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
                    selectedOutbreak.priority === 'High' ? "bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  )}>
                    {selectedOutbreak.priority === 'High' ? 'Nivel Crítico' : 'Alerta de Vigilancia'}
                  </Badge>
                  <DialogTitle className="text-4xl font-black tracking-tighter leading-none">{selectedOutbreak.diseaseName}</DialogTitle>
                  <p className="text-white/40 text-xs mt-2 uppercase font-bold tracking-widest flex items-center gap-2">
                     <MapPin size={12} className="text-[#22c55e]" /> {selectedOutbreak.locationDescription}
                  </p>
                </div>
                
                <div className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <InfoItem icon={<Activity size={18} className="text-[#22c55e]" />} label="Estado Operativo" value={selectedOutbreak.status} />
                    <InfoItem icon={<Calendar size={18} className="text-[#22c55e]" />} label="Fecha de Registro" value={new Date(selectedOutbreak.reportedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} />
                    <InfoItem icon={<AlertCircle size={18} className="text-[#22c55e]" />} label="Índice de Intensidad" value={`${selectedOutbreak.intensityLevel || selectedOutbreak.intensity}%`} />
                    <InfoItem icon={<ShieldAlert size={18} className="text-[#22c55e]" />} label="Categoría" value={selectedOutbreak.category} />
                  </div>

                  <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 relative group transition-all hover:bg-white/[0.05]">
                    <h4 className="text-[10px] font-black text-[#22c55e] uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                      <Info size={14} /> Análisis VirusAlert España
                    </h4>
                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                      {selectedOutbreak.description || `Los protocolos de vigilancia en ${selectedOutbreak.locationDescription} muestran una intensidad crítica. Se recomienda activar protocolos regionales fase 2 de contención biológica.`}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      variant="ghost"
                      className="flex-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 font-black uppercase tracking-widest h-14 rounded-2xl text-[10px]"
                      onClick={() => handleDeleteOutbreak(selectedOutbreak.id)}
                    >
                      <Trash2 size={16} className="mr-2" /> Eliminar
                    </Button>
                    <Button 
                      className="flex-[2] bg-[#22c55e] hover:bg-[#22c55e]/90 text-[#0a0a0c] font-black uppercase tracking-widest h-14 rounded-2xl text-[10px] shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                      onClick={() => setSelectedOutbreak(null)}
                    >
                      Archivar Protocolo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Overlay de Carga Principal */}
        {isPending && (
          <div className="absolute inset-0 z-50 bg-[#060608]/80 backdrop-blur-2xl flex items-center justify-center">
            <div className="flex flex-col items-center gap-8">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-[3px] border-[#22c55e]/10 rounded-full" />
                <div className="absolute inset-0 border-t-[3px] border-[#22c55e] rounded-full animate-spin shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
                <Globe className="absolute inset-0 m-auto text-[#22c55e]/50 animate-pulse" size={32} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-black text-[#22c55e] uppercase tracking-[0.6em] animate-pulse">Sincronizando con la red</span>
                <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Actualizando coordenadas nacionales...</span>
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
        "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
        active 
          ? "bg-[#22c55e]/10 text-[#22c55e] shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]" 
          : "text-white/30 hover:text-white hover:bg-white/5"
      )}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#22c55e]/5 to-transparent pointer-events-none" />
      )}
      
      <span className={cn(
        "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 relative z-10",
        active ? "text-[#22c55e] scale-110 drop-shadow-[0_0_8px_#22c55e]" : "text-white/20"
      )}>
        {icon}
      </span>
      <span className={cn(
        "text-[11px] font-black tracking-widest uppercase relative z-10 transition-all duration-300",
        active ? "text-[#22c55e] drop-shadow-[0_0_8px_#22c55e]" : ""
      )}>
        {label}
      </span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_12px_#22c55e] relative z-10" />}
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
      <p className="text-sm font-bold tracking-tight text-white/90">{value}</p>
    </div>
  );
}
