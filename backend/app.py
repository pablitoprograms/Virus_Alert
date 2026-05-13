from flask import Flask, jsonify
from flask_cors import CORS
import requests
import xml.etree.ElementTree as ET
from datetime import datetime

app = Flask(__name__)
CORS(app)

@app.route('/api/reportes-reales')
def datos():

    alertas = []

    # -------------------------
    # WHO RSS (REAL)
    # -------------------------
    try:
        url = "https://www.who.int/feeds/entity/csr/don/feeds/en/rss.xml"
        res = requests.get(url, timeout=10)

        root = ET.fromstring(res.content)

        for item in root.findall('.//item')[:30]:
            title_node = item.find('title')
            if title_node is None or not title_node.text:
                continue

            alertas.append({
                "enfermedad": title_node.text,
                "pais": "Global",
                "lat": 0,
                "lng": 0,
                "afectados": 0,
                "fecha_reporte": datetime.utcnow().strftime("%d/%m/%Y"),
                "prioridad": "Medium",
                "fuente": "WHO"
            })

    except Exception as e:
        print("WHO error:", e)

    # -------------------------
    # HealthMap RSS (REAL)
    # -------------------------
    try:
        url = "https://healthmap.org/alerts_rss.php"
        res = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})

        root = ET.fromstring(res.content)

        for item in root.findall('.//item')[:30]:
            title_node = item.find('title')
            if title_node is None or not title_node.text:
                continue

            title = title_node.text

            parts = title.split(" - ")
            disease = parts[0]

            alertas.append({
                "enfermedad": disease,
                "pais": "Unknown",
                "lat": 0,
                "lng": 0,
                "afectados": 0,
                "fecha_reporte": datetime.utcnow().strftime("%d/%m/%Y"),
                "prioridad": "Low",
                "fuente": "HealthMap"
            })

    except Exception as e:
        print("HealthMap error:", e)

    # -------------------------
    # ❌ NO FALLBACK
    # -------------------------
    return jsonify({
        "detalle_brotes": alertas,
        "total": len(alertas)
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)