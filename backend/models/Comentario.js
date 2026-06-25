/**
 * ============================================
 * MODELO COMENTARIO
 * ============================================
 * Define la estructura de la tabla 'comentarios' en MySQL usando Sequelize ORM.
 * Cada fila representa un comentario o reseña de un usuario sobre un producto.
 * Los comentarios requieren moderación por parte del administrador.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comentario = sequelize.define('Comentario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    validate: {
      notNull: {
        msg: 'Debe especificar un usuario'
      }
    }
  },
  productoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    validate: {
      notNull: {
        msg: 'Debe especificar un producto'
      }
    }
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El comentario no puede estar vacío'
      },
      len: {
        args: [1, 1000],
        msg: 'El comentario debe tener entre 1 y 1000 caracteres'
      }
    }
  },
  calificacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
      isInt: true,
      notNull: {
        msg: 'La calificación es obligatoria'
      }
    }
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  estado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true // false = no vissible , true= visible 
  }
}, {
  tableName: 'comentarios',
  timestamps: false
});

module.exports = Comentario;