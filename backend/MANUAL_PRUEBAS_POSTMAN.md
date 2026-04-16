# 📘 MANUAL DE PRUEBAS - API E-COMMERCE
## Guía Completa para Postman

---

## 📋 TABLA DE CONTENIDOS
1. [Configuración Inicial](#configuración-inicial)
2. [Credenciales del Sistema](#credenciales-del-sistema)
3. [Autenticación](#autenticación)
4. [Rutas Públicas](#rutas-públicas)
5. [Rutas de Administrador](#rutas-de-administrador)
6. [Rutas de Auxiliar](#rutas-de-auxiliar)
7. [Rutas de Cliente](#rutas-de-cliente)
8. [Códigos de Respuesta](#códigos-de-respuesta)

---

## ⚙️ CONFIGURACIÓN INICIAL

### Base URL
```
http://localhost:5000
```

### Headers Globales
Para todas las peticiones que requieren autenticación:
```
Authorization: Bearer <TOKEN>
Content-Type: application/json
```

### Variables de Entorno en Postman
Crear las siguientes variables:
- `base_url`: `http://localhost:5000`
- `admin_token`: (se obtendrá después del login)
- `auxiliar_token`: (se obtendrá después del login)
- `cliente_token`: (se obtendrá después del login)

---

## 🔑 CREDENCIALES DEL SISTEMA

### 👨‍💼 ADMINISTRADOR
- **Email**: `admin@ecommerce.com`
- **Password**: `admin1234`
- **Permisos**: Acceso total a todas las funcionalidades

### 👤 AUXILIAR
- **Email**: `auxiliar@ecommerce.com`
- **Password**: `aux123`
- **Permisos**: Gestión de categorías, subcategorías y productos (sin eliminar)

### 🛍️ CLIENTES (5 disponibles)
- **Cliente 1**: `cliente1@ecommerce.com` / `cliente1`
- **Cliente 2**: `cliente2@ecommerce.com` / `cliente2`
- **Cliente 3**: `cliente3@ecommerce.com` / `cliente3`
- **Cliente 4**: `cliente4@ecommerce.com` / `cliente4`
- **Cliente 5**: `cliente5@ecommerce.com` / `cliente5`
- **Permisos**: Catálogo, carrito y pedidos

---

## 🔐 1. AUTENTICACIÓN

### 1.1 Registrar Nuevo Usuario

**POST** `/api/auth/register`

**Headers**: 
```
Content-Type: application/json
```

**Body**:
```json
{
  "nombre": "María",
  "apellido": "García",
  "email": "maria.garcia@ejemplo.com",
  "password": "password123",
  "telefono": "3001234567",
  "direccion": "Calle 123 #45-67"
}
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "usuario": {
      "id": 10,
      "nombre": "María",
      "apellido": "García",
      "email": "maria.garcia@ejemplo.com",
      "rol": "cliente",
      "activo": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.2 Login (Todos los Usuarios)

**POST** `/api/auth/login`

**Headers**: 
```
Content-Type: application/json
```

**Body - Admin**:
```json
{
  "email": "admin@ecommerce.com",
  "password": "admin1234"
}
```

**Body - Auxiliar**:
```json
{
  "email": "auxiliar@ecommerce.com",
  "password": "aux123"
}
```

**Body - Cliente**:
```json
{
  "email": "cliente1@ecommerce.com",
  "password": "cliente1"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Admin",
      "apellido": "Principal",
      "email": "admin@ecommerce.com",
      "rol": "administrador",
      "activo": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**⚠️ IMPORTANTE**: Guardar el token en variables de Postman:
```javascript
// En Tests tab de Postman:
pm.environment.set("admin_token", pm.response.json().data.token);
```

---

### 1.3 Obtener Perfil del Usuario Autenticado

**GET** `/api/auth/me`

**Headers**: 
```
Authorization: Bearer {{admin_token}}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Admin",
      "apellido": "Principal",
      "email": "admin@ecommerce.com",
      "rol": "administrador",
      "telefono": "3001234567",
      "direccion": "Admin Address",
      "activo": true,
      "createdAt": "2026-02-04T10:00:00.000Z"
    }
  }
}
```

---

### 1.4 Actualizar Perfil

**PUT** `/api/auth/me`

**Headers**: 
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body**:
```json
{
  "nombre": "Admin",
  "apellido": "Principal Actualizado",
  "telefono": "3009876543",
  "direccion": "Nueva Dirección 456"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Admin",
      "apellido": "Principal Actualizado",
      "telefono": "3009876543",
      "direccion": "Nueva Dirección 456"
    }
  }
}
```

---

### 1.5 Cambiar Contraseña

**PUT** `/api/auth/password`

**Headers**: 
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

**Body**:
```json
{
  "currentPassword": "admin1234",
  "newPassword": "nuevoPassword123"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

---

## 🌐 2. RUTAS PÚBLICAS (Sin Autenticación)

### 2.1 Ver Catálogo de Productos

**GET** `/api/catalogo/productos`

**Query Parameters** (opcionales):
- `categoriaId`: Filtrar por categoría (ejemplo: `?categoriaId=1`)
- `subcategoriaId`: Filtrar por subcategoría (ejemplo: `?subcategoriaId=1`)
- `buscar`: Buscar por nombre (ejemplo: `?buscar=laptop`)
- `precioMin`: Precio mínimo (ejemplo: `?precioMin=100000`)
- `precioMax`: Precio máximo (ejemplo: `?precioMax=500000`)
- `pagina`: Número de página (ejemplo: `?pagina=1`)
- `limite`: Items por página (ejemplo: `?limite=10`)

**Ejemplo**: `/api/catalogo/productos?categoriaId=1&pagina=1&limite=5`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "productos": [
      {
        "id": 1,
        "nombre": "Laptop HP Pavilion",
        "descripcion": "Laptop con procesador Intel i5",
        "precio": "2500000.00",
        "stock": 15,
        "imagen": "uploads/productos/laptop-hp.jpg",
        "activo": true,
        "Categoria": {
          "id": 1,
          "nombre": "Tecnología"
        },
        "Subcategoria": {
          "id": 1,
          "nombre": "Laptops"
        }
      }
    ],
    "paginacion": {
      "total": 72,
      "pagina": 1,
      "limite": 5,
      "totalPaginas": 15
    }
  }
}
```

---

### 2.2 Ver Producto Específico

**GET** `/api/catalogo/productos/:id`

**Ejemplo**: `/api/catalogo/productos/1`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "producto": {
      "id": 1,
      "nombre": "Laptop HP Pavilion",
      "descripcion": "Laptop con procesador Intel i5, 8GB RAM, 256GB SSD",
      "precio": "2500000.00",
      "stock": 15,
      "imagen": "uploads/productos/laptop-hp.jpg",
      "activo": true,
      "Categoria": {
        "id": 1,
        "nombre": "Tecnología"
      },
      "Subcategoria": {
        "id": 1,
        "nombre": "Laptops"
      }
    }
  }
}
```

---

### 2.3 Ver Categorías Activas

**GET** `/api/catalogo/categorias`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "categorias": [
      {
        "id": 1,
        "nombre": "Tecnología",
        "descripcion": "Productos tecnológicos y electrónicos",
        "activo": true,
        "totalProductos": 24
      },
      {
        "id": 2,
        "nombre": "Hogar",
        "descripcion": "Productos para el hogar",
        "activo": true,
        "totalProductos": 18
      }
    ]
  }
}
```

---

### 2.4 Ver Subcategorías por Categoría

**GET** `/api/catalogo/categorias/:id/subcategorias`

**Ejemplo**: `/api/catalogo/categorias/1/subcategorias`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "subcategorias": [
      {
        "id": 1,
        "nombre": "Laptops",
        "descripcion": "Computadores portátiles",
        "categoriaId": 1,
        "activo": true,
        "totalProductos": 8
      },
      {
        "id": 2,
        "nombre": "Celulares",
        "descripcion": "Teléfonos móviles",
        "categoriaId": 1,
        "activo": true,
        "totalProductos": 10
      }
    ]
  }
}
```

---

### 2.5 Ver Productos Destacados

**GET** `/api/catalogo/destacados`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "productos": [
      {
        "id": 1,
        "nombre": "Laptop HP Pavilion",
        "precio": "2500000.00",
        "imagen": "uploads/productos/laptop-hp.jpg"
      }
    ]
  }
}
```

---

## 👨‍💼 3. RUTAS DE ADMINISTRADOR

**⚠️ Requiere Token de Administrador**

Todas las peticiones deben incluir:
```
Authorization: Bearer {{admin_token}}
Content-Type: application/json
```

---

### 3.1 GESTIÓN DE CATEGORÍAS

#### 3.1.1 Listar Todas las Categorías

**GET** `/api/admin/categorias`

**Query Parameters** (opcionales):
- `activo`: Filtrar por estado (ejemplo: `?activo=true`)
- `incluirStats`: Incluir estadísticas (ejemplo: `?incluirStats=true`)

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "categorias": [
      {
        "id": 1,
        "nombre": "Tecnología",
        "descripcion": "Productos tecnológicos",
        "activo": true,
        "totalSubcategorias": 5,
        "totalProductos": 24,
        "createdAt": "2026-02-04T10:00:00.000Z"
      }
    ]
  }
}
```

---

#### 3.1.2 Obtener Categoría por ID

**GET** `/api/admin/categorias/:id`

**Ejemplo**: `/api/admin/categorias/1`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "categoria": {
      "id": 1,
      "nombre": "Tecnología",
      "descripcion": "Productos tecnológicos",
      "activo": true,
      "Subcategorias": [
        {
          "id": 1,
          "nombre": "Laptops",
          "totalProductos": 8
        }
      ]
    }
  }
}
```

---

#### 3.1.3 Crear Categoría

**POST** `/api/admin/categorias`

**Body**:
```json
{
  "nombre": "Deportes",
  "descripcion": "Artículos deportivos y fitness"
}
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Categoría creada exitosamente",
  "data": {
    "categoria": {
      "id": 24,
      "nombre": "Deportes",
      "descripcion": "Artículos deportivos y fitness",
      "activo": true,
      "createdAt": "2026-02-04T15:30:00.000Z"
    }
  }
}
```

---

#### 3.1.4 Actualizar Categoría

**PUT** `/api/admin/categorias/:id`

**Ejemplo**: `/api/admin/categorias/24`

**Body**:
```json
{
  "nombre": "Deportes y Fitness",
  "descripcion": "Artículos deportivos, gimnasio y vida saludable"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Categoría actualizada exitosamente",
  "data": {
    "categoria": {
      "id": 24,
      "nombre": "Deportes y Fitness",
      "descripcion": "Artículos deportivos, gimnasio y vida saludable",
      "activo": true
    }
  }
}
```

---

#### 3.1.5 Activar/Desactivar Categoría

**PATCH** `/api/admin/categorias/:id/toggle`

**Ejemplo**: `/api/admin/categorias/24/toggle`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Categoría desactivada exitosamente",
  "data": {
    "categoria": {
      "id": 24,
      "nombre": "Deportes y Fitness",
      "activo": false
    }
  }
}
```

---

#### 3.1.6 Eliminar Categoría (Solo Admin)

**DELETE** `/api/admin/categorias/:id`

**Ejemplo**: `/api/admin/categorias/24`

**⚠️ Solo funciona si la categoría NO tiene subcategorías ni productos**

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Categoría eliminada exitosamente"
}
```

**Error (400)**:
```json
{
  "success": false,
  "message": "No se puede eliminar la categoría porque tiene subcategorías o productos asociados"
}
```

---

#### 3.1.7 Obtener Estadísticas de Categoría

**GET** `/api/admin/categorias/:id/stats`

**Ejemplo**: `/api/admin/categorias/1/stats`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalSubcategorias": 5,
      "totalProductos": 24,
      "totalProductosActivos": 20,
      "stockTotal": 350
    }
  }
}
```

---

### 3.2 GESTIÓN DE SUBCATEGORÍAS

#### 3.2.1 Listar Todas las Subcategorías

**GET** `/api/admin/subcategorias`

**Query Parameters** (opcionales):
- `categoriaId`: Filtrar por categoría (ejemplo: `?categoriaId=1`)
- `activo`: Filtrar por estado (ejemplo: `?activo=true`)
- `incluirCategoria`: Incluir datos de categoría (ejemplo: `?incluirCategoria=true`)

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "subcategorias": [
      {
        "id": 1,
        "nombre": "Laptops",
        "descripcion": "Computadores portátiles",
        "categoriaId": 1,
        "activo": true,
        "totalProductos": 8,
        "Categoria": {
          "id": 1,
          "nombre": "Tecnología"
        }
      }
    ]
  }
}
```

