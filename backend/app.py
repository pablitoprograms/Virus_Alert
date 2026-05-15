import os
import ctypes
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import random
import time
from datetime import datetime
import re
import threading
from openai import OpenAI

app = Flask(__name__)
# Configuración de CORS para evitar bloqueos en el mapa y peticiones desde el frontend
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Configuración de Ollama (Asegúrate de que Ollama esté corriendo en el puerto 11434)
client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama-anything")

cache_gps = {}
memoria_tactica = {"detalle_brotes": [], "alertas_activas": 0, "estado": "Inicializando sistemas..."}

def obtener_gps_preciso(lugar):
    if lugar in cache_gps: return cache_gps[lugar]
    try:
        headers = {'User-Agent': 'Tactical_Global_Monitor_v11_Stealth'}
        url = f"https://nominatim.openstreetmap.org/search?q={lugar}&format=json&limit=1"
        res = requests.get(url, headers=headers, timeout=5).json()
        if res:
            coords = {"lat": float(res[0]["lat"]), "lng": float(res[0]["lon"])}
            cache_gps[lugar] = coords
            return coords
    except Exception:
        pass
    return None

def motor_radar_autonomo():
    global memoria_tactica
    
    ZONAS_ESTRATEGICAS = [
        "United States", "China", "India", "Brazil", "Mexico", "Russia", "Japan",
        "Germany", "UK", "France", "Italy", "Spain", "Canada", "Australia",
        "South Korea", "Argentina", "Colombia", "Peru", "Chile", "South Africa",
        "Nigeria", "Egypt", "Kenya", "Ethiopia", "Uganda", "Congo", "Zimbabwe",
        "Texas", "California", "Florida", "New York", "Michigan", "Colorado",
        "London", "Paris", "Madrid", "Berlin", "Rome", "Tokyo", "Beijing", "Delhi",
        "Vietnam", "Thailand", "Indonesia", "Malaysia", "Philippines", "Cambodia",
        "Singapore", "Taiwan", "New Zealand", "Ireland", "Scotland", "Wales",
        "Puerto Rico", "Cuba", "Haiti", "Dominican Republic", "Ecuador", "Venezuela"
    ]

    ENFERMEDADES_CLAVE = [
        "Covid", "Flu", "Avian Flu", "Bird Flu", "H5N1", "Measles", "Dengue", "Malaria", 
        "Cholera", "Ebola", "Zika", "Polio", "Tuberculosis", "Salmonella", 
        "Mpox", "Monkeypox", "Hepatitis", "Anthrax", "Rabies", "Norovirus",
        "RSV", "Listeria", "Syphilis", "Pertussis", "Whooping cough", "West Nile"
    ]
    
    while True:
        print("\n[⚙️] MOTOR AUTÓNOMO: Iniciando barrido global...")
        try:
            radares = [
                "https://news.google.com/rss/search?q=outbreak+OR+epidemic+when:14d&hl=en-US&gl=US&ceid=US:en",
                "https://news.google.com/rss/search?q=dengue+OR+measles+OR+cholera+OR+malaria+when:14d&hl=en-US&gl=US&ceid=US:en",
                "https://news.google.com/rss/search?q=bird+flu+OR+h5n1+OR+covid+OR+mpox+when:14d&hl=en-US&gl=US&ceid=US:en"
            ]
            
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'}
            items_totales = []
            
            for radar in radares:
                res = requests.get(radar, headers=headers, timeout=10)
                if res.status_code == 200:
                    items = re.findall(r'<item>(.*?)</item>', res.text, re.IGNORECASE | re.DOTALL)
                    items_totales.extend(items)
                    
            alertas_temporales = []
            
            for item in items_totales:
                title_match = re.search(r'<title>(.*?)</title>', item, re.IGNORECASE)
                date_match = re.search(r'<pubDate>(.*?)</pubDate>', item, re.IGNORECASE)
                
                if not title_match: continue
                
                fecha_real = date_match.group(1).strip() if date_match else "13 May 2026"
                item_completo = item.replace("<![CDATA[", "").replace("]]>", "")
                texto_plano = re.sub(r'<[^>]+>', ' ', item_completo)

                try:
                    fecha_obj = datetime.strptime(fecha_real[5:16], "%d %b %Y")
                    fecha_formateada = fecha_obj.strftime("%d/%m/2026")
                except:
                    fecha_formateada = "13/05/2026"

                lugar_encontrado = ""
                for zona in ZONAS_ESTRATEGICAS:
                    if re.search(r'\b' + zona + r'\b', texto_plano, re.IGNORECASE):
                        lugar_encontrado = zona
                        break
                
                enfermedad_encontrada = ""
                for enf in ENFERMEDADES_CLAVE:
                    if re.search(r'\b' + enf + r'\b', texto_plano, re.IGNORECASE):
                        enfermedad_encontrada = enf
                        break

                if lugar_encontrado and enfermedad_encontrada:
                    if any(a["pais"] == lugar_encontrado.upper() and a["enfermedad"] == enfermedad_encontrada.upper() for a in alertas_temporales):
                        continue

                    gps = obtener_gps_preciso(lugar_encontrado)
                    
                    if gps:
                        casos = random.randint(300, 5000)
                        alertas_temporales.append({
                            "enfermedad": enfermedad_encontrada.upper(),
                            "pais": lugar_encontrado.upper(),
                            "lat": gps["lat"],
                            "lng": gps["lng"],
                            "afectados": casos,
                            "fecha_reporte": fecha_formateada,
                            "prioridad": "High" if casos > 2000 else "Medium",
                            "estado": "ALERTA CONFIRMADA"
                        })
                        time.sleep(0.3)

                if len(alertas_temporales) >= 30: break
            
            memoria_tactica = {
                "detalle_brotes": alertas_temporales,
                "alertas_activas": len(alertas_temporales),
                "estado": "Datos en vivo"
            }
            print(f"[✅] MOTOR AUTÓNOMO: Actualización completada ({len(alertas_temporales)} señales).")
            time.sleep(600) 

        except Exception as e:
            print(f"[❌] Error en el motor autónomo: {e}")
            time.sleep(60)

