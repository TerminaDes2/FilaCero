# ═══════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN DE MÚLTIPLES CUENTAS DE ZOHO MAIL
# ═══════════════════════════════════════════════════════════════════════
#
# Este archivo muestra cómo configurar diferentes cuentas de Zoho Mail
# para que cada dirección de correo use sus propias credenciales OAuth.
#
# IMPORTANTE: Cada cuenta de Zoho Mail necesita:
#   1. CLIENT_ID y CLIENT_SECRET (de la consola de desarrollador de Zoho)
#   2. REFRESH_TOKEN (obtenido después de autorizar la app)
#
# ═══════════════════════════════════════════════════════════════════════

# -----------------------------------------------------------------------
# CONFIGURACIÓN BÁSICA
# -----------------------------------------------------------------------
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
MAIL_USE_HTTP=true
ZOHO_API_DOMAIN=https://mail.zoho.com
ZOHO_REDIRECT_URI=http://localhost:3000/api/email/callback

# -----------------------------------------------------------------------
# CREDENCIALES PARA NO-REPLY@FILACERO.STORE
# -----------------------------------------------------------------------
# Estas credenciales se usan cuando el remitente es no-reply@filacero.store
ZOHO_CLIENT_ID_NOREPLY=tu_client_id_noreply
ZOHO_CLIENT_SECRET_NOREPLY=tu_client_secret_noreply
ZOHO_REFRESH_TOKEN_NOREPLY=tu_refresh_token_noreply

# -----------------------------------------------------------------------
# CREDENCIALES PARA PRIVACITY@FILACERO.STORE
# -----------------------------------------------------------------------
# Estas credenciales se usan cuando el remitente es privacity@filacero.store
ZOHO_CLIENT_ID_PRIVACITY=tu_client_id_privacity
ZOHO_CLIENT_SECRET_PRIVACITY=tu_client_secret_privacity
ZOHO_REFRESH_TOKEN_PRIVACITY=tu_refresh_token_privacity

# -----------------------------------------------------------------------
# CREDENCIALES POR DEFECTO (LEGACY)
# -----------------------------------------------------------------------
# Estas se usan como fallback si ninguna de las anteriores coincide
ZOHO_CLIENT_ID=tu_client_id_default
ZOHO_CLIENT_SECRET=tu_client_secret_default
ZOHO_REFRESH_TOKEN=tu_refresh_token_default

# -----------------------------------------------------------------------
# DIRECCIONES DE EMAIL
# -----------------------------------------------------------------------
MAIL_FROM=default@filacero.store
MAIL_NOREPLY_FROM=no-reply@filacero.store
MAIL_CONTACT_FROM=contact@filacero.store
MAIL_PRIVACY_FROM=privacity@filacero.store

# ═══════════════════════════════════════════════════════════════════════
# CÓMO OBTENER EL REFRESH TOKEN
# ═══════════════════════════════════════════════════════════════════════
#
# 1. Asegúrate de tener CLIENT_ID y CLIENT_SECRET configurados
# 2. Inicia tu servidor: npm run start:dev
# 3. Visita: http://localhost:3000/api/email/auth
# 4. Autoriza la aplicación con la cuenta de Zoho correspondiente
# 5. Copia el REFRESH_TOKEN que aparece en los logs
# 6. Pégalo en la variable correspondiente arriba
# 7. Reinicia el servidor
#
# NOTA: Si tienes múltiples cuentas (no-reply y privacity), necesitas
# obtener un REFRESH_TOKEN para cada una autorizando con cada cuenta.
#
# ═══════════════════════════════════════════════════════════════════════
