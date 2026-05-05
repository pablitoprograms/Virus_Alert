from flask import Flask, jsonify
from flask_cors import CORS
import requests # Esta librería es la que "navega" por internet

app = Flask(__name__)
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
    app.run(debug=True, port=5000)