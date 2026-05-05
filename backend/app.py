from flask import Flask, jsonify
from flask_cors import CORS
import requests # Esta librería es la que "navega" por internet

app = Flask(__name__)
CORS(app)

@app.route('/api/reportes-reales', methods=['GET'])
def obtener_datos_oficiales():
    try:
        # Consultamos una API de salud pública real
        url_api = "https://disease.sh/v3/covid-19/all"
        respuesta = requests.get(url_api)
        datos_originales = respuesta.json()

        # "Limpiamos" los datos para enviar solo lo que nos interesa al frontend
        datos_filtrados = {
            "total_casos": datos_originales.get("cases"),
            "hoy": datos_originales.get("todayCases"),
            "recuperados": datos_originales.get("recovered"),
            "muertes_hoy": datos_originales.get("todayDeaths"),
            "mensaje": "Datos actualizados desde organismos de salud"
        }
        
        return jsonify(datos_filtrados)
    
    except Exception as e:
        return jsonify({"error": "No se pudo conectar con la API oficial", "detalle": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)