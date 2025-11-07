import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear roles si no existen
  const adminRole = await prisma.roles.upsert({
    where: { nombre_rol: 'admin' },
    update: {},
    create: {
      nombre_rol: 'admin',
    },
  });

  const ownerRole = await prisma.roles.upsert({
    where: { nombre_rol: 'owner' },
    update: {},
    create: {
      nombre_rol: 'owner',
    },
  });

  const employeeRole = await prisma.roles.upsert({
    where: { nombre_rol: 'employee' },
    update: {},
    create: {
      nombre_rol: 'employee',
    },
  });

  console.log('✅ Roles creados');

  // 2. Crear usuario de prueba
  const testUser = await prisma.usuarios.upsert({
    where: { correo_electronico: 'demo@filacero.com' },
    update: {},
    create: {
      correo_electronico: 'demo@filacero.com',
      password_hash: '$2b$10$rM9ZwJ1Q2XYZ9kFQ9ZwJ1u', // Password: "demo123"
      nombre: 'Usuario Demo',
      numero_telefono: '555-0100',
      id_rol: ownerRole.id_rol,
      correo_verificado: true,
      correo_verificado_en: new Date(),
    },
  });

  console.log('✅ Usuario demo creado');

  // 3. Crear negocio de ejemplo
  const testBusiness = await prisma.negocio.upsert({
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

    const created = existing || await prisma.producto.create({
      data: prod,
    });

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
    { tipo: 'tarjeta', descripcion: 'Pago con tarjeta de crédito/débito' },
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
