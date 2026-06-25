/**
 * ============================================
 * RUTAS DE FACTURAS
 * ============================================
 * Define todos los endpoints para gestión de facturas
 * Rutas de cliente: Crear, descargar y listar facturas
 * Rutas de admin: Ver todas las facturas y anular si es necesario
 */

const express = require('express');
const router = express.Router();

// Importar controlador de facturas
const facturaController = require('../controllers/factura.controller');

// Importar middlewares de autenticación y roles
const { verificarAuth } = require('../middleware/auth');
const { esAdministrador } = require('../middleware/checkRole');

/**
 * ==========================================
 * RUTAS DE CLIENTE (Requieren autenticación)
 * ==========================================
 */

/**
 * POST /api/cliente/facturas
 * Crear una nueva factura para un pedido pagado
 * Body: { pedidoId: number }
 */
router.post('/cliente/facturas', verificarAuth, facturaController.crearFactura);

/**
 * GET /api/cliente/pedidos/:pedidoId/factura
 * Obtener la factura de un pedido específico
 */
router.get('/cliente/pedidos/:pedidoId/factura', verificarAuth, facturaController.obtenerFacturaPedido);

/**
 * GET /api/cliente/facturas
 * Listar todas las facturas del usuario autenticado
 * Query params: page, limit
 */
router.get('/cliente/facturas', verificarAuth, facturaController.listarFacturasUsuario);

/**
 * GET /api/cliente/facturas/:numeroFactura/descargar
 * Descargar el PDF de una factura
 */
router.get('/cliente/facturas/:numeroFactura/descargar', verificarAuth, facturaController.descargarFacturaPDF);

/**
 * ==========================================
 * RUTAS DE ADMINISTRADOR (Requieren auth + rol admin)
 * ==========================================
 */

/**
 * GET /api/admin/facturas
 * Listar todas las facturas del sistema
 * Query params: page, limit, estado
 */
router.get('/admin/facturas', verificarAuth, esAdministrador, facturaController.listarFacturasAdmin);

/**
 * GET /api/admin/facturas/:id
 * Ver detalle completo de una factura
 */
router.get('/admin/facturas/:id', verificarAuth, esAdministrador, facturaController.verDetalleFactura);

/**
 * PUT /api/admin/facturas/:id/anular
 * Anular una factura (cambiar estado a 'anulada')
 * Body: { motivo: string }
 */
router.put('/admin/facturas/:id/anular', verificarAuth, esAdministrador, facturaController.anularFactura);

module.exports = router;
