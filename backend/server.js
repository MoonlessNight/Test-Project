/**
 * ============================================
 * SERVIDOR PRINCIPAL - E-COMMERCE BACKEND (server.js)
 * ============================================
 * Este es el ARCHIVO PRINCIPAL del servidor backend (punto de entrada).
 * Se ejecuta con: node server.js (o nodemon server.js en desarrollo)
 * 
 * Responsabilidades de este archivo:
 *   1. Cargar las variables de entorno (.env)
 *   2. Crear y configurar la aplicación Express
 *   3. Registrar los middlewares globales (CORS, JSON parser, logging)
 *   4. Montar las rutas de la API (/api/auth, /api/admin, /api/*)
 *   5. Configurar manejo de errores (404 y errores globales)
 *   6. Conectar con MySQL, sincronizar tablas y arrancar el servidor
 * 
 * Flujo de arranque:
 *   startServer() → testConnection() → initAssociations() → syncDatabase() → runSeeders() → app.listen()
 */

// ==========================================
// IMPORTACIONES
// ==========================================

// Importa Express desde el paquete npm 'express'
// Express es el framework web que crea el servidor HTTP, maneja rutas y middlewares
// Es el núcleo del backend: recibe peticiones HTTP y devuelve respuestas JSON
const express = require('express');

// Importa CORS (Cross-Origin Resource Sharing) desde el paquete npm 'cors'
// CORS permite que el frontend (React en localhost:3000) haga peticiones al backend (localhost:5000)
// Sin CORS, el navegador bloquearía las peticiones por ser de diferente origen (puerto diferente)
const cors = require('cors');

// Importa 'path' desde Node.js (módulo nativo, no necesita npm install)
// path proporciona utilidades para trabajar con rutas de archivos del sistema operativo
// Se usa aquí para construir la ruta absoluta de la carpeta 'uploads/'
const path = require('path');

// Ejecuta dotenv.config() para cargar las variables del archivo .env
// Lee el archivo .env en la raíz del backend y las pone en process.env
// Después de esto, puedes acceder a variables como: process.env.PORT, process.env.DB_NAME, etc.
// require('dotenv').config() es una forma abreviada de: const dotenv = require('dotenv'); dotenv.config();
require('dotenv').config();

// Importa testConnection y syncDatabase desde config/database.js
// testConnection → prueba la conexión a MySQL (retorna true/false)
// syncDatabase → sincroniza los modelos Sequelize con las tablas MySQL (las crea si no existen)
const { testConnection, syncDatabase } = require('./config/database');

// Importa initAssociations desde models/index.js
// initAssociations → función que confirma que las relaciones entre modelos están establecidas
// Al hacer require('./models'), el código de index.js se ejecuta y las asociaciones se crean
const { initAssociations } = require('./models');

// Importa runSeeders desde seeders/adminSeeder.js
// runSeeders → función que crea los datos iniciales (usuario administrador) si no existen
// Se ejecuta cada vez que arranca el servidor para asegurar que haya un admin
const { runSeeders } = require('./seeders/adminSeeder');

// ==========================================
// CREAR APLICACIÓN EXPRESS
// ==========================================

// Crea la instancia de la aplicación Express
// 'app' es el objeto principal del servidor: se le agregan middlewares, rutas y se pone a escuchar
const app = express();

// Lee el puerto desde la variable de entorno PORT (.env) o usa 5000 como valor por defecto
// process.env.PORT viene del archivo .env: PORT=5000
// El operador || (OR) usa 5000 si PORT no está definido
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================
// Los middlewares se ejecutan EN ORDEN para CADA petición que llega al servidor
// app.use() registra un middleware que se aplica a TODAS las rutas

