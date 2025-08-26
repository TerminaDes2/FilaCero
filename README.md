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
	src/index.js
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

