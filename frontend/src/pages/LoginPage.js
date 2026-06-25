/**
 * ============================================
 * LOGIN PAGE - Adaptado a la paleta del proyecto
 * ============================================
 * Página de inicio de sesión con estilos personalizados (dorados, fondos)
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tieneCarrito, setTieneCarrito] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const carritoLocal = JSON.parse(localStorage.getItem('carrito_local') || '[]');
    setTieneCarrito(carritoLocal.length > 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);

      if (response.data.usuario.rol === 'cliente') {
        navigate('/catalogo');
      } else if (response.data.usuario.rol === 'administrador' || response.data.usuario.rol === 'auxiliar') {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="login-card shadow">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="login-title">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Iniciar Sesión
                </h2>
                <p className="login-subtitle">Accede a tu cuenta</p>
              </div>

              {error && <Alert variant="danger" className="login-alert">{error}</Alert>}

              {tieneCarrito && (
                <Alert variant="success" className="login-alert-success mb-3">
                  <i className="bi bi-cart-check me-2"></i>
                  Tu carrito se sincronizará automáticamente al iniciar sesión
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="login-label">
                    <i className="bi bi-envelope me-2"></i>
                    Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="login-input"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="login-label">
                    <i className="bi bi-lock me-2"></i>
                    Contraseña
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-input"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className="login-btn w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </Form>

              <hr className="login-hr" />

              <div className="text-center">
                <p className="mb-2">¿No tienes cuenta?</p>
                <Link to="/register" className="login-link-outline">
                  <i className="bi bi-person-plus me-2"></i>
                  Crear cuenta nueva
                </Link>
              </div>

              <div className="mt-4">
                <Alert variant="info" className="login-alert-info mb-0">
                  <strong>
                    <i className="bi bi-info-circle me-2"></i>
                    Cuentas de Prueba
                  </strong>
                  <hr className="my-2" />
                  <div className="test-accounts">
                    <div className="account-item">
                      <strong className="account-role">👨‍💼 Administrador</strong>
                      <div className="account-credentials">
                        <small>📧 admin@gavat.com</small>
                        <br />
                        <small>🔑 admin123</small>
                      </div>
                    </div>
                    <div className="account-item">
                      <strong className="account-role">👨‍🔧 Auxiliar</strong>
                      <div className="account-credentials">
                        <small>📧 auxiliar@gavat.com</small>
                        <br />
                        <small>🔑 aux123</small>
                      </div>
                    </div>
                    <div className="account-item">
                      <strong className="account-role">👤 Cliente</strong>
                      <div className="account-credentials">
                        <small>📧 cliente1@gavat.com</small>
                        <br />
                        <small>🔑 cliente1</small>
                      </div>
                    </div>
                  </div>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Estilos personalizados usando variables globales */}
      <style jsx>{`
        .login-card {
          background: var(--bg, #ffffff);
          border-radius: 1.5rem;
          border: none;
          transition: var(--transition, all 0.3s ease);
          overflow: hidden;
        }
        .login-title {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: 700;
        }
        .login-subtitle {
          color: var(--bg-negativo, #192847);
          opacity: 0.8;
        }
        .login-label {
          font-weight: 600;
          color: var(--bg-negativo, #192847);
        }
        .login-input {
          border-radius: 0.75rem;
          border: 1px solid var(--gray-300, #d1d5db);
          padding: 0.625rem 1rem;
          transition: all 0.3s ease;
          background-color: var(--bg, #ffffff);
        }
        .login-input:focus {
          border-color: var(--bs-gold, #f5c271);
          box-shadow: 0 0 0 3px rgba(145, 105, 52, 0.1);
        }
        .login-btn {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          border: none;
          border-radius: 0.75rem;
          padding: 0.625rem;
          font-weight: 600;
          color: var(--fnt-black, #000000);
          transition: all 0.3s ease;
        }
        .login-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--bs-gold-dark, #c7984e), var(--bs-oldGold-bg, #916934));
          transform: translateY(-2px);
          box-shadow: 0 4px 15px 0 rgba(145, 105, 52, 0.3);
        }
        .login-btn:active {
          transform: translateY(0);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .login-link-outline {
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
        .login-link-outline:hover {
          background: var(--bs-gold, #f5c271);
          color: var(--fnt-black, #000000);
          transform: translateY(-2px);
        }
        .login-alert {
          border-radius: 0.75rem;
          background-color: #f8d7da;
          border: none;
          color: #721c24;
        }
        .login-alert-success {
          border-radius: 0.75rem;
          background-color: #d4edda;
          border: none;
          color: #155724;
        }
        .login-alert-info {
          border-radius: 0.75rem;
          background-color: #cfe2ff;
          border: none;
          color: #084298;
        }
        .login-hr {
          background-color: var(--gray-300, #d1d5db);
          opacity: 0.5;
        }
        .test-accounts {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .account-item {
          background-color: rgba(255, 255, 255, 0.5);
          border-left: 3px solid var(--bs-gold, #f5c271);
          padding: 0.75rem;
          border-radius: 0.5rem;
        }
        .account-role {
          display: block;
          color: #084298;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        .account-credentials {
          font-family: monospace;
          background-color: rgba(255, 255, 255, 0.7);
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.85rem;
          color: #084298;
        }
      `}</style>
    </Container>
  );
};

export default LoginPage;