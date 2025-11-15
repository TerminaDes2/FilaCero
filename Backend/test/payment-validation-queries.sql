-- Queries SQL para validar estados del sistema de pagos
-- Ejecutar en PgAdmin o psql para verificar integridad

-- 1. Verificar pedido creado
SELECT 
    p.id_pedido,
    p.id_usuario,
    p.id_negocio,
    p.estado,
    p.total,
    p.fecha_creacion,
    p.fecha_confirmacion
FROM pedido p
WHERE p.id_pedido = <PEDIDO_ID>; -- Reemplazar con ID del pedido

-- 2. Verificar transacción de pago creada
SELECT 
    t.id_transaccion,
    t.id_pedido,
    t.stripe_payment_id,
    t.estado,
    t.monto,
    t.metodo_pago,
    t.created_at,
    t.updated_at
FROM transaccion_pago t
WHERE t.id_pedido = <PEDIDO_ID>;

-- 3. Verificar usuario tiene Stripe Customer ID
SELECT 
    u.id_usuario,
    u.nombre,
    u.correo_electronico,
    u.stripe_customer_id
FROM usuarios u
WHERE u.id_usuario = <USER_ID>;

-- 4. Verificar estado del pedido después de pago exitoso
-- Debe cambiar de 'pendiente' a 'confirmado'
SELECT 
    p.id_pedido,
    p.estado AS estado_pedido,
    p.fecha_confirmacion,
    t.estado AS estado_transaccion,
    t.stripe_payment_id,
    t.monto,
    t.stripe_fee,
    t.net_amount
FROM pedido p
LEFT JOIN transaccion_pago t ON p.id_pedido = t.id_pedido
WHERE p.id_pedido = <PEDIDO_ID>;

-- 5. Verificar métodos de pago guardados del usuario
SELECT 
    m.id_metodo,
    m.id_usuario,
    m.tipo,
    m.marca,
    m.ultima_4_digitos,
    m.mes_expiracion,
    m.anio_expiracion,
    m.is_default,
    m.activo,
    m.created_at
FROM metodo_pago_guardado m
WHERE m.id_usuario = <USER_ID>
ORDER BY m.is_default DESC, m.created_at DESC;

-- 6. Listar todas las transacciones de un usuario
SELECT 
    t.id_transaccion,
    t.id_pedido,
    p.id_negocio,
    n.nombre_negocio,
    t.estado,
    t.monto,
    t.metodo_pago,
    t.stripe_payment_id,
    t.error_codigo,
    t.error_mensaje,
    t.created_at
FROM transaccion_pago t
JOIN pedido p ON t.id_pedido = p.id_pedido
JOIN negocios n ON p.id_negocio = n.id_negocio
WHERE p.id_usuario = <USER_ID>
ORDER BY t.created_at DESC;

-- 7. Verificar transacciones fallidas (para debugging)
SELECT 
    t.id_transaccion,
    t.id_pedido,
    t.stripe_payment_id,
    t.estado,
    t.error_codigo,
    t.error_mensaje,
    t.monto,
    t.updated_at
FROM transaccion_pago t
WHERE t.estado IN ('failed', 'canceled')
ORDER BY t.updated_at DESC
LIMIT 10;

-- 8. Verificar pagos reembolsados
SELECT 
    t.id_transaccion,
    t.id_pedido,
    p.estado AS estado_pedido,
    t.estado AS estado_transaccion,
    t.monto,
    t.error_mensaje,
    t.updated_at
FROM transaccion_pago t
JOIN pedido p ON t.id_pedido = p.id_pedido
WHERE t.estado = 'refunded'
ORDER BY t.updated_at DESC;

-- 9. Estadísticas generales de pagos
SELECT 
    COUNT(*) AS total_transacciones,
    COUNT(CASE WHEN estado = 'succeeded' THEN 1 END) AS exitosas,
    COUNT(CASE WHEN estado = 'failed' THEN 1 END) AS fallidas,
    COUNT(CASE WHEN estado = 'pending' THEN 1 END) AS pendientes,
    COUNT(CASE WHEN estado = 'canceled' THEN 1 END) AS canceladas,
    COUNT(CASE WHEN estado = 'refunded' THEN 1 END) AS reembolsadas,
    SUM(CASE WHEN estado = 'succeeded' THEN monto ELSE 0 END) AS monto_total_exitoso
FROM transaccion_pago;

-- 10. Verificar integridad: pedidos confirmados deben tener transacción succeeded
SELECT 
    p.id_pedido,
    p.estado AS estado_pedido,
    t.estado AS estado_transaccion,
    p.total,
    t.monto
FROM pedido p
LEFT JOIN transaccion_pago t ON p.id_pedido = t.id_pedido
WHERE p.estado = 'confirmado' AND (t.estado IS NULL OR t.estado != 'succeeded')
LIMIT 10;

-- 11. Buscar duplicados de PaymentIntent (verificar idempotencia)
SELECT 
    stripe_payment_id,
    COUNT(*) AS cantidad
FROM transaccion_pago
WHERE stripe_payment_id IS NOT NULL
GROUP BY stripe_payment_id
HAVING COUNT(*) > 1;
