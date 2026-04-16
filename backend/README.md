# 📦 E-commerce Backend

Backend para sistema de E-commerce construido con Node.js, Express, Sequelize y MySQL.

## 🚀 Tecnologías

- **Node.js** - Entorno de ejecución JavaScript
- **Express** - Framework web
- **Sequelize** - ORM para MySQL
- **MySQL** - Base de datos relacional
- **JWT** - Autenticación con JSON Web Tokens
- **Bcrypt** - Encriptación de contraseñas
- **Multer** - Manejo de subida de archivos

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (v14 o superior)
- [XAMPP](https://www.apachefriends.org/) (MySQL)
- Un editor de código (VS Code recomendado)

## ⚙️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

El archivo `.env` ya está configurado con valores por defecto para XAMPP:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecommerce_db
DB_USER=root
DB_PASSWORD=
JWT_SECRET=mi_clave_secreta_super_segura_2026
```

**⚠️ Nota:** Si tu configuración de MySQL es diferente, edita el archivo `.env`

### 3. Iniciar XAMPP

- Abre XAMPP Control Panel
- Inicia el servicio **MySQL**
- ✅ No necesitas crear la base de datos manualmente, se creará automáticamente

## 🎯 Ejecutar el Servidor

### Modo desarrollo (con nodemon - recarga automática)

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

## 📁 Estructura del Proyecto

```
backend/
│
├── config/              # Archivos de configuración
│   ├── database.js      # Configuración de Sequelize
│   ├── jwt.js           # Configuración de JWT
│   └── multer.js        # Configuración de subida de archivos
│
├── models/              # Modelos de Sequelize (tablas)
│
├── controllers/         # Lógica de negocio
│
├── routes/              # Rutas de la API
│
├── middleware/          # Middlewares personalizados
│
├── seeders/             # Datos iniciales (seeds)
│
├── uploads/             # Carpeta para imágenes subidas
│
├── .env                 # Variables de entorno
├── .gitignore          # Archivos ignorados por git
├── package.json        # Dependencias del proyecto
└── server.js           # Archivo principal del servidor
```

## 🔑 Credenciales Admin por Defecto

Después de iniciar el servidor por primera vez (se crearán en la siguiente fase):

- **Email:** admin@ecommerce.com
- **Password:** admin123
- **Rol:** Administrador

## 🌐 Endpoints Disponibles

### General

- `GET /` - Verificar que el servidor está corriendo
- `GET /api/health` - Health check del servidor

### (Más endpoints se agregarán en las siguientes fases)

## 📸 Acceso a Imágenes

Las imágenes subidas están disponibles en:

```
http://localhost:5000/uploads/nombre-imagen.jpg
```

## 🛠️ Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon

## 🐛 Solución de Problemas

### Error: No se puede conectar a MySQL

- ✅ Verifica que XAMPP esté corriendo
- ✅ Verifica que el servicio MySQL esté iniciado en XAMPP
- ✅ Revisa las credenciales en el archivo `.env`

### Error: Puerto 5000 en uso

- Cambia el puerto en el archivo `.env`
- O detén el proceso que está usando el puerto 5000

### Error al subir imágenes

- ✅ Verifica que la carpeta `uploads/` exista
- ✅ Verifica los permisos de la carpeta

## 📝 Notas Importantes

- La base de datos se crea automáticamente al iniciar el servidor
- Las tablas se crean automáticamente desde los modelos Sequelize
- Los datos iniciales (admin) se insertan automáticamente
- Las imágenes se guardan en la carpeta `uploads/`

## 🔄 Próximos Pasos

- [ ] Crear modelos de Sequelize (Fase 2)
- [ ] Implementar autenticación JWT (Fase 3)
- [ ] Crear APIs de administrador (Fase 4)
- [ ] Crear APIs de clientes (Fase 5)

## 📧 Soporte

Para dudas o problemas, contacta al instructor.

---

**Desarrollado para:** SENA - Articulación 3206404  
**Fecha:** Febrero 2026
