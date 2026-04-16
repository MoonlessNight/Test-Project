/**
 * ============================================
 * ADMIN CATEGORÍAS PAGE
 * ============================================
 * Gestión CRUD de categorías
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Dropdown, ButtonGroup, Row, Col, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { exportarCategoriasAPDF, exportarCategoriasAExcel } from '../../utils/exportUtils';

const AdminCategoriasPage = () => {
  useAuth();
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos'
  });
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  });
  
  const [tipoExportacion, setTipoExportacion] = useState('pdf');
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 25;
  
  // Categorías filtradas y paginadas
  const categoriasFiltradas = useMemo(() => {
    return categorias.filter(cat => {
      // Filtro por búsqueda
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const coincide = cat.nombre.toLowerCase().includes(busqueda) ||
                        (cat.descripcion && cat.descripcion.toLowerCase().includes(busqueda));
        if (!coincide) return false;
      }
      
      // Filtro por estado
      if (filtros.estado !== 'todos') {
        if (filtros.estado === 'activos' && !cat.activo) return false;
        if (filtros.estado === 'inactivos' && cat.activo) return false;
      }
      
      return true;
    });
  }, [categorias, filtros.busqueda, filtros.estado]);
  
  // Aplicar paginación
  const totalPaginas = Math.ceil(categoriasFiltradas.length / registrosPorPagina);
  const categoriasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    return categoriasFiltradas.slice(inicio, fin);
  }, [categoriasFiltradas, paginaActual, registrosPorPagina]);
  
  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtros.busqueda, filtros.estado]);

  const loadCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/categorias');
      
      // El backend devuelve { success: true, count: X, data: { categorias: [...] } }
      const categorias = response.data?.data?.categorias || response.data?.categorias || response.data?.data || [];
      
      setCategorias(Array.isArray(categorias) ? categorias : []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar las categorías' });
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShowModal = (categoria = null) => {
    if (categoria) {
      setEditando(categoria);
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        activo: categoria.activo
      });
    } else {
      setEditando(null);
      setFormData({
        nombre: '',
        descripcion: '',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditando(null);
    setFormData({ nombre: '', descripcion: '', activo: true });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editando) {
        await api.put(`/admin/categorias/${editando.id}`, formData);
        setMensaje({ tipo: 'success', texto: 'Categoría actualizada exitosamente' });
      } else {
        await api.post('/admin/categorias', formData);
        setMensaje({ tipo: 'success', texto: 'Categoría creada exitosamente' });
      }
      
      handleCloseModal();
      loadCategorias();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      setMensaje({ 
        tipo: 'danger', 
        texto: error.response?.data?.message || 'Error al guardar la categoría' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
    
    try {
      await api.delete(`/admin/categorias/${id}`);
      setMensaje({ tipo: 'success', texto: 'Categoría eliminada exitosamente' });
      loadCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      setMensaje({ 
        tipo: 'danger', 
        texto: error.response?.data?.message || 'Error al eliminar la categoría' 
      });
    }
  };

  const handleToggleActivo = async (categoria) => {
    try {
      await api.put(`/admin/categorias/${categoria.id}`, {
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        activo: !categoria.activo
      });
      
      setMensaje({ 
        tipo: 'success', 
        texto: `Categoría ${!categoria.activo ? 'activada' : 'desactivada'} exitosamente` 
      });
      
      // Recargar categorías
      await loadCategorias();
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cambiar el estado' });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando categorías..." />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            <i className="bi bi-folder me-2"></i>
            Gestión de Categorías
          </h1>
          <p className="text-muted mb-0">Administra las categorías de productos</p>
        </div>
        <div>
          <Dropdown as={ButtonGroup} className="me-2">
            <Button 
              variant="success" 
              onClick={async () => {
                if (tipoExportacion === 'pdf') {
                  exportarCategoriasAPDF(categoriasFiltradas);
                } else {
                  await exportarCategoriasAExcel(categoriasFiltradas);
                }
              }}
            >
              <i className={`bi bi-file-earmark-${tipoExportacion === 'pdf' ? 'pdf' : 'excel'} me-1`}></i>
              Exportar a {tipoExportacion === 'pdf' ? 'PDF' : 'Excel'}
            </Button>
            <Dropdown.Toggle split variant="success" />
            <Dropdown.Menu>
              <Dropdown.Item 
                onClick={() => {
                  setTipoExportacion('pdf');
                  exportarCategoriasAPDF(categoriasFiltradas);
                }}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Exportar a PDF
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={async () => {
                  setTipoExportacion('excel');
                  await exportarCategoriasAExcel(categoriasFiltradas);
                }}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>
                Exportar a Excel
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          <Button variant="outline-secondary" onClick={() => navigate('/admin/dashboard')} className="me-2">
            <i className="bi bi-arrow-left me-1"></i>
            Volver
          </Button>
          <Button variant="primary" onClick={() => handleShowModal()}>
            <i className="bi bi-plus-circle me-1"></i>
            Nueva Categoría
          </Button>
        </div>
      </div>

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-3">
        <Card.Header className="bg-light">
          <i className="bi bi-funnel me-2"></i>
          <strong>Filtros</strong>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Buscar</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o descripción..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                >
                  <option value="todos">Todos</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => setFiltros({ busqueda: '', estado: 'todos' })}
                className="w-100"
              >
                <i className="bi bi-x-circle me-1"></i>
                Limpiar filtros
              </Button>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col>
              <small className="text-muted">
                Mostrando {categoriasFiltradas.length} de {categorias.length} categorías
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    {categorias.length === 0 ? 'No hay categorías registradas' : 'No se encontraron categorías con los filtros aplicados'}
                  </td>
                </tr>
              ) : (
                categoriasPaginadas.map((cat) => (
                  <tr key={cat.id}>
                    <td className="align-middle">{cat.id}</td>
                    <td className="align-middle fw-bold">{cat.nombre}</td>
                    <td className="align-middle">{cat.descripcion || '-'}</td>
                    <td className="align-middle">
                      <Badge bg={cat.activo ? 'success' : 'secondary'}>
                        {cat.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="align-middle text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleShowModal(cat)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant={cat.activo ? 'outline-warning' : 'outline-success'}
                        size="sm"
                        className="me-1"
                        onClick={() => handleToggleActivo(cat)}
                      >
                        <i className={`bi bi-${cat.activo ? 'x-circle' : 'check-circle'}`}></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(cat.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      {/* Paginación */}
      {totalPaginas > 1 && (
        <Card className="mt-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">
                  <i className="bi bi-file-text me-1"></i>
                  Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> - Mostrando <strong>{categoriasPaginadas.length}</strong> de <strong>{categoriasFiltradas.length}</strong> registros
                </small>
              </div>
              <div className="btn-group">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                  title="Primera página"
                >
                  <i className="bi bi-chevron-bar-left"></i>
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setPaginaActual(prev => prev - 1)}
                  disabled={paginaActual === 1}
                  title="Página anterior"
                >
                  <i className="bi bi-chevron-left me-1"></i> Anterior
                </Button>
                <Button variant="primary" size="sm" disabled>
                  {paginaActual} / {totalPaginas}
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setPaginaActual(prev => prev + 1)}
                  disabled={paginaActual === totalPaginas}
                  title="Página siguiente"
                >
                  Siguiente <i className="bi bi-chevron-right ms-1"></i>
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                  title="Última página"
                >
                  <i className="bi bi-chevron-bar-right"></i>
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Modal para crear/editar */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editando ? 'Editar Categoría' : 'Nueva Categoría'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Electrónica"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción de la categoría (opcional)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="activo"
                label="Categoría activa"
                checked={formData.activo}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editando ? 'Actualizar' : 'Crear'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminCategoriasPage;
