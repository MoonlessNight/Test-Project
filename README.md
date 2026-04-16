# 🛒 Sistema E-commerce Completo

Sistema de comercio electrónico full-stack con panel de administración y tienda en línea.

## 📚 Descripción

Sistema completo de e-commerce que incluye:
- **Backend API RESTful** con Node.js, Express y Sequelize
- **Frontend** con React y Bootstrap
- **Base de datos** MySQL con creación automática
- **Autenticación** con JWT
- **Gestión de roles** (Administrador y Cliente)
- **Subida de imágenes** para productos
- **Carrito de compras** y sistema de pedidos

## 🏗️ Estructura del Proyecto

```
software/
│
├── backend/              # Backend API con Node.js
│   ├── config/           # Configuraciones (DB, JWT, Multer)
│   ├── models/           # Modelos de Sequelize
│   ├── controllers/      # Lógica de negocio
│   ├── routes/           # Rutas de la API
│   ├── middleware/       # Middlewares personalizados
│   ├── seeders/          # Datos iniciales
│   ├── uploads/          # Imágenes de productos
│   ├── server.js         # Servidor principal
│   └── package.json      # Dependencias backend
│
├── frontend/             # Frontend con React
│   ├── src/              # Código fuente
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas de la aplicación
│   │   ├── context/      # Context API (estado global)
│   │   ├── services/     # Servicios API
│   │   └── utils/        # Utilidades
│   ├── public/           # Archivos públicos
│   └── package.json      # Dependencias frontend
│
└── PLAN_DE_TRABAJO.md    # Plan detallado del proyecto
```

## 🚀 Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express** - Framework web
- **Sequelize** - ORM para MySQL
- **MySQL** - Base de datos relacional
- **JWT** - Autenticación segura
- **Bcrypt** - Encriptación de contraseñas
- **Multer** - Manejo de archivos/imágenes

