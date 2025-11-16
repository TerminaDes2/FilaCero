from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
import shutil
import os
import cloudinary
import cloudinary.uploader

from Credencial import validate_card

# Configuración de Cloudinary
cloudinary.config(
    cloud_name="dthglapda",
    api_secret="EGock1Fm60yAFbQ_Rs6OVhshESs",
    api_key="663445446218971"
)

app = Flask(__name__)

# Habilitar CORS para la API
CORS(app)


@app.route('/validate', methods=['POST'])
def validate():
    image = request.files.get('image')
    expected_student_id = request.form.get('expected_student_id')
    expected_name = request.form.get('expected_name')

    if not image:
        return jsonify({"error": "No file provided"}), 400

    tmp_dir = Path('/tmp/uploads')
    tmp_dir.mkdir(parents=True, exist_ok=True)
    file_path = tmp_dir / image.filename
    with file_path.open('wb') as f:
        shutil.copyfileobj(image.stream, f)

    try:
        res = validate_card(file_path, expected_student_id, expected_name)
    except FileNotFoundError:
        return jsonify({"error": "file not found or unreadable"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            file_path.unlink()
        except Exception:
            pass

    return res


@app.route('/verificacion_credencial', methods=['POST'])
def verificacion_credencial():
    # Soportar dos formas de uso:
    # 1) multipart/form-data con campo 'file' (archivo)
    # 2) application/json con { "file": "https://..." } (URL remota)
    file = request.files.get('file')

    # Si no viene como archivo, intentar leer JSON/form con URL
    file_url = None
    if not file:
        # request.get_json(silent=True) devuelve None si no es JSON
        data = request.get_json(silent=True)
        if data and isinstance(data, dict):
            file_url = data.get('file')
        else:
            # también admitir form-urlencoded con 'file'
            file_url = request.form.get('file')

    if not file and not file_url:
        return jsonify({"error": "No file provided"}), 400

    # Subir la imagen a Cloudinary
    try:
        if file:
            # subir desde el stream del archivo
            upload_result = cloudinary.uploader.upload(file.stream)
        else:
            # subir desde URL remoto (string)
            upload_result = cloudinary.uploader.upload(file_url)

        return {"message": "Imagen subida exitosamente", "url": upload_result.get('url')}
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
