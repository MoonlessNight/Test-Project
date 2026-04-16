/**
 * ============================================
 * ADMIN PRODUCTOS PAGE
 * ============================================
 * Gestión CRUD de productos
 */

import React, { useEffect, useState, useMemo, useCallback, memo, useRef } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Row, Col, Dropdown, ButtonGroup, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { exportarProductosAPDF, exportarProductosAExcel } from '../../utils/exportUtils';

// Componente memoizado para imágenes de productos
const ProductImage = memo(({ imagen, nombre }) => {
  const [imgSrc, setImgSrc] = useState(imagen || '/producto-default.jpg');
  const hasError = useRef(false);
  
  const handleImageError = useCallback(() => {
    if (!hasError.current) {
      hasError.current = true;
      setImgSrc('/producto-default.jpg');
    }
  }, []);
  
  return (
    <img
      src={imgSrc}
      alt={nombre}
      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
      className="rounded"
      onError={handleImageError}
    />
  );
});

ProductImage.displayName = 'ProductImage';

const AdminProductosPage = () => {
  const { isAdmin, isAuxiliar } = useAuth();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [tipoExportacion, setTipoExportacion] = useState('pdf');
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 25;
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoriaId: '',
    subcategoriaId: '',
    imagen: '',
    activo: true
  });
  
  // Productos filtrados
  const productosFiltrados = useMemo(() => {
    return productos.filter(prod => {
      // Filtro de búsqueda
      const coincideBusqueda = busqueda === '' || 
        prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        prod.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      
      // Filtro de categoría
      const coincideCategoria = filtroCategoria === '' || prod.categoriaId === parseInt(filtroCategoria);
      
      // Filtro de subcategoría
      const coincideSubcategoria = filtroSubcategoria === '' || prod.subcategoriaId === parseInt(filtroSubcategoria);
      
      // Filtro de precio
      const min = precioMin === '' ? 0 : parseFloat(precioMin);
      const max = precioMax === '' ? Infinity : parseFloat(precioMax);
      const coincidePrecio = prod.precio >= min && prod.precio <= max;
      
      return coincideBusqueda && coincideCategoria && coincideSubcategoria && coincidePrecio;
    }).sort((a, b) => a.id - b.id);
  }, [productos, busqueda, filtroCategoria, filtroSubcategoria, precioMin, precioMax]);

  // Cálculo de paginación
  const totalPaginas = Math.ceil(productosFiltrados.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const indiceFin = indiceInicio + ITEMS_POR_PAGINA;
  const productosPaginados = useMemo(() => {
    return productosFiltrados.slice(indiceInicio, indiceFin);
  }, [productosFiltrados, indiceInicio, indiceFin]);

  // Limpiar mensaje automáticamente
  useEffect(() => {
    if (mensaje.texto) {
      const timer = setTimeout(() => {
        setMensaje({ tipo: '', texto: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  // Resetear a página 1 cuando cambien los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroCategoria, filtroSubcategoria, precioMin, precioMax]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodResponse, catResponse, subcatResponse] = await Promise.all([
        api.get('/admin/productos?limite=1000'),
        api.get('/admin/categorias'),
        api.get('/admin/subcategorias')
      ]);
      
      const productos = prodResponse.data?.data?.productos || prodResponse.data?.productos || prodResponse.data?.data || [];
      const categorias = catResponse.data?.data?.categorias || catResponse.data?.categorias || catResponse.data?.data || [];
      const subcategorias = subcatResponse.data?.data?.subcategorias || subcatResponse.data?.subcategorias || subcatResponse.data?.data || [];
      
      // Pequeño delay para suavizar la renderización
      setTimeout(() => {
        setProductos(Array.isArray(productos) ? productos : []);
        setCategorias(Array.isArray(categorias) ? categorias : []);
        setSubcategorias(Array.isArray(subcategorias) ? subcategorias : []);
        setLoading(false);
      }, 100);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar los datos' });
      setProductos([]);
      setCategorias([]);
      setSubcategorias([]);
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShowModal = (producto = null) => {
    if (producto) {
      setEditando(producto);
      setFormData({
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: producto.precio,
        stock: producto.stock,
        categoriaId: producto.categoriaId,
        subcategoriaId: producto.subcategoriaId || '',
        imagen: producto.imagen || '',
        activo: producto.activo
      });
    } else {
      setEditando(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        categoriaId: '',
        subcategoriaId: '',
        imagen: '',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditando(null);
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      stock: '',
      categoriaId: '',
      subcategoriaId: '',
      imagen: '',
      activo: true
    });
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
      const dataToSend = {
        ...formData,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        subcategoriaId: formData.subcategoriaId || null
      };

      if (editando) {
        await api.put(`/admin/productos/${editando.id}`, dataToSend);
        setMensaje({ tipo: 'success', texto: 'Producto actualizado exitosamente' });
      } else {
        await api.post('/admin/productos', dataToSend);
        setMensaje({ tipo: 'success', texto: 'Producto creado exitosamente' });
      }
      
      handleCloseModal();
      loadData();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      setMensaje({ 
        tipo: 'danger', 
        texto: error.response?.data?.message || 'Error al guardar el producto' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      await api.delete(`/admin/productos/${id}`);
      setMensaje({ tipo: 'success', texto: 'Producto eliminado exitosamente' });
      loadData();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setMensaje({ 
        tipo: 'danger', 
        texto: error.response?.data?.message || 'Error al eliminar el producto' 
      });
    }
  };

  const handleToggleActivo = async (producto) => {
    try {
      await api.put(`/admin/productos/${producto.id}`, {
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: parseFloat(producto.precio),
        stock: parseInt(producto.stock),
        categoriaId: producto.categoriaId,
        subcategoriaId: producto.subcategoriaId || null,
        imagen: producto.imagen,
        activo: !producto.activo
      });
      
      // Actualizar el estado local sin recargar todo
      setProductos(prevProductos => 
        prevProductos.map(p => 
          p.id === producto.id ? { ...p, activo: !p.activo } : p
        )
      );
      
      setMensaje({ 
        tipo: 'success', 
        texto: `Producto ${!producto.activo ? 'activado' : 'desactivado'} exitosamente` 
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cambiar el estado' });
    }
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(precio);
  };

  // Subcategorías para el formulario (basadas en categoría seleccionada en formData)
  const subcategoriasFiltradas = useMemo(() => {
    return subcategorias.filter(sub => sub.categoriaId === parseInt(formData.categoriaId));
  }, [subcategorias, formData.categoriaId]);

  if (loading) {
    return <LoadingSpinner message="Cargando productos..." />;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            <i className="bi bi-box-seam me-2"></i>
            Gestión de Productos
          </h1>
          <p className="text-muted mb-0">
            Total: {productosFiltrados.length} de {productos.length} producto{productos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div>
          <Dropdown as={ButtonGroup} className="me-2">
            <Button 
              variant="success" 
              onClick={async () => {
                if (tipoExportacion === 'pdf') {
                  exportarProductosAPDF(productosFiltrados);
                } else {
                  await exportarProductosAExcel(productosFiltrados);
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
                  exportarProductosAPDF(productosFiltrados);
                }}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>
                Exportar a PDF
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={async () => {
                  setTipoExportacion('excel');
                  await exportarProductosAExcel(productosFiltrados);
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
            Nuevo Producto
          </Button>
        </div>
      </div>

      {mensaje.texto && (
        <Alert variant={mensaje.tipo} dismissible onClose={() => setMensaje({ tipo: '', texto: '' })}>
          {mensaje.texto}
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">
            <i className="bi bi-funnel me-2"></i>
            Filtros
          </h5>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small mb-1">Buscar</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Nombre o descripción..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small mb-1">Categoría</Form.Label>
                <Form.Select
                  value={filtroCategoria}
                  onChange={(e) => {
                    setFiltroCategoria(e.target.value);
                    setFiltroSubcategoria('');
                  }}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.filter(c => c.activo).map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small mb-1">Subcategoría</Form.Label>
                <Form.Select
                  value={filtroSubcategoria}
                  onChange={(e) => setFiltroSubcategoria(e.target.value)}
                  disabled={!filtroCategoria}
                >
                  <option value="">Todas las subcategorías</option>
                  {filtroCategoria && subcategorias
                    .filter(s => s.categoriaId === parseInt(filtroCategoria) && s.activo)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                    ))
                  }
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small mb-1">Rango de Precio</Form.Label>
                <Row className="g-2">
                  <Col xs={6}>
                    <Form.Control
                      type="number"
                      placeholder="Mínimo"
                      value={precioMin}
                      onChange={(e) => setPrecioMin(e.target.value)}
                      min="0"
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Control
                      type="number"
                      placeholder="Máximo"
                      value={precioMax}
                      onChange={(e) => setPrecioMax(e.target.value)}
                      min="0"
                    />
                  </Col>
                </Row>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setBusqueda('');
                  setFiltroCategoria('');
                  setFiltroSubcategoria('');
                  setPrecioMin('');
                  setPrecioMax('');
                  setPaginaActual(1);
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Limpiar filtros
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body className="p-0">
          <Table responsive className="mb-0" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <tr>
                <th>ID</th>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosPaginados.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  No hay productos registrados
                </td>
              </tr>
              ) : (
                productosPaginados.map((prod) => (
                  <tr key={prod.id}>
                    <td className="align-middle">{prod.id}</td>
                    <td className="align-middle">
                      <ProductImage imagen={prod.imagen} nombre={prod.nombre} />
                    </td>
                    <td className="align-middle fw-bold">{prod.nombre}</td>
                    <td className="align-middle">
                      <Badge bg="info">{prod.categoria?.nombre || 'N/A'}</Badge>
                      {prod.subcategoria && (
                        <><br /><small className="text-muted">{prod.subcategoria.nombre}</small></>
                      )}
                    </td>
                    <td className="align-middle">{formatearPrecio(prod.precio)}</td>
                    <td className="align-middle">
                      <Badge bg={prod.stock > 10 ? 'success' : prod.stock > 0 ? 'warning' : 'danger'}>
                        {prod.stock}
                      </Badge>
                    </td>
                    <td className="align-middle">
                      <Badge bg={prod.activo ? 'success' : 'secondary'}>
                        {prod.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="align-middle text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleShowModal(prod)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant={prod.activo ? 'outline-warning' : 'outline-success'}
                        size="sm"
                        className="me-1"
                        onClick={() => handleToggleActivo(prod)}
                      >
                        <i className={`bi bi-${prod.activo ? 'x-circle' : 'check-circle'}`}></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(prod.id)}
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
        <Card.Footer className="text-muted">
          <div className="d-flex justify-content-between align-items-center">
            <small>
              <i className="bi bi-file-text me-1"></i>
              Mostrando <strong>{indiceInicio + 1}-{Math.min(indiceFin, productosFiltrados.length)}</strong> de <strong>{productosFiltrados.length}</strong> producto{productosFiltrados.length !== 1 ? 's' : ''}
            </small>
            
            {/* Controles de paginación */}
            <div className="d-flex gap-2 align-items-center">
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              >
                <i className="bi bi-chevron-left"></i>
              </Button>
              
              <span className="text-nowrap">
                Página <strong>{paginaActual}</strong> de <strong>{totalPaginas || 1}</strong>
              </span>
              
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual(prev => prev + 1)}
              >
                <i className="bi bi-chevron-right"></i>
              </Button>
            </div>
          </div>
        </Card.Footer>
      </Card>

      {/* Modal para crear/editar */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editando ? 'Editar Producto' : 'Nuevo Producto'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Laptop HP"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Categoría <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="categoriaId"
                    value={formData.categoriaId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categorias.filter(c => c.activo).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Subcategoría</Form.Label>
                  <Form.Select
                    name="subcategoriaId"
                    value={formData.subcategoriaId}
                    onChange={handleChange}
                    disabled={!formData.categoriaId}
                  >
                    <option value="">Seleccionar subcategoría...</option>
                    {subcategoriasFiltradas.filter(s => s.activo).map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>URL de Imagen</Form.Label>
                  <Form.Control
                    type="text"
                    name="imagen"
                    value={formData.imagen}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción del producto (opcional)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="activo"
                label="Producto activo"
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

export default AdminProductosPage;
