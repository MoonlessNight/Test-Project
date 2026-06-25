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
  
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 25;

  const cargarPedidos = useCallback(async () => {
    try {
      const data = await pedidoService.obtenerTodosPedidos('?limite=1000');
      setPedidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      alert('Error al cargar pedidos');
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      const response = await pedidoService.actualizarEstadoPedido(pedidoId, nuevoEstado);
      alert('Estado del pedido actualizado');
      cargarPedidos();
      if (showDetalleModal && pedidoSeleccionado?.id === pedidoId) {
        const pedidoActualizado = response?.data?.pedido || response?.pedido || response?.data || null;
        if (pedidoActualizado) {
          setPedidoSeleccionado(pedidoActualizado);
        }
      }
    } catch (error) {
      alert('Error al cambiar estado del pedido');
    }
  };

  const handleVerDetalle = (pedido) => {
    setPedidoSeleccionado(pedido);
    setShowDetalleModal(true);
  };

  const formatearPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(pedido => {
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        const nombreCliente = pedido.usuario?.nombre?.toLowerCase() || '';
        const emailCliente = pedido.usuario?.email?.toLowerCase() || '';
        if (!nombreCliente.includes(busqueda) && !emailCliente.includes(busqueda)) return false;
      }
      if (filtros.estado !== 'todos' && pedido.estado !== filtros.estado) return false;
      if (filtros.fechaInicio) {
        const fechaPedido = new Date(pedido.createdAt);
        const fechaInicio = new Date(filtros.fechaInicio);
        fechaInicio.setHours(0,0,0,0);
        if (fechaPedido < fechaInicio) return false;
      }
      if (filtros.fechaFin) {
        const fechaPedido = new Date(pedido.createdAt);
        const fechaFin = new Date(filtros.fechaFin);
        fechaFin.setHours(23,59,59,999);
        if (fechaPedido > fechaFin) return false;
      }
      return true;
    });
  }, [pedidos, filtros]);

  const totalPaginas = Math.ceil(pedidosFiltrados.length / registrosPorPagina);
  const pedidosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return pedidosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [pedidosFiltrados, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros.busqueda, filtros.estado, filtros.fechaInicio, filtros.fechaFin]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border" style={{ color: 'var(--bs-gold, #f5c271)' }} role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="admin-title">Gestión de Pedidos</h2>
        <div className="btn-group">
          <button className="btn-exportar" onClick={() => exportarPedidosAPDF(pedidosFiltrados)}>
            <i className="bi bi-file-earmark-pdf me-1"></i> Exportar
          </button>
          <button className="btn-exportar dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown"></button>
          <ul className="dropdown-menu">
            <li><button className="dropdown-item" onClick={() => exportarPedidosAPDF(pedidosFiltrados)}>PDF</button></li>
            <li><button className="dropdown-item" onClick={() => exportarPedidosAExcel(pedidosFiltrados)}>Excel</button></li>
          </ul>
        </div>
      </div>

      {/* FILTROS */}
      <div className="filtros-card mb-4">
        <div className="filtros-header">
          <h5 className="mb-0"><i className="bi bi-funnel me-2"></i>Filtros</h5>
        </div>
        <div className="filtros-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="filtros-label">Buscar por Cliente:</label>
              <div className="input-group">
                <span className="input-group-text bg-gold-light"><i className="bi bi-search"></i></span>
                <input type="text" className="form-control admin-input" placeholder="Buscar por nombre o email..."
                  value={filtros.busqueda} onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })} />
              </div>
            </div>
            <div className="col-md-6">
              <label className="filtros-label">Estado del Pedido:</label>
              <select className="form-select admin-select" value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
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
              <label className="filtros-label">Fecha Inicio:</label>
              <input type="date" className="form-control admin-input" value={filtros.fechaInicio}
                onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="filtros-label">Fecha Fin:</label>
              <input type="date" className="form-control admin-input" value={filtros.fechaFin}
                onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="filtros-label">&nbsp;</label>
              <button className="btn-limpiar-filtros w-100" onClick={() => setFiltros({ busqueda: '', estado: 'todos', fechaInicio: '', fechaFin: '' })}>
                <i className="bi bi-x-circle me-1"></i> Limpiar Filtros
              </button>
            </div>
          </div>
          <div className="mt-3">
            <span className="badge-registros">
              <i className="bi bi-file-text me-1"></i>
              {pedidosFiltrados.length} de {pedidos.length} pedidos
              {(filtros.busqueda || filtros.estado !== 'todos' || filtros.fechaInicio || filtros.fechaFin) && (
                <span className="ms-2"><i className="bi bi-funnel-fill"></i> Filtros activos</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="tabla-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted">No hay pedidos para mostrar</td></tr>
              ) : (
                pedidosPaginados.map(pedido => (
                  <tr key={pedido.id}>
                    <td>#{pedido.id}</td>
                    <td>{pedido.usuario?.nombre || 'Usuario desconocido'}<br/><small className="text-muted">{pedido.usuario?.email}</small></td>
                    <td>{formatearFecha(pedido.createdAt)}</td>
                    <td><strong>{formatearPrecio(pedido.total)}</strong></td>
                    <td><span className={`badge-estado-pedido ${pedido.estado}`}>{pedido.estado}</span></td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn-action view" onClick={() => handleVerDetalle(pedido)} title="Ver detalle"><i className="bi bi-eye"></i></button>
                        {pedido.estado === 'pendiente' && (
                          <>
                            <button className="btn-action pay" onClick={() => handleCambiarEstado(pedido.id, 'pagado')} title="Marcar como pagado"><i className="bi bi-cash"></i></button>
                            <button className="btn-action cancel" onClick={() => handleCambiarEstado(pedido.id, 'cancelado')} title="Cancelar"><i className="bi bi-x-circle"></i></button>
                          </>
                        )}
                        {pedido.estado === 'pagado' && (
                          <button className="btn-action ship" onClick={() => handleCambiarEstado(pedido.id, 'enviado')} title="Marcar como enviado"><i className="bi bi-truck"></i></button>
                        )}
                        {pedido.estado === 'enviado' && (
                          <button className="btn-action deliver" onClick={() => handleCambiarEstado(pedido.id, 'entregado')} title="Marcar como entregado"><i className="bi bi-check-circle"></i></button>
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

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="paginacion-card mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <div><small>Página {paginaActual} de {totalPaginas} - {pedidosPaginados.length} de {pedidosFiltrados.length} registros</small></div>
            <div className="btn-group">
              <button className="btn-paginacion" onClick={() => setPaginaActual(1)} disabled={paginaActual === 1}><i className="bi bi-chevron-bar-left"></i></button>
              <button className="btn-paginacion" onClick={() => setPaginaActual(p => p-1)} disabled={paginaActual === 1}>Anterior</button>
              <button className="btn-paginacion active" disabled>{paginaActual} / {totalPaginas}</button>
              <button className="btn-paginacion" onClick={() => setPaginaActual(p => p+1)} disabled={paginaActual === totalPaginas}>Siguiente</button>
              <button className="btn-paginacion" onClick={() => setPaginaActual(totalPaginas)} disabled={paginaActual === totalPaginas}><i className="bi bi-chevron-bar-right"></i></button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {showDetalleModal && pedidoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-container modal-xl">
            <div className="modal-header-custom">
              <h5>Detalle del Pedido #{pedidoSeleccionado.id}</h5>
              <button className="btn-close-custom" onClick={() => { setShowDetalleModal(false); setPedidoSeleccionado(null); }}>×</button>
            </div>
            <div className="modal-body-custom">
              <div className="row mb-4">
                <div className="col-md-6"><h6>Información del Cliente</h6><p><strong>Nombre:</strong> {pedidoSeleccionado.usuario?.nombre}<br/><strong>Email:</strong> {pedidoSeleccionado.usuario?.email}<br/><strong>Teléfono:</strong> {pedidoSeleccionado.telefono}</p></div>
                <div className="col-md-6"><h6>Información del Pedido</h6><p><strong>Fecha:</strong> {formatearFecha(pedidoSeleccionado.createdAt)}<br/><strong>Estado:</strong> <span className={`badge-estado-pedido ${pedidoSeleccionado.estado}`}>{pedidoSeleccionado.estado}</span><br/><strong>Total:</strong> {formatearPrecio(pedidoSeleccionado.total)}</p></div>
              </div>
              <div className="mb-4"><h6>Dirección de Envío</h6><p>{pedidoSeleccionado.direccionEnvio}</p></div>
              {pedidoSeleccionado.notas && <div className="mb-4"><h6>Notas</h6><p className="text-muted">{pedidoSeleccionado.notas}</p></div>}
              <h6>Productos</h6>
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead><tr><th>Producto</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
                  <tbody>
                    {(pedidoSeleccionado.detalles || pedidoSeleccionado.DetallePedidos || []).map((detalle, index) => (
                      <tr key={index}><td>{detalle.producto?.nombre || detalle.Producto?.nombre || 'Producto no disponible'}</td><td>{detalle.cantidad}</td><td>{formatearPrecio(detalle.precioUnitario)}</td><td><strong>{formatearPrecio(detalle.subtotal)}</strong></td></tr>
                    ))}
                  </tbody>
                  <tfoot><tr><th colSpan="3" className="text-end">TOTAL:</th><th>{formatearPrecio(pedidoSeleccionado.total)}</th></tr></tfoot>
                </table>
              </div>
              <div className="mt-4"><h6>Cambiar Estado del Pedido</h6>
                <div className="btn-group">
                  {['pendiente','pagado','enviado','entregado','cancelado'].map(est => (
                    <button key={est} className={`btn-estado ${pedidoSeleccionado.estado === est ? 'active' : ''}`}
                      onClick={() => handleCambiarEstado(pedidoSeleccionado.id, est)}
                      disabled={pedidoSeleccionado.estado === est}>
                      {est.charAt(0).toUpperCase() + est.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer-custom">
              <button className="btn-cancelar" onClick={() => { setShowDetalleModal(false); setPedidoSeleccionado(null); }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-title { background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e)); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: 700; }
        .btn-exportar { background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 0.75rem; padding: 0.5rem 1rem; font-weight: 600; transition: all 0.3s; }
        .btn-exportar:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(16,185,129,0.3); }
        .filtros-card { background: var(--bg-positiva, #DBE1ED); border-radius: 1rem; overflow: hidden; }
        .filtros-header { background: var(--bg-negativo, #192847); color: white; padding: 0.75rem 1.25rem; }
        .filtros-body { padding: 1.25rem; }
        .filtros-label { font-weight: 600; color: var(--bg-negativo, #192847); margin-bottom: 0.5rem; display: block; }
        .admin-input, .admin-select { border-radius: 0.75rem; border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; background: white; }
        .admin-input:focus, .admin-select:focus { border-color: var(--bs-gold, #f5c271); box-shadow: 0 0 0 3px rgba(145,105,52,0.1); }
        .btn-limpiar-filtros { background: transparent; border: 2px solid var(--bs-gold, #f5c271); color: var(--bs-gold-dark, #c7984e); border-radius: 0.75rem; padding: 0.5rem; font-weight: 600; transition: all 0.3s; }
        .btn-limpiar-filtros:hover { background: var(--bs-gold, #f5c271); color: var(--fnt-black, #000); }
        .badge-registros { background: var(--bs-gold, #f5c271); color: var(--fnt-black, #000); padding: 0.35rem 0.75rem; border-radius: 2rem; font-size: 0.85rem; font-weight: 500; display: inline-block; }
        .tabla-card { background: white; border-radius: 1rem; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table thead { background: var(--bg-positiva, #DBE1ED); color: var(--bg-negativo, #192847); }
        .admin-table th, .admin-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .admin-table tbody tr:hover { background: rgba(145,105,52,0.05); }
        .badge-estado-pedido { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; }
        .badge-estado-pedido.pendiente { background: #ffc107; color: #000; }
        .badge-estado-pedido.pagado { background: #0dcaf0; color: #000; }
        .badge-estado-pedido.enviado { background: #0d6efd; color: white; }
        .badge-estado-pedido.entregado { background: #10b981; color: white; }
        .badge-estado-pedido.cancelado { background: #dc3545; color: white; }
        .btn-action { background: transparent; border: 1px solid; border-radius: 0.5rem; padding: 0.25rem 0.5rem; margin: 0 0.125rem; transition: all 0.2s; }
        .btn-action.view { border-color: var(--bs-gold, #f5c271); color: var(--bs-gold-dark, #c7984e); }
        .btn-action.view:hover { background: var(--bs-gold, #f5c271); color: black; }
        .btn-action.pay { border-color: #0dcaf0; color: #0dcaf0; }
        .btn-action.pay:hover { background: #0dcaf0; color: black; }
        .btn-action.cancel { border-color: #dc3545; color: #dc3545; }
        .btn-action.cancel:hover { background: #dc3545; color: white; }
        .btn-action.ship { border-color: #0d6efd; color: #0d6efd; }
        .btn-action.ship:hover { background: #0d6efd; color: white; }
        .btn-action.deliver { border-color: #10b981; color: #10b981; }
        .btn-action.deliver:hover { background: #10b981; color: white; }
        .paginacion-card { background: white; border-radius: 1rem; padding: 0.75rem 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .btn-paginacion { background: transparent; border: 1px solid var(--bs-gold, #f5c271); color: var(--bs-gold-dark, #c7984e); border-radius: 0.5rem; padding: 0.25rem 0.75rem; margin: 0 0.25rem; }
        .btn-paginacion:hover:not(:disabled) { background: var(--bs-gold, #f5c271); color: black; }
        .btn-paginacion.active { background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e)); color: black; border: none; }
        .btn-paginacion:disabled { opacity: 0.5; cursor: not-allowed; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1050; }
        .modal-container { background: white; border-radius: 1.5rem; width: 90%; max-width: 1200px; max-height: 90vh; overflow-y: auto; }
        .modal-header-custom { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #e5e7eb; background: var(--bg-positiva, #DBE1ED); border-radius: 1.5rem 1.5rem 0 0; }
        .modal-header-custom h5 { margin: 0; color: var(--bg-negativo, #192847); font-weight: 600; }
        .btn-close-custom { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
        .modal-body-custom { padding: 1.5rem; }
        .modal-footer-custom { display: flex; justify-content: flex-end; padding: 1rem 1.5rem; border-top: 1px solid #e5e7eb; }
        .btn-cancelar { background: transparent; border: 2px solid var(--bs-gold, #f5c271); color: var(--bs-gold-dark, #c7984e); border-radius: 0.75rem; padding: 0.5rem 1rem; font-weight: 600; transition: all 0.3s; }
        .btn-cancelar:hover { background: var(--bs-gold, #f5c271); color: black; }
        .btn-estado { background: transparent; border: 1px solid var(--bs-gold, #f5c271); color: var(--bs-gold-dark, #c7984e); border-radius: 0.5rem; padding: 0.375rem 0.75rem; margin: 0 0.25rem; transition: all 0.2s; }
        .btn-estado:hover:not(:disabled) { background: var(--bs-gold, #f5c271); color: black; }
        .btn-estado.active { background: linear-gradient(135deg, var(--bs-gold, #f5c271), var(--bs-gold-dark, #c7984e)); color: black; border: none; }
        .btn-estado:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

export default AdminPedidosPage;