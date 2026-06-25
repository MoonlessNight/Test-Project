/**
 * ============================================
 * SCRIPT DE INICIALIZACIÓN COMPLETA DE BD
 * ============================================
 * Este script:
 * 1. Crea la base de datos si no existe
 * 2. Sincroniza TODAS las tablas (modelos)
 * 3. Ejecuta los seeders para poblar datos iniciales
 * 
 * Se ejecuta con: npm run init-db-complete
 * O manualmente: node config/initializeDatabase.js
 */

// Importa las funciones necesarias
const { testConnection, syncDatabase } = require('./database');
const { seedDatosCompletos } = require('../seeders/datosCompletos.seeder');
const { initAssociations } = require('../models');
const mysql = require('mysql2/promise');

// Carga variables del .env
require('dotenv').config();

/**
 * Función principal que realiza la inicialización completa
 */
const initializeDatabase = async () => {
  try {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   🔧 INICIALIZANDO BASE DE DATOS GAVAT         ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    // PASO 1: Crear la base de datos si no existe
    console.log('📦 Paso 1: Creando base de datos...');
    const dbName = process.env.DB_NAME || 'GAVAT';
    let connection;
    
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
      });
      
      console.log('   ✅ Conectado a MySQL');
      
      // Crea la base de datos si no existe
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`   ✅ Base de datos '${dbName}' lista\n`);
      
      await connection.end();
    } catch (error) {
      console.error('   ❌ Error al crear la base de datos:', error.message);
      process.exit(1);
    }

    // PASO 2: Probar conexión a la BD
    console.log('📡 Paso 2: Conectando a la base de datos...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('   ❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    console.log('   ✅ Conexión exitosa\n');

    // PASO 3: Sincronizar modelos (crear tablas)
    console.log('📊 Paso 3: Sincronizando modelos con la base de datos...');
    initAssociations();
    
    const alterTables = process.env.NODE_ENV === 'development';
    const dbSynced = await syncDatabase(false, alterTables);
    
    if (!dbSynced) {
      console.error('   ❌ Error al sincronizar la base de datos');
      process.exit(1);
    }
    console.log('   ✅ Modelos sincronizados correctamente\n');

    // PASO 4: Ejecutar seeders (cargar datos iniciales)
    console.log('🌱 Paso 4: Cargando datos iniciales (seeders)...\n');
    await seedDatosCompletos();
    console.log('\n   ✅ Datos iniciales cargados exitosamente\n');

    // Finalización
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   ✅ ¡BASE DE DATOS INICIALIZADA!             ║');
    console.log('║   Puedes iniciar el servidor con: npm run dev ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error fatal durante la inicialización:', error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
};

// Ejecutar si se corre este archivo directamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
