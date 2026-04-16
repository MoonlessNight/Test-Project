/**
 * ============================================
 * MIS PEDIDOS PAGE
 * ============================================
 * Página para ver el historial de pedidos del cliente
 */

import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import pedidoService from '../services/pedidoService';
import LoadingSpinner from '../components/LoadingSpinner';

const MisPedidosPage = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPedidos();
  }, [isAuthenticated, navigate]);

  const loadPedidos = async () => {
    setLoading(true);
    try {
      const response = await pedidoService.getMisPedidos();
      if (response.success) {
        // El backend devuelve { success: true, data: { pedidos: [...], paginacion: {...} } }
        setPedidos(response.data.pedidos || response.data || []);
      } else {
        setMensaje({ tipo: 'danger', texto: response.message || 'Error al cargar pedidos' });
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar los pedidos' });
    } finally {
      setLoading(false);
    }
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': 'warning',
      'confirmado': 'info',
      'en_proceso': 'primary',
      'enviado': 'secondary',
      'entregado': 'success',
      'cancelado': 'danger'
    };
    return badges[estado] || 'secondary';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      'pendiente': 'Pendiente',
      'confirmado': 'Confirmado',
      'en_proceso': 'En Proceso',
      'enviado': 'Enviado',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return <LoadingSpinner message="Cargando pedidos..." />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="bi bi-box-seam me-2"></i>
          Mis Pedidos
        </h1>
        <Button variant="primary" onClick={() => navigate('/catalogo')}>
          <i className="bi bi-shop me-2"></i>
          Seguir Comprando
        </Button>
      </div>

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      {pedidos.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <i className="bi bi-inbox display-1 text-muted"></i>
            <h3 className="mt-3">No tienes pedidos aún</h3>
            <p className="text-muted">Comienza a comprar para ver tu historial de pedidos aquí</p>
            <Button variant="primary" onClick={() => navigate('/catalogo')}>
              <i className="bi bi-shop me-2"></i>
              Ir al Catálogo
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Pedido</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th className="text-end">Total</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido) => (
                  <tr key={pedido.id}>
                    <td className="align-middle">
                      <div>
                        <strong>#{pedido.id}</strong>
                        <div className="small text-muted">
                          {pedido.detalles?.length || 0} producto(s)
                        </div>
                      </div>
                    </td>
                    <td className="align-middle">
                      {formatearFecha(pedido.createdAt)}
                    </td>
                    <td className="align-middle">
                      <Badge bg={getEstadoBadge(pedido.estado)}>
                        {getEstadoTexto(pedido.estado)}
                      </Badge>
                    </td>
                    <td className="align-middle text-end">
                      <strong>{formatearPrecio(pedido.total)}</strong>
                    </td>
                    <td className="align-middle text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/pedido-confirmado/${pedido.id}`)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        Ver Detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default MisPedidosPage;
