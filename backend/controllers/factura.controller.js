/**
 * ============================================
 * CONTROLADOR DE FACTURAS
 * ============================================
 * Maneja la lógica de negocio relacionada con facturas.
 * Funcionalidades:
 * - Crear factura cuando se paga un pedido
 * - Obtener factura de un pedido
 * - Descargar PDF de factura
 * - Reenviar factura por email (opcional)
 * - Listar facturas del usuario
 * - Anular factura (admin)
 */

const { Factura, Pedido, Usuario, DetallePedido, Producto } = require('../models');
const { generarFacturaPDF, obtenerBufferFactura } = require('../services/pdfService');

/**
 * Generar una nueva factura (se llamará automáticamente cuando se pague un pedido)
 * POST /api/cliente/facturas
 * Body: { pedidoId: number }
 */
exports.crearFactura = async (req, res) => {
  try {
    const { pedidoId } = req.body;
    const usuarioId = req.usuario.id;

    // Validar que el pedidoId esté presente
    if (!pedidoId) {
      return res.status(400).json({
        success: false,
        message: 'El ID del pedido es obligatorio'
      });
    }

    // Obtener el pedido con sus detalles
    const pedido = await Pedido.findOne({
      where: { id: pedidoId, usuarioId },
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        },
        { model: Usuario, as: 'usuario' }
      ]
    });

    // Verificar que el pedido existe y pertenece al usuario
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el pedido está pagado antes de generar la factura
    if (pedido.estado !== 'pagado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se puede generar factura para pedidos pagados'
      });
    }

    // Verificar que ya no existe una factura para este pedido
    const facturaExistente = await Factura.findOne({ where: { pedidoId } });
    if (facturaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una factura para este pedido'
      });
    }

    // Generar número de factura único
    const ultimaFactura = await Factura.findOne({
      order: [['id', 'DESC']]
    });
    
    const numeroSecuencial = (ultimaFactura?.id || 0) + 1;
    const ano = new Date().getFullYear();
    const numeroFactura = `FAC-${ano}-${String(numeroSecuencial).padStart(5, '0')}`;

    // Preparar datos de detalles para PDF
    const detalles = pedido.detalles.map(det => ({
      productoId: det.producto.id,
      nombre: det.producto.nombre,
      cantidad: det.cantidad,
      precioUnitario: det.precioUnitario,
      subtotal: det.subtotal
    }));

    // Calcular impuesto (19% en Colombia)
    const subtotal = parseFloat(pedido.total) / 1.19; // Asumir que el total ya incluye IVA
    const impuesto = pedido.total - subtotal;

    // Crear registro de factura en BD
    const factura = await Factura.create({
      pedidoId,
      numeroFactura,
      clienteNombre: pedido.usuario.nombre,
      clienteEmail: pedido.usuario.email,
      clienteDocumento: pedido.usuario.cedula || null,
      direccionEnvio: pedido.direccionEnvio,
      telefonoEnvio: pedido.telefono,
      subtotal: subtotal.toFixed(2),
      impuesto: impuesto.toFixed(2),
      total: pedido.total,
      metodoPago: pedido.metodoPago,
      referenciaPago: null,
      estado: 'emitida',
      detalles
    });

    // Generar PDF de la factura
    try {
      const rutaPDF = await generarFacturaPDF(factura.dataValues, true);
      
      // Actualizar la ruta del PDF en la BD
      await factura.update({ rutaPDF });
      
      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: {
          id: factura.id,
          numeroFactura: factura.numeroFactura,
          estado: factura.estado,
          total: factura.total,
          fechaEmision: factura.fechaEmision
        }
      });
    } catch (pdfError) {
      console.error('Error generando PDF:', pdfError);
      // La factura se creó pero sin PDF - se puede regenerar después
      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente (PDF pendiente)',
        data: {
          id: factura.id,
          numeroFactura: factura.numeroFactura,
          estado: factura.estado,
          total: factura.total,
          fechaEmision: factura.fechaEmision
        }
      });
    }

  } catch (error) {
    console.error('Error creando factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la factura',
      error: error.message
    });
  }
};

/**
 * Obtener la factura de un pedido
 * GET /api/cliente/pedidos/:pedidoId/factura
 */
exports.obtenerFacturaPedido = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const usuarioId = req.usuario.id;

    // Verificar que el pedido pertenece al usuario
    const pedido = await Pedido.findOne({
      where: { id: pedidoId, usuarioId }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Obtener la factura
    const factura = await Factura.findOne({
      where: { pedidoId }
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'No hay factura para este pedido'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: factura.id,
        numeroFactura: factura.numeroFactura,
        fechaEmision: factura.fechaEmision,
        clienteNombre: factura.clienteNombre,
        direccionEnvio: factura.direccionEnvio,
        subtotal: factura.subtotal,
        impuesto: factura.impuesto,
        total: factura.total,
        metodoPago: factura.metodoPago,
        estado: factura.estado,
        detalles: factura.detalles
      }
    });

  } catch (error) {
    console.error('Error obteniendo factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la factura',
      error: error.message
    });
  }
};

