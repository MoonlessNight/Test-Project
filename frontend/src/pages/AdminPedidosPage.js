import React, { useState, useEffect, useMemo, useCallback } from 'react';
import pedidoService from '../services/pedidoService';
import { exportarPedidosAPDF, exportarPedidosAExcel } from '../utils/exportUtils';

function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos',
    fechaInicio: '',
    fechaFin: ''
  });
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 25;

  const cargarPedidos = useCallback(async () => {
    try {
      const data = await pedidoService.obtenerTodosPedidos('?limite=1000');
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error al cargar pedidos:', error);
      alert('Error al cargar pedidos');
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    cargarPedidos();
  }, []); // Solo una vez

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    console.log('🔄 Cambiando estado del pedido:', pedidoId, 'a', nuevoEstado);
    
    try {
      await pedidoService.actualizarEstadoPedido(pedidoId, nuevoEstado);
      console.log('✅ Estado actualizado');
      alert('Estado del pedido actualizado');
      cargarPedidos();
      
      // Si hay un modal abierto, actualizarlo
      if (showDetalleModal && pedidoSeleccionado?.id === pedidoId) {
        const pedidoActualizado = await pedidoService.obtenerPedidoPorId(pedidoId);
        setPedidoSeleccionado(pedidoActualizado);
      }
    } catch (error) {
      console.error('❌ Error al cambiar estado:', error);
      alert('Error al cambiar estado del pedido');
    }
  };

  const handleVerDetalle = async (pedidoId) => {
    console.log('👁️ Viendo detalle del pedido:', pedidoId);
    try {
      const pedido = await pedidoService.obtenerPedidoPorId(pedidoId);
      console.log('✅ Detalle cargado:', pedido);
      setPedidoSeleccionado(pedido);
      setShowDetalleModal(true);
    } catch (error) {
      console.error('❌ Error al cargar detalle:', error);
      alert('Error al cargar detalle del pedido');
    }
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
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

  const obtenerBadgeEstado = (estado) => {
    const badges = {
      pendiente: 'bg-warning',
      pagado: 'bg-info',
      enviado: 'bg-primary',
      entregado: 'bg-success',
      cancelado: 'bg-danger'
    };
    return badges[estado] || 'bg-secondary';
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(pedido => {
      // Filtro por búsqueda (nombre o email del cliente)
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const nombreCliente = pedido.Usuario?.nombre?.toLowerCase() || '';
        const emailCliente = pedido.Usuario?.email?.toLowerCase() || '';
        if (!nombreCliente.includes(busqueda) && !emailCliente.includes(busqueda)) {
          return false;
        }
      }

      // Filtro por estado
      if (filtros.estado !== 'todos' && pedido.estado !== filtros.estado) {
        return false;
      }

      // Filtro por fecha de inicio
      if (filtros.fechaInicio) {
        const fechaPedido = new Date(pedido.createdAt);
        const fechaInicio = new Date(filtros.fechaInicio);
        fechaInicio.setHours(0, 0, 0, 0);
        if (fechaPedido < fechaInicio) {
          return false;
        }
      }

      // Filtro por fecha fin
      if (filtros.fechaFin) {
        const fechaPedido = new Date(pedido.createdAt);
        const fechaFin = new Date(filtros.fechaFin);
        fechaFin.setHours(23, 59, 59, 999);
        if (fechaPedido > fechaFin) {
          return false;
        }
      }

      return true;
    });
  }, [pedidos, filtros.busqueda, filtros.estado, filtros.fechaInicio, filtros.fechaFin]);

  // Aplicar paginación
  const totalPaginas = Math.ceil(pedidosFiltrados.length / registrosPorPagina);
  const pedidosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    return pedidosFiltrados.slice(inicio, fin);
  }, [pedidosFiltrados, paginaActual, registrosPorPagina]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtros.busqueda, filtros.estado, filtros.fechaInicio, filtros.fechaFin]);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Pedidos</h2>
        <div className="btn-group">
          <button className="btn btn-success" onClick={() => exportarPedidosAPDF(pedidosFiltrados)}>
            <i className="bi bi-file-earmark-pdf me-1"></i>
            Exportar
          </button>
          <button className="btn btn-success dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown"></button>
          <ul className="dropdown-menu">
            <li><button className="dropdown-item" onClick={() => exportarPedidosAPDF(pedidosFiltrados)}>
              <i className="bi bi-file-earmark-pdf me-2"></i>
              Exportar a PDF
            </button></li>
            <li><button className="dropdown-item" onClick={() => exportarPedidosAExcel(pedidosFiltrados)}>
              <i className="bi bi-file-earmark-excel me-2"></i>
              Exportar a Excel
            </button></li>
          </ul>
        </div>
      </div>

      {/* FILTROS */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Filtros</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Buscar por Cliente:</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre o email..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Estado del Pedido:</label>
              <select 
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Fecha Inicio:</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Fecha Fin:</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">&nbsp;</label>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFiltros({ busqueda: '', estado: 'todos', fechaInicio: '', fechaFin: '' })}
              >
                <i className="bi bi-x-circle me-1"></i>
                Limpiar Filtros
              </button>
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-12">
              <div className="alert alert-info mb-0">
                <strong>Registros Encontrados:</strong> {pedidosFiltrados.length} de {pedidos.length} pedidos
                {filtros.busqueda || filtros.estado !== 'todos' || filtros.fechaInicio || filtros.fechaFin ? (
                  <span className="ms-2">
                    <i className="bi bi-funnel-fill"></i> Filtros activos
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE PEDIDOS */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      No hay pedidos para mostrar
                    </td>
                  </tr>
                ) : (
                  pedidosPaginados.map(pedido => (
                    <tr key={pedido.id}>
                      <td>#{pedido.id}</td>
                      <td>
                        {pedido.Usuario?.nombre || 'Usuario desconocido'}<br/>
                        <small className="text-muted">{pedido.Usuario?.email}</small>
                      </td>
                      <td>{formatearFecha(pedido.createdAt)}</td>
                      <td><strong>{formatearPrecio(pedido.total)}</strong></td>
                      <td>
                        <span className={`badge ${obtenerBadgeEstado(pedido.estado)}`}>
                          {pedido.estado}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleVerDetalle(pedido.id)}
                            title="Ver detalle"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          
                          {pedido.estado === 'pendiente' && (
                            <>
                              <button
                                className="btn btn-outline-info"
                                onClick={() => handleCambiarEstado(pedido.id, 'pagado')}
                                title="Marcar como pagado"
                              >
                                <i className="bi bi-cash"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleCambiarEstado(pedido.id, 'cancelado')}
                                title="Cancelar"
                              >
                                <i className="bi bi-x-circle"></i>
                              </button>
                            </>
                          )}
                          
                          {pedido.estado === 'pagado' && (
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleCambiarEstado(pedido.id, 'enviado')}
                              title="Marcar como enviado"
                            >
                              <i className="bi bi-truck"></i>
                            </button>
                          )}
                          
                          {pedido.estado === 'enviado' && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleCambiarEstado(pedido.id, 'entregado')}
                              title="Marcar como entregado"
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="card mt-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <small className="text-muted">
                  <i className="bi bi-file-text me-1"></i>
                  Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong> - Mostrando <strong>{pedidosPaginados.length}</strong> de <strong>{pedidosFiltrados.length}</strong> registros
                </small>
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                  title="Primera página"
                >
                  <i className="bi bi-chevron-bar-left"></i>
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setPaginaActual(prev => prev - 1)}
                  disabled={paginaActual === 1}
                  title="Página anterior"
                >
                  <i className="bi bi-chevron-left me-1"></i> Anterior
                </button>
                <button className="btn btn-primary btn-sm" disabled>
                  {paginaActual} / {totalPaginas}
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setPaginaActual(prev => prev + 1)}
                  disabled={paginaActual === totalPaginas}
                  title="Página siguiente"
                >
                  Siguiente <i className="bi bi-chevron-right ms-1"></i>
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                  title="Última página"
                >
                  <i className="bi bi-chevron-bar-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE PEDIDO */}
      {showDetalleModal && pedidoSeleccionado && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalle del Pedido #{pedidoSeleccionado.id}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowDetalleModal(false);
                    setPedidoSeleccionado(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Información del Cliente</h6>
                    <p>
                      <strong>Nombre:</strong> {pedidoSeleccionado.Usuario?.nombre}<br/>
                      <strong>Email:</strong> {pedidoSeleccionado.Usuario?.email}<br/>
                      <strong>Teléfono:</strong> {pedidoSeleccionado.telefono}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Información del Pedido</h6>
                    <p>
                      <strong>Fecha:</strong> {formatearFecha(pedidoSeleccionado.createdAt)}<br/>
                      <strong>Estado:</strong> <span className={`badge ${obtenerBadgeEstado(pedidoSeleccionado.estado)}`}>
                        {pedidoSeleccionado.estado}
                      </span><br/>
                      <strong>Total:</strong> {formatearPrecio(pedidoSeleccionado.total)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h6>Dirección de Envío</h6>
                  <p>{pedidoSeleccionado.direccionEnvio}</p>
                </div>

                {pedidoSeleccionado.notas && (
                  <div className="mb-4">
                    <h6>Notas</h6>
                    <p className="text-muted">{pedidoSeleccionado.notas}</p>
                  </div>
                )}

                <h6>Productos</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidoSeleccionado.DetallePedidos?.map((detalle, index) => (
                        <tr key={index}>
                          <td>{detalle.Producto?.nombre || 'Producto no disponible'}</td>
                          <td>{detalle.cantidad}</td>
                          <td>{formatearPrecio(detalle.precioUnitario)}</td>
                          <td><strong>{formatearPrecio(detalle.subtotal)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan="3" className="text-end">TOTAL:</th>
                        <th>{formatearPrecio(pedidoSeleccionado.total)}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-4">
                  <h6>Cambiar Estado del Pedido</h6>
                  <div className="btn-group">
                    <button
                      className={`btn ${pedidoSeleccionado.estado === 'pendiente' ? 'btn-warning' : 'btn-outline-warning'}`}
                      onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'pendiente')}
                      disabled={pedidoSeleccionado.estado === 'pendiente'}
                    >
                      Pendiente
                    </button>
                    <button
                      className={`btn ${pedidoSeleccionado.estado === 'pagado' ? 'btn-info' : 'btn-outline-info'}`}
                      onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'pagado')}
                      disabled={pedidoSeleccionado.estado === 'pagado'}
                    >
                      Pagado
                    </button>
                    <button
                      className={`btn ${pedidoSeleccionado.estado === 'enviado' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'enviado')}
                      disabled={pedidoSeleccionado.estado === 'enviado'}
                    >
                      Enviado
                    </button>
                    <button
                      className={`btn ${pedidoSeleccionado.estado === 'entregado' ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'entregado')}
                      disabled={pedidoSeleccionado.estado === 'entregado'}
                    >
                      Entregado
                    </button>
                    <button
                      className={`btn ${pedidoSeleccionado.estado === 'cancelado' ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => handleCambiarEstado(pedidoSeleccionado.id, 'cancelado')}
                      disabled={pedidoSeleccionado.estado === 'cancelado'}
                    >
                      Cancelado
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDetalleModal(false);
                    setPedidoSeleccionado(null);
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPedidosPage;
