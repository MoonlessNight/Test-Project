# 📱 Aplicación Móvil E-Commerce

Aplicación móvil híbrida desarrollada con **Expo** y **React Native** para el Sistema E-Commerce Completo, que permite tanto a clientes realizar compras como a administradores gestionar la tienda.

---

## 🚀 Características Principales

### 👤 Panel de Clientes
* **Catálogo de Productos:** Exploración interactiva y búsqueda filtrada por categorías y subcategorías.
* **Carrito de Compras:** Gestión local y en la nube del carrito (agregar, modificar cantidad, eliminar).
* **Proceso de Pago (Checkout):** Formulario para finalizar el pedido y confirmación visual.
* **Mis Pedidos:** Historial de compras con detalles de cada orden realizada.

### 👨‍💼 Panel de Administración (Dashboard)
* **Gestión de Categorías y Subcategorías:** Altas, bajas, modificaciones y activación/desactivación en cascada.
* **Gestión de Productos:** Formulario completo para registrar y editar productos con imágenes.
* **Gestión de Usuarios:** Registro y edición de clientes y administradores.
* **Control de Pedidos:** Visualización general de los pedidos realizados en el sistema.

### 🛠️ Detalles de Arquitectura & Estado
* **Autenticación con JWT:** Almacenamiento seguro del token de sesión mediante `AsyncStorage` con respaldo en memoria.
* **Navegación Dinámica:** Implementada con `expo-router` usando rutas basadas en carpetas y un sistema de pestañas (`(tabs)`).
* **Conexión Automática con el Backend:** Detección automática de la dirección IP de la computadora host para facilitar pruebas en dispositivos físicos mediante Expo Go sin configurar IPs de forma manual.

---

## 🏗️ Estructura del Proyecto

```
app-movil/
├── app/                      # Rutas de la Aplicación (Expo Router)
│   ├── (tabs)/               # Pestañas principales de navegación
│   │   ├── index.tsx         # Catálogo / Pantalla de Inicio
│   │   ├── explore.tsx       # Búsqueda / Categorías
│   │   └── carrito.tsx       # Carrito de compras
│   ├── admin/                # Vistas exclusivas del Administrador
│   │   ├── dashboard.tsx     # Estadísticas y accesos de administración
│   │   ├── categorias.tsx    # Listado y gestión de categorías
│   │   ├── productos.tsx     # Listado y gestión de productos
│   │   └── usuarios.tsx      # Gestión de usuarios
│   ├── pedidos/              # Detalles de los pedidos del cliente
│   ├── _layout.tsx           # Configuración global y navegación base
│   ├── checkout.tsx          # Pantalla de facturación y pago
│   ├── mis-pedidos.tsx       # Lista de pedidos del usuario
│   └── modal.tsx             # Ventanas modales globales
│
├── src/                      # Código Fuente Modular
│   ├── api/
│   │   └── apiClient.js      # Cliente Axios configurado con interceptores de Token JWT
│   ├── context/
│   │   ├── AuthContext.js    # Contexto y estado de autenticación (Login/Logout)
│   │   └── CarritoContext.js # Contexto y persistencia del carrito de compras
│   ├── services/
│   │   ├── authService.js    # Llamadas de login, registro y perfil
│   │   ├── catalogoService.js# Solicitudes de productos y categorías
│   │   ├── carritoService.js # Sincronización del carrito con la API
│   │   ├── pedidoService.js  # Creación y consulta de pedidos
│   │   └── adminService.js   # Acciones CRUD para el administrador
│   └── utils/
│       ├── constants.js      # Configuración de URLs y constantes
│       └── storage.js        # Envoltorio seguro para AsyncStorage y memoryStore
│
├── assets/                   # Imágenes, íconos y splash screen
└── package.json              # Dependencias y scripts de Expo
```

---

## 🛠️ Tecnologías y Librerías Utilizadas

* **Expo (v54.0.33)**: Entorno y herramientas de desarrollo ágil para React Native.
* **React Native (v0.81.5)**: Desarrollo de interfaz de usuario móvil nativa.
* **Expo Router (v6.0.23)**: Enrutador basado en archivos para React Native.
* **Axios (v1.15.2)**: Cliente HTTP para realizar peticiones a la API RESTful.
* **React Native Async Storage**: Almacenamiento local clave-valor persistente.
* **React Native Reanimated**: Animaciones fluidas para una interfaz interactiva y moderna.

---

## ⚙️ Requisitos Previos

Antes de ejecutar la aplicación móvil, asegúrate de tener configurado lo siguiente:

1. **Backend en Ejecución:** El servidor de la API en Node.js debe estar corriendo (generalmente en `http://localhost:5000`).
2. **Expo Go instalado:** Descarga la app **Expo Go** en tu dispositivo físico desde Google Play Store o Apple App Store para probar en tu celular.
3. **Emulador (Opcional):** Si prefieres probar en tu PC, instala Android Studio para emuladores Android o Xcode para simuladores iOS (sólo macOS).

---

## 🚀 Instalación y Uso

### 1. Instalar Dependencias
Ingresa a la carpeta `app-movil` e instala los paquetes necesarios:

```bash
cd app-movil
npm install
```

### 2. Iniciar Servidor de Desarrollo
Ejecuta el comando para arrancar el servidor de Expo (puedes usar el script de npm o el comando directo de Expo CLI):

```bash
# Usando npx (Recomendado)
npx expo start
```

Esto abrirá la consola de Expo Developer y generará un **código QR** en tu terminal.

### 3. Ejecutar en Dispositivo o Emulador

* **Dispositivo Físico (Recomendado):** Abre la aplicación de cámara de tu celular (en iOS) o la app **Expo Go** (en Android) y escanea el código QR mostrado en la terminal. Asegúrate de que tanto tu PC como tu teléfono estén conectados a la **misma red Wi-Fi**.
* **Emulador Android:** Presiona la tecla `a` en la terminal donde corre Expo.
* **Simulador iOS:** Presiona la tecla `i` en la terminal.
* **Navegador Web:** Presiona la tecla `w`.

---

## 📡 Conexión con el Servidor Backend

La aplicación cuenta con detección dinámica de IP para evitar problemas de conexión al probar en diferentes entornos. Esta lógica se encuentra en [constants.js](file:///c:/Users/SENA/Desktop/Github/Test-Project/app-movil/src/utils/constants.js):

* **En Dispositivo Físico:** Expo lee automáticamente la IP local de tu computador (ej: `192.168.1.50`) y la utiliza para las llamadas a la API.
* **En Emulador Android:** Utiliza el puente `10.0.2.2` para comunicarse con el localhost de tu PC.

> [!IMPORTANT]
> Si la aplicación no carga los datos, verifica que:
> 1. Tu dispositivo móvil y tu PC estén en la misma red Wi-Fi.
> 2. Tu firewall o antivirus en Windows no esté bloqueando el puerto `5000` de la API o el puerto `8081` de Expo.

---

## 🔑 Credenciales de Prueba

Para probar el flujo de administración y cliente, puedes iniciar sesión con las siguientes credenciales una vez que el backend y sus seeders estén iniciados:

### Perfil Administrador
* **Email:** `admin@ecommerce.com`
* **Contraseña:** `admin123`

### Perfil Cliente
* **Email:** `cliente@ecommerce.com` (o registra uno nuevo desde la pantalla de Registro de la App)
* **Contraseña:** `cliente123`
