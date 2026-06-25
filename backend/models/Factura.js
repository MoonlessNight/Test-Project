/**
 * ============================================
 * MODELO FACTURA
 * ============================================
 * Define la estructura de la tabla 'facturas' en MySQL.
 * Una factura es generada automáticamente cuando un pedido es pagado.
 * Una factura contiene toda la información necesaria para auditoría fiscal y cliente.
 * REGLA: Una factura = Un pedido (relación 1:1)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Factura = sequelize.define('Factura', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

  // Relación con Pedido
  pedidoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Pedidos',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    validate: {
      notNull: { msg: 'Debe especificar un pedido' }
    }
  },

  // Número de factura único (consecutivo)
  // Formato: FAC-2026-00001, FAC-2026-00002, etc.
  numeroFactura: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'El número de factura es obligatorio' }
    }
  },

  // Fecha de emisión de la factura
  fechaEmision: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  // Información del cliente
  clienteNombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  clienteEmail: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  clienteDocumento: {
    type: DataTypes.STRING(20),
    allowNull: true // Opcional: cédula o NIT
  },

  // Información de envío
  direccionEnvio: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  telefonoEnvio: {
    type: DataTypes.STRING(20),
    allowNull: false
  },

  // Montos
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El subtotal debe ser decimal' }
    }
  },

  // IVA (Impuesto al Valor Agregado) - en Colombia normalmente 19%
  impuesto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      isDecimal: { msg: 'El impuesto debe ser decimal' }
    }
  },

  // Total a pagar (subtotal + impuesto)
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'El total debe ser decimal' }
    }
  },

  // Método de pago utilizado
  metodoPago: {
    type: DataTypes.ENUM('efectivo', 'tarjeta', 'transferencia', 'nequi'),
    allowNull: false,
    defaultValue: 'efectivo'
  },

  // Referencia de pago (número de transacción, etc.)
  referenciaPago: {
    type: DataTypes.STRING(100),
    allowNull: true
  },

  // Estado de la factura
  estado: {
    type: DataTypes.ENUM(
      'emitida',        // Recién creada
      'enviada',        // Enviada al cliente por email
      'vista',          // Cliente la visualizó
      'anulada'         // Cancelada por rectificación
    ),
    allowNull: false,
    defaultValue: 'emitida'
  },

  // Ruta del archivo PDF almacenado
  rutaPDF: {
    type: DataTypes.STRING(255),
    allowNull: true // Se genera después
  },

  // JSON con los detalles del pedido (productos, cantidades, precios)
  detalles: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array de objetos con {productoId, nombre, cantidad, precioUnitario, subtotal}'
  },

  // Notas adicionales
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // Timestamps automáticos
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'facturas',
  timestamps: true,
  underscored: true
});

module.exports = Factura;
