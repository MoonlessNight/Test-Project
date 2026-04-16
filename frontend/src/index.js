/**
 * ============================================
 * ARCHIVO PRINCIPAL DE LA APLICACIÓN REACT
 * ============================================
 * Este es el punto de entrada de la aplicación React
 * Aquí se importa Bootstrap y se configura el componente principal
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

// Importar estilos de Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';

// Importar estilos personalizados de la aplicación
import './index.css';

// Importar el componente principal de la aplicación
import App from './App';

/**
 * Crear el root de React 18
 * document.getElementById('root') busca el elemento con id="root" en public/index.html
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Renderizar la aplicación
 * StrictMode removido para evitar doble renderizado en desarrollo
 */
root.render(
  <App />
);