---

#### 3.2.2 Crear Subcategoría

**POST** `/api/admin/subcategorias`

**Body**:
```json
{
  "nombre": "Tablets",
  "descripcion": "Tabletas electrónicas",
  "categoriaId": 1
}
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Subcategoría creada exitosamente",
  "data": {
    "subcategoria": {
      "id": 24,
      "nombre": "Tablets",
      "descripcion": "Tabletas electrónicas",
      "categoriaId": 1,
      "activo": true
    }
  }
}
```

---

#### 3.2.3 Actualizar Subcategoría

**PUT** `/api/admin/subcategorias/:id`

**Ejemplo**: `/api/admin/subcategorias/24`

**Body**:
```json
{
  "nombre": "Tablets y iPads",
  "descripcion": "Tabletas electrónicas de todas las marcas"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Subcategoría actualizada exitosamente",
  "data": {
    "subcategoria": {
      "id": 24,
      "nombre": "Tablets y iPads",
      "descripcion": "Tabletas electrónicas de todas las marcas"
    }
  }
}
```

---

#### 3.2.4 Eliminar Subcategoría (Solo Admin)

**DELETE** `/api/admin/subcategorias/:id`

**Ejemplo**: `/api/admin/subcategorias/24`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Subcategoría eliminada exitosamente"
}
```

---

### 3.3 GESTIÓN DE PRODUCTOS

#### 3.3.1 Listar Todos los Productos

**GET** `/api/admin/productos`

**Query Parameters** (opcionales):
- `categoriaId`: Filtrar por categoría
- `subcategoriaId`: Filtrar por subcategoría
- `activo`: Filtrar por estado (`true`/`false`)
- `conStock`: Solo productos con stock (`true`)
- `buscar`: Buscar por nombre
- `pagina`: Número de página (default: 1)
- `limite`: Items por página (default: 10)

**Ejemplo**: `/api/admin/productos?categoriaId=1&activo=true&pagina=1&limite=5`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "productos": [
      {
        "id": 1,
        "nombre": "Laptop HP Pavilion",
        "descripcion": "Laptop con procesador Intel i5",
        "precio": "2500000.00",
        "stock": 15,
        "imagen": "uploads/productos/laptop-hp.jpg",
        "activo": true,
        "categoriaId": 1,
        "subcategoriaId": 1,
        "Categoria": {
          "id": 1,
          "nombre": "Tecnología"
        },
        "Subcategoria": {
          "id": 1,
          "nombre": "Laptops"
        }
      }
    ],
    "paginacion": {
      "total": 72,
      "pagina": 1,
      "limite": 5,
      "totalPaginas": 15
    }
  }
}
```

---

#### 3.3.2 Obtener Producto por ID

**GET** `/api/admin/productos/:id`

**Ejemplo**: `/api/admin/productos/1`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "producto": {
      "id": 1,
      "nombre": "Laptop HP Pavilion",
      "descripcion": "Laptop con procesador Intel i5, 8GB RAM, 256GB SSD",
      "precio": "2500000.00",
      "stock": 15,
      "imagen": "uploads/productos/laptop-hp.jpg",
      "activo": true,
      "categoriaId": 1,
      "subcategoriaId": 1,
      "createdAt": "2026-02-04T10:00:00.000Z",
      "updatedAt": "2026-02-04T10:00:00.000Z"
    }
  }
}
```

---

#### 3.3.3 Crear Producto (con Imagen)

**POST** `/api/admin/productos`

**⚠️ IMPORTANTE**: Usar `Content-Type: multipart/form-data`

**Headers**: 
```
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data
```

**Body (form-data)**:
- `nombre`: Samsung Galaxy Tab (text)
- `descripcion`: Tablet de 10 pulgadas (text)
- `precio`: 1200000 (text)
- `stock`: 20 (text)
- `categoriaId`: 1 (text)
- `subcategoriaId`: 24 (text)
- `imagen`: [Archivo de imagen] (file)

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "producto": {
      "id": 73,
      "nombre": "Samsung Galaxy Tab",
      "descripcion": "Tablet de 10 pulgadas",
      "precio": "1200000.00",
      "stock": 20,
      "imagen": "uploads/productos/1738684821234-samsung-galaxy-tab.jpg",
      "activo": true,
      "categoriaId": 1,
      "subcategoriaId": 24
    }
  }
}
```

---

#### 3.3.4 Actualizar Producto

**PUT** `/api/admin/productos/:id`

**Ejemplo**: `/api/admin/productos/73`

**Headers**: 
```
Authorization: Bearer {{admin_token}}
Content-Type: multipart/form-data
```

**Body (form-data)**:
- `nombre`: Samsung Galaxy Tab A8 (text)
- `precio`: 1350000 (text)
- `stock`: 25 (text)
- `imagen`: [Nueva imagen] (file) - OPCIONAL

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "data": {
    "producto": {
      "id": 73,
      "nombre": "Samsung Galaxy Tab A8",
      "precio": "1350000.00",
      "stock": 25
    }
  }
}
```

---

#### 3.3.5 Actualizar Stock de Producto

**PATCH** `/api/admin/productos/:id/stock`

**Ejemplo**: `/api/admin/productos/1/stock`

**Body - Aumentar Stock**:
```json
{
  "cantidad": 10,
  "operacion": "aumentar"
}
```

**Body - Reducir Stock**:
```json
{
  "cantidad": 5,
  "operacion": "reducir"
}
```

**Body - Establecer Stock**:
```json
{
  "cantidad": 50,
  "operacion": "establecer"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Stock actualizado exitosamente",
  "data": {
    "producto": {
      "id": 1,
      "nombre": "Laptop HP Pavilion",
      "stockAnterior": 15,
      "stockNuevo": 25
    }
  }
}
```

---

#### 3.3.6 Activar/Desactivar Producto

**PATCH** `/api/admin/productos/:id/toggle`

**Ejemplo**: `/api/admin/productos/73/toggle`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Producto desactivado exitosamente",
  "data": {
    "producto": {
      "id": 73,
      "nombre": "Samsung Galaxy Tab A8",
      "activo": false
    }
  }
}
```

---

#### 3.3.7 Eliminar Producto (Solo Admin)

**DELETE** `/api/admin/productos/:id`

**Ejemplo**: `/api/admin/productos/73`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

---

### 3.4 GESTIÓN DE USUARIOS

#### 3.4.1 Listar Todos los Usuarios

**GET** `/api/admin/usuarios`

**Query Parameters** (opcionales):
- `rol`: Filtrar por rol (`administrador`, `auxiliar`, `cliente`)
- `activo`: Filtrar por estado (`true`/`false`)
- `buscar`: Buscar por nombre o email
- `pagina`: Número de página
- `limite`: Items por página

**Ejemplo**: `/api/admin/usuarios?rol=cliente&activo=true&limite=5`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "usuarios": [
      {
        "id": 3,
        "nombre": "Cliente",
        "apellido": "Uno",
        "email": "cliente1@ecommerce.com",
        "rol": "cliente",
        "telefono": "3001111111",
        "direccion": "Calle Cliente 1",
        "activo": true,
        "createdAt": "2026-02-04T10:00:00.000Z"
      }
    ],
    "paginacion": {
      "total": 5,
      "pagina": 1,
      "limite": 5,
      "totalPaginas": 1
    }
  }
}
```

---

#### 3.4.2 Obtener Usuario por ID

**GET** `/api/admin/usuarios/:id`

**Ejemplo**: `/api/admin/usuarios/3`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 3,
      "nombre": "Cliente",
      "apellido": "Uno",
      "email": "cliente1@ecommerce.com",
      "rol": "cliente",
      "telefono": "3001111111",
      "direccion": "Calle Cliente 1",
      "activo": true,
      "createdAt": "2026-02-04T10:00:00.000Z"
    }
  }
}
```

---

#### 3.4.3 Crear Usuario (Solo Admin)

**POST** `/api/admin/usuarios`

**⚠️ Solo el Administrador puede crear usuarios**

**Body**:
```json
{
  "nombre": "Nuevo",
  "apellido": "Auxiliar",
  "email": "auxiliar2@ecommerce.com",
  "password": "aux12345",
  "rol": "auxiliar",
  "telefono": "3009998877",
  "direccion": "Dirección Auxiliar 2"
}
```

