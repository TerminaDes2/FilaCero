import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // --- CORREGIDO: Roles actualizados ---
  // 1. Crear roles si no existen
  const adminRole = await prisma.roles.upsert({
    where: { nombre_rol: 'admin' },
    update: {},
    create: {
      nombre_rol: 'admin',
    },
  });

  const superAdminRole = await prisma.roles.upsert({
    where: { nombre_rol: 'superadmin' },
    update: {},
    create: {
      nombre_rol: 'superadmin',
    },
  });

  const empleadoRole = await prisma.roles.upsert({
    where: { nombre_rol: 'empleado' },
    update: {},
    create: {
      nombre_rol: 'empleado',
    },
  });

  const usuarioRole = await prisma.roles.upsert({
    where: { nombre_rol: 'usuario' },
    update: {},
    create: {
      nombre_rol: 'usuario',
    },
  });

  console.log('✅ Roles creados');
  // --- FIN DE LA CORRECCIÓN ---

  // 2. Crear usuario de prueba
  const testUser = await prisma.usuarios.upsert({
    where: { correo_electronico: 'demo@filacero.com' },
    update: {},
    create: {
      correo_electronico: 'demo@filacero.com',
      password_hash: '$2b$10$rM9ZwJ1Q2XYZ9kFQ9ZwJ1u', // Password: "demo123"
      nombre: 'Usuario Demo',
      numero_telefono: '555-0100',
      // --- CORREGIDO: Asignado a superAdminRole ---
      id_rol: superAdminRole.id_rol,
      correo_verificado: true,
      correo_verificado_en: new Date(),
    },
  });

  console.log('✅ Usuario demo creado');

  // 3. Crear negocio de ejemplo
  const testBusiness = await prisma.negocio.upsert({
    // @ts-ignore
    where: { id_negocio: 1 },
    update: {},
    create: {
      nombre: 'Cafetería FilaCero',
      direccion: 'Av. Principal 123, Centro',
      telefono: '555-0200',
      correo: 'contacto@filacero.com',
      owner_id: testUser.id_usuario,
      fecha_registro: new Date(),
    },
  });

  console.log('✅ Negocio demo creado');

  // 4. Crear categorías si no existen
  const categories = [
    { nombre: 'Bebidas' },
    { nombre: 'Alimentos' },
    { nombre: 'Postres' },
    { nombre: 'Snacks' },
  ];

  for (const cat of categories) {
    await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Categorías creadas');

  // 5. Crear productos de ejemplo
  const bebidas = await prisma.categoria.findFirst({
    where: { nombre: 'Bebidas' },
  });
  const alimentos = await prisma.categoria.findFirst({
    where: { nombre: 'Alimentos' },
  });

  const productos = [
    {
      nombre: 'Café Americano',
      descripcion: 'Café americano preparado con granos selectos',
      precio: 35.0,
      id_categoria: bebidas!.id_categoria,
    },
    {
      nombre: 'Café Latte',
      descripcion: 'Espresso con leche vaporizada',
      precio: 45.0,
      id_categoria: bebidas!.id_categoria,
    },
    {
      nombre: 'Sandwich Club',
      descripcion: 'Sandwich triple con pollo, tocino y vegetales',
      precio: 85.0,
      id_categoria: alimentos!.id_categoria,
    },
    {
      nombre: 'Ensalada Caesar',
      descripcion: 'Ensalada con aderezo caesar y crutones',
      precio: 75.0,
      id_categoria: alimentos!.id_categoria,
    },
  ];

  for (const prod of productos) {
    const existing = await prisma.producto.findFirst({
      where: { nombre: prod.nombre },
    });

    const created = existing || (await prisma.producto.create({
      data: prod,
    }));

    // Crear inventario para cada producto
    await prisma.inventario.upsert({
      where: {
        id_negocio_id_producto: {
          id_negocio: testBusiness.id_negocio,
          id_producto: created.id_producto,
        },
      },
      update: {},
      create: {
        id_negocio: testBusiness.id_negocio,
        id_producto: created.id_producto,
        cantidad_actual: 50,
        stock_minimo: 10,
      },
    });
  }

  console.log('✅ Productos e inventario creados');

  // 6. Crear tipos de pago si no existen
  const tiposPago = [
    { tipo: 'efectivo', descripcion: 'Pago en efectivo' },
    { tipo: 'tarjeta', descripcion: 'Pago con tarjeta de crédito/débito (Stripe)' },
    { tipo: 'spei', descripcion: 'Transferencia SPEI' },
    { tipo: 'transferencia', descripcion: 'Transferencia bancaria' },
  ];

  for (const tipo of tiposPago) {
    await prisma.tipo_pago.upsert({
      where: { tipo: tipo.tipo },
      update: {},
      create: tipo,
    });
  }

  console.log('✅ Tipos de pago creados');

  // 7. Crear pedido de ejemplo
  const tipoPagoEfectivo = await prisma.tipo_pago.findFirst({
    where: { tipo: 'efectivo' },
  });

  const productosCafe = await prisma.producto.findMany({
    where: {
      nombre: { in: ['Café Americano', 'Sandwich Club'] },
    },
  });

  const pedidoEjemplo = await prisma.pedido.create({
    data: {
      id_negocio: testBusiness.id_negocio,
      id_usuario: testUser.id_usuario,
      id_tipo_pago: tipoPagoEfectivo!.id_tipo_pago,
      estado: 'pendiente',
      nombre_cliente: 'Juan Pérez',
      email_cliente: 'juan@example.com',
      telefono_cliente: '555-9999',
      total: 0, // Se recalculará automáticamente
      tiempo_entrega: '30-45 minutos',
      notas_cliente: 'Sin cebolla en el sandwich',
    },
  });

  // Agregar items al pedido
  await prisma.detalle_pedido.createMany({
    data: [
      {
        id_pedido: pedidoEjemplo.id_pedido,
        id_producto: productosCafe[0].id_producto,
        cantidad: 2,
        precio_unitario: productosCafe[0].precio,
        notas: 'Extra caliente',
      },
      {
        id_pedido: pedidoEjemplo.id_pedido,
        id_producto: productosCafe[1].id_producto,
        cantidad: 1,
        precio_unitario: productosCafe[1].precio,
        notas: 'Sin cebolla',
      },
    ],
  });

  console.log('✅ Pedido de ejemplo creado');

  // 8. Crear notificación de ejemplo
  await prisma.notificacion.create({
    data: {
      id_usuario: testUser.id_usuario,
      id_negocio: testBusiness.id_negocio,
      id_pedido: pedidoEjemplo.id_pedido,
      tipo: 'pedido_nuevo',
      titulo: 'Nuevo pedido recibido',
      mensaje: `Pedido #${pedidoEjemplo.id_pedido} de ${pedidoEjemplo.nombre_cliente}`,
      canal: 'in_app',
      leida: false,
    },
  });

  console.log('✅ Notificación de ejemplo creada');

  // 9. Crear historial de precios para productos
  console.log('📊 Creando historial de precios...');

  // Obtener algunos productos para crear historial
  const productosConHistorial = await prisma.producto.findMany({ take: 3 });

  for (const producto of productosConHistorial) {
    const precioActual = Number(producto.precio);
    
    // Crear 3 registros históricos por producto
    await prisma.productoHistorialPrecio.createMany({
      data: [
        {
          id_producto: producto.id_producto,
          precio: precioActual * 0.85, // Precio hace 2 meses (15% más barato)
          fecha_inicio: new Date('2025-09-01'),
          fecha_fin: new Date('2025-09-30'),
          vigente: false,
          motivo: 'Precio de lanzamiento',
          id_usuario: testUser.id_usuario,
          creado_en: new Date('2025-09-01'),
        },
        {
          id_producto: producto.id_producto,
          precio: precioActual * 0.95, // Precio hace 1 mes (5% más barato)
          fecha_inicio: new Date('2025-10-01'),
          fecha_fin: new Date('2025-10-31'),
          vigente: false,
          motivo: 'Ajuste de mercado',
          id_usuario: testUser.id_usuario,
          creado_en: new Date('2025-10-01'),
        },
        {
          id_producto: producto.id_producto,
          precio: precioActual, // Precio actual
          fecha_inicio: new Date('2025-11-01'),
          fecha_fin: null,
          vigente: true,
          motivo: 'Precio noviembre - inflación ajustada',
          id_usuario: testUser.id_usuario,
          creado_en: new Date('2025-11-01'),
        },
      ],
    });
  }

  console.log(`✅ Historial de precios creado para ${productosConHistorial.length} productos`);

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });