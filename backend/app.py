from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# Permitimos que Next.js (que suele usar el puerto 3000) se conecte
CORS(app)

@app.route('/api/alerta', methods=['GET'])
def enviar_alerta():
    # Este es un ejemplo de datos que tu frontend recibirá
    datos = {
        "estado": "peligro",
        "mensaje": "¡Alerta de Virus detectada en el sistema!",
        "nivel_amenaza": 5
    }
    return jsonify(datos)

if __name__ == '__main__':
    # Ejecutamos en el puerto 5000
    app.run(debug=True, port=5000)