**Roles disponibles**: `administrador`, `auxiliar`, `cliente`

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "usuario": {
      "id": 10,
      "nombre": "Nuevo",
      "apellido": "Auxiliar",
      "email": "auxiliar2@ecommerce.com",
      "rol": "auxiliar",
      "telefono": "3009998877",
      "direccion": "Dirección Auxiliar 2",
      "activo": true
    }
  }
}
```

---

#### 3.4.4 Actualizar Usuario (Solo Admin)

**PUT** `/api/admin/usuarios/:id`

**Ejemplo**: `/api/admin/usuarios/10`

**Body**:
```json
{
  "nombre": "Nuevo",
  "apellido": "Auxiliar Actualizado",
  "telefono": "3001112233",
  "direccion": "Nueva Dirección Auxiliar",
  "rol": "auxiliar"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "usuario": {
      "id": 10,
      "nombre": "Nuevo",
      "apellido": "Auxiliar Actualizado",
      "telefono": "3001112233",
      "direccion": "Nueva Dirección Auxiliar",
      "rol": "auxiliar"
    }
  }
}
```

---

#### 3.4.5 Activar/Desactivar Usuario (Solo Admin)

**PATCH** `/api/admin/usuarios/:id/toggle`

**Ejemplo**: `/api/admin/usuarios/10/toggle`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Usuario desactivado exitosamente",
  "data": {
    "usuario": {
      "id": 10,
      "nombre": "Nuevo",
      "apellido": "Auxiliar Actualizado",
      "activo": false
    }
  }
}
```

---

#### 3.4.6 Eliminar Usuario (Solo Admin)

**DELETE** `/api/admin/usuarios/:id`

**Ejemplo**: `/api/admin/usuarios/10`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

---

#### 3.4.7 Obtener Estadísticas de Usuarios

**GET** `/api/admin/usuarios/stats`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsuarios": 9,
      "totalAdministradores": 1,
      "totalAuxiliares": 1,
      "totalClientes": 7,
      "usuariosActivos": 9,
      "usuariosInactivos": 0
    }
  }
}
```

---

### 3.5 GESTIÓN DE PEDIDOS (ADMIN)

#### 3.5.1 Listar Todos los Pedidos

**GET** `/api/admin/pedidos`

**Query Parameters** (opcionales):
- `estado`: Filtrar por estado (`pendiente`, `enviado`, `entregado`, `cancelado`)
- `usuarioId`: Filtrar por usuario
- `pagina`: Número de página
- `limite`: Items por página (default: 20)

**Ejemplo**: `/api/admin/pedidos?estado=pendiente&limite=10`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "pedidos": [
      {
        "id": 1,
        "total": "5000000.00",
        "estado": "pendiente",
        "direccionEnvio": "Calle Cliente 1",
        "telefono": "3001111111",
        "usuarioId": 3,
        "createdAt": "2026-02-04T14:00:00.000Z",
        "Usuario": {
          "id": 3,
          "nombre": "Cliente",
          "apellido": "Uno",
          "email": "cliente1@ecommerce.com"
        },
        "DetallesPedido": [
          {
            "id": 1,
            "cantidad": 2,
            "precioUnitario": "2500000.00",
            "Producto": {
              "id": 1,
              "nombre": "Laptop HP Pavilion"
            }
          }
        ]
      }
    ],
    "paginacion": {
      "total": 15,
      "pagina": 1,
      "limite": 10,
      "totalPaginas": 2
    }
  }
}
```

---

#### 3.5.2 Obtener Pedido por ID

**GET** `/api/admin/pedidos/:id`

**Ejemplo**: `/api/admin/pedidos/1`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "pedido": {
      "id": 1,
      "total": "5000000.00",
      "estado": "pendiente",
      "direccionEnvio": "Calle Cliente 1",
      "telefono": "3001111111",
      "usuarioId": 3,
      "createdAt": "2026-02-04T14:00:00.000Z",
      "Usuario": {
        "id": 3,
        "nombre": "Cliente",
        "apellido": "Uno",
        "email": "cliente1@ecommerce.com"
      },
      "DetallesPedido": [
        {
          "id": 1,
          "cantidad": 2,
          "precioUnitario": "2500000.00",
          "subtotal": "5000000.00",
          "Producto": {
            "id": 1,
            "nombre": "Laptop HP Pavilion",
            "imagen": "uploads/productos/laptop-hp.jpg"
          }
        }
      ]
    }
  }
}
```

---

#### 3.5.3 Actualizar Estado de Pedido

**PUT** `/api/admin/pedidos/:id/estado`

**Ejemplo**: `/api/admin/pedidos/1/estado`

**Body**:
```json
{
  "estado": "enviado"
}
```

**Estados válidos**: `pendiente`, `enviado`, `entregado`, `cancelado`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Estado del pedido actualizado exitosamente",
  "data": {
    "pedido": {
      "id": 1,
      "estado": "enviado",
      "estadoAnterior": "pendiente"
    }
  }
}
```

---

#### 3.5.4 Obtener Estadísticas de Pedidos

