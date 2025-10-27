# Estado del módulo de feedback

## Modelo de datos
- Tabla `comentario`: referenciada por negocio y usuario, mantiene estado (`visible`, `oculto`, etc.).
- Tabla `feedback`: registra reacciones y calificaciones breves sobre comentarios, con restricciones de unicidad (`id_comentario`, `id_usuario`, `tipo`).
- Relaciones definidas en `prisma/schema.prisma` con cascada para conservar integridad cuando se borran negocios o usuarios.

## Consideraciones actuales
- No existe aún un servicio Nest dedicado para feedback; solo se cuenta con el esquema y triggers en `Docker/db/db_filacero.sql`.
- El disparador `fn_touch_comentario_actualizado` actualiza `actualizado_en` al recibir reacciones.
- Se espera crear DTOs y endpoints REST en un módulo posterior que respete la unicidad de reacciones por usuario.

## Próximos pasos sugeridos
1. Generar migración Prisma acorde al esquema actualizado.
2. Implementar `FeedbackService` que utilice `PrismaService` y aplique validaciones de negocio.
3. Exponer endpoints en `/api/businesses/:businessId/feedback` o anidados bajo comentarios.
4. Añadir pruebas e2e para validar estados (`visible`, `oculto`) y recuentos de reacciones.
