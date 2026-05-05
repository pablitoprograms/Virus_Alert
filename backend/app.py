from flask import Flask, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

# --- NUEVA RUTA PRINCIPAL ---
@app.route('/')
def inicio():
    return """
    <h1>Servidor VirusAlert: <span style='color: green;'>FUNCIONANDO</span></h1>
    <p>El backend está enviando datos al mapa correctamente.</p>
    <p>Puedes ver los datos en crudo aquí: <a href='/api/reportes-reales'>/api/reportes-reales</a></p>
    """

@app.route('/api/reportes-reales', methods=['GET'])
def obtener_datos_oficiales():
    try:
        url_api = "https://disease.sh/v3/covid-19/all"
        respuesta = requests.get(url_api, timeout=10)
        datos_originales = respuesta.json()

        datos_filtrados = {
            "total_casos": datos_originales.get("cases", 0),
            "hoy": datos_originales.get("todayCases", 0),
            "recuperados": datos_originales.get("recovered", 0),
            "muertes_hoy": datos_originales.get("todayDeaths", 0),
            "mensaje": "Datos actualizados correctamente desde organismos de salud"
        }
        
        return jsonify(datos_filtrados)
    
    except Exception as e:
        return jsonify({"error": "Error de conexión", "detalle": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)