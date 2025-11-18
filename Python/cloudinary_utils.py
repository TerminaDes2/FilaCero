"""
Utilidades para descargar imágenes (Cloudinary u otras URLs) y extraer texto con OCR.
Diseñado para usarse con el payload:
{ "file": "https://res.cloudinary.com/..../image.jpg", "expected_student_id": "20210974", "expected_name": "Dominic Isai Garcia Bautista" }

Dependencias: usa solo la biblioteca estándar para la descarga y `pytesseract`, `opencv-python-headless`, `numpy` ya listadas en `requirements.txt`.
Evita depender de `requests` o `Pillow` escribiendo la imagen a un fichero temporal y pasando la ruta a `pytesseract`.

Funciones principales:
- process_payload(payload) -> dict con resultados de OCR y coincidencias
- download_image_bytes(url) -> bytes
- ocr_image_from_bytes(image_bytes) -> str

Nota: requiere el binario `tesseract` instalado en el sistema (pytesseract es el wrapper Python).
"""

from __future__ import annotations
import urllib.request
import tempfile
import os
import re
import json
from typing import Optional, Dict, Any
import numpy as np
import cv2
import pytesseract

try:
    from fuzzywuzzy import fuzz
except Exception:
    fuzz = None


def download_image_bytes(url: str, timeout: int = 15) -> bytes:
    """Descarga raw bytes de una URL (seguirá redirecciones)."""
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return resp.read()


def ocr_image_from_bytes(image_bytes: bytes, lang: str = 'eng') -> str:
    """Guarda temporalmente la imagen y ejecuta pytesseract sobre el fichero.
    Devolvemos el texto en bruto tal cual lo devuelve tesseract.
    """
    fd, path = tempfile.mkstemp(suffix='.jpg')
    os.close(fd)
    try:
        with open(path, 'wb') as f:
            f.write(image_bytes)
        # Opcional: preprocesado con OpenCV para mejorar OCR
        # Cargar con OpenCV y convertir a escala de grises
        img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        if img is not None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Binarización simple
            _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            # Sobrescribe el archivo temporal con la versión preprocesada
            cv2.imwrite(path, th)
        # Ejecutar OCR sobre el fichero
        text = pytesseract.image_to_string(path, lang=lang)
        return text
    finally:
        try:
            os.remove(path)
        except Exception:
            pass


def extract_student_id(ocr_text: str) -> Optional[str]:
    """Busca un patrón de número que podría ser un ID de estudiante (6-10 dígitos).
    Devuelve la primera coincidencia o None.
    """
    if not ocr_text:
        return None
    # Buscar secuencia de 6 a 10 dígitos (ajustable según formato real)
    m = re.search(r"\b(\d{6,10})\b", ocr_text)
    if m:
        return m.group(1)
    return None


def extract_name(ocr_text: str) -> Optional[str]:
    """Intenta extraer la línea que parece el nombre: la línea más larga con letras y espacios.
    Esto es heurístico; puede ajustarse según el formato real de las imágenes.
    """
    if not ocr_text:
        return None
    lines = [ln.strip() for ln in ocr_text.splitlines() if ln.strip()]
    # Filtrar líneas con al menos una letra
    candidate_lines = [ln for ln in lines if re.search(r"[A-Za-zÀ-ÖØ-öø-ÿ]", ln)]
    if not candidate_lines:
        return None
    # Devolver la línea con más palabras/longitud
    candidate_lines.sort(key=lambda s: (len(s.split()), len(s)), reverse=True)
    return candidate_lines[0]


def compare_names(expected: str, found: Optional[str]) -> Dict[str, Any]:
    """Compara dos nombres y devuelve una puntuación y una etiqueta simple.
    Usa fuzzywuzzy si está disponible, si no, usa una similitud basada en ratio simple.
    """
    if not found:
        return {"score": 0, "match": False, "found": None}
    expected_norm = re.sub(r"\s+", " ", expected.strip()).lower()
    found_norm = re.sub(r"\s+", " ", found.strip()).lower()
    score = 0
    if fuzz is not None:
        try:
            score = fuzz.token_set_ratio(expected_norm, found_norm)
        except Exception:
            # Fallback
            from difflib import SequenceMatcher
            score = int(SequenceMatcher(None, expected_norm, found_norm).ratio() * 100)
    else:
        from difflib import SequenceMatcher
        score = int(SequenceMatcher(None, expected_norm, found_norm).ratio() * 100)
    match = score >= 80  # umbral por defecto (ajustable)
    return {"score": int(score), "match": bool(match), "found": found}


def process_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Proceso completo: descarga, OCR, extracción y comparación con valores esperados.

    payload debe contener claves: `file` (URL), `expected_student_id`, `expected_name`.
    Devuelve dict con información detectada y flags de coincidencia.
    """
    url = payload.get('file')
    expected_id = payload.get('expected_student_id')
    expected_name = payload.get('expected_name')
    result: Dict[str, Any] = {
        'url': url,
        'expected_student_id': expected_id,
        'expected_name': expected_name,
        'ok': False,
        'error': None,
        'ocr_text': None,
        'detected_student_id': None,
        'detected_name': None,
        'name_comparison': None,
    }

    if not url:
        result['error'] = 'No se proporcionó URL en `file`.'
        return result

    try:
        img_bytes = download_image_bytes(url)
    except Exception as e:
        result['error'] = f'Error descargando la imagen: {e}'
        return result

    try:
        ocr_text = ocr_image_from_bytes(img_bytes)
        result['ocr_text'] = ocr_text
    except Exception as e:
        result['error'] = f'Error en OCR: {e}'
        return result

    detected_id = extract_student_id(ocr_text)
    detected_name = extract_name(ocr_text)
    result['detected_student_id'] = detected_id
    result['detected_name'] = detected_name

    # Comparar ID (simple igualdad)
    id_match = None
    if expected_id is not None:
        id_match = str(detected_id) == str(expected_id)
    result['id_match'] = id_match

    # Comparar nombres con fuzzy
    if expected_name is not None:
        result['name_comparison'] = compare_names(expected_name, detected_name)

    # Ok si al menos ID o nombre matchean
    result['ok'] = bool(id_match or (result.get('name_comparison') and result['name_comparison'].get('match')))

    return result


if __name__ == '__main__':
    # Ejemplo de uso con el payload proporcionado
    sample = {
        "file": "https://res.cloudinary.com/dthglapda/image/upload/v1763415458/bbsyagodyuukx62qhhtb.jpg",
        "expected_student_id": "20210974",
        "expected_name": "Dominic Isai Garcia Bautista"
    }
    print(json.dumps(process_payload(sample), ensure_ascii=False, indent=2))
