# 👤 ROL DE AUXILIAR - SISTEMA E-COMMERCE

**Fecha de implementación:** Febrero 4, 2026

---

## 🎯 ¿Qué es el Rol Auxiliar?

El rol **auxiliar** es un rol intermedio entre cliente y administrador que permite a ciertos usuarios acceder al panel de administración con **permisos limitados**.

---

## ✅ Lo que PUEDE hacer un auxiliar:

### 📦 Gestión de Productos
- ✅ Ver todos los productos
- ✅ Crear nuevos productos
- ✅ Actualizar productos existentes
- ✅ Activar/Desactivar productos
- ✅ Actualizar stock (aumentar, reducir, establecer)
- ❌ **NO PUEDE** eliminar productos

### 🗂️ Gestión de Categorías
- ✅ Ver todas las categorías
- ✅ Crear nuevas categorías
- ✅ Actualizar categorías
- ✅ Activar/Desactivar categorías
- ✅ Ver estadísticas de categorías
- ❌ **NO PUEDE** eliminar categorías

### 📋 Gestión de Subcategorías
- ✅ Ver todas las subcategorías
- ✅ Crear nuevas subcategorías
- ✅ Actualizar subcategorías
- ✅ Activar/Desactivar subcategorías
- ✅ Ver estadísticas de subcategorías
- ❌ **NO PUEDE** eliminar subcategorías

### 📦 Gestión de Pedidos
- ✅ Ver todos los pedidos
- ✅ Ver detalles de cualquier pedido
- ✅ Actualizar estado de pedidos
- ✅ Ver estadísticas de pedidos

### 👥 Gestión de Usuarios
- ✅ Ver lista de usuarios (solo consultar)
- ✅ Ver detalles de usuarios
- ✅ Ver estadísticas de usuarios
- ❌ **NO PUEDE** crear usuarios
- ❌ **NO PUEDE** actualizar usuarios
- ❌ **NO PUEDE** activar/desactivar usuarios
- ❌ **NO PUEDE** eliminar usuarios

---

## ❌ Lo que NO PUEDE hacer un auxiliar:

1. **Eliminar NADA** - Ninguna operación DELETE está permitida
2. **Gestionar usuarios** - Solo puede consultarlos, no modificarlos
3. **Cambiar su propio rol** - Requiere un administrador

---

## 🔑 Credenciales del Usuario Auxiliar

El sistema crea automáticamente un usuario auxiliar al iniciar:

```
Email: auxiliar@ecommerce.com
Password: auxiliar123
Rol: auxiliar
```

⚠️ **IMPORTANTE:** Cambia esta contraseña en producción

---

## 🧪 Cómo Probar el Rol Auxiliar

### 1. Iniciar sesión como auxiliar

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "auxiliar@ecommerce.com",
  "password": "auxiliar123"
}
```

Respuesta:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 2,
      "nombre": "Auxiliar",
      "email": "auxiliar@ecommerce.com",
      "rol": "auxiliar"
    }
  }
}
```

### 2. Probar operación permitida (Ver productos)

```http
GET http://localhost:5000/api/admin/productos
Authorization: Bearer <token-auxiliar>
```

✅ Respuesta: **200 OK** - Lista de productos

### 3. Probar operación bloqueada (Eliminar producto)

```http
DELETE http://localhost:5000/api/admin/productos/1
Authorization: Bearer <token-auxiliar>
```

❌ Respuesta: **403 Forbidden**
```json
{
  "success": false,
  "message": "Acceso denegado. Solo administradores pueden realizar esta operación"
}
```

### 4. Probar operación bloqueada (Crear usuario)

```http
POST http://localhost:5000/api/admin/usuarios
Authorization: Bearer <token-auxiliar>
Content-Type: application/json

{
  "nombre": "Nuevo Usuario",
  "email": "nuevo@email.com",
  "password": "pass123",
  "rol": "cliente"
}
```

❌ Respuesta: **403 Forbidden**

---

