# ════════════════════════════════════════════════════════════════════════════
# Variables de Entorno - Configuración para Zoho Mail OAuth2
# ════════════════════════════════════════════════════════════════════════════

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ CONFIGURACIÓN BÁSICA DEL SERVIDOR                                      │
# └─────────────────────────────────────────────────────────────────────────┘
PORT=3000

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ CONFIGURACIÓN DE REDIS                                                  │
# └─────────────────────────────────────────────────────────────────────────┘
REDIS_HOST=
REDIS_PORT=6379
REDIS_USER=
REDIS_PASSWORD=

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ CONFIGURACIÓN DE EMAIL - Zoho OAuth2                                   │
# └─────────────────────────────────────────────────────────────────────────┘

# Habilitar autenticación HTTP (OAuth2) en lugar de SMTP
MAIL_USE_HTTP=true

# ─────────────────────────────────────────────────────────────────────────
# OAuth2 - Credenciales de Zoho
# ─────────────────────────────────────────────────────────────────────────
# Obtén estas credenciales desde: https://api-console.zoho.com/
# 1. Crea un nuevo "Client" en Zoho API Console
# 2. Selecciona "Server-based Applications"
# 3. Copia el Client ID y Client Secret

ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL de redirección después de la autorización
# Debe coincidir exactamente con la URL configurada en Zoho API Console
# Formato: https://tu-dominio.com/api/email/auth/callback
ZOHO_REDIRECT_URI=https://tu-dominio.com/api/email/auth/callback

# ─────────────────────────────────────────────────────────────────────────
# OAuth2 - Refresh Token
# ─────────────────────────────────────────────────────────────────────────
# ⚠️ IMPORTANTE: Este token lo obtendrás DESPUÉS del primer flujo OAuth
# 
# Pasos para obtenerlo:
# 1. Configura las variables anteriores (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
# 2. Inicia tu aplicación
# 3. Visita: https://tu-dominio.com/api/email/auth
# 4. Acepta los permisos en Zoho
# 5. El refresh token se imprimirá en los logs de tu aplicación
# 6. Cópialo y pégalo aquí
# 7. Reinicia la aplicación
#
# Una vez configurado, el access_token se regenerará automáticamente
# y NO necesitarás volver a pasar por el flujo de autorización manual

ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────────────────────────────────
# OAuth2 - API Domain (Opcional)
# ─────────────────────────────────────────────────────────────────────────
# Dominio de la API de Zoho Mail
# Varía según tu región:
# - Global: https://mail.zoho.com
# - Europa: https://mail.zoho.eu
# - India: https://mail.zoho.in
# - Australia: https://mail.zoho.com.au
# - Japón: https://mail.zoho.jp

ZOHO_API_DOMAIN=https://mail.zoho.com

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ DIRECCIONES DE CORREO                                                   │
# └─────────────────────────────────────────────────────────────────────────┘
# Estas direcciones deben estar autorizadas en tu cuenta de Zoho Mail

MAIL_FROM=admin@tudominio.com
MAIL_NOREPLY_FROM=noreply@tudominio.com
MAIL_CONTACT_FROM=contacto@tudominio.com
MAIL_PRIVACY_FROM=privacidad@tudominio.com

# ════════════════════════════════════════════════════════════════════════════
# NOTAS IMPORTANTES
# ════════════════════════════════════════════════════════════════════════════
#
# 1. NO subas este archivo a GitHub si contiene valores reales
# 2. Crea un archivo .env con tus valores reales (está en .gitignore)
# 3. En Railway, configura estas variables en la sección "Variables"
# 4. El ZOHO_REFRESH_TOKEN es la clave para evitar reautorizaciones manuales
# 5. Si el refresh token se invalida, tendrás que repetir el flujo OAuth
#
# ════════════════════════════════════════════════════════════════════════════
