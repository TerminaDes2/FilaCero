# 🎓✨ FilaCero

> 🚀 *FilaCero is a student-led initiative developed for the University of Colima, aimed at solving the issue of cafeteria congestion during break hours by streamlining service and enhancing comfort for the university community.*

---

## 🎯 **Our Mission**
Reduce cafeteria chaos 🥪🍔 by making service **faster**, **simpler**, and **friendlier** for students and staff.  

---

## 🛠️ **Features**
- 📱 Mobile-first design  
- ⚡ Fast and efficient service flow  
- 👩‍🎓 Built by students, for students  
- ☕ More time to enjoy your coffee, less time waiting  

---

## 🏫 **About the Project**
FilaCero is an academic and community-driven initiative developed at the **University of Colima**.  
It embodies collaboration, innovation, and the desire to improve everyday student life.  

---

## 🖼️ **Preview**
![FilaCero Mockup](https://via.placeholder.com/600x300.png?text=FilaCero+App+Preview)  

---

## 🤝 **Contributors**
👨‍💻 Student developers from **University of Colima**  
🙌 Guided by professors and the cafeteria community  

---

## 📌 **Status**
🟢 *Currently in development — stay tuned for updates!*  

---

## 📫 **Contact**
Have ideas or feedback? Let’s collaborate!  
📧 fila.cero@ucol.mx  

---

⭐ If you like this project, don’t forget to **star** it on GitHub!

---

## 🚀 Desarrollo local con Node.js vía Docker

Hemos agregado configuración mínima para un backend Express y un frontend Vite usando sólo contenedores.

### Estructura añadida
```
Backend/
	package.json
	src/main.ts (Nest bootstrap)
	src/app.module.ts
	src/app.controller.ts
	src/app.service.ts
	tsconfig*.json
Frontend/
	package.json
	index.html
	src/main.js
Docker/
	backend.Dockerfile
	frontend.Dockerfile
docker-compose.yml
```

### Requisitos
* Docker Desktop (o Docker Engine)

### Levantar entorno de desarrollo
```powershell
docker compose up --build
```
Visita:
* Backend: http://localhost:3000/api/health
* Frontend: http://localhost:5173/

Los cambios en código se recargan automáticamente (nodemon / Vite) gracias a los volúmenes.

### Comandos útiles
```powershell
# Reconstruir solo backend si cambia package.json
docker compose build backend

# Ver logs en vivo
docker compose logs -f backend

# Entrar al contenedor backend
docker compose exec backend sh
```

### Subir estos cambios a GitHub
```powershell
git add .
git commit -m "feat: inicializa backend Express y frontend Vite con Docker"
git push origin main
```

### Próximos pasos sugeridos
* Variables de entorno (.env + dotenv)
* Tests (Jest para backend, Vitest para frontend)
* Linter & formatter (ESLint + Prettier)
* Pipeline CI (GitHub Actions) para instalar, testear y build
* Configurar build de producción multistage (sirviendo frontend estático con nginx)

¿Necesitas el setup de producción o CI? Pídelo y lo añadimos.

---

## 🧩 VS Code: Resolver "No se encuentra el módulo '@nestjs/common'"

Si ves este error en VS Code pero el contenedor corre bien, es porque tu editor está analizando el código desde el host (donde no hay `node_modules`). Opciones:

1. Abrir el proyecto dentro del contenedor (recomendado):
	- Instala la extensión "Dev Containers".
	- Abre la paleta (Ctrl+Shift+P) y ejecuta: Dev Containers: Reopen in Container.
	- Se montará usando `docker-compose` y se instalarán dependencias dentro.
2. Alternativa rápida: Ejecuta `npm install` localmente dentro de `Backend/` (requiere tener Node instalado en tu máquina) sólo para que VS Code tenga los tipos.

Hemos añadido `.devcontainer/devcontainer.json` para la opción 1.

### ¿Por qué ocurre?
TypeScript Server busca `Backend/node_modules/@nestjs/common` en tu filesystem host. Al existir sólo dentro del contenedor (volumen anónimo `/app/node_modules`), el host no lo ve.

### Cómo verificar dentro del contenedor
```powershell
docker compose exec backend ls -1 node_modules/@nestjs | findstr /C:"common"
```

Deberías ver `common` listado. Si no:
```powershell
docker compose exec backend npm install
```

### Ajuste opcional (persistir node_modules)
Si quieres que `node_modules` viva en tu carpeta (para indexación local), elimina la línea `- /app/node_modules` en `docker-compose.yml` (que crea un volumen anónimo vacío) y reconstruye:
```powershell
docker compose down
docker compose up --build
```

Esto hará que `Backend/node_modules` exista en el host tras la instalación dentro del contenedor.