**GET** `/api/admin/pedidos/estadisticas`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalPedidos": 50,
      "pedidosPendientes": 15,
      "pedidosEnviados": 20,
      "pedidosEntregados": 10,
      "pedidosCancelados": 5,
      "ventasTotales": "125000000.00",
      "ventasHoy": "5000000.00",
      "ventasMes": "45000000.00"
    }
  }
}
```

---

## 👤 4. RUTAS DE AUXILIAR

**⚠️ Requiere Token de Auxiliar**

El auxiliar tiene acceso a:
- ✅ **Crear, actualizar y ver** categorías, subcategorías y productos
- ✅ **Activar/desactivar** categorías, subcategorías y productos
- ❌ **NO puede eliminar** nada
- ❌ **NO puede gestionar usuarios**

### Permisos del Auxiliar

**Headers**: 
```
Authorization: Bearer {{auxiliar_token}}
Content-Type: application/json
```

### Rutas Permitidas:

#### Categorías (Admin + Auxiliar):
- ✅ GET `/api/admin/categorias` - Listar
- ✅ GET `/api/admin/categorias/:id` - Ver
- ✅ POST `/api/admin/categorias` - Crear
- ✅ PUT `/api/admin/categorias/:id` - Actualizar
- ✅ PATCH `/api/admin/categorias/:id/toggle` - Activar/Desactivar
- ❌ DELETE `/api/admin/categorias/:id` - **Solo Admin**

#### Subcategorías (Admin + Auxiliar):
- ✅ GET `/api/admin/subcategorias` - Listar
- ✅ GET `/api/admin/subcategorias/:id` - Ver
- ✅ POST `/api/admin/subcategorias` - Crear
- ✅ PUT `/api/admin/subcategorias/:id` - Actualizar
- ✅ PATCH `/api/admin/subcategorias/:id/toggle` - Activar/Desactivar
- ❌ DELETE `/api/admin/subcategorias/:id` - **Solo Admin**

#### Productos (Admin + Auxiliar):
- ✅ GET `/api/admin/productos` - Listar
- ✅ GET `/api/admin/productos/:id` - Ver
- ✅ POST `/api/admin/productos` - Crear
- ✅ PUT `/api/admin/productos/:id` - Actualizar
- ✅ PATCH `/api/admin/productos/:id/toggle` - Activar/Desactivar
- ✅ PATCH `/api/admin/productos/:id/stock` - Actualizar stock
- ❌ DELETE `/api/admin/productos/:id` - **Solo Admin**

#### Usuarios:
- ❌ **Sin acceso** - Solo Admin

#### Pedidos (Admin + Auxiliar):
- ✅ GET `/api/admin/pedidos` - Listar
- ✅ GET `/api/admin/pedidos/:id` - Ver
- ✅ PUT `/api/admin/pedidos/:id/estado` - Actualizar estado
- ✅ GET `/api/admin/pedidos/estadisticas` - Ver estadísticas

---

### Ejemplo de Prueba - Auxiliar Intentando Eliminar

**DELETE** `/api/admin/categorias/1`

**Headers**: 
```
Authorization: Bearer {{auxiliar_token}}
```

**Respuesta Error (403)**:
```json
{
  "success": false,
  "message": "Acceso denegado. Solo administradores pueden realizar esta acción."
}
```

---

## 🛍️ 5. RUTAS DE CLIENTE

**⚠️ Requiere Token de Cliente**

**Headers**: 
```
Authorization: Bearer {{cliente_token}}
Content-Type: application/json
```

---

### 5.1 CARRITO DE COMPRAS

#### 5.1.1 Ver Mi Carrito

**GET** `/api/cliente/carrito`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "carrito": {
      "id": 1,
      "usuarioId": 3,
      "Items": [
        {
          "id": 1,
          "cantidad": 2,
          "productoId": 1,
          "Producto": {
            "id": 1,
            "nombre": "Laptop HP Pavilion",
            "precio": "2500000.00",
            "stock": 15,
            "imagen": "uploads/productos/laptop-hp.jpg",
            "activo": true
          },
          "subtotal": "5000000.00"
        }
      ],
      "totalItems": 2,
      "totalCarrito": "5000000.00"
    }
  }
}
```

---

#### 5.1.2 Agregar Producto al Carrito

**POST** `/api/cliente/carrito`

**Body**:
```json
{
  "productoId": 1,
  "cantidad": 2
}
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Producto agregado al carrito exitosamente",
  "data": {
    "item": {
      "id": 1,
      "carritoId": 1,
      "productoId": 1,
      "cantidad": 2,
      "Producto": {
        "id": 1,
        "nombre": "Laptop HP Pavilion",
        "precio": "2500000.00"
      }
    }
  }
}
```

**Si el producto ya existe en el carrito, aumenta la cantidad**:
```json
{
  "success": true,
  "message": "Cantidad actualizada en el carrito",
  "data": {
    "item": {
      "cantidad": 4
    }
  }
}
```

---

#### 5.1.3 Actualizar Cantidad de un Item

**PUT** `/api/cliente/carrito/:id`

**Ejemplo**: `/api/cliente/carrito/1`

**Body**:
```json
{
  "cantidad": 3
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Cantidad actualizada exitosamente",
  "data": {
    "item": {
      "id": 1,
      "cantidad": 3,
      "subtotal": "7500000.00"
    }
  }
}
```

---

#### 5.1.4 Eliminar Item del Carrito

**DELETE** `/api/cliente/carrito/:id`

**Ejemplo**: `/api/cliente/carrito/1`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Producto eliminado del carrito exitosamente"
}
```

---

#### 5.1.5 Vaciar Todo el Carrito

**DELETE** `/api/cliente/carrito`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Carrito vaciado exitosamente"
}
```

---

### 5.2 PEDIDOS

#### 5.2.1 Crear Pedido (Checkout)

**POST** `/api/cliente/pedidos`

**⚠️ El carrito debe tener items antes de crear un pedido**

**Body**:
```json
{
  "direccionEnvio": "Calle 123 #45-67, Bogotá",
  "telefono": "3001234567"
}
```

**Respuesta Exitosa (201)**:
```json
{
  "success": true,
  "message": "Pedido creado exitosamente",
  "data": {
    "pedido": {
      "id": 15,
      "total": "5000000.00",
      "estado": "pendiente",
      "direccionEnvio": "Calle 123 #45-67, Bogotá",
      "telefono": "3001234567",
      "usuarioId": 3,
      "createdAt": "2026-02-04T15:30:00.000Z",
      "DetallesPedido": [
        {
          "id": 25,
          "cantidad": 2,
          "precioUnitario": "2500000.00",
          "subtotal": "5000000.00",
          "Producto": {
            "nombre": "Laptop HP Pavilion"
          }
        }
      ]
    }
  }
}
```

