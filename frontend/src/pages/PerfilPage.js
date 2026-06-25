/**
 * ============================================
 * PÁGINA DE PERFIL DEL USUARIO
 * ============================================
 * Muestra la información del usuario autenticado
 * Adaptada a cada tipo de rol: Cliente, Auxiliar, Administrador
 */

import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './PerfilPage.css';

const PerfilPage = () => {
  const { user, isAdmin, isAuxiliar, isCliente, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    telefono: user?.telefono || '',
    direccion: user?.direccion || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(formData);
      setSuccess('Perfil actualizado exitosamente');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const getRolBadgeColor = () => {
    if (isAdmin) return 'danger';
    if (isAuxiliar) return 'warning';
    return 'info';
  };

  const getRolLabel = () => {
    if (isAdmin) return 'Administrador';
    if (isAuxiliar) return 'Auxiliar';
    return 'Cliente';
  };

  const getProfileIcon = () => {
    if (isAdmin) return '👨‍💼';
    if (isAuxiliar) return '👤';
    return '👨‍💻';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container className="perfil-page py-5">
      <Row className="mb-4">
        <Col xs={12} md={8} className="mx-auto">
          {/* Encabezado con avatar */}
          <div className="perfil-header mb-4">
            <div className="perfil-avatar">
              <span className="avatar-icon">{getProfileIcon()}</span>
            </div>
            <div className="perfil-header-info">
              <h1 className="perfil-nombre">{user?.nombre || 'Usuario'}</h1>
              <span className={`badge bg-${getRolBadgeColor()} perfil-rol`}>
                {getRolLabel()}
              </span>
            </div>
          </div>

          {/* Alertas */}
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Tarjeta de información */}
          <Card className="perfil-card shadow-sm">
            <Card.Body className="p-4">
              <div className="perfil-info">
                
                {/* Sección Email */}
                <div className="perfil-item">
                  <div className="perfil-item-icon">
                    <i className="bi bi-envelope"></i>
                  </div>
                  <div className="perfil-item-content">
                    <label className="perfil-item-label">Correo Electrónico</label>
                    <p className="perfil-item-value">{user?.email}</p>
                  </div>
                </div>

                {/* Sección Nombre */}
                {!isEditing ? (
                  <div className="perfil-item">
                    <div className="perfil-item-icon">
                      <i className="bi bi-person"></i>
                    </div>
                    <div className="perfil-item-content">
                      <label className="perfil-item-label">Nombre Completo</label>
                      <p className="perfil-item-value">{user?.nombre || 'No especificado'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="perfil-item">
                    <div className="perfil-item-icon">
                      <i className="bi bi-person"></i>
                    </div>
                    <div className="perfil-item-content w-100">
                      <label className="perfil-item-label">Nombre Completo</label>
                      <Form.Control
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        placeholder="Ingresa tu nombre"
                      />
                    </div>
                  </div>
                )}

                {/* Sección Teléfono */}
                {!isEditing ? (
                  <div className="perfil-item">
                    <div className="perfil-item-icon">
                      <i className="bi bi-telephone"></i>
                    </div>
                    <div className="perfil-item-content">
                      <label className="perfil-item-label">Teléfono</label>
                      <p className="perfil-item-value">{user?.telefono || 'No especificado'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="perfil-item">
                    <div className="perfil-item-icon">
                      <i className="bi bi-telephone"></i>
                    </div>
                    <div className="perfil-item-content w-100">
                      <label className="perfil-item-label">Teléfono</label>
                      <Form.Control
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        placeholder="Ingresa tu teléfono"
                      />
                    </div>
                  </div>
                )}

                {/* Sección Dirección - Solo para Clientes */}
                {isCliente && (
                  <>
                    {!isEditing ? (
                      <div className="perfil-item">
                        <div className="perfil-item-icon">
                          <i className="bi bi-geo-alt"></i>
                        </div>
                        <div className="perfil-item-content">
                          <label className="perfil-item-label">Dirección de Envío</label>
                          <p className="perfil-item-value">{user?.direccion || 'No especificada'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="perfil-item">
                        <div className="perfil-item-icon">
                          <i className="bi bi-geo-alt"></i>
                        </div>
                        <div className="perfil-item-content w-100">
                          <label className="perfil-item-label">Dirección de Envío</label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleInputChange}
                            placeholder="Ingresa tu dirección"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Sección Rol */}
                <div className="perfil-item">
                  <div className="perfil-item-icon">
                    <i className="bi bi-shield"></i>
                  </div>
                  <div className="perfil-item-content">
                    <label className="perfil-item-label">Rol</label>
                    <p className="perfil-item-value">
                      <span className={`badge bg-${getRolBadgeColor()}`}>
                        {getRolLabel()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Sección Fecha de Registro */}
                <div className="perfil-item">
                  <div className="perfil-item-icon">
                    <i className="bi bi-calendar"></i>
                  </div>
                  <div className="perfil-item-content">
                    <label className="perfil-item-label">Miembro desde</label>
                    <p className="perfil-item-value">{formatDate(user?.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="perfil-actions mt-4">
                {!isEditing ? (
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="w-100 perfil-btn-edit"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <div className="d-grid gap-2 d-md-flex">
                      <Button 
                        variant="success" 
                        size="lg"
                        className="flex-grow-1"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        <i className="bi bi-check me-2"></i>
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="lg"
                        className="flex-grow-1"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            nombre: user?.nombre || '',
                            telefono: user?.telefono || '',
                            direccion: user?.direccion || '',
                          });
                        }}
                        disabled={loading}
                      >
                        <i className="bi bi-x me-2"></i>
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Información adicional por rol */}
          {isAdmin && (
            <Card className="perfil-card-info mt-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">
                  <i className="bi bi-lock-fill me-2"></i>
                  Permisos de Administrador
                </h5>
                <ul className="perfil-permissions">
                  <li>
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    Acceso total al panel de administración
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    Gestión de usuarios, categorías y productos
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    Generación de facturas y reportes
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    Moderación de comentarios
                  </li>
                </ul>
              </Card.Body>
            </Card>
          )}

          {isAuxiliar && (
            <Card className="perfil-card-info mt-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">
                  <i className="bi bi-info-circle-fill me-2"></i>
                  Permisos de Auxiliar
                </h5>
                <ul className="perfil-permissions">
                  <li>
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    Acceso limitado al panel de administración
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    Gestión de categorías, subcategorías y productos
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    Visualización de pedidos y facturas
                  </li>
                </ul>
              </Card.Body>
            </Card>
          )}

          {isCliente && (
            <Card className="perfil-card-info mt-4 shadow-sm">
              <Card.Body>
                <h5 className="mb-3">
                  <i className="bi bi-bag-check-fill me-2"></i>
                  Mi Actividad
                </h5>
                <ul className="perfil-permissions">
                  <li>
                    <i className="bi bi-cart-check me-2"></i>
                    Compra productos en nuestro catálogo
                  </li>
                  <li>
                    <i className="bi bi-box-seam me-2"></i>
                    Visualiza tus pedidos en "Mis Pedidos"
                  </li>
                  <li>
                    <i className="bi bi-chat-left-dots me-2"></i>
                    Deja comentarios en los productos
                  </li>
                </ul>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PerfilPage;
