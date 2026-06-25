/**
 * ============================================
 * NAVBAR COMPONENT - Adaptado a la paleta del proyecto
 * ============================================
 * Barra de navegación principal con menú responsive y colores personalizados
 */

import React, { memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const NavigationBar = memo(() => {
  const { user, isAuthenticated, isAdmin, isAuxiliar, isCliente, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <Navbar expand="lg" sticky="top" className="custom-navbar shadow-sm">
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand-logo d-flex align-items-center">
  <img 
    src="/gavat.png" 
    alt="GAVAT" 
    style={{ height: '40px', marginRight: '10px' }}
  />
  <span>GAVAT</span>
</Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="nav-link-custom">Inicio</Nav.Link>
            <Nav.Link as={Link} to="/catalogo" className="nav-link-custom">Catálogo</Nav.Link>
            
            {(isAdmin || isAuxiliar) && (
              <NavDropdown title="Administración" id="admin-dropdown" className="nav-dropdown-custom">
                <NavDropdown.Item as={Link} to="/admin/dashboard">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/admin/categorias">
                  Categorías
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/subcategorias">
                  Subcategorías
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/productos">
                  Productos
                </NavDropdown.Item>
                {(isAdmin || isAuxiliar) && (
                  <>
                    <NavDropdown.Divider />
                    {isAdmin && (
                      <NavDropdown.Item as={Link} to="/admin/usuarios">
                        Usuarios
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Item as={Link} to="/admin/facturas">
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      Facturas
                    </NavDropdown.Item>
                  </>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/admin/pedidos">
                  Pedidos
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/comentarios">
                  <i className="bi bi-chat-dots me-2"></i>
                  Comentarios
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

          <Nav>
            <Nav.Link as={Link} to="/carrito" className="nav-link-custom">
              <i className="bi bi-cart3 me-1"></i>
              Carrito
            </Nav.Link>

            {isAuthenticated ? (
              <>
                {isCliente && (
                  <Nav.Link as={Link} to="/mis-pedidos" className="nav-link-custom">
                    <i className="bi bi-box-seam me-1"></i>
                    Mis Pedidos
                  </Nav.Link>
                )}
                
                {(isAdmin || isAuxiliar) && (
                  <>
                    <Nav.Link as={Link} to="/catalogo" className="nav-link-custom text-gold">
                      <i className="bi bi-shop me-1"></i>
                      Ver Tienda
                    </Nav.Link>
                    <Nav.Link as={Link} to="/admin/mis-pedidos" className="nav-link-custom text-gold">
                      <i className="bi bi-box-seam me-1"></i>
                      Mis Pedidos
                    </Nav.Link>
                  </>
                )}
                
                <NavDropdown
                  title={
                    <>
                      <i className="bi bi-person-circle me-1"></i>
                      {user?.nombre}
                    </>
                  }
                  id="user-dropdown"
                  align="end"
                  className="nav-dropdown-custom"
                >
                  <NavDropdown.Item as={Link} to="/perfil">
                    Mi Perfil
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Cerrar Sesión
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="nav-link-custom">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Iniciar Sesión
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="nav-link-custom">
                  <i className="bi bi-person-plus me-1"></i>
                  Registrarse
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>

      {/* Estilos personalizados usando las variables globales del proyecto */}
      <style jsx>{`
        .custom-navbar {
          background-color: var(--bg-negativo, #192847);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.75rem 0;
        }
        .brand-logo {
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--fnt-light, #ffffff);
          text-decoration: none;
        }
        .brand-logo i {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .brand-logo span {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .nav-link-custom {
          color: var(--fnt-light, #ffffff) !important;
          font-weight: 500;
          padding: 0.5rem 1rem !important;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
          margin: 0 0.25rem;
        }
        .nav-link-custom:hover {
          color: var(--fnt-light, #ffffff) !important;
          background-color: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }
        .text-gold {
          color: var(--bs-gold, #f5c271) !important;
        }
        /* Dropdown personalizado */
        :global(.nav-dropdown-custom .dropdown-menu) {
          border: none;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-radius: 0.75rem;
          padding: 0.5rem;
          margin-top: 0.5rem;
        }
        :global(.nav-dropdown-custom .dropdown-item) {
          border-radius: 0.5rem;
          padding: 0.625rem 1rem;
          transition: all 0.2s ease;
        }
        :global(.nav-dropdown-custom .dropdown-item:hover) {
          background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e));
          color: var(--fnt-black, #000000);
        }
        /* Toggler button */
        :global(.navbar-toggler) {
          border: none;
          padding: 0.5rem;
        }
        :global(.navbar-toggler:focus) {
          box-shadow: none;
        }
      `}</style>
    </Navbar>
  );
});

NavigationBar.displayName = 'NavigationBar';

export default NavigationBar;