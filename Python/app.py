from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from pathlib import Path
import shutil
import uvicorn
import os

from Credencial import validate_card
from typing import Optional
from pydantic import BaseModel
import urllib.request
import tempfile
import os

app = FastAPI(title="OCR Credencial API")


@app.post('/validate')
async def validate(image: UploadFile = File(...), expected_student_id: str = Form(None), expected_name: str = Form(None)):
    tmp_dir = Path('/tmp/uploads')
    tmp_dir.mkdir(parents=True, exist_ok=True)
    file_path = tmp_dir / image.filename
    with file_path.open('wb') as f:
        shutil.copyfileobj(image.file, f)

    try:
        res = validate_card(file_path, expected_student_id, expected_name)
    except FileNotFoundError:
        return JSONResponse(status_code=400, content={"error": "file not found or unreadable"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        try:
            file_path.unlink()
        except Exception:
            pass

    return res


class ValidatePayload(BaseModel):
    file: str
    expected_student_id: Optional[str] = None
    expected_name: Optional[str] = None


@app.post('/validate_json')
async def validate_json(payload: ValidatePayload):
    """Acepta JSON con la URL de la imagen (p.ej. Cloudinary) y campos esperados.
    Descarga la imagen desde la URL y llama a `validate_card` (implementado en `Credencial.py`).
    """
    url = payload.file
    if not url:
        return JSONResponse(status_code=400, content={"error": "file URL required"})

    # Descargar la imagen a un fichero temporal
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = resp.read()
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": f"Error downloading image: {e}"})

    fd, tmp_path = tempfile.mkstemp(suffix='.jpg')
    os.close(fd)
    try:
        with open(tmp_path, 'wb') as f:
            f.write(data)

        # Llamar al validador Python que usa OpenCV/Tesseract
        try:
            res = validate_card(tmp_path, payload.expected_student_id, payload.expected_name)
        except FileNotFoundError:
            return JSONResponse(status_code=400, content={"error": "file not found or unreadable"})
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": str(e)})

        return JSONResponse(status_code=200, content=res)
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run('app:app', host='0.0.0.0', port=port)
