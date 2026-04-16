/**
 * ============================================
 * ADMIN DASHBOARD PAGE
 * ============================================
 * Panel principal de administración
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminDashboardPage = () => {
  const { isAdmin, isAuxiliar } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    categorias: 0,
    subcategorias: 0,
    productos: 0,
    usuarios: 0,
    pedidos: 0,
    pedidosPendientes: 0
  });

  const loadStats = useCallback(async () => {
    try {
      // Obtener estadísticas básicas
      const [categorias, subcategorias, productos, usuarios, pedidos] = await Promise.all([
        api.get('/admin/categorias'),
        api.get('/admin/subcategorias'),
        api.get('/admin/productos'),
        api.get('/admin/usuarios'),
        api.get('/admin/pedidos')
      ]);

      // Extraer los datos de cada respuesta
      const categoriasData = categorias.data?.data?.categorias || categorias.data?.categorias || categorias.data?.data || [];
      const subcategoriasData = subcategorias.data?.data?.subcategorias || subcategorias.data?.subcategorias || subcategorias.data?.data || [];
      const productosData = productos.data?.data?.productos || productos.data?.productos || productos.data?.data || [];
      const usuariosData = usuarios.data.data?.usuarios || usuarios.data.usuarios || [];
      const pedidosData = pedidos.data.data?.pedidos || pedidos.data.pedidos || [];
      
      const pedidosPendientes = Array.isArray(pedidosData) 
        ? pedidosData.filter(p => p.estado === 'pendiente').length 
        : 0;

      setStats({
        categorias: Array.isArray(categoriasData) ? categoriasData.length : 0,
        subcategorias: Array.isArray(subcategoriasData) ? subcategoriasData.length : 0,
        productos: Array.isArray(productosData) ? productosData.length : 0,
        usuarios: usuariosData.length || 0,
        pedidos: pedidosData.length || 0,
        pedidosPendientes: pedidosPendientes
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }, []);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dashboardCards = [
    {
      title: 'Categorías',
      value: stats.categorias,
      icon: 'bi-folder',
      color: 'primary',
      link: '/admin/categorias',
      show: true
    },
    {
      title: 'Subcategorías',
      value: stats.subcategorias,
      icon: 'bi-folder2',
      color: 'info',
      link: '/admin/subcategorias',
      show: true
    },
    {
      title: 'Productos',
      value: stats.productos,
      icon: 'bi-box-seam',
      color: 'success',
      link: '/admin/productos',
      show: true
    },
    {
      title: 'Usuarios',
      value: stats.usuarios,
      icon: 'bi-people',
      color: 'warning',
      link: '/admin/usuarios',
      show: isAdmin
    },
    {
      title: 'Pedidos',
      value: stats.pedidos,
      icon: 'bi-cart-check',
      color: 'secondary',
      link: '/admin/pedidos',
      show: true
    },
    {
      title: 'Pendientes',
      value: stats.pedidosPendientes,
      icon: 'bi-clock-history',
      color: 'danger',
      link: '/admin/pedidos?estado=pendiente',
      show: true
    }
  ];

  return (
    <Container className="py-4">
      <div className="mb-5">
        <h1 className="display-5 fw-bold mb-3">
          <i className="bi bi-speedometer2 me-3" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}></i>
          Panel de Administración
        </h1>
        <p className="text-muted lead">
          Bienvenido al sistema de gestión del e-commerce
        </p>
      </div>

      <Row className="g-4">
        {dashboardCards.filter(card => card.show).map((card, index) => (
          <Col key={index} lg={4} md={6}>
            <Card 
              className="stat-card h-100 border-0"
              onClick={() => navigate(card.link)}
              style={{ 
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${
                  card.color === 'primary' ? '#667eea 0%, #764ba2 100%' :
                  card.color === 'info' ? '#06b6d4 0%, #0891b2 100%' :
                  card.color === 'success' ? '#10b981 0%, #059669 100%' :
                  card.color === 'warning' ? '#f59e0b 0%, #d97706 100%' :
                  card.color === 'secondary' ? '#6b7280 0%, #4b5563 100%' :
                  '#ef4444 0%, #dc2626 100%'
                })`,
                color: 'white'
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-1" style={{ opacity: 0.9, fontSize: '0.875rem', fontWeight: '500' }}>
                      {card.title}
                    </h6>
                    <h2 className="mb-0 fw-bold" style={{ fontSize: '2.5rem' }}>
                      {card.value}
                    </h2>
                  </div>
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '1rem',
                    borderRadius: '1rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <i className={`${card.icon} fs-1`}></i>
                  </div>
                </div>
                <div className="d-flex align-items-center" style={{ opacity: 0.9 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Ver detalles</span>
                  <i className="bi bi-arrow-right ms-2"></i>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-5 g-4">
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '0.75rem 0.75rem 0 0',
              border: 'none',
              padding: '1.25rem'
            }}>
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-lightning-fill me-2"></i>
                Accesos Rápidos
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-grid gap-3">
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/admin/productos')}
                  style={{ 
                    borderRadius: '0.75rem',
                    padding: '0.875rem',
                    fontWeight: '500',
                    borderWidth: '2px'
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Agregar Producto
                </Button>
                <Button 
                  variant="outline-success" 
                  onClick={() => navigate('/admin/categorias')}
                  style={{ 
                    borderRadius: '0.75rem',
                    padding: '0.875rem',
                    fontWeight: '500',
                    borderWidth: '2px'
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Agregar Categoría
                </Button>
                <Button 
                  variant="outline-info" 
                  onClick={() => navigate('/admin/pedidos')}
                  style={{ 
                    borderRadius: '0.75rem',
                    padding: '0.875rem',
                    fontWeight: '500',
                    borderWidth: '2px'
                  }}
                >
                  <i className="bi bi-list-check me-2"></i>
                  Gestionar Pedidos
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => navigate('/catalogo')}
                  style={{ 
                    borderRadius: '0.75rem',
                    padding: '0.875rem',
                    fontWeight: '500',
                    borderWidth: '2px'
                  }}
                >
                  <i className="bi bi-shop me-2"></i>
                  Visitar Tienda
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Información del Sistema
              </h5>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Sistema operativo correctamente
                </li>
                <li className="mb-2">
                  <i className="bi bi-database text-primary me-2"></i>
                  Base de datos conectada
                </li>
                <li className="mb-2">
                  <i className="bi bi-shield-check text-info me-2"></i>
                  Sesión de administrador activa
                </li>
                <li>
                  <i className="bi bi-clock text-secondary me-2"></i>
                  Última actualización: {new Date().toLocaleDateString('es-CO')}
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboardPage;
