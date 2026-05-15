"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import "leaflet/dist/leaflet.css";

// Definición del tipo unificado para evitar conflictos entre API y Firebase
type Brote = {
  enfermedad: string;
  pais: string;
  lat: number;
  lng: number;
  afectados: number;
  fecha_reporte: string;
  fuente?: string;
  prioridad?: string;
};

export default function WorldMap() {
  const [apiData, setApiData] = useState<Brote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const db = useFirestore();

  // --- 1. ESCUCHA ACTIVA DE FIREBASE (Tus informes manuales) ---
  // Esto permite que en cuanto guardes en "Informes", el mapa se actualice solo.
  const q = useMemoFirebase(() => {
    return query(collection(db, 'outbreaks'), orderBy('reportedDate', 'desc'), limit(50));
  }, [db]);
  
  const { data: firebaseData } = useCollection(q);

  // --- 2. CONEXIÓN CON EL RADAR DE NOTICIAS (API Python) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Sincronizando radar global...");
        const response = await fetch("http://localhost:5000/api/reportes-reales");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        
        // Mapeamos los datos de la API para que coincidan con nuestra estructura
        const brotesValidos = (json.detalle_brotes || []).map((b: any) => ({
          enfermedad: b.enfermedad,
          pais: b.pais,
          lat: b.lat,
          lng: b.lng,
          afectados: b.afectados || 0,
          fecha_reporte: b.fecha_reporte,
          fuente: b.fuente || "Inteligencia OSINT",
          prioridad: b.prioridad
        }));
        
        setApiData(brotesValidos);
        setError(null);
      } catch (err) {
        console.error("Error en la conexión del radar API:", err);
        setError("Fallo de conexión con el radar táctico.");
      }
    };

    fetchData();
    // Actualización del radar cada 60 segundos
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- 3. MERGE TÁCTICO DE DATOS ---
  // Combinamos lo que viene de la API con lo que viene de Firebase
  const combinedData: Brote[] = [
    ...apiData,
    ...(firebaseData || []).map((fb: any) => ({
      enfermedad: fb.diseaseName || "Desconocida",
      pais: fb.locationDescription || "Ubicación Remota",
      lat: fb.latitude,
      lng: fb.longitude,
      afectados: fb.afectados || 1,
      fecha_reporte: fb.reportedDate ? new Date(fb.reportedDate).toLocaleDateString() : "Reciente",
      fuente: "Reporte de Usuario",
      prioridad: fb.priority || "Medium"
    }))
  ];

  const getColor = (prioridad?: string) => {
    if (prioridad === "High") return "#ff3b30";
    if (prioridad === "Medium") return "#ff9500";
    return "#34c759";
  };

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      {/* Panel de Estado Táctico */}
      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          bottom: 20,
          left: 20,
          background: "rgba(0,0,0,0.85)",
          color: error ? "#ff3b30" : "#22c55e",
          padding: "12px 18px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "bold",
          border: `1px solid ${error ? "#ff3b30" : "rgba(34,197,94,0.5)"}`,
          fontFamily: "monospace",
          boxShadow: "0 0 20px rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>{error ? "⚠️ " + error : "● RADAR TÁCTICO ONLINE"}</span>
          <span style={{ opacity: 0.7, fontSize: "10px" }}>
            SEÑALES DETECTADAS: {combinedData.length} (Global: {apiData.length} | Manuales: {firebaseData?.length || 0})
          </span>
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2.5}
        style={{ height: "100%", width: "100%", background: "#0a0a0c" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri &mdash; Tactical Global Monitor"
        />

        {combinedData.map((b, i) => {
          // Seguridad: Si no hay coordenadas, no renderizar
          if (b.lat === undefined || b.lng === undefined || b.lat === null || b.lng === null) {
            return null;
          }

          return (
            <CircleMarker
              key={`${b.pais}-${i}`}
              center={[b.lat, b.lng]}
              radius={b.prioridad === "High" ? 12 : 8}
              pathOptions={{
                color: getColor(b.prioridad),
                fillColor: getColor(b.prioridad),
                fillOpacity: 0.5,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ color: "#333", minWidth: "180px", fontFamily: "sans-serif" }}>
                  <h3 style={{ 
                    margin: "0 0 8px 0", 
                    color: getColor(b.prioridad), 
                    borderBottom: "1px solid #eee",
                    paddingBottom: "4px",
                    textTransform: "uppercase",
                    fontSize: "14px"
                  }}>
                    {b.enfermedad}
                  </h3>
                  <div style={{ fontSize: "11px", lineHeight: "1.6" }}>
                    <b>🌎 TERRITORIO:</b> {b.pais} <br />
                    <b>👥 IMPACTO:</b> {b.afectados.toLocaleString()} <br />
                    <b>📅 DETECCIÓN:</b> {b.fecha_reporte} <br />
                    <b style={{ color: "#666" }}>📡 FUENTE:</b> {b.fuente}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}