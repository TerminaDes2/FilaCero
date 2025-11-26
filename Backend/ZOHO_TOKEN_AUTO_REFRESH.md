# 🔄 Sistema de Renovación Automática de Tokens de Zoho

## 📋 Resumen

Este documento explica cómo funciona el sistema de renovación automática de tokens para el envío de correos con Zoho Mail en la aplicación.

## ❓ ¿Por qué los tokens expiran?

Los `access_token` de OAuth2 **SIEMPRE** tienen una duración limitada (típicamente 1 hora) por razones de seguridad. **No es posible extender su duración** porque es una restricción impuesta por Zoho (y todos los proveedores OAuth2).

Sin embargo, los `refresh_token` **NO expiran** (mientras no los revoques manualmente), lo que permite obtener nuevos `access_token` indefinidamente.

## ✅ Solución Implementada

Hemos implementado **DOS estrategias complementarias** para garantizar que siempre tengas un token válido:

### 1️⃣ Renovación Bajo Demanda (Ya existía)

Cuando se solicita un `access_token` mediante `getAccessToken()`:
- ✅ Verifica si el token expira en menos de 5 minutos
- ✅ Si está próximo a expirar, lo renueva automáticamente
- ✅ Retorna un token válido

**Código relevante:**
```typescript
async getAccessToken(): Promise<string> {
    const bufferTime = 5 * 60 * 1000; // 5 minutos
    if (Date.now() + bufferTime >= this.tokenData.expires_at) {
        return await this.refreshAccessToken();
    }
    return this.tokenData.access_token;
}
```

### 2️⃣ Renovación Proactiva (🆕 NUEVA)

El sistema ahora también **programa automáticamente** la renovación del token:
- ⏰ Calcula cuándo expirará el token actual
- 🔄 Programa una renovación automática **10 minutos antes** de que expire
- 🔁 Después de renovar, vuelve a programar la siguiente renovación
- 🛡️ Si falla, reintenta en 1 minuto

**Características:**
- ✅ No requiere que alguien use el servicio para renovar el token
- ✅ El token siempre estará fresco y válido
- ✅ Se ejecuta en segundo plano automáticamente
- ✅ Maneja errores y reintentos

## 📊 Flujo de Renovación Automática

```
Inicio del servidor
      ↓
Obtener access_token con refresh_token
      ↓
Programar renovación en 50 minutos (10 min antes de expirar)
      ↓
[Espera 50 minutos]
      ↓
Renovar access_token automáticamente
      ↓
Programar siguiente renovación
      ↓
[Ciclo continúa indefinidamente]
```

## 🔧 Configuración Necesaria

### Variables de Entorno

Asegúrate de tener estas variables configuradas:

```env
ZOHO_CLIENT_ID=tu_client_id
ZOHO_CLIENT_SECRET=tu_client_secret
ZOHO_REDIRECT_URI=http://localhost:3000/api/email/callback
ZOHO_REFRESH_TOKEN=tu_refresh_token  # ¡IMPORTANTE!
ZOHO_API_DOMAIN=https://mail.zoho.com
MAIL_USE_HTTP=true
```

### Obtener el Refresh Token (Primera vez)

1. **Visita** `http://localhost:3000/api/email/auth`
2. **Autoriza** la aplicación en Zoho
3. **Copia** el `ZOHO_REFRESH_TOKEN` que aparece en los logs
4. **Agrégalo** a tus variables de entorno
5. **Reinicia** la aplicación

## 📝 Logs del Sistema

El sistema genera logs informativos para monitorear el proceso:

### Al Iniciar
```
[INIT] ✅ Access token obtenido exitosamente usando ZOHO_REFRESH_TOKEN
[SCHEDULE_REFRESH] ⏰ Próxima renovación automática en 50 minutos
```

### Renovación Automática
```
[AUTO_REFRESH] 🔄 Iniciando renovación automática del token...
[REFRESH_TOKEN] 🔄 Refrescando access token...
[REFRESH_TOKEN_SUCCESS] ✅ Access token refrescado correctamente
[AUTO_REFRESH] ✅ Token renovado automáticamente
[SCHEDULE_REFRESH] ⏰ Próxima renovación automática en 50 minutos
```

### En Caso de Error
```
[AUTO_REFRESH_ERROR] ❌ Error al renovar token automáticamente: [mensaje]
[SCHEDULE_REFRESH] ⚡ Reintentando en 1 minuto...
```

## 🎯 Beneficios

✅ **Sin intervención manual**: El token se renueva automáticamente cada ~50 minutos
✅ **Resistente a fallos**: Si falla, reintenta automáticamente
✅ **Siempre disponible**: No importa si nadie usa el servicio, el token siempre estará fresco
✅ **Eficiente**: Solo renueva cuando es necesario
✅ **Limpieza automática**: Los timers se limpian cuando el servicio se destruye

## 🔍 Monitoreo

Puedes verificar el estado del sistema monitoreando los logs:

- Busca `[SCHEDULE_REFRESH]` para ver cuándo se programó la siguiente renovación
- Busca `[AUTO_REFRESH]` para ver las renovaciones automáticas
- Busca `[ERROR]` o `❌` para detectar problemas

## 🚀 Ventajas vs. Alternativas

### ❌ Alternativa 1: Renovar cada hora con cron
- Requiere configurar un cron job externo
- Puede renovar innecesariamente
- No se adapta a cambios en el tiempo de expiración

### ❌ Alternativa 2: Solo renovar bajo demanda
- Si nadie usa el servicio por más de 1 hora, el token expira
- Primer intento después de 1 hora fallará

### ✅ Nuestra solución: Renovación programada inteligente
- Se adapta automáticamente al tiempo de expiración
- No requiere configuración externa
- Siempre mantiene el token válido
- Eficiente y resistente a fallos

## 📌 Preguntas Frecuentes

**P: ¿Puedo hacer que el access_token dure más de 1 hora?**  
R: No, es una restricción de Zoho OAuth2 por seguridad. Pero con este sistema no lo necesitas.

**P: ¿Qué pasa si el servidor se reinicia?**  
R: Al iniciar, obtiene un nuevo access_token usando el refresh_token y programa la renovación automática.

**P: ¿El refresh_token expira?**  
R: No, mientras no lo revoques manualmente, el refresh_token es permanente.

**P: ¿Cuánto consume en recursos?**  
R: Mínimo. Solo usa un setTimeout que se ejecuta cada ~50 minutos con una petición HTTP ligera.

## 🛠️ Troubleshooting

### El token no se renueva automáticamente

1. Verifica que `ZOHO_REFRESH_TOKEN` esté configurado
2. Revisa los logs en busca de errores
3. Asegúrate de que `MAIL_USE_HTTP=true`

### Error al renovar el token

1. Verifica que las credenciales sean correctas
2. Comprueba que el refresh_token no haya sido revocado
3. Intenta reautorizar visitando `/api/email/auth`

---

**Última actualización**: 2025-11-20  
**Versión**: 2.0 (con renovación automática programada)
