# Guía de Diagnóstico: Email de Verificación No Llega

## Problema
Al crear una cuenta nueva, el código de verificación por email no llega.

## Diagnóstico Paso a Paso

### 1. Verificar que todos los servicios estén corriendo

```powershell
docker ps
```

Deberías ver 5 contenedores:
- `filacero-backend`
- `filacero-frontend`
- `filacero-postgres`
- `filacero-redis` ⚠️ **CRÍTICO para emails**
- `filacero-ocr-dev`

Si `filacero-redis` no está corriendo, el sistema de emails NO funciona.

### 2. Probar SMTP directamente (sin colas)

**IMPORTANTE:** Edita `Backend/test-email.ts` línea 24 y pon tu email real:
```typescript
to: 'tu-email-real@gmail.com', // ⚠️ CAMBIA ESTO
```

Luego ejecuta:
```powershell
docker exec -it filacero-backend npx ts-node test-email.ts
```

**Resultados esperados:**
- ✅ "Conexión SMTP verificada correctamente" → SMTP funciona
- ✅ "Email enviado exitosamente!" → Revisa tu inbox/spam
- ❌ Error de autenticación → Credenciales SMTP incorrectas
- ❌ Error de conexión → Firewall o puerto bloqueado

### 3. Revisar logs de Redis y Bull

```powershell
# Ver si Redis está recibiendo conexiones
docker compose logs redis --tail=50

# Ver si Bull está procesando trabajos de email
docker compose logs backend | Select-String "QUEUE|EMAIL|Bull"
```

Busca líneas como:
- `[QUEUE_ENQUEUED] jobId=...` → Email se encoló correctamente
- `[QUEUE_ACTIVE] id=...` → Bull está procesando el job
- `[SMTP_SENT] ...` → Email se envió exitosamente
- `[QUEUE_FAILED] ...` → Falló el envío (ver error)

### 4. Probar el flujo completo de registro

Abre el frontend en http://localhost:3001/auth/register y crea una cuenta.

En otra terminal, monitorea en tiempo real:
```powershell
docker compose logs -f backend | Select-String "EMAIL|QUEUE|SMTP"
```

Deberías ver:
1. `[EMAIL_VERIFICATION_SEND] email=...`
2. `[QUEUE_ADD] email-queue/send-email ...`
3. `[QUEUE_ENQUEUED] jobId=...`
4. `[QUEUE_ACTIVE] id=...`
5. `[SMTP_SENDING] ...`
6. `[SMTP_SENT] ...`

Si no ves estas líneas, identifica dónde se detiene.

### 5. Revisar configuración de variables de entorno

El archivo `Backend/.env` tiene:
```bash
REDIS_HOST='localhost'  # ⚠️ ESTO ES PARA LOCAL SIN DOCKER
```

Pero `docker-compose.yml` sobrescribe con:
```yaml
- REDIS_HOST=redis  # ✅ Esto es correcto para Docker
```

**Verifica que el backend esté usando la variable correcta:**
```powershell
docker exec -it filacero-backend printenv | Select-String "REDIS"
```

Debe mostrar:
```
REDIS_HOST=redis
REDIS_PORT=6379
```

Si muestra `REDIS_HOST=localhost`, hay un problema de configuración.

### 6. Verificar credenciales SMTP

Las credenciales de Zoho en `.env`:
```
MAIL_NOREPLY_USER="no-reply@filacero.store"
MAIL_NOREPLY_PASS="mdEp34tJEF1z"
```

**Posibles problemas:**
- Contraseña de aplicación expirada/revocada
- IP no autorizada en Zoho
- Cuenta bloqueada por spam

**Prueba alternativa con Gmail:**
1. Crea una contraseña de aplicación en Gmail
2. Cambia en `.env`:
   ```
   MAIL_HOST="smtp.gmail.com"
   MAIL_PORT=587
   MAIL_NOREPLY_USER="tu-email@gmail.com"
   MAIL_NOREPLY_PASS="tu-contraseña-de-app"
   ```
3. Reinicia: `docker compose restart backend`

### 7. Inspeccionar la cola de Bull directamente

```powershell
docker exec -it filacero-redis redis-cli

# En el CLI de Redis:
KEYS *
LLEN bull:email-queue:waiting
LLEN bull:email-queue:failed
```

- Si `bull:email-queue:waiting` > 0 → Hay emails pendientes (Redis ok, procesador no)
- Si `bull:email-queue:failed` > 0 → Hay emails fallidos (ver errores)

## Soluciones Comunes

### Redis no está corriendo
```powershell
docker compose up -d redis
docker compose restart backend
```

### SMTP bloqueado
1. Verifica en Zoho Mail que la cuenta esté activa
2. Revisa que no haya límites de envío alcanzados
3. Prueba con otro proveedor (Gmail, SendGrid)

### Variables de entorno no se actualizan
```powershell
docker compose down
docker compose up -d
```

### Puerto 587 bloqueado
Algunas redes bloquean SMTP. Prueba con puerto 465 (SSL):
```bash
MAIL_PORT=465
MAIL_SECURE=true
```

## Contacto
Si después de todos estos pasos el problema persiste, comparte:
1. Output de `docker exec -it filacero-backend npx ts-node test-email.ts`
2. Logs completos de registro: `docker compose logs backend --tail=100`
3. Estado de Redis: `docker compose logs redis --tail=50`
