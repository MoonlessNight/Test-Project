/**
 * ============================================
 * ADMIN DASHBOARD PAGE
 * ============================================
 * Panel principal de administración
 */

import React, { useEffect, useState, useCallback } from 'react';
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
    pedidosPendientes: 0,
    facturas: 0,
    comentarios: 0
  });

  const loadStats = useCallback(async () => {
    try {
      // Obtener estadísticas básicas - Manejar errores individuales
      const results = await Promise.allSettled([
        api.get('/admin/categorias'),
        api.get('/admin/subcategorias'),
        api.get('/admin/productos'),
        api.get('/admin/usuarios'),
        api.get('/admin/pedidos'),
        api.get('/admin/facturas'),
        api.get('/admin/comentarios')
      ]);

      // Extraer datos de cada respuesta, ignorando los 403
      const extractData = (result, index) => {
        if (result.status === 'rejected') {
          // Si falla por 403 (no autorizado), retornar array vacío
          if (result.reason?.response?.status === 403) {
            return [];
          }
          console.error(`Error en request ${index}:`, result.reason);
          return [];
        }
        return result.value.data || [];
      };

      const [categorias, subcategorias, productos, usuarios, pedidos, facturas, comentarios] = results;

      // Extraer los datos de cada respuesta
      const getCategorias = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.data?.categorias) return data.data.categorias;
        if (data?.categorias) return data.categorias;
        if (data?.data) return data.data;
        return [];
      };

      const getSubcategorias = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.data?.subcategorias) return data.data.subcategorias;
        if (data?.subcategorias) return data.subcategorias;
        if (data?.data) return data.data;
        return [];
      };

      const getProductos = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.data?.productos) return data.data.productos;
        if (data?.productos) return data.productos;
        if (data?.data) return data.data;
        return [];
      };

      const getUsuarios = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.data?.usuarios) return data.data.usuarios;
        if (data?.usuarios) return data.usuarios;
        if (data?.data) return data.data;
        return [];
      };

      const getPedidos = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.data?.pedidos) return data.data.pedidos;
        if (data?.pedidos) return data.pedidos;
        if (data?.data) return data.data;
        return [];
      };

      const getFacturas = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.data?.facturas) return data.data.facturas;
        if (data?.facturas) return data.facturas;
        if (data?.data) return data.data;
        return [];
      };

      const getComentarios = (data) => {
        if (Array.isArray(data)) return data;
        if (data?.data?.comentarios) return data.data.comentarios;
        if (data?.comentarios) return data.comentarios;
        if (data?.data) return data.data;
        return [];
      };

      const categoriasData = getCategorias(extractData(categorias, 0));
      const subcategoriasData = getSubcategorias(extractData(subcategorias, 1));
      const productosData = getProductos(extractData(productos, 2));
      const usuariosData = getUsuarios(extractData(usuarios, 3));
      const pedidosData = getPedidos(extractData(pedidos, 4));
      const facturasData = getFacturas(extractData(facturas, 5));
      const comentariosData = getComentarios(extractData(comentarios, 6));
      
      console.log('Datos extraídos:', { categoriasData, subcategoriasData, productosData, usuariosData, pedidosData, facturasData, comentariosData });
      
      const pedidosPendientes = Array.isArray(pedidosData) 
        ? pedidosData.filter(p => p.estado === 'pendiente').length 
        : 0;

      setStats({
        categorias: Array.isArray(categoriasData) ? categoriasData.length : 0,
        subcategorias: Array.isArray(subcategoriasData) ? subcategoriasData.length : 0,
        productos: Array.isArray(productosData) ? productosData.length : 0,
        usuarios: Array.isArray(usuariosData) ? usuariosData.length : 0,
        pedidos: Array.isArray(pedidosData) ? pedidosData.length : 0,
        pedidosPendientes: pedidosPendientes,
        facturas: Array.isArray(facturasData) ? facturasData.length : 0,
        comentarios: Array.isArray(comentariosData) ? comentariosData.length : 0
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
    },
    {
      title: 'Facturas',
      value: stats.facturas,
      icon: 'bi-file-earmark-pdf',
      color: 'info',
      link: '/admin/facturas',
      show: isAdmin || isAuxiliar
    },
    {
      title: 'Comentarios',
      value: stats.comentarios,
      icon: 'bi-chat-dots',
      color: 'success',
      link: '/admin/comentarios',
      show: true
    }
  ];

  return (
    <div className="admin-dashboard-page">
      <div className="page-header">
        <h1 className="page-title">
          <i className="bi bi-speedometer2 page-title-icon"></i>
          Panel de Administración
        </h1>
        <p className="page-subtitle text-muted">
          Bienvenido al sistema de gestión del e-commerce
        </p>
      </div>

      <div className="dashboard-grid">
        {dashboardCards.filter(card => card.show).map((card) => (
          <div key={card.link} className="dashboard-card" onClick={() => navigate(card.link)}>
            <div className={`dashboard-card-top dashboard-card-${card.color}`}>
              <div>
                <h6>{card.title}</h6>
                <h2>{card.value}</h2>
              </div>
              <div className="dashboard-card-icon">
                <i className={`${card.icon} fs-1`}></i>
              </div>
            </div>
            <div className="dashboard-card-footer">
              <span>Ver detalles</span>
              <i className="bi bi-arrow-right"></i>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-panel">
          <div className="admin-panel-header admin-panel-header-dark">
            <h5>
              <i className="bi bi-lightning-fill"></i>
              Accesos Rápidos
            </h5>
          </div>
          <div className="admin-panel-body">
            <div className="button-grid">
              <button type="button" className="btn btn-dark btn-lg" onClick={() => navigate('/admin/productos')}>
                <i className="bi bi-plus-circle"></i>
                Agregar Producto
              </button>
              <button type="button" className="btn btn-dark btn-lg" onClick={() => navigate('/admin/categorias')}>
                <i className="bi bi-plus-circle"></i>
                Agregar Categoría
              </button>
              <button type="button" className="btn btn-dark btn-lg" onClick={() => navigate('/admin/pedidos')}>
                <i className="bi bi-list-check"></i>
                Gestionar Pedidos
              </button>
              <button type="button" className="btn btn-dark btn-lg" onClick={() => navigate('/catalogo')}>
                <i className="bi bi-shop"></i>
                Visitar Tienda
              </button>
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h5>
              <i className="bi bi-info-circle"></i>
              Información del Sistema
            </h5>
          </div>
          <div className="admin-panel-body">
            <ul className="info-list">
              <li>
                <i className="bi bi-check-circle text-success"></i>
                Sistema operativo correctamente
              </li>
              <li>
                <i className="bi bi-database text-primary"></i>
                Base de datos conectada
              </li>
              <li>
                <i className="bi bi-shield-check text-info"></i>
                Sesión de administrador activa
              </li>
              <li>
                <i className="bi bi-clock text-secondary"></i>
                Última actualización: {new Date().toLocaleDateString('es-CO')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
