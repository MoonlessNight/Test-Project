/**
 * ============================================
 * PEDIDO CONFIRMADO PAGE
 * ============================================
 * Página de confirmación después de realizar un pedido
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Alert, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import pedidoService from '../services/pedidoService';
import LoadingSpinner from '../components/LoadingSpinner';

const PedidoConfirmadoPage = () => {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPedido();
  }, [id, isAuthenticated, navigate]);

  const loadPedido = async () => {
    setLoading(true);
    try {
      const response = await pedidoService.getPedidoById(id);
      if (response.success && response.data) {
        setPedido(response.data.pedido || response.data);
      } else {
        setMensaje({ tipo: 'danger', texto: response.message || 'Error al cargar el pedido' });
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      setMensaje({ tipo: 'danger', texto: error.message || 'Error al cargar el pedido' });
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
      month: 'long',
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

  const handleImprimir = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner message="Cargando información del pedido..." />;
  }

  if (!pedido) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          No se pudo cargar la información del pedido
        </Alert>
        <Button onClick={() => navigate('/mis-pedidos')}>Ver Mis Pedidos</Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Encabezado de confirmación */}
      <Card className="mb-4 border-success">
        <Card.Body className="text-center py-5">
          <div className="mb-3">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
          </div>
          <h1 className="text-success mb-3">¡Pedido Confirmado!</h1>
          <p className="lead mb-4">
            Tu pedido ha sido recibido exitosamente y está siendo procesado.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <div className="text-start">
              <small className="text-muted d-block">Número de Pedido</small>
              <strong className="fs-4">#{pedido.id}</strong>
            </div>
            <div className="text-start">
              <small className="text-muted d-block">Fecha</small>
              <strong>{formatearFecha(pedido.createdAt)}</strong>
            </div>
            <div className="text-start">
              <small className="text-muted d-block">Estado</small>
              <span className={`badge bg-${getEstadoBadge(pedido.estado)} fs-6`}>
                {getEstadoTexto(pedido.estado)}
              </span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      <Row>
        {/* Información del pedido */}
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-box-seam me-2"></i>
                Productos del Pedido
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Producto</th>
                    <th className="text-center">Precio</th>
                    <th className="text-center">Cantidad</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.detalles && pedido.detalles.map((detalle) => (
                    <tr key={detalle.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={detalle.producto?.imagen || '/producto-default.jpg'}
                            alt={detalle.producto?.nombre}
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            className="rounded me-3"
                            onError={(e) => {
                              e.target.src = '/producto-default.jpg';
                            }}
                          />
                          <div>
                            <div className="fw-bold">{detalle.producto?.nombre}</div>
                            {detalle.producto?.categoria && (
                              <small className="text-muted">
                                {detalle.producto.categoria.nombre}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center align-middle">
                        {formatearPrecio(detalle.precioUnitario)}
                      </td>
                      <td className="text-center align-middle">
                        {detalle.cantidad}
                      </td>
                      <td className="text-end align-middle fw-bold">
                        {formatearPrecio(detalle.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                <i className="bi bi-truck me-2"></i>
                Información de Envío
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6 className="text-muted mb-2">Dirección de Entrega</h6>
                  <p className="mb-0">{pedido.direccionEnvio}</p>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted mb-2">Teléfono de Contacto</h6>
                  <p className="mb-0">{pedido.telefono}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Resumen del pedido */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Resumen del Pedido</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush" className="mb-3">
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Subtotal:</span>
                  <span>{formatearPrecio(pedido.total)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <span>Envío:</span>
                  <span className="text-success">Gratis</span>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 d-flex justify-content-between">
                  <strong className="fs-5">Total:</strong>
                  <strong className="text-primary fs-4">{formatearPrecio(pedido.total)}</strong>
                </ListGroup.Item>
              </ListGroup>

              <div className="alert alert-info mb-3">
                <i className="bi bi-info-circle me-2"></i>
                <small>
                  Recibirás un correo de confirmación con los detalles de tu pedido.
                </small>
              </div>

              <div className="d-grid gap-2">
                <Button
                  variant="primary"
                  onClick={() => navigate('/mis-pedidos')}
                >
                  <i className="bi bi-list-ul me-2"></i>
                  Ver Mis Pedidos
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={handleImprimir}
                >
                  <i className="bi bi-printer me-2"></i>
                  Imprimir Comprobante
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => navigate('/catalogo')}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Seguir Comprando
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PedidoConfirmadoPage;
