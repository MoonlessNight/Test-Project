/**
 * ============================================
 * ADMIN COMENTARIOS PAGE
 * ============================================
 * Gestión y moderación de comentarios de productos
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import comentariosService from '../../services/comentariosService';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminComentariosPage = () => {
  useAuth();
  const navigate = useNavigate();
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [comentarioSeleccionado, setComentarioSeleccionado] = useState(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos'
  });
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 20;

  const normalizarComentario = (comentario) => ({
    ...comentario,
    usuario: typeof comentario.usuario === 'object' && comentario.usuario !== null
      ? comentario.usuario
      : {
          nombre: comentario.usuario || comentario.autor || null,
          email: comentario.email || null
        },
    producto: typeof comentario.producto === 'object' && comentario.producto !== null
      ? comentario.producto
      : {
          nombre: comentario.producto || null
        }
  });
  
  // Comentarios filtrados y paginados
  const comentariosFiltrados = useMemo(() => {
    return comentarios.filter(comentario => {
      // Filtro por búsqueda (nombre usuario, producto, texto)
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const coincide = 
          (comentario.usuario?.nombre && comentario.usuario.nombre.toLowerCase().includes(busqueda)) ||
          (comentario.producto?.nombre && comentario.producto.nombre.toLowerCase().includes(busqueda)) ||
          (comentario.comentario && comentario.comentario.toLowerCase().includes(busqueda));
        if (!coincide) return false;
      }
      
      // Filtro por estado
      if (filtros.estado !== 'todos') {
        const estado = filtros.estado === 'visible' ? true : false;
        if (comentario.estado !== estado) return false;
      }
      
      return true;
    });
  }, [comentarios, filtros.busqueda, filtros.estado]);
  
  // Aplicar paginación
  const totalPaginas = Math.ceil(comentariosFiltrados.length / registrosPorPagina);
  const comentariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    return comentariosFiltrados.slice(inicio, fin);
  }, [comentariosFiltrados, paginaActual, registrosPorPagina]);
  
  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtros.busqueda, filtros.estado]);

  const loadComentarios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await comentariosService.obtenerTodosComentarios({ limite: 1000 });
      const comentariosData = response.data?.comentarios || response.data || [];
      setComentarios(Array.isArray(comentariosData) ? comentariosData.map(normalizarComentario) : []);
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al cargar comentarios' });
      setComentarios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComentarios();
  }, [loadComentarios]);

  const handleVerDetalle = (comentario) => {
    setComentarioSeleccionado(comentario);
    setShowDetalleModal(true);
  };

  const handleToggleVisibilidad = async (id) => {
    try {
      await comentariosService.toggleComentario(id);
      setMensaje({ tipo: 'success', texto: 'Visibilidad actualizada' });
      setShowDetalleModal(false);
      loadComentarios();
    } catch (error) {
      console.error('Error al actualizar visibilidad:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al actualizar visibilidad' });
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) return;
    
    try {
      await comentariosService.eliminarComentario(id);
      setMensaje({ tipo: 'success', texto: 'Comentario eliminado exitosamente' });
      setShowDetalleModal(false);
      loadComentarios();
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      setMensaje({ tipo: 'danger', texto: 'Error al eliminar el comentario' });
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-CO', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderizarEstrellas = (calificacion) => {
    const estrellas = [];
    for (let i = 1; i <= 5; i++) {
      estrellas.push(
        <i key={i} className={`bi bi-star${i <= calificacion ? '-fill' : ''}`} style={{ color: '#FFD700' }}></i>
      );
    }
    return estrellas;
  };

  if (loading) {
    return <LoadingSpinner message="Cargando comentarios..." />;
  }

  return (
    <div className="admin-comentarios-page">
      <div className="admin-toolbar">
        <div className="admin-title">
          <h1>
            <i className="bi bi-chat-dots"></i>
            Moderación de Comentarios
          </h1>
          <p className="subtext">Gestiona y modera los comentarios de clientes sobre productos</p>
        </div>

        <div className="action-groups">
          <div className="nav-actions">
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/dashboard')}>
              <i className="bi bi-arrow-left"></i>
              Volver
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
                  placeholder="Buscar por usuario, producto o contenido..."
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
                <option value="visible">Visible</option>
                <option value="oculto">Oculto</option>
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
            Mostrando {comentariosFiltrados.length} de {comentarios.length} comentarios
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Producto</th>
                <th>Calificación</th>
                <th>Comentario</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comentariosPaginados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted">
                    {comentarios.length === 0 ? 'No hay comentarios' : 'No se encontraron comentarios con los filtros aplicados'}
                  </td>
                </tr>
              ) : (
                comentariosPaginados.map((comentario) => (
                  <tr key={comentario.id}>
                    <td className="font-bold">{comentario.usuario?.nombre || '-'}</td>
                    <td>{comentario.producto?.nombre || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {renderizarEstrellas(comentario.calificacion)}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {comentario.comentario}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${comentario.estado ? 'bg-success' : 'bg-warning'}`}>
                        {comentario.estado ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td>{formatearFecha(comentario.fecha)}</td>
                    <td className="text-center">
                      <button 
                        type="button" 
                        className="btn btn-outline-primary btn-sm" 
                        onClick={() => handleVerDetalle(comentario)}
                        title="Ver detalles"
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                      <button 
                        type="button" 
                        className={`btn btn-outline-${comentario.estado ? 'warning' : 'success'} btn-sm`}
                        onClick={() => handleToggleVisibilidad(comentario.id)}
                        title={comentario.estado ? 'Ocultar' : 'Mostrar'}
                      >
                        <i className={`bi bi-eye${comentario.estado ? '-slash' : ''}`}></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-danger btn-sm" 
                        onClick={() => handleEliminar(comentario.id)}
                        title="Eliminar"
                      >
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
                <i className="bi bi-chat-left"></i>
                Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> - Mostrando <strong>{comentariosPaginados.length}</strong> de <strong>{comentariosFiltrados.length}</strong> registros
              </small>
            </div>
            <div className="pagination-buttons">
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1}>
                <i className="bi bi-chevron-bar-left"></i>
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(prev => prev - 1)} disabled={paginaActual === 1}>
                <i className="bi bi-chevron-left"></i> Anterior
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled>
                {paginaActual} / {totalPaginas}
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(prev => prev + 1)} disabled={paginaActual === totalPaginas}>
                Siguiente <i className="bi bi-chevron-right"></i>
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas}>
                <i className="bi bi-chevron-bar-right"></i>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* MODAL DETALLE COMENTARIO */}
      {showDetalleModal && comentarioSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowDetalleModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Detalle del Comentario</h2>
              <button type="button" className="close-button" onClick={() => setShowDetalleModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Usuario:</strong> {comentarioSeleccionado.usuario?.nombre || '-'}
                </div>
                <div className="col-md-6">
                  <strong>Email:</strong> {comentarioSeleccionado.usuario?.email || '-'}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-12">
                  <strong>Producto:</strong> {comentarioSeleccionado.producto?.nombre || '-'}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Calificación:</strong> {renderizarEstrellas(comentarioSeleccionado.calificacion)}
                </div>
                <div className="col-md-6">
                  <strong>Estado:</strong> <span className={`badge ${comentarioSeleccionado.estado ? 'bg-success' : 'bg-warning'}`}>
                    {comentarioSeleccionado.estado ? 'Visible' : 'Oculto'}
                  </span>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-12">
                  <strong>Fecha:</strong> {formatearFecha(comentarioSeleccionado.fecha)}
                </div>
              </div>

              <hr />

              <div className="row mb-3">
                <div className="col-md-12">
                  <strong>Comentario:</strong>
                  <div className="alert alert-light mt-2">
                    {comentarioSeleccionado.comentario}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDetalleModal(false)}>
                Cerrar
              </button>
              <button 
                type="button" 
                className={`btn btn-${comentarioSeleccionado.estado ? 'warning' : 'success'}`}
                onClick={() => handleToggleVisibilidad(comentarioSeleccionado.id)}
              >
                <i className={`bi bi-eye${comentarioSeleccionado.estado ? '-slash' : ''}`}></i>
                {comentarioSeleccionado.estado ? ' Ocultar' : ' Mostrar'}
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => handleEliminar(comentarioSeleccionado.id)}
              >
                <i className="bi bi-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComentariosPage;
