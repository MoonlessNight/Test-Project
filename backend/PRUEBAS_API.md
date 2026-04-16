# Guía de Pruebas de API - Fase 4: Autenticación

Esta guía proporciona ejemplos para probar todos los endpoints de autenticación usando **Postman**, **Thunder Client** o **cURL**.

## Configuración Inicial

**URL Base del Backend:** `http://localhost:5000`

---

## 1. Registrar Nuevo Usuario (Cliente)

**Endpoint:** `POST /api/auth/register`

**Descripción:** Crea un nuevo usuario con rol de cliente.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "nombre": "Carlos",
  "apellido": "Rodríguez",
  "email": "carlos@example.com",
  "password": "carlos123",
  "telefono": "3001234567",
  "direccion": "Calle 10 #20-30, Bogotá"
}
```

**Respuesta Exitosa (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "usuario": {
      "id": 2,
      "nombre": "Carlos",
      "apellido": "Rodríguez",
      "email": "carlos@example.com",
      "rol": "cliente",
      "telefono": "3001234567",
      "direccion": "Calle 10 #20-30, Bogotá",
      "activo": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores Posibles:**
- `400`: Faltan campos requeridos
- `400`: Email ya está registrado
- `400`: Formato de email inválido
- `400`: Contraseña muy corta (menos de 6 caracteres)

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos",
    "apellido": "Rodríguez",
    "email": "carlos@example.com",
    "password": "carlos123",
    "telefono": "3001234567",
    "direccion": "Calle 10 #20-30, Bogotá"
  }'
```

---

## 2. Iniciar Sesión (Login)

**Endpoint:** `POST /api/auth/login`

**Descripción:** Autentica un usuario y retorna un token JWT.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON) - Login como Admin:**
```json
{
  "email": "admin@ecommerce.com",
  "password": "admin123"
}
```

**Body (JSON) - Login como Cliente:**
```json
{
  "email": "carlos@example.com",
  "password": "carlos123"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Administrador",
      "apellido": "Principal",
      "email": "admin@ecommerce.com",
      "rol": "administrador",
      "telefono": null,
      "direccion": null,
      "activo": true,
      "ultimoLogin": "2024-01-15T10:35:00.000Z",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores Posibles:**
- `400`: Email y contraseña son requeridos
- `401`: Credenciales inválidas (email no existe o password incorrecto)
- `401`: Usuario inactivo

**cURL:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ecommerce.com",
    "password": "admin123"
  }'
```

**IMPORTANTE:** Guardar el `token` de la respuesta, se necesitará para las siguientes peticiones.

---

## 3. Obtener Perfil del Usuario Autenticado

**Endpoint:** `GET /api/auth/me`

**Descripción:** Retorna los datos del usuario que está autenticado.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {TOKEN}
```

**⚠️ Reemplazar `{TOKEN}` con el token obtenido en el login**

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Administrador",
      "apellido": "Principal",
      "email": "admin@ecommerce.com",
      "rol": "administrador",
      "telefono": null,
      "direccion": null,
      "activo": true,
      "ultimoLogin": "2024-01-15T10:35:00.000Z",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

**Errores Posibles:**
- `401`: No se proporcionó token de autenticación
- `401`: Token de autenticación inválido
- `401`: Token expirado
- `404`: Usuario no encontrado

**cURL:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 4. Actualizar Perfil del Usuario

**Endpoint:** `PUT /api/auth/me`

**Descripción:** Permite al usuario actualizar su información personal (nombre, apellido, teléfono, dirección).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {TOKEN}
```

**Body (JSON) - Todos los campos son opcionales:**
```json
{
  "nombre": "Carlos Alberto",
  "apellido": "Rodríguez Pérez",
  "telefono": "3009876543",
  "direccion": "Carrera 15 #25-40, Apartamento 301, Bogotá"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": {
    "usuario": {
      "id": 2,
      "nombre": "Carlos Alberto",
      "apellido": "Rodríguez Pérez",
      "email": "carlos@example.com",
      "rol": "cliente",
      "telefono": "3009876543",
      "direccion": "Carrera 15 #25-40, Apartamento 301, Bogotá",
      "activo": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:45:00.000Z"
    }
  }
}
```