### Frontend
- **React** - Librería para interfaces de usuario
- **React Router** - Navegación SPA
- **Bootstrap** - Framework CSS
- **Axios** - Cliente HTTP

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** v14 o superior - [Descargar aquí](https://nodejs.org/)
2. **XAMPP** - Para MySQL - [Descargar aquí](https://www.apachefriends.org/)
3. **Editor de código** - VS Code recomendado

## ⚙️ Instalación y Configuración

### 1. Instalar Backend

```bash
# Navegar a la carpeta backend
cd backend

# Instalar dependencias
npm install
```

### 2. Configurar Base de Datos

- Abre **XAMPP Control Panel**
- Inicia el servicio **MySQL**
- ✅ No necesitas crear la base de datos manualmente

### 3. Configurar Variables de Entorno (Backend)

El archivo `backend/.env` ya está configurado con valores por defecto:

```env
PORT=5000
DB_HOST=localhost
DB_NAME=ecommerce_db
DB_USER=root
DB_PASSWORD=
JWT_SECRET=mi_clave_secreta_super_segura_2026
```

### 4. Iniciar Backend

```bash
# Desde la carpeta backend
npm run dev
```

El servidor iniciará en `http://localhost:5000`

### 5. Instalar Frontend

```bash
# Navegar a la carpeta frontend
cd frontend

# Las dependencias ya están instaladas
# Si necesitas reinstalarlas:
npm install
```

### 6. Iniciar Frontend

```bash
# Desde la carpeta frontend
npm start
```

La aplicación se abrirá automáticamente en `http://localhost:3000`

## 🎯 Uso del Sistema

### Credenciales de Administrador

Después de iniciar el backend por primera vez (se crearán en la Fase 2):

```
Email: admin@ecommerce.com
Password: admin123
Rol: Administrador
```

### Funcionalidades por Rol

#### 👤 Cliente
- Navegar catálogo de productos
- Filtrar por categorías/subcategorías
- Agregar productos al carrito
- Realizar pedidos
- Ver historial de compras
- Actualizar perfil

#### 👨‍💼 Administrador
- Gestionar categorías (CRUD + desactivación en cascada)
- Gestionar subcategorías (CRUD + desactivación en cascada)
- Gestionar productos (CRUD + subida de imágenes)
- Ver lista de clientes
- Ver todos los pedidos
- Dashboard con estadísticas

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Obtener usuario actual

### Categorías (Admin)
- `GET /api/categorias` - Listar todas
- `POST /api/categorias` - Crear nueva
- `PUT /api/categorias/:id` - Actualizar
- `DELETE /api/categorias/:id` - Eliminar
- `PATCH /api/categorias/:id/toggle` - Activar/Desactivar

### Subcategorías (Admin)
- `GET /api/subcategorias` - Listar todas
- `GET /api/subcategorias/categoria/:id` - Por categoría
- `POST /api/subcategorias` - Crear nueva
- `PUT /api/subcategorias/:id` - Actualizar
- `DELETE /api/subcategorias/:id` - Eliminar
- `PATCH /api/subcategorias/:id/toggle` - Activar/Desactivar

### Productos
- `GET /api/productos` - Listar todos (activos)
- `GET /api/productos/:id` - Ver detalle
- `POST /api/productos` - Crear (Admin + imagen)
- `PUT /api/productos/:id` - Actualizar (Admin)
- `DELETE /api/productos/:id` - Eliminar (Admin)
- `PATCH /api/productos/:id/toggle` - Activar/Desactivar (Admin)

### Carrito
- `GET /api/carrito` - Ver carrito actual
- `POST /api/carrito` - Agregar producto
- `PUT /api/carrito/:id` - Actualizar cantidad
- `DELETE /api/carrito/:id` - Eliminar del carrito

### Pedidos
- `GET /api/pedidos` - Mis pedidos (Cliente) / Todos (Admin)
- `GET /api/pedidos/:id` - Ver detalle
- `POST /api/pedidos` - Crear pedido

## 🔧 Scripts Disponibles

### Backend
```bash
npm start       # Iniciar en modo producción
npm run dev     # Iniciar en modo desarrollo (con nodemon)
```

### Frontend
```bash
npm start       # Iniciar servidor de desarrollo
npm run build   # Crear build de producción
npm test        # Ejecutar tests
```

## 📸 Subida de Imágenes

Las imágenes de productos se guardan en `backend/uploads/` y son accesibles en:

```
http://localhost:5000/uploads/nombre-imagen.jpg
```

## 🐛 Solución de Problemas

### Backend no inicia
- ✅ Verifica que XAMPP esté corriendo
- ✅ Verifica que MySQL esté iniciado en XAMPP
- ✅ Revisa las credenciales en `backend/.env`
- ✅ Verifica que el puerto 5000 no esté en uso

### Frontend no se conecta al backend
- ✅ Verifica que el backend esté corriendo en `http://localhost:5000`
- ✅ Revisa la variable `REACT_APP_API_URL` en `frontend/.env`
- ✅ Verifica que CORS esté habilitado en el backend

### Error al subir imágenes
- ✅ Verifica que la carpeta `backend/uploads/` exista
- ✅ Verifica los permisos de la carpeta

### Base de datos no se crea
- ✅ Verifica que MySQL esté corriendo en XAMPP
- ✅ Verifica las credenciales en el archivo `.env`
- ✅ Revisa los logs del servidor para ver el error específico

## 📝 Características Principales

✅ Base de datos se crea automáticamente desde modelos  
✅ Relaciones en cascada (desactivar categoría → subcategorías → productos)  
✅ Autenticación segura con JWT  
✅ Redirección automática por roles (admin/cliente)  
✅ Subida y almacenamiento de imágenes  
✅ Validación de formularios  
✅ Manejo de errores centralizado  
✅ API RESTful completamente funcional  
✅ Código completamente comentado en español  

## 📖 Documentación Completa

### 📋 Documentos Principales
- [Plan de Trabajo](PLAN_DE_TRABAJO.md) - Plan de las 12 fases del proyecto
- [Reporte de Verificación](REPORTE_VERIFICACION.md) - Estado actual de documentación vs implementación

### 🔧 Documentación del Desarrollo
- [DESARROLLO.md](DESARROLLO.md) - Fases 1-7 del Backend (5,450 líneas)
  - Fase 1: Configuración Inicial
  - Fases 2-3: Modelos Sequelize
  - Fase 4: Autenticación JWT
  - Fase 5: APIs del Administrador
  - Fase 6: APIs del Cliente
  - Fase 7: Testing con Jest

- [DESARROLLO_FRONTEND.md](DESARROLLO_FRONTEND.md) - Fases 8-11 del Frontend (3,200 líneas)
  - Fase 8: Configuración Inicial (React, Router, Bootstrap)
  - Fase 9: Autenticación (Context API, Login, Registro)
  - Fase 10: Panel de Administrador (CRUD interfaces)
  - Fase 11: Panel de Cliente (Catálogo, Carrito, Checkout)

### 📚 Documentación Específica
- [Backend README](backend/README.md) - Instrucciones quick-start del backend
- [Frontend README](frontend/README.md) - Instrucciones quick-start del frontend
- [Backend - Manual de Pruebas Postman](backend/MANUAL_PRUEBAS_POSTMAN.md) - 70+ páginas de ejemplos
- [Backend - Pruebas de API](backend/PRUEBAS_API.md) - Documentación de endpoints
- [Backend - Instrucciones de Seeder](backend/INSTRUCCIONES_SEEDER.md) - Cómo insertar datos"

## 🔄 Estado del Proyecto

### ✅ Fase 1 - COMPLETADA
- [x] Estructura de carpetas
- [x] Configuración del backend
- [x] Configuración del frontend
- [x] Archivos de configuración
- [x] Servidor básico funcional

### 🔜 Siguientes Fases
- [ ] Fase 2: Modelos de Sequelize
- [ ] Fase 3: Sincronización de base de datos
- [ ] Fase 4: Autenticación JWT
- [ ] Fase 5: APIs de administrador
- [ ] Fase 6: APIs de clientes
- [ ] Fase 7: Configuración frontend avanzada
- [ ] Fase 8: Autenticación frontend
- [ ] Fase 9: Panel de administrador
- [ ] Fase 10: Panel de cliente
- [ ] Fase 11: Pruebas y validaciones
- [ ] Fase 12: Refinamiento final

## 👨‍🏫 Proyecto Académico

**Institución:** SENA  
**Programa:** Articulación 3206404  
**Trimestre:** 1 - 2026  
**Instructor:** Sena  

## 📧 Soporte

Para dudas o problemas, contacta al instructor del curso.

---

**¡Proyecto listo para comenzar el desarrollo!** 🚀

Sigue el [Plan de Trabajo](PLAN_DE_TRABAJO.md) para continuar con las siguientes fases.
