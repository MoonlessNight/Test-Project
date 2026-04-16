# 🎨 E-commerce Frontend

Frontend para sistema de E-commerce construido con React, Bootstrap y Axios.

## 🚀 Tecnologías

- **React** - Librería para construir interfaces de usuario
- **React Router** - Navegación entre páginas
- **Bootstrap** - Framework CSS para estilos
- **React Bootstrap** - Componentes de Bootstrap para React
- **Axios** - Cliente HTTP para consumir APIs

## 📋 Requisitos Previos

- [Node.js](https://nodejs.org/) (v14 o superior)
- Backend corriendo en `http://localhost:5000`

## ⚙️ Instalación

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install
```

## 🎯 Ejecutar la Aplicación

### Modo desarrollo

```bash
npm start
```

La aplicación se abrirá automáticamente en [http://localhost:3000](http://localhost:3000)

### Build para producción

```bash
npm run build
```

Esto creará una carpeta `build/` con los archivos optimizados para producción.

## 📁 Estructura del Proyecto

```
frontend/
│
├── public/              # Archivos públicos (index.html, favicon, etc)
│
├── src/                 # Código fuente
│   ├── components/      # Componentes reutilizables
│   ├── pages/           # Páginas de la aplicación
│   ├── context/         # Context API (estado global)
│   ├── services/        # Servicios para consumir APIs
│   │   └── api.js       # Configuración de Axios
│   ├── utils/           # Funciones utilitarias
│   ├── App.js           # Componente principal
│   ├── App.css          # Estilos del componente principal
│   └── index.js         # Punto de entrada de React
│
├── .env                 # Variables de entorno
├── package.json         # Dependencias y scripts
└── README.md            # Este archivo
```

## 🔧 Configuración

### Variables de Entorno (.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=E-commerce SENA
REACT_APP_VERSION=1.0.0
```

**⚠️ Importante:** Las variables de entorno en React deben empezar con `REACT_APP_`

## 🌐 Páginas de la Aplicación

### Públicas (Sin autenticación)
- `/` - Página principal (catálogo de productos)
- `/login` - Inicio de sesión
- `/register` - Registro de usuarios
- `/producto/:id` - Detalle de producto

### Cliente (Requiere autenticación)
- `/perfil` - Perfil de usuario
- `/carrito` - Carrito de compras
- `/checkout` - Proceso de pago
- `/mis-pedidos` - Historial de pedidos

### Administrador (Requiere rol admin)
- `/admin` - Dashboard de administrador
- `/admin/categorias` - Gestión de categorías
- `/admin/subcategorias` - Gestión de subcategorías
- `/admin/productos` - Gestión de productos
- `/admin/clientes` - Gestión de clientes
- `/admin/pedidos` - Gestión de pedidos

## 📦 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Crea el build de producción
- `npm test` - Ejecuta los tests
- `npm run eject` - Expone la configuración (⚠️ irreversible)

## 🎨 Componentes de Bootstrap Utilizados

- `Container` - Contenedor responsivo
- `Row` / `Col` - Sistema de grid
- `Navbar` - Barra de navegación
- `Card` - Tarjetas de contenido
- `Button` - Botones
- `Form` - Formularios
- `Modal` - Ventanas modales
- `Alert` - Mensajes de alerta
- `Table` - Tablas de datos

## 🔐 Autenticación

La autenticación se maneja con:
- **JWT (JSON Web Tokens)** almacenados en `localStorage`
- **Context API** para el estado global del usuario
- **Interceptors de Axios** para agregar el token automáticamente

## 🛠️ Solución de Problemas

### Error: No se puede conectar con el backend

- ✅ Verifica que el backend esté corriendo en `http://localhost:5000`
- ✅ Revisa la variable `REACT_APP_API_URL` en el archivo `.env`
- ✅ Verifica que CORS esté habilitado en el backend

### Error: Las imágenes no se muestran

- ✅ Verifica que las imágenes existan en `backend/uploads/`
- ✅ Verifica la URL de las imágenes: `http://localhost:5000/uploads/imagen.jpg`

### La aplicación no recarga automáticamente

- Reinicia el servidor: Ctrl+C y luego `npm start`
- Verifica que `nodemon` esté funcionando correctamente

## 📝 Notas Importantes

- Siempre inicia el **backend primero** antes de iniciar el frontend
- Las variables de entorno solo se cargan al iniciar la aplicación
- Si cambias `.env`, debes reiniciar el servidor con `npm start`
- El puerto por defecto es 3000, puede cambiar si está ocupado

## 🔄 Próximos Pasos

- [ ] Crear contexto de autenticación (Fase 8)
- [ ] Crear páginas de login y registro (Fase 8)
- [ ] Crear panel de administrador (Fase 9)
- [ ] Crear panel de cliente (Fase 10)
- [ ] Integrar con el backend (Fase 11)

## 📧 Soporte

Para dudas o problemas, contacta al instructor.

---

**Desarrollado para:** SENA - Articulación 3206404  
**Fecha:** Febrero 2026