**⚠️ Nota**: Después de crear el pedido, el carrito se vacía automáticamente.

---

#### 5.2.2 Ver Mis Pedidos

**GET** `/api/cliente/pedidos`

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "pedidos": [
      {
        "id": 15,
        "total": "5000000.00",
        "estado": "pendiente",
        "direccionEnvio": "Calle 123 #45-67, Bogotá",
        "telefono": "3001234567",
        "createdAt": "2026-02-04T15:30:00.000Z",
        "DetallesPedido": [
          {
            "cantidad": 2,
            "precioUnitario": "2500000.00",
            "subtotal": "5000000.00",
            "Producto": {
              "nombre": "Laptop HP Pavilion",
              "imagen": "uploads/productos/laptop-hp.jpg"
            }
          }
        ]
      }
    ]
  }
}
```

---

#### 5.2.3 Ver un Pedido Específico

**GET** `/api/cliente/pedidos/:id`

**Ejemplo**: `/api/cliente/pedidos/15`

**⚠️ Solo puedes ver tus propios pedidos**

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "pedido": {
      "id": 15,
      "total": "5000000.00",
      "estado": "pendiente",
      "direccionEnvio": "Calle 123 #45-67, Bogotá",
      "telefono": "3001234567",
      "createdAt": "2026-02-04T15:30:00.000Z",
      "DetallesPedido": [
        {
          "cantidad": 2,
          "precioUnitario": "2500000.00",
          "subtotal": "5000000.00",
          "Producto": {
            "id": 1,
            "nombre": "Laptop HP Pavilion",
            "descripcion": "Laptop con procesador Intel i5",
            "imagen": "uploads/productos/laptop-hp.jpg"
          }
        }
      ]
    }
  }
}
```

**Error si intentas ver un pedido de otro usuario (403)**:
```json
{
  "success": false,
  "message": "No tienes permiso para ver este pedido"
}
```

---

#### 5.2.4 Cancelar Pedido

**PUT** `/api/cliente/pedidos/:id/cancelar`

**Ejemplo**: `/api/cliente/pedidos/15/cancelar`

**⚠️ Solo puedes cancelar pedidos en estado "pendiente"**

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Pedido cancelado exitosamente",
  "data": {
    "pedido": {
      "id": 15,
      "estado": "cancelado"
    }
  }
}
```

**Error si el pedido ya fue enviado (400)**:
```json
{
  "success": false,
  "message": "No se puede cancelar un pedido que ya ha sido enviado o entregado"
}
```

---

## 📊 6. CÓDIGOS DE RESPUESTA HTTP

### Códigos de Éxito

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa (GET, PUT, PATCH, DELETE) |
| 201 | Created | Recurso creado exitosamente (POST) |

### Códigos de Error del Cliente

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 400 | Bad Request | Datos inválidos, falta información requerida |
| 401 | Unauthorized | Token inválido o expirado, sin autenticación |
| 403 | Forbidden | Sin permisos para realizar la acción |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: email duplicado, nombre existente) |

### Códigos de Error del Servidor

| Código | Significado | Cuándo se usa |
|--------|-------------|---------------|
| 500 | Internal Server Error | Error inesperado en el servidor |

---

## 🔧 7. EJEMPLOS DE ERRORES COMUNES

### Error 401 - Sin Token
```json
{
  "success": false,
  "message": "No se proporcionó token de autenticación"
}
```

### Error 401 - Token Inválido
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```

