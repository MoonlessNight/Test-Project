/**
 * ============================================
 * CONFIGURACIÓN DE MULTER
 * ============================================
 * Multer es un middleware de Express para manejar la subida de archivos (multipart/form-data).
 * Este archivo configura CÓMO se guardan las imágenes (nombre, carpeta) y QUÉ archivos se permiten.
 * Es usado en las rutas de productos (routes/) cuando se sube una imagen de producto.
 */

// Importa el paquete 'multer' desde node_modules.
// Multer intercepta las peticiones que contienen archivos y los procesa.
const multer = require('multer');

// Importa el módulo 'path' de Node.js (módulo nativo, no necesita instalación).
// Provee utilidades para trabajar con rutas de archivos y directorios.
const path = require('path');

// Carga las variables del archivo .env en process.env.
require('dotenv').config();

/**
 * Configuración de almacenamiento de multer.
 * multer.memoryStorage() mantiene el archivo en memoria para guardarlo directamente en la BD.
 */
const storage = multer.memoryStorage();

/**
 * Filtro para validar el tipo de archivo antes de guardar o procesar.
 * Solo permite imágenes. Si alguien intenta subir un .pdf o .exe, se rechaza.
 * 
 * @param {Object} req - Objeto de petición HTTP de Express
 * @param {Object} file - Objeto del archivo (file.mimetype indica el tipo: 'image/jpeg', etc.)
 * @param {Function} cb - Callback: cb(null, true) = aceptar, cb(error, false) = rechazar
 */
const fileFilter = (req, file, cb) => {
  // Array con los tipos MIME permitidos (solo formatos de imagen)
  // MIME type es un estándar que identifica el tipo de contenido de un archivo
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  // Verifica si el tipo MIME del archivo subido está en la lista de permitidos
  // includes() retorna true si el elemento está en el array
  if (allowedMimeTypes.includes(file.mimetype)) {
    // Si el tipo es permitido, acepta el archivo: cb(null, true)
    // null = sin error, true = aceptar archivo
    cb(null, true);
  } else {
    // Si el tipo NO es permitido, rechaza el archivo con un mensaje de error
    // El error será capturado por Express y enviado como respuesta al cliente
    cb(new Error('Solo se permiten imágenes (JPG, JPEG, PNG, GIF)'), false);
  }
};

/**
 * Crea la instancia final de multer combinando todas las configuraciones:
 * storage (dónde y cómo guardar), fileFilter (qué tipos permitir) y limits (tamaño máximo).
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
  }
});

// Exporta el middleware de multer para usarlo en las rutas.
// Ejemplo: const { upload } = require('../config/multer');
//          router.post('/productos', upload.single('imagen'), controller.crear);
module.exports = {
  upload
};
