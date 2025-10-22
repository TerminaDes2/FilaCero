from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from pathlib import Path
import shutil
import uvicorn
import os

from Credencial import validate_card

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


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    uvicorn.run('app:app', host='0.0.0.0', port=port)