### Error 403 - Sin Permisos
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción"
}
```

### Error 404 - No Encontrado
```json
{
  "success": false,
  "message": "Categoría no encontrada"
}
```

### Error 400 - Datos Faltantes
```json
{
  "success": false,
  "message": "El campo 'nombre' es requerido"
}
```

### Error 409 - Duplicado
```json
{
  "success": false,
  "message": "Ya existe una categoría con ese nombre"
}
```

### Error 400 - Stock Insuficiente
```json
{
  "success": false,
  "message": "Stock insuficiente. Solo hay 5 unidades disponibles"
}
```

---

## 📝 8. FLUJO COMPLETO DE COMPRA (CLIENTE)

### Paso 1: Login
```
POST /api/auth/login
Body: { email, password }
→ Guardar token
```

### Paso 2: Ver Catálogo
```
GET /api/catalogo/productos?categoriaId=1
→ Ver productos disponibles
```

### Paso 3: Agregar al Carrito
```
POST /api/cliente/carrito
Body: { productoId: 1, cantidad: 2 }
Headers: Authorization: Bearer {{cliente_token}}
```

### Paso 4: Ver Carrito
```
GET /api/cliente/carrito
Headers: Authorization: Bearer {{cliente_token}}
→ Verificar items y total
```

### Paso 5: Crear Pedido (Checkout)
```
POST /api/cliente/pedidos
Body: { direccionEnvio: "...", telefono: "..." }
Headers: Authorization: Bearer {{cliente_token}}
→ Pedido creado, carrito vaciado
```

### Paso 6: Ver Pedidos
```
GET /api/cliente/pedidos
Headers: Authorization: Bearer {{cliente_token}}
→ Ver historial de pedidos
```

---

## 🎯 9. COLECCIÓN DE POSTMAN RECOMENDADA

### Estructura de Carpetas

```
📁 E-Commerce API
├── 📁 1. Autenticación
│   ├── POST Register
│   ├── POST Login Admin
│   ├── POST Login Auxiliar
│   ├── POST Login Cliente
│   ├── GET Get Profile
│   ├── PUT Update Profile
│   └── PUT Change Password
│
├── 📁 2. Catálogo (Público)
│   ├── GET Productos
│   ├── GET Producto por ID
│   ├── GET Categorías
│   ├── GET Subcategorías por Categoría
│   └── GET Productos Destacados
│
├── 📁 3. Admin - Categorías
│   ├── GET Listar Categorías
│   ├── GET Categoría por ID
│   ├── GET Stats Categoría
│   ├── POST Crear Categoría
│   ├── PUT Actualizar Categoría
│   ├── PATCH Toggle Categoría
│   └── DELETE Eliminar Categoría
│
├── 📁 4. Admin - Subcategorías
│   ├── GET Listar Subcategorías
│   ├── GET Subcategoría por ID
│   ├── POST Crear Subcategoría
│   ├── PUT Actualizar Subcategoría
│   ├── PATCH Toggle Subcategoría
│   └── DELETE Eliminar Subcategoría
│
├── 📁 5. Admin - Productos
│   ├── GET Listar Productos
│   ├── GET Producto por ID
│   ├── POST Crear Producto (con imagen)
│   ├── PUT Actualizar Producto
│   ├── PATCH Toggle Producto
│   ├── PATCH Actualizar Stock
│   └── DELETE Eliminar Producto
│
├── 📁 6. Admin - Usuarios
│   ├── GET Listar Usuarios
│   ├── GET Usuario por ID
│   ├── GET Stats Usuarios
│   ├── POST Crear Usuario
│   ├── PUT Actualizar Usuario
│   ├── PATCH Toggle Usuario
│   └── DELETE Eliminar Usuario
│
├── 📁 7. Admin - Pedidos
│   ├── GET Listar Pedidos
│   ├── GET Pedido por ID
│   ├── GET Estadísticas
│   └── PUT Actualizar Estado
│
├── 📁 8. Cliente - Carrito
│   ├── GET Ver Carrito
│   ├── POST Agregar al Carrito
│   ├── PUT Actualizar Cantidad
│   ├── DELETE Eliminar Item
│   └── DELETE Vaciar Carrito
│
└── 📁 9. Cliente - Pedidos
    ├── POST Crear Pedido
    ├── GET Mis Pedidos
    ├── GET Pedido por ID
    └── PUT Cancelar Pedido
```

---

## 🚀 10. TIPS PARA PRUEBAS EFECTIVAS

### 1. Usar Variables de Entorno
Crear variables para:
- `base_url`
- `admin_token`
- `auxiliar_token`
- `cliente_token`
- `categoria_id`
- `producto_id`
- `pedido_id`

### 2. Scripts de Postman para Auto-guardar Tokens

**En Login Request → Tests tab**:
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("admin_token", response.data.token);
}
```

### 3. Scripts para Auto-guardar IDs

**Después de crear categoría → Tests tab**:
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("categoria_id", response.data.categoria.id);
}
```

### 4. Pre-request Script para Timestamps

```javascript
pm.variables.set("timestamp", Date.now());
```

Usar en body:
```json
{
  "email": "test{{timestamp}}@ejemplo.com"
}
```

---

## ✅ 11. CHECKLIST DE PRUEBAS

### Autenticación
- [ ] Registro de nuevo usuario
- [ ] Login con credenciales correctas
- [ ] Login con credenciales incorrectas
- [ ] Obtener perfil autenticado
- [ ] Actualizar perfil
- [ ] Cambiar contraseña

### Administrador
- [ ] CRUD completo de categorías
- [ ] CRUD completo de subcategorías
- [ ] CRUD completo de productos (con imagen)
- [ ] CRUD completo de usuarios
- [ ] Gestión de pedidos
- [ ] Ver estadísticas

### Auxiliar
- [ ] Crear categoría
- [ ] Crear subcategoría
- [ ] Crear producto
- [ ] Actualizar stock
- [ ] Intentar eliminar (debe fallar)
- [ ] Gestionar pedidos

### Cliente
- [ ] Ver catálogo público
- [ ] Agregar productos al carrito
- [ ] Actualizar cantidad en carrito
- [ ] Crear pedido
- [ ] Ver mis pedidos
- [ ] Cancelar pedido pendiente
- [ ] Intentar cancelar pedido enviado (debe fallar)

### Permisos
- [ ] Cliente intentando acceder a ruta admin (debe fallar)
- [ ] Auxiliar intentando eliminar (debe fallar)
- [ ] Usuario sin token (debe fallar)
- [ ] Token inválido (debe fallar)

---

## 📞 SOPORTE

Para dudas o problemas:
- Revisar logs del servidor en la consola
- Verificar que el servidor esté corriendo en `http://localhost:5000`
- Confirmar que la base de datos esté iniciada
- Revisar que los tokens no hayan expirado

---

## 📅 ÚLTIMA ACTUALIZACIÓN

**Fecha**: 4 de febrero de 2026  
**Versión API**: 1.0.0  
**Base de datos**: MySQL - ecommerce_db  
**Puerto**: 5000

---

**🎉 ¡Todo listo para probar la API E-Commerce!**