// CORS → Configura qué dominios pueden hacer peticiones al backend
// Sin este middleware, el navegador bloquea las peticiones del frontend (localhost:3000)
// porque el backend está en un puerto diferente (localhost:5000)
app.use(cors({
  // origin → URL del frontend que tiene permiso para hacer peticiones
  // Lee FRONTEND_URL del .env, o usa http://localhost:3000 por defecto
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // credentials: true → permite que el navegador envíe cookies y headers de autenticación
  // Necesario para que el token JWT en el header Authorization funcione correctamente
  credentials: true,
  
  // methods → lista de métodos HTTP que el frontend puede usar
  // GET (leer), POST (crear), PUT (actualizar todo), DELETE (eliminar), PATCH (actualizar parcial)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  
  // allowedHeaders → headers que el frontend puede enviar en las peticiones
  // Content-Type → indica el formato del body (application/json, multipart/form-data)
  // Authorization → contiene el token JWT (Bearer eyJ...)
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// express.json() → Middleware que parsea (interpreta) el body de las peticiones en formato JSON
// Cuando el frontend envía: { "email": "test@test.com", "password": "123" }
// Este middleware lo convierte en un objeto JavaScript accesible como req.body
// Sin esto, req.body sería undefined
app.use(express.json());

// express.urlencoded() → Middleware que parsea el body de formularios HTML tradicionales
// Formato: email=test@test.com&password=123 (URL-encoded)
// extended: true → permite objetos anidados y arrays en el body
// Se usa cuando el frontend envía formularios con enctype="application/x-www-form-urlencoded"
app.use(express.urlencoded({ extended: true }));

// express.static() → Middleware que sirve archivos estáticos (imágenes, CSS, etc.)
// Hace que los archivos de la carpeta 'uploads/' sean accesibles públicamente via HTTP
// path.join(__dirname, 'uploads') construye la ruta absoluta: C:\...\backend\uploads
// __dirname → variable de Node.js que contiene la ruta del directorio actual (donde está server.js)
// Ejemplo: Un archivo en uploads/producto-123.jpg es accesible en http://localhost:5000/uploads/producto-123.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging → Muestra en consola cada petición HTTP que llega al servidor
// Solo se activa en modo desarrollo (NODE_ENV=development en .env)
// Útil para depuración: ver qué rutas se están llamando y con qué método
if (process.env.NODE_ENV === 'development') {
  // app.use() con una función (req, res, next) es un middleware personalizado
  app.use((req, res, next) => {
    // Imprime el método HTTP (GET, POST, etc.) y la ruta de la petición
    console.log(`📨 ${req.method} ${req.path}`);
    
    // next() → OBLIGATORIO en middlewares: pasa la petición al siguiente middleware/ruta
    // Sin next(), la petición se quedaría "colgada" aquí y el cliente nunca recibiría respuesta
    next();
  });
}

// ==========================================
// RUTAS BASE (no requieren autenticación)
// ==========================================

// GET / → Ruta raíz para verificar que el servidor está corriendo
// Al visitar http://localhost:5000/ en el navegador, muestra esta respuesta
// Es útil para verificar rápidamente que el servidor arrancó correctamente
app.get('/', (req, res) => {
  // res.json() envía una respuesta en formato JSON al cliente
  res.json({
    success: true,                                // Indica que la petición fue exitosa
    message: '✅ Servidor E-commerce Backend corriendo correctamente',
    version: '1.0.0',                             // Versión del backend
    timestamp: new Date().toISOString()            // Fecha/hora actual en formato ISO 8601
  });
});

// GET /api/health → Health check (verificación de salud del servidor)
// Endpoint estándar usado por herramientas de monitoreo para verificar que el servidor está vivo
// El frontend puede llamar a este endpoint para verificar conectividad con el backend
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',                             // Estado del servidor
    database: 'connected',                         // Estado de la conexión a MySQL
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// MONTAR RUTAS DE LA API
// ==========================================
// app.use(prefijo, router) → Monta un archivo de rutas en un prefijo específico
// Todas las rutas definidas en el archivo de rutas se prefijan con el string dado

// Rutas de autenticación → prefijo /api/auth
// Archivo: routes/auth.routes.js
// Ejemplo: POST /api/auth/login, POST /api/auth/register, GET /api/auth/me
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Rutas del administrador → prefijo /api/admin
// Archivo: routes/admin.routes.js
// Requieren autenticación + rol administrador o auxiliar (middleware global en el archivo de rutas)
// Ejemplo: GET /api/admin/productos, POST /api/admin/categorias, PUT /api/admin/usuarios/:id
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// Rutas del cliente → prefijo /api
// Archivo: routes/cliente.routes.js
// Incluye rutas públicas (/api/catalogo/...) y protegidas (/api/cliente/carrito, /api/cliente/pedidos)
// NOTA: El prefijo es solo /api (no /api/cliente) porque las rutas del catálogo son públicas
const clienteRoutes = require('./routes/cliente.routes');
app.use('/api', clienteRoutes);

// ==========================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// ==========================================
// Este middleware se ejecuta cuando NINGUNA ruta anterior coincidió con la petición
// Debe ir DESPUÉS de todas las rutas definidas
// app.use() sin ruta específica captura TODAS las peticiones no manejadas
app.use((req, res) => {
  // Retorna error 404 (Not Found) con un mensaje descriptivo
  res.status(404).json({
    success: false,
    message: '❌ Ruta no encontrada',
    path: req.path                                 // Muestra qué ruta intentó acceder el usuario
  });
});

// ==========================================
// MANEJO DE ERRORES GLOBAL
// ==========================================
// Este middleware tiene 4 parámetros (err, req, res, next) → Express lo reconoce como manejador de errores
// Captura CUALQUIER error no manejado que ocurra en los controladores o middlewares
// Si un controlador hace throw new Error() o next(error), llega aquí
app.use((err, req, res, next) => {
  // Imprime el error en la consola del servidor para depuración
  console.error('❌ Error:', err.message);
  
  // Manejo especial para errores de Multer (subida de archivos)
  // MulterError ocurre cuando: el archivo es muy grande, formato no permitido, etc.
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'Error al subir archivo',
      error: err.message                           // Detalle del error de Multer
    });
  }
  
  // Para cualquier otro tipo de error
  res.status(err.status || 500).json({             // Usa el status del error o 500 (Internal Server Error)
    success: false,
    message: err.message || 'Error interno del servidor',
    // En desarrollo muestra el stack trace (pila de llamadas) para depuración
    // En producción NO se muestra por seguridad (podría revelar código interno)
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// INICIALIZAR SERVIDOR Y BASE DE DATOS
// ==========================================

/**
 * startServer() → Función asíncrona principal que arranca todo el backend
 * Se ejecuta al final del archivo. Sigue estos pasos en orden:
 *   1. Prueba la conexión a MySQL (testConnection)
 *   2. Inicializa las asociaciones entre modelos (initAssociations)
 *   3. Sincroniza los modelos con la BD (syncDatabase → crea tablas si no existen)
 *   4. Ejecuta los seeders (runSeeders → crea el admin inicial)
 *   5. Pone a escuchar el servidor en el puerto configurado (app.listen)
 */
const startServer = async () => {
  try {
    // Mensaje inicial en consola
    console.log('🚀 Iniciando servidor E-commerce Backend...\n');
    
    // PASO 1: Probar la conexión a MySQL
    // testConnection() intenta conectarse a MySQL con las credenciales del .env
    // Retorna true si la conexión es exitosa, false si falla
    console.log('📡 Conectando a MySQL...');
    const dbConnected = await testConnection();
    
    // Si no hay conexión a MySQL, no tiene sentido continuar
    if (!dbConnected) {
      console.error('❌ No se pudo conectar a MySQL. Verifica XAMPP y el archivo .env');
      process.exit(1);                             // Termina el proceso con código de error (1)
    }
    
    // PASO 2: Sincronizar modelos con la base de datos
    // syncDatabase() ejecuta CREATE TABLE IF NOT EXISTS para cada modelo
    console.log('\n📊 Sincronizando modelos con la base de datos...');
    
    // Inicializar asociaciones → las relaciones (FK) entre los modelos
    // Esto se debe hacer ANTES de syncDatabase para que las FK se creen correctamente
    initAssociations();
    
    // Determinar si se deben alterar las tablas existentes
    // En desarrollo (NODE_ENV=development): alter=true → modifica columnas si cambiaron los modelos
    // En producción: alter=false → NO toca la estructura de las tablas (protege los datos)
    const alterTables = process.env.NODE_ENV === 'development';
    
    // syncDatabase(force, alter):
    //   force=false → NO borra las tablas existentes (true las borraría y recrearía, perdiendo datos)
    //   alter=true/false → si true, modifica las tablas para que coincidan con los modelos
    const dbSynced = await syncDatabase(false, alterTables);
    
    // Si la sincronización falla, no se puede iniciar el servidor
    if (!dbSynced) {
      console.error('❌ Error al sincronizar la base de datos');
      process.exit(1);
    }
    
    // PASO 3: Ejecutar seeders (datos iniciales)
    // runSeeders() crea el usuario administrador por defecto si no existe
    // Esto asegura que siempre haya al menos un admin para acceder al sistema
    await runSeeders();
    
    // PASO 4: Iniciar el servidor HTTP con Express
    // app.listen(puerto, callback) → pone el servidor a escuchar en el puerto especificado
    // El callback se ejecuta cuando el servidor está listo para recibir peticiones
    app.listen(PORT, () => {
      // Muestra un banner informativo en la consola del servidor
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log(`║  ✅ Servidor corriendo en puerto ${PORT}          ║`);
      console.log(`║  🌐 URL: http://localhost:${PORT}                ║`);
      console.log(`║  📚 Documentación API: http://localhost:${PORT}  ║`);
      console.log(`║  🗄️  Base de datos: ${process.env.DB_NAME}        ║`);
      console.log(`║  🔧 Modo: ${process.env.NODE_ENV}                     ║`);
      console.log('╚════════════════════════════════════════════════╝\n');
      console.log('📝 Servidor listo para recibir peticiones...\n');
    });
    
  } catch (error) {
    // Si ocurre cualquier error no esperado durante el arranque
    console.error('❌ Error fatal al iniciar el servidor:', error.message);
    process.exit(1);                               // Termina el proceso con código de error
  }
};

// ==========================================
// MANEJO DE CIERRE GRACEFUL (cierre ordenado)
// ==========================================

// process.on('SIGINT') → Captura la señal SIGINT (se envía al presionar CTRL+C en la terminal)
// Permite cerrar el servidor de forma ordenada en vez de cortarlo abruptamente
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Cerrando servidor...');
  process.exit(0);                                 // Código 0 = cierre exitoso (sin errores)
});

// process.on('unhandledRejection') → Captura promesas rechazadas que no tienen .catch()
// Si algún await falla y no está dentro de un try/catch, este handler lo captura
// Evita que el servidor siga corriendo en un estado inconsistente
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);                                 // Termina con código de error
});

// ==========================================
// INICIAR EL SERVIDOR
// ==========================================
// Llama a la función startServer() para comenzar todo el proceso de arranque
// Esta es la línea que realmente "enciende" el servidor al ejecutar: node server.js
startServer();

// Exporta la app de Express para poder usarla en los tests (jest + supertest)
// En los tests se hace: const request = require('supertest')(app) sin necesidad de app.listen()
// module.exports → sistema de exportación de Node.js (CommonJS)
module.exports = app;
