# 📦 INSTRUCCIONES PARA POBLAR LA BASE DE DATOS

## 🎯 Resumen
Este script poblará la base de datos con:
- ✅ 1 Administrador (usuario: admin, contraseña: admin1234)
- ✅ 1 Auxiliar (usuario: auxiliar, contraseña: aux123)
- ✅ 5 Clientes (cliente1/cliente1, cliente2/cliente2, etc.)
- ✅ 5 Categorías
- ✅ 15 Subcategorías (3 por categoría)
- ✅ 75 Productos (5 por subcategoría)

## ⚡ Ejecución Rápida

### Opción 1: Desde cero (recomendado)

```bash
# 1. Detén el servidor si está corriendo (Ctrl+C)

# 2. Elimina la base de datos actual
DROP DATABASE ecommerce_db;

# 3. Crea la base de datos desde cero
cd backend
npm run init-db

# 4. El seeder se ejecutará automáticamente al iniciar el servidor
npm run dev
```

### Opción 2: Solo ejecutar el seeder

Si ya tienes el servidor corriendo y quieres poblar datos:

```bash
cd backend
npm run seed
```

## 🔑 Credenciales Creadas

### Administrador
- Usuario: `admin`
- Contraseña: `admin1234`
- Rol: administrador

### Auxiliar
- Usuario: `auxiliar`
- Contraseña: `aux123`
- Rol: auxiliar

### Clientes (5)
- Usuario: `cliente1` - Contraseña: `cliente1`
- Usuario: `cliente2` - Contraseña: `cliente2`
- Usuario: `cliente3` - Contraseña: `cliente3`
- Usuario: `cliente4` - Contraseña: `cliente4`
- Usuario: `cliente5` - Contraseña: `cliente5`

## 📊 Datos Creados

### Categorías (5)
1. Electrónica - 3 subcategorías, 15 productos
2. Ropa - 3 subcategorías, 15 productos
3. Hogar - 3 subcategorías, 15 productos
4. Deportes - 3 subcategorías, 15 productos
5. Libros - 3 subcategorías, 15 productos

### Total
- 7 usuarios
- 5 categorías
- 15 subcategorías
- 75 productos

## 🧪 Probar Acceso

### Login Administrador
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin",
  "password": "admin1234"
}
```

### Login Auxiliar
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "auxiliar",
  "password": "aux123"
}
```

### Login Cliente
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "cliente1",
  "password": "cliente1"
}
```

## ⚠️ Notas Importantes

1. **Si ya existen datos:** El seeder detectará que ya hay datos y NO los duplicará
2. **Para recrear todo:** Elimina la base de datos y vuelve a crearla
3. **Imágenes:** Todos los productos usan imagen por defecto `producto-default.jpg`
4. **Stock:** Todos los productos tienen stock disponible
5. **Activos:** Todos los registros están activos por defecto

## 🔧 Solución de Problemas

### El seeder dice "Ya existen datos"
Elimina la base de datos y créala de nuevo:
```sql
DROP DATABASE ecommerce_db;
CREATE DATABASE ecommerce_db;
```

### Error de autenticación
Verifica que XAMPP/MySQL esté corriendo en el puerto 3306

### No puedo hacer login
Asegúrate de usar exactamente las credenciales mostradas arriba (case-sensitive)