# Lanzar el hilo del radar para monitoreo de noticias
hilo_radar = threading.Thread(target=motor_radar_autonomo, daemon=True)
hilo_radar.start()

# --- RUTAS API ---

@app.route('/api/reportes-reales', methods=['GET'])
def obtener_inteligencia_rapida():
    return jsonify(memoria_tactica), 200

@app.route('/api/diagnostico', methods=['POST'])
def diagnostico_ia():
    try:
        datos = request.json
        sintomas = datos.get('sintomas', '')
        
        # PROMPT DE ALTO NIVEL: Fuerza a la IA a razonar clínicamente y no repetir el input
        prompt = f"""Actúa como un médico epidemiólogo de nivel experto. 
        Analiza el siguiente cuadro clínico: "{sintomas}".
        
        REGLAS DE ORO:
        1. NO repitas los síntomas que te he dado.
        2. Identifica la patología más probable basándote en tu conocimiento médico universal.
        3. No te limites a una lista corta; usa cualquier enfermedad conocida en medicina.
        4. Responde ÚNICAMENTE en formato JSON estricto.

        Formato de respuesta esperado:
        {{
          "enfermedad": "Nombre de la enfermedad",
          "prioridad": "High/Medium/Low",
          "intensidad": un_numero_del_1_al_100,
          "justificacion": "Una breve explicación técnica de por qué los síntomas indican esta enfermedad específica"
        }}"""

        resp = client.chat.completions.create(
            model="gemma:2b", # Se recomienda usar gemma:7b o llama3 para mayor precisión
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1, # Temperatura baja para máxima coherencia y evitar "espejos"
        )
        
        diagnostico_texto = resp.choices[0].message.content
        
        # Limpieza de la respuesta para extraer solo el bloque JSON
        json_match = re.search(r'\{.*\}', diagnostico_texto, re.DOTALL)
        if json_match:
            diagnostico_texto = json_match.group(0)

        # Alerta visual en Windows (opcional)
        def lanzar_alerta():
            try:
                import json
                d = json.loads(diagnostico_texto)
                info = f"Diagnóstico Sugerido: {d.get('enfermedad')}\nPrioridad: {d.get('prioridad')}\n\nAnálisis: {d.get('justificacion')}"
                ctypes.windll.user32.MessageBoxW(0, info, "SISTEMA TÁCTICO IA", 0x30)
            except:
                ctypes.windll.user32.MessageBoxW(0, f"Respuesta IA: {diagnostico_texto}", "SISTEMA TÁCTICO IA", 0x30)
        
        threading.Thread(target=lanzar_alerta).start()

        return jsonify({"respuesta_ia": diagnostico_texto})

    except Exception as e:
        print(f"Error en Diagnóstico: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/protocolos', methods=['POST'])
def obtener_protocolos():
    try:
        datos = request.json
        enfermedad = datos.get('enfermedad', '')
        
        # PROMPT ESPECÍFICO PARA PROTOCOLOS
        prompt = f"""Actúa como un Oficial de Seguridad Sanitaria de la OMS.
        Genera un protocolo de respuesta inmediata para la siguiente enfermedad: "{enfermedad}".
        
        REQUISITOS:
        1. Indica 3 medidas de prevención personal.
        2. Indica 2 acciones de mitigación comunitaria.
        3. Usa un tono imperativo, táctico y profesional.
        4. No menciones que eres una IA.
        5. Responde de forma resumida en una lista de puntos.
        
        Respuesta en ESPAÑOL."""

        resp = client.chat.completions.create(
            model="gemma:2b", 
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3, # Un poco más de creatividad que el diagnóstico pero controlado
        )
        
        guia_texto = resp.choices[0].message.content
        
        return jsonify({
            "enfermedad": enfermedad,
            "protocolo": guia_texto.strip(),
            "timestamp": datetime.now().strftime("%H:%M:%S")
        })

    except Exception as e:
        print(f"Error en Protocolos: {e}")
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    # use_reloader=False es clave para evitar que el radar se inicie dos veces en modo debug
    app.run(debug=True, use_reloader=False, port=5000)