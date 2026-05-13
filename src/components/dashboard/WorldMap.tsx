"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
  const [data, setData] = useState<Brote[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/reportes-reales")
      .then((r) => r.json())
      .then((json) => {
        setData(json.detalle_brotes || []);
      })
      .catch((err) => {
        console.error("API error:", err);
        setData([]);
      });
  }, []);

  const getColor = (b: Brote) => {
    if (b.prioridad === "High") return "#ff3b30";
    if (b.prioridad === "Medium") return "#ff9500";
    return "#34c759";
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          zIndex: 999,
          bottom: 10,
          left: 10,
          background: "rgba(0,0,0,0.75)",
          color: "white",
          padding: "10px 12px",
          borderRadius: "10px",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        señales: {data.length}
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
        />

        {data.map((b, i) => (
          <CircleMarker
            key={i}
            center={[b.lat || 0, b.lng || 0]}
            radius={8}
            pathOptions={{
              color: getColor(b),
              fillColor: getColor(b),
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontSize: "13px" }}>
                <b>{b.enfermedad}</b>
                <br />
                🌍 {b.pais}
                <br />
                📡 {b.fuente || "unknown"}
                <br />
                📅 {b.fecha_reporte}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </>
  );
}