"use client";

import React, { useEffect, useState } from "react";

interface Outbreak {
  id: string;
  diseaseName: string;
  locationDescription: string;
  priority: "High" | "Medium" | "Low";
  status: string;
  reportedDate: string;
  intensityLevel: number;
}

export function RecentAlerts({
  outbreaks,
  onSelect,
  onDelete,
}: {
  outbreaks: any[];
  onSelect: (o: Outbreak) => void;
  onDelete: (id: string) => void;
}) {
  const [apiAlerts, setApiAlerts] = useState<Outbreak[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:5000/api/reportes-reales"
        );

        const data = await res.json();

        const mapped: Outbreak[] = (data.detalle_brotes || []).map(
          (b: any, i: number) => {
            const afectados = Number(b.afectados || 0);

            let priority: "High" | "Medium" | "Low" = "Low";
            if (afectados > 1000) priority = "High";
            else if (afectados > 200) priority = "Medium";

            return {
              id: `api-${i}`,
              diseaseName: b.enfermedad || "Unknown",
              locationDescription: b.pais || "Unknown",
              priority,
              status: "active",
              reportedDate: b.fecha_reporte || "",
              intensityLevel: Math.min(100, afectados / 50),
            };
          }
        );

        setApiAlerts(mapped);
      } catch (err) {
        console.error("API error:", err);
        setApiAlerts([]);
      }
    };

    fetchData();
  }, []);

  const all = [...apiAlerts, ...(outbreaks || [])];

  return (
    <div className="p-4 space-y-3">
      {all.length === 0 ? (
        <div className="text-white/40 text-sm">
          No active real-time outbreaks
        </div>
      ) : (
        all.map((o) => (
          <div
            key={o.id}
            onClick={() => onSelect(o)}
            className="p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
          >
            <div className="font-bold">{o.diseaseName}</div>
            <div className="text-xs opacity-60">
              {o.locationDescription}
            </div>
          </div>
        ))
      )}
    </div>
  );
}