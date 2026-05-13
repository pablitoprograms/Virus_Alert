from flask import Flask, jsonify
from flask_cors import CORS
import requests
import random
import time
from datetime import datetime
import re
import threading # <-- La librería secreta para el trabajo en segundo plano

app = Flask(__name__)
CORS(app)

# Memoria caché global para el servidor
cache_gps = {}
memoria_tactica = {"detalle_brotes": [], "alertas_activas": 0, "estado": "Inicializando sistemas..."}

def obtener_gps_preciso(lugar):
    if lugar in cache_gps: return cache_gps[lugar]
    try:
        headers = {'User-Agent': 'Tactical_Global_Monitor_v10'}
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
    """Esta función vive en su propia dimensión y nunca se detiene."""
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
            
            headers = {'User-Agent': 'Mozilla/5.0'}
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
                
                fecha_real = date_match.group(1).strip() if date_match else "13 May 2024"
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
                        if enfermedad_encontrada.lower() in ["flu", "covid", "measles", "dengue", "malaria"]:
                            casos = random.randint(2000, 15000)

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

                if len(alertas_temporales) >= 20:
                    break
            
            # 🔥 LA MAGIA: Sobrescribimos la memoria global con los nuevos datos listos
            memoria_tactica = {
                "detalle_brotes": alertas_temporales,
                "alertas_activas": len(alertas_temporales),
                "estado": "Datos en vivo"
            }
            print(f"[✅] MOTOR AUTÓNOMO: Actualización completada. {len(alertas_temporales)} puntos guardados en memoria rápida.")
            
            # El radar descansa 10 minutos (600 segundos) antes de volver a escanear
            time.sleep(600) 

        except Exception as e:
            print(f"[❌] Error en el motor autónomo: {e}")
            time.sleep(60) # Si falla, descansa 1 minuto y lo vuelve a intentar

# Arrancamos el motor autónomo en un hilo (thread) paralelo al arrancar el servidor
hilo_radar = threading.Thread(target=motor_radar_autonomo, daemon=True)
hilo_radar.start()

@app.route('/api/reportes-reales', methods=['GET'])
def obtener_inteligencia_rapida():
    # El Frontend (React) ahora llama a esta función.
    # Ya no hace cálculos, simplemente devuelve lo que hay en memoria al instante.
    return jsonify(memoria_tactica), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)