## 📊 Matriz Completa de Permisos

| Recurso | GET (Ver) | POST (Crear) | PUT (Actualizar) | PATCH (Toggle) | DELETE (Eliminar) |
|---------|-----------|--------------|------------------|----------------|-------------------|
| **Categorías** | ✅ Auxiliar | ✅ Auxiliar | ✅ Auxiliar | ✅ Auxiliar | ❌ Solo Admin |
| **Subcategorías** | ✅ Auxiliar | ✅ Auxiliar | ✅ Auxiliar | ✅ Auxiliar | ❌ Solo Admin |
| **Productos** | ✅ Auxiliar | ✅ Auxiliar | ✅ Auxiliar | ✅ Auxiliar | ❌ Solo Admin |
| **Usuarios** | ✅ Auxiliar | ❌ Solo Admin | ❌ Solo Admin | ❌ Solo Admin | ❌ Solo Admin |
| **Pedidos** | ✅ Auxiliar | - | ✅ Auxiliar (estado) | - | - |

---

## 💼 Casos de Uso Reales

### Caso 1: Asistente de Tienda
**Necesidad:** Personal que actualiza inventario y precios, pero no debe eliminar productos.

**Solución:** Crear usuario con rol auxiliar
```http
POST http://localhost:5000/api/admin/usuarios
Authorization: Bearer <admin-token>

{
  "nombre": "María López",
  "email": "maria.lopez@tienda.com",
  "password": "segura123",
  "rol": "auxiliar",
  "telefono": "3001234567"
}
```

### Caso 2: Despachador de Pedidos
**Necesidad:** Personal que solo actualiza el estado de pedidos (pendiente → en proceso → enviado).

**Permisos del auxiliar:**
- ✅ Ver pedidos
- ✅ Actualizar estado
- ❌ No puede eliminar pedidos

### Caso 3: Soporte al Cliente
**Necesidad:** Ver información de clientes y pedidos, pero sin capacidad de modificar datos sensibles.

**Permisos del auxiliar:**
- ✅ Ver lista de usuarios
- ✅ Ver detalles de pedidos
- ❌ No puede modificar usuarios
- ❌ No puede eliminar nada

---

## 🔧 Implementación Técnica

### Middlewares Utilizados

```javascript
// Permite admin y auxiliar
const esAdminOAuxiliar = (req, res, next) => {
  if (!['administrador', 'auxiliar'].includes(req.usuario.rol)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador o auxiliar'
    });
  }
  next();
};

// Solo permite admin (bloquea auxiliar)
const soloAdministrador = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo administradores pueden realizar esta operación'
    });
  }
  next();
};
```

### Ejemplo de Ruta Protegida

```javascript
// Todos pueden ver (admin y auxiliar)
router.get('/productos', categoriaController.getProductos);

// Todos pueden crear (admin y auxiliar)
router.post('/productos', upload.single('imagen'), productoController.crearProducto);

// Solo admin puede eliminar
router.delete('/productos/:id', soloAdministrador, productoController.eliminarProducto);
```

---

## 🛡️ Seguridad

1. **Validación por token JWT:** El rol se almacena en el token, no se puede falsificar
2. **Middlewares encadenados:** Verificación en múltiples niveles
3. **Sin escalación de privilegios:** Un auxiliar no puede modificar su propio rol
4. **Protección de operaciones críticas:** DELETE y gestión de usuarios solo para admin

---

## 📝 Resumen

El rol **auxiliar** es perfecto para:
- ✅ Personal de soporte
- ✅ Asistentes de tienda
- ✅ Despachadores de pedidos
- ✅ Cualquier usuario que necesite acceso limitado al panel

El rol **administrador** es necesario para:
- 🔒 Eliminar datos permanentemente
- 🔒 Gestionar usuarios del sistema
- 🔒 Configuraciones críticas

---

**Desarrollado por:** SENA - Articulación 3206404  
**Fecha:** Febrero 4, 2026  
**Versión:** 1.0
