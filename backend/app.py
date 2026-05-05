from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "API de Virus Alert funcionando 🚀"

@app.route('/api/alerta', methods=['GET'])
def enviar_alerta():
    datos = {
        "estado": "peligro",
        "mensaje": "¡Alerta de Virus detectada en el sistema!",
        "nivel_amenaza": 5
    }
    return jsonify(datos)

if __name__ == '__main__':
    app.run(debug=True, port=5000)