"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

// 🌍 TRADUCCIONES
export const translations = {
  ES: {
    title: "Configuración del Sistema",
    lang: "Idioma",
    theme: "Tema Visual",
    map: "Mapa Táctico",
    alerts: "Alertas Recientes",
    reports: "Informes",
    ai_diagnosis: "Diagnóstico IA",
    settings: "Configuración",
    intensity: "Intensidad",
    emergency: "Emergencia Crítica",
    watch: "Vigilancia Activa",
    light: "Claro",
    dark: "Oscuro",
    purple: "Morado Táctico",
    save: "Guardar Cambios",
    system_spain: "Sistemas España",
    operator: "Operador",
    logout: "Cerrar Sesión",
    hide_panels: "Ocultar Paneles",
    national_surveillance: "Vigilancia Nacional",
    critical_alerts: "Alertas Críticas",
    system_settings: "Ajustes del Sistema"
  },
  EN: {
    title: "System Configuration",
    lang: "Language",
    theme: "Visual Theme",
    map: "Tactical Map",
    alerts: "Recent Alerts",
    reports: "Reports",
    ai_diagnosis: "AI Diagnosis",
    settings: "Settings",
    intensity: "Intensity",
    emergency: "Critical Emergency",
    watch: "Active Watch",
    light: "Light",
    dark: "Dark",
    purple: "Tactical Purple",
    save: "Save Changes",
    system_spain: "Spain Systems",
    operator: "Operator",
    logout: "Sign Out",
    hide_panels: "Hide Panels",
    national_surveillance: "National Surveillance",
    critical_alerts: "Critical Alerts",
    system_settings: "System Settings"
  },
  DE: {
    title: "Systemkonfiguration",
    lang: "Sprache",
    theme: "Visuelles Thema",
    map: "Taktische Karte",
    alerts: "Aktuelle Warnungen",
    reports: "Berichte",
    ai_diagnosis: "KI-Diagnose",
    settings: "Einstellungen",
    intensity: "Intensität",
    emergency: "Kritischer Notfall",
    watch: "Aktive Überwachung",
    light: "Hell",
    dark: "Dunkel",
    purple: "Taktisches Lila",
    save: "Änderungen speichern",
    system_spain: "Spanien Systeme",
    operator: "Bediener",
    logout: "Abmelden",
    hide_panels: "Panels ausblenden",
    national_surveillance: "Nationale Überwachung",
    critical_alerts: "Kritische Warnungen",
    system_settings: "Systemeinstellungen"
  }
};

type Language = 'ES' | 'EN' | 'DE';
type Theme = 'light' | 'dark' | 'purple';

const ConfigContext = createContext<any>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('ES');
  const [theme, setTheme] = useState<Theme>('dark');

  // Aplicar tema al HTML
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'purple');
    root.classList.add(theme);
  }, [theme]);

  const t = translations[lang];

  return (
    <ConfigContext.Provider value={{ lang, setLang, theme, setTheme, t }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);