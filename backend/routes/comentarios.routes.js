/**
 * ============================================
 * RUTAS DE COMENTARIOS/RESEÑAS
 * ============================================
 * Define los endpoints para comentarios y reseñas de productos.
 */

const express = require('express');
const router = express.Router();

// Importa el controlador de comentarios
const {
  crearComentario,
  obtenerComentariosProducto,
  editarComentario,
  eliminarComentarioPropio,
  moderarComentario,
  toggleComentario,
  eliminarComentario,
  obtenerComentariosPorUsuario,
  obtenerTodosComentarios,
  obtenerAutoresComentarios,
  obtenerProductosComentados
} = require('../controllers/comentario.controller');

// Importa middlewares de autenticación
const { verificarAuth } = require('../middleware/auth');
const { esAdministrador, esAdminOAuxiliar } = require('../middleware/checkRole');

/**
 * RUTAS CLIENTE (requieren autenticación)
 */

/**
 * POST /api/cliente/comentarios
 * Crea un nuevo comentario sobre un producto
 */
router.post('/cliente/comentarios', verificarAuth, crearComentario);

/**
 * PUT /api/cliente/comentarios/:comentarioId
 * Edita un comentario propio.
 */
router.put('/cliente/comentarios/:comentarioId', verificarAuth, editarComentario);

/**
 * DELETE /api/cliente/comentarios/:comentarioId
 * Elimina un comentario propio.
 */
router.delete('/cliente/comentarios/:comentarioId', verificarAuth, eliminarComentarioPropio);

/**
 * RUTAS PÚBLICAS (sin autenticación)
 */

/**
 * GET /api/catalogo/productos/:productoId/comentarios
 * Obtiene comentarios visibles de un producto con paginación
 */
router.get('/catalogo/productos/:productoId/comentarios', obtenerComentariosProducto);

/**
 * RUTAS ADMIN (requieren autenticación y rol admin/auxiliar)
 */

/**
 * PUT /api/admin/comentarios/:comentarioId/moderar
 * Moderar un comentario (visible o no_visible)
 */
router.put('/admin/comentarios/:comentarioId/moderar', verificarAuth, esAdminOAuxiliar, moderarComentario);

/**
 * PATCH /api/admin/comentarios/:comentarioId/toggle
 * Alterna la visibilidad del comentario.
 */
router.patch('/admin/comentarios/:comentarioId/toggle', verificarAuth, esAdminOAuxiliar, toggleComentario);

/**
 * DELETE /api/admin/comentarios/:comentarioId
 * Eliminar un comentario (solo admin)
 */
router.delete('/admin/comentarios/:comentarioId', verificarAuth, esAdministrador, eliminarComentario);

/**
 * GET /api/admin/comentarios/usuario/:usuarioId
 * Busca comentarios creados por un usuario específico.
 */
router.get('/admin/comentarios/usuario/:usuarioId', verificarAuth, esAdminOAuxiliar, obtenerComentariosPorUsuario);

/**
 * GET /api/admin/comentarios
 * Obtiene todos los comentarios (panel administrador) con filtros y búsqueda.
 */
router.get('/admin/comentarios', verificarAuth, esAdminOAuxiliar, obtenerTodosComentarios);

/**
 * GET /api/admin/comentarios/autores
 * Obtiene la lista de clientes que han realizado comentarios
 */
router.get('/admin/comentarios/autores', verificarAuth, esAdminOAuxiliar, obtenerAutoresComentarios);

/**
 * GET /api/admin/comentarios/productos-comentados
 * Obtiene la lista de productos que han sido comentados
 */
router.get('/admin/comentarios/productos-comentados', verificarAuth, esAdminOAuxiliar, obtenerProductosComentados);

module.exports = router;
