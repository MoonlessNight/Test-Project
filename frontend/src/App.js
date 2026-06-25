/**
 * ============================================
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN
 * ============================================
 * Configuración de rutas y contexto global
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas públicas
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogoPage from './pages/CatalogoPage';
import ProductoDetallePage from './pages/ProductoDetallePage';
import CarritoPage from './pages/CarritoPage';
import CheckoutPage from './pages/CheckoutPage';
import PedidoConfirmadoPage from './pages/PedidoConfirmadoPage';
import MisPedidosPage from './pages/MisPedidosPage';
import PerfilPage from './pages/PerfilPage';

// Páginas de administración
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCategoriasPage from './pages/admin/AdminCategoriasPage';
import AdminSubcategoriasPage from './pages/admin/AdminSubcategoriasPage';
import AdminProductosPage from './pages/admin/AdminProductosPage';
import AdminFacturasPage from './pages/admin/AdminFacturasPage';
import AdminComentariosPage from './pages/admin/AdminComentariosPage';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import AdminPedidosPage from './pages/AdminPedidosPage';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        
        <main className="flex-grow-1">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/producto/:id" element={<ProductoDetallePage />} />
            <Route path="/carrito" element={<CarritoPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/pedido-confirmado/:id" element={<PedidoConfirmadoPage />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
            <Route path="/perfil" element={
              <ProtectedRoute>
                <PerfilPage />
              </ProtectedRoute>
            } />
            
            {/* Rutas de administración - PROTEGIDAS */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/categorias" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminCategoriasPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/subcategorias" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminSubcategoriasPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/productos" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminProductosPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/mis-pedidos" element={
              <ProtectedRoute requireAdmin={true}>
                <MisPedidosPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/facturas" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminFacturasPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/comentarios" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminComentariosPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUsuariosPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/pedidos" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPedidosPage />
              </ProtectedRoute>
            } />
            
            {/* Ruta por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
