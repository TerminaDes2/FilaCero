OCR Credencial service

Instrucciones rápidas:

- Build local (desde la raíz del repo):
  docker build -t filacero-ocr:dev -f Python/Dockerfile Python

- Levantar con docker-compose dev (ya se incluye en docker-compose.dev.yml):
  docker compose -f docker-compose.dev.yml up --build

- Endpoint:
  POST /validate
  Form fields: image (file), expected_student_id (optional), expected_name (optional)

Ejemplo curl:

  curl -F "image=@tarjeta.jpg" -F "expected_name=JUAN PEREZ" http://localhost:8000/validate
