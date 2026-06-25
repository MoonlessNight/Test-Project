/**
 * ============================================
 * ADMIN CATEGORÍAS PAGE
 * ============================================
 * Gestión CRUD de categorías
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
    <div className="admin-categorias-page">
      <div className="admin-toolbar">
        <div className="admin-title">
          <h1>
            <i className="bi bi-folder"></i>
            Gestión de Categorías
          </h1>
          <p className="subtext">Administra las categorías de productos</p>
        </div>

        <div className="action-groups">
          <div className="export-actions">
            <button
              type="button"
              className={`btn ${tipoExportacion === 'pdf' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => {
                setTipoExportacion('pdf');
                exportarCategoriasAPDF(categoriasFiltradas);
              }}
            >
              <i className="bi bi-file-earmark-pdf"></i>
              Exportar a PDF
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                setTipoExportacion('excel');
                await exportarCategoriasAExcel(categoriasFiltradas);
              }}
            >
              <i className="bi bi-file-earmark-excel"></i>
              Exportar a Excel
            </button>
          </div>

          <div className="nav-actions">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/dashboard')}>
              <i className="bi bi-arrow-left"></i>
              Volver
            </button>
            <button type="button" className="btn btn-primary" onClick={() => handleShowModal()}>
              <i className="bi bi-plus-circle"></i>
              Nueva Categoría
            </button>
          </div>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <section className="admin-card">
        <div className="admin-card-header">
          <i className="bi bi-funnel"></i>
          <strong>Filtros</strong>
        </div>
        <div className="admin-card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Buscar</label>
              <div className="input-group">
                <span className="input-icon"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre o descripción..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>

            <div className="form-group form-align-end">
              <button
                type="button"
                className="btn btn-outline-secondary full-width"
                onClick={() => setFiltros({ busqueda: '', estado: 'todos' })}
              >
                <i className="bi bi-x-circle"></i>
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="text-muted small">
            Mostrando {categoriasFiltradas.length} de {categorias.length} categorías
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
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
                    <td>{cat.id}</td>
                    <td className="font-bold">{cat.nombre}</td>
                    <td>{cat.descripcion || '-'}</td>
                    <td>
                      <span className={`badge ${cat.activo ? 'badge-success' : 'badge-secondary'}`}>
                        {cat.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-center">
                      <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleShowModal(cat)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className={`btn ${cat.activo ? 'btn-outline-warning' : 'btn-outline-success'} btn-sm`}
                        onClick={() => handleToggleActivo(cat)}
                      >
                        <i className={`bi bi-${cat.activo ? 'x-circle' : 'check-circle'}`}></i>
                      </button>
                      <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(cat.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {totalPaginas > 1 && (
        <section className="admin-card pagination-card">
          <div className="admin-pagination">
            <div>
              <small className="text-muted">
                <i className="bi bi-file-text"></i>
                Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> - Mostrando <strong>{categoriasPaginadas.length}</strong> de <strong>{categoriasFiltradas.length}</strong> registros
              </small>
            </div>
            <div className="pagination-buttons">
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1} title="Primera página">
                <i className="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(prev => prev - 1)} disabled={paginaActual === 1} title="Página anterior">
                <i className="bi bi-chevron-left"></i> Anterior
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled>
                {paginaActual} / {totalPaginas}
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(prev => prev + 1)} disabled={paginaActual === totalPaginas} title="Página siguiente">
                Siguiente <i className="bi bi-chevron-right"></i>
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas} title="Última página">
                <i className="bi bi-chevron-bar-right"></i>
              </button>
            </div>
          </div>
        </section>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editando ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
              <button type="button" className="close-button" onClick={handleCloseModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    name="nombre"
                    className="form-control"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Electrónica"
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Descripción de la categoría (opcional)"
                  />
                </div>

                <div className="form-group form-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                    />
                    Categoría activa
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriasPage;