/**
 * Descargar PDF de la factura
 * GET /api/cliente/facturas/:numeroFactura/descargar
 */
exports.descargarFacturaPDF = async (req, res) => {
  try {
    const { numeroFactura } = req.params;
    const usuarioId = req.usuario.id;

    // Verificar que la factura pertenece al usuario
    const factura = await Factura.findOne({
      where: { numeroFactura },
      include: [
        {
          model: Pedido,
          as: 'pedido',
          where: { usuarioId }
        }
      ]
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    if (!factura.rutaPDF) {
      return res.status(400).json({
        success: false,
        message: 'El PDF de esta factura no está disponible'
      });
    }

    // Obtener el buffer del PDF
    const pdfBuffer = await obtenerBufferFactura(numeroFactura);

    // Actualizar estado a 'vista'
    await factura.update({ estado: 'vista' });

    // Enviar el PDF al cliente
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${numeroFactura}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error descargando factura:', error);
    
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        message: 'Archivo de factura no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al descargar la factura',
      error: error.message
    });
  }
};

/**
 * Listar todas las facturas del usuario
 * GET /api/cliente/facturas
 */
exports.listarFacturasUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await Factura.findAndCountAll({
      include: [
        {
          model: Pedido,
          as: 'pedido',
          attributes: ['id', 'estado'],
          where: { usuarioId },
          required: true
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fechaEmision', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        total: count,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(count / limit),
        facturas: rows.map(f => ({
          id: f.id,
          numeroFactura: f.numeroFactura,
          fechaEmision: f.fechaEmision,
          clienteNombre: f.clienteNombre,
          total: f.total,
          estado: f.estado,
          pedidoEstado: f.pedido.estado
        }))
      }
    });

  } catch (error) {
    console.error('Error listando facturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar las facturas',
      error: error.message
    });
  }
};

/**
 * Ver detalle de factura (para admin o propietario)
 * GET /api/admin/facturas/:id
 */
exports.verDetalleFactura = async (req, res) => {
  try {
    const { id } = req.params;

    const factura = await Factura.findOne({
      where: { id },
      include: [
        {
          model: Pedido,
          as: 'pedido',
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }]
        }
      ]
    });

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: factura
    });

  } catch (error) {
    console.error('Error obteniendo detalle de factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la factura',
      error: error.message
    });
  }
};

/**
 * Listar todas las facturas (admin)
 * GET /api/admin/facturas
 */
exports.listarFacturasAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, estado } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) {
      where.estado = estado;
    }

    const { count, rows } = await Factura.findAndCountAll({
      where,
      include: [
        {
          model: Pedido,
          as: 'pedido',
          attributes: ['id', 'estado', 'metodoPago'],
          include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'email'] }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fechaEmision', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        total: count,
        pagina: parseInt(page),
        limite: parseInt(limit),
        totalPaginas: Math.ceil(count / limit),
        facturas: rows.map(f => ({
          id: f.id,
          numeroFactura: f.numeroFactura,
          fechaEmision: f.fechaEmision,
          clienteNombre: f.clienteNombre,
          clienteEmail: f.clienteEmail,
          total: f.total,
          estado: f.estado,
          pedidoEstado: f.pedido.estado
        }))
      }
    });

  } catch (error) {
    console.error('Error listando facturas (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar las facturas',
      error: error.message
    });
  }
};

/**
 * Anular una factura (admin)
 * PUT /api/admin/facturas/:id/anular
 */
exports.anularFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const factura = await Factura.findByPk(id);

    if (!factura) {
      return res.status(404).json({
        success: false,
        message: 'Factura no encontrada'
      });
    }

    if (factura.estado === 'anulada') {
      return res.status(400).json({
        success: false,
        message: 'La factura ya está anulada'
      });
    }

    // Actualizar estado a anulada
    await factura.update({
      estado: 'anulada',
      notas: `Anulada. Motivo: ${motivo || 'No especificado'}`
    });

    res.status(200).json({
      success: true,
      message: 'Factura anulada exitosamente',
      data: {
        id: factura.id,
        numeroFactura: factura.numeroFactura,
        estado: factura.estado
      }
    });

  } catch (error) {
    console.error('Error anulando factura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al anular la factura',
      error: error.message
    });
  }
};

module.exports = exports;
