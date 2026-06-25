/**
 * ============================================
 * REGISTER PAGE - Adaptado a la paleta del proyecto
 * ============================================
 * Página de registro de nuevos usuarios con estilos personalizados (dorados, fondos)
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, isValidPhone } from '../utils/helpers';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tieneCarrito, setTieneCarrito] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const carritoLocal = JSON.parse(localStorage.getItem('carrito_local') || '[]');
    setTieneCarrito(carritoLocal.length > 0);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError('Email inválido');
      return;
    }

    if (formData.telefono && !isValidPhone(formData.telefono)) {
      setError('Teléfono inválido (debe ser 10 dígitos iniciando con 3)');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      
      // Dar tiempo a React de actualizar el estado antes de navegar
      setTimeout(() => {
        navigate('/catalogo');
      }, 200);
    } catch (err) {
      setError(err.message || 'Error al registrarse');
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="register-card shadow">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="register-title">
                  <i className="bi bi-person-plus me-2"></i>
                  Crear Cuenta
                </h2>
                <p className="register-subtitle">Regístrate para empezar a comprar</p>
              </div>

              {error && <Alert variant="danger" className="register-alert">{error}</Alert>}

              {tieneCarrito && (
                <Alert variant="success" className="register-alert-success mb-3">
                  <i className="bi bi-cart-check me-2"></i>
                  Tu carrito se sincronizará automáticamente al crear tu cuenta
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="register-label">Nombre *</Form.Label>
                      <Form.Control
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                        className="register-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="register-label">Apellido *</Form.Label>
                      <Form.Control
                        type="text"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleChange}
                        required
                        className="register-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="register-label">Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="register-input"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="register-label">Contraseña *</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="register-input"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="register-label">Confirmar Contraseña *</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="register-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="register-label">Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefono"
                    placeholder="3001234567"
                    value={formData.telefono}
                    onChange={handleChange}
                    maxLength="10"
                    className="register-input"
                  />
                  <Form.Text className="register-hint">
                    10 dígitos, iniciando con 3
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="register-label">Dirección</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="direccion"
                    placeholder="Calle 123 #45-67"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="register-input"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="register-btn w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Crear Cuenta
                    </>
                  )}
                </Button>
              </Form>

              <hr className="register-hr" />

              <div className="text-center">
                <p className="mb-2">¿Ya tienes cuenta?</p>
                <Link to="/login" className="register-link-outline">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Iniciar Sesión
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Estilos personalizados usando variables globales */}
      <style jsx>{`
        .register-card {
          background: var(--bg, #ffffff);
          border-radius: 1.5rem;
          border: none;
          transition: var(--transition, all 0.3s ease);
          overflow: hidden;
        }
        .register-title {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .register-subtitle {
          color: var(--bg-negativo, #192847);
          opacity: 0.8;
        }
        .register-label {
          font-weight: 600;
          color: var(--bg-negativo, #192847);
        }
        .register-input {
          border-radius: 0.75rem;
          border: 1px solid var(--gray-300, #d1d5db);
          padding: 0.625rem 1rem;
          transition: all 0.3s ease;
          background-color: var(--bg, #ffffff);
        }
        .register-input:focus {
          border-color: var(--bs-gold, #f5c271);
          box-shadow: 0 0 0 3px rgba(145, 105, 52, 0.1);
        }
        .register-hint {
          color: var(--gray-600, #4b5563);
          font-size: 0.75rem;
        }
        .register-btn {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          border: none;
          border-radius: 0.75rem;
          padding: 0.625rem;
          font-weight: 600;
          color: var(--fnt-black, #000000);
          transition: all 0.3s ease;
        }
        .register-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--bs-gold-dark, #c7984e), var(--bs-oldGold-bg, #916934));
          transform: translateY(-2px);
          box-shadow: 0 4px 15px 0 rgba(145, 105, 52, 0.3);
        }
        .register-btn:active {
          transform: translateY(0);
        }
        .register-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .register-link-outline {
          display: inline-block;
          width: 100%;
          text-align: center;
          background: transparent;
          border: 2px solid var(--bs-gold, #f5c271);
          color: var(--bs-gold-dark, #c7984e);
          border-radius: 0.75rem;
          padding: 0.625rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .register-link-outline:hover {
          background: var(--bs-gold, #f5c271);
          color: var(--fnt-black, #000000);
          transform: translateY(-2px);
        }
        .register-alert {
          border-radius: 0.75rem;
          background-color: #f8d7da;
          border: none;
          color: #721c24;
        }
        .register-alert-success {
          border-radius: 0.75rem;
          background-color: #d4edda;
          border: none;
          color: #155724;
        }
        .register-hr {
          background-color: var(--gray-300, #d1d5db);
          opacity: 0.5;
        }
      `}</style>
    </Container>
  );
};

export default RegisterPage;