**Errores Posibles:**
- `401`: Token no proporcionado o inválido
- `404`: Usuario no encontrado

**cURL:**
```bash
curl -X PUT http://localhost:5000/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "nombre": "Carlos Alberto",
    "apellido": "Rodríguez Pérez",
    "telefono": "3009876543",
    "direccion": "Carrera 15 #25-40, Apartamento 301, Bogotá"
  }'
```

---

## 5. Cambiar Contraseña

**Endpoint:** `PUT /api/auth/change-password`

**Descripción:** Permite al usuario cambiar su contraseña. Requiere la contraseña actual por seguridad.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {TOKEN}
```

**Body (JSON):**
```json
{
  "passwordActual": "carlos123",
  "passwordNueva": "nuevoPassword456"
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Errores Posibles:**
- `400`: Se requiere contraseña actual y nueva contraseña
- `400`: La nueva contraseña debe tener al menos 6 caracteres
- `401`: Token no proporcionado o inválido
- `401`: Contraseña actual incorrecta
- `404`: Usuario no encontrado

**cURL:**
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "passwordActual": "carlos123",
    "passwordNueva": "nuevoPassword456"
  }'
```

---

## Flujo Completo de Prueba

### Escenario 1: Nuevo Cliente

1. **Registrarse** → `POST /api/auth/register`
   - Crear cuenta con email y password
   - Guardar el token retornado

2. **Ver mi perfil** → `GET /api/auth/me`
   - Usar el token del registro
   - Verificar que los datos son correctos

3. **Actualizar perfil** → `PUT /api/auth/me`
   - Actualizar teléfono y dirección
   - Verificar que los cambios se guardaron

4. **Cambiar contraseña** → `PUT /api/auth/change-password`
   - Cambiar la contraseña
   - Confirmar que se actualizó

5. **Login con nueva contraseña** → `POST /api/auth/login`
   - Usar el nuevo password
   - Verificar que el login funciona

### Escenario 2: Usuario Administrador

1. **Login como admin** → `POST /api/auth/login`
   ```json
   {
     "email": "admin@ecommerce.com",
     "password": "admin123"
   }
   ```
   - Guardar el token

2. **Ver perfil de admin** → `GET /api/auth/me`
   - Verificar que el rol es "administrador"

---

## Códigos de Estado HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| 200 | OK | Operación exitosa (login, get, update) |
| 201 | Created | Recurso creado exitosamente (register) |
| 400 | Bad Request | Datos inválidos o incompletos |
| 401 | Unauthorized | Token inválido, expirado o credenciales incorrectas |
| 403 | Forbidden | No tiene permisos para esta acción |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error del servidor |

---

## Estructura del Token JWT

El token JWT tiene la siguiente estructura:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBlY29tbWVyY2UuY29tIiwicm9sIjoiYWRtaW5pc3RyYWRvciIsImlhdCI6MTcwNTMxNDAwMCwiZXhwIjoxNzA1NDAwNDAwfQ.signature
```

**Partes:**
1. **Header** (algoritmo y tipo)
2. **Payload** (datos del usuario: id, email, rol)
3. **Signature** (firma para verificar autenticidad)

**Expiración:** 24 horas desde la creación

**Uso:** Siempre enviar en el header `Authorization: Bearer {TOKEN}`

---

## Consejos para Postman

### Crear una Collection

1. Crear nueva Collection llamada "E-commerce API"
2. Agregar una variable de entorno `{{url}}` = `http://localhost:5000`
3. Agregar una variable `{{token}}` (se actualizará automáticamente)

### Guardar Token Automáticamente

En el endpoint de Login, agregar en la pestaña **Tests**:

```javascript
// Guardar el token automáticamente
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.data.token);
    console.log("Token guardado:", response.data.token);
}
```

### Usar Token en Todas las Peticiones

En las peticiones protegidas, usar:

**Authorization Tab:**
- Type: `Bearer Token`
- Token: `{{token}}`

---

## Próximos Pasos

En la **Fase 5** crearemos los endpoints del administrador:
- Gestión de categorías
- Gestión de subcategorías
- Gestión de productos
- Gestión de usuarios

En la **Fase 6** crearemos los endpoints de clientes:
- Catálogo de productos
- Carrito de compras
- Checkout y pedidos
