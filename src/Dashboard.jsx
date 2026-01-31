import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard() {
  const [tabActivo, setTabActivo] = useState('leads'); // 'leads' o 'usuarios'
  const [leads, setLeads] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    contestados: 0,
    porcentaje_contestados: 0
  });
  const [busqueda, setBusqueda] = useState('');
  const [empresaFiltro, setEmpresaFiltro] = useState('todas');
  const [empresas, setEmpresas] = useState([]);
  const [leadSeleccionado, setLeadSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  const API_BASE = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  // Obtener usuario logueado
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setUsuarioLogueado(data.usuario);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchMe();
  }, []);

  // Obtener estadísticas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setEstadisticas(data.stats);
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
      }
    };
    fetchStats();
  }, []);

  // Obtener empresas (solo para superadmin)
  useEffect(() => {
    if (usuarioLogueado?.role === 'superadmin') {
      const fetchEmpresas = async () => {
        try {
          const response = await fetch(`${API_BASE}/dashboard/empresas`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            setEmpresas(data.empresas);
          }
        } catch (error) {
          console.error('Error cargando empresas:', error);
        }
      };
      fetchEmpresas();
    }
  }, [usuarioLogueado]);

  // Cargar leads
  const cargarLeads = async () => {
    setCargando(true);
    try {
      const url = busqueda 
        ? `${API_BASE}/dashboard/search?q=${encodeURIComponent(busqueda)}`
        : `${API_BASE}/dashboard/leads`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Error cargando leads:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cargar usuarios
  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const response = await fetch(`${API_BASE}/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.usuarios);
      } else {
        alert(data.error || 'Solo superadmin puede ver usuarios');
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  // Effect para búsqueda
  useEffect(() => {
    if (tabActivo === 'leads') {
      cargarLeads();
    }
  }, [busqueda, tabActivo]);

  // Effect para cambiar tab
  useEffect(() => {
    if (tabActivo === 'usuarios') {
      cargarUsuarios();
    } else {
      cargarLeads();
    }
  }, [tabActivo]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const truncarMensaje = (texto, max = 50) => {
    if (!texto) return 'Sin mensaje';
    return texto.length > max ? texto.substring(0, max) + '...' : texto;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📊 CRM Dashboard</h1>
          <p>Bienvenido, <strong>{usuarioLogueado?.nombre || 'Usuario'}</strong></p>
        </div>
        <div className="header-right">
          <span className="role-badge">
            {usuarioLogueado?.role === 'superadmin' ? '🔑 Superadmin' : '👤 Admin'}
          </span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      {/* TABS */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${tabActivo === 'leads' ? 'active' : ''}`}
          onClick={() => setTabActivo('leads')}
        >
          📋 Leads
        </button>
        {usuarioLogueado?.role === 'superadmin' && (
          <button 
            className={`tab-btn ${tabActivo === 'usuarios' ? 'active' : ''}`}
            onClick={() => setTabActivo('usuarios')}
          >
            👥 Usuarios
          </button>
        )}
      </div>

      {/* TAB: LEADS */}
      {tabActivo === 'leads' && (
        <div className="tab-content">
          {/* PANEL GENERAL */}
          <div className="panel-general">
            <h2>📊 Panel General</h2>
            
            {/* Selector de empresa */}
            {usuarioLogueado?.role === 'superadmin' && (
              <div className="selector-empresa">
                <label>Filtrar por empresa:</label>
                <select value={empresaFiltro} onChange={(e) => setEmpresaFiltro(e.target.value)}>
                  <option value="todas">Todas las empresas</option>
                  {empresas.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Cards de estadísticas */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Total Leads</h3>
                  <p className="stat-number">{estadisticas.total || 0}</p>
                </div>
              </div>

              <div className="stat-card pending">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h3>Pendientes</h3>
                  <p className="stat-number">{estadisticas.pendientes || 0}</p>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>Contestados</h3>
                  <p className="stat-number">{estadisticas.contestados || 0}</p>
                </div>
              </div>

              <div className="stat-card info">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>% Contestados</h3>
                  <p className="stat-number">{estadisticas.porcentaje_contestados || 0}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE BÚSQUEDA */}
          <div className="seccion-busqueda">
            <h2>🔍 Buscar Lead</h2>
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
            <p className="search-hint">Escribe para buscar en tiempo real</p>
          </div>

          {/* TABLA DE LEADS */}
          <div className="seccion-tabla">
            <h2>📋 Leads ({leads.length})</h2>
            
            {cargando ? (
              <p className="loading">Cargando...</p>
            ) : leads.length === 0 ? (
              <p className="no-data">No hay leads para mostrar</p>
            ) : (
              <div className="tabla-wrapper">
                <table className="leads-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Empresa</th>
                      <th>Mensaje</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className={`lead-row status-${lead.estado}`}>
                        <td className="nombre-cell">
                          <strong>{lead.nombre} {lead.apellidos}</strong>
                        </td>
                        <td>{lead.email}</td>
                        <td>{lead.telefono}</td>
                        <td>
                          <span className="empresa-badge">{lead.empresa_nombre || 'N/A'}</span>
                        </td>
                        <td className="mensaje-cell">
                          {truncarMensaje(lead.mensaje)}
                        </td>
                        <td>
                          <span className={`estado-badge estado-${lead.estado}`}>
                            {lead.estado === 'recibido' ? '📬 Pendiente' : '✅ Contestado'}
                          </span>
                        </td>
                        <td className="acciones-cell">
                          <button 
                            onClick={() => setLeadSeleccionado(lead)}
                            className="btn-ver"
                          >
                            Ver ficha
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: USUARIOS */}
      {tabActivo === 'usuarios' && (
        <div className="tab-content">
          <div className="seccion-usuarios">
            <h2>👥 Gestión de Usuarios</h2>
            
            <button className="btn-crear-usuario">+ Crear nuevo usuario</button>

            {cargando ? (
              <p className="loading">Cargando usuarios...</p>
            ) : usuarios.length === 0 ? (
              <p className="no-data">No hay usuarios registrados</p>
            ) : (
              <div className="tabla-wrapper">
                <table className="usuarios-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Empresa</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(usuario => (
                      <tr key={usuario.id}>
                        <td><strong>{usuario.nombre}</strong></td>
                        <td>{usuario.email}</td>
                        <td>
                          <span className={`role-badge role-${usuario.role}`}>
                            {usuario.role === 'superadmin' ? '🔑 Superadmin' : usuario.role === 'admin' ? '👤 Admin' : '👁️ Viewer'}
                          </span>
                        </td>
                        <td>{usuario.nombre_empresa || 'N/A'}</td>
                        <td>
                          <span className={`estado-badge ${usuario.activo ? 'activo' : 'inactivo'}`}>
                            {usuario.activo ? '✅ Activo' : '❌ Inactivo'}
                          </span>
                        </td>
                        <td className="acciones-cell">
                          <button className="btn-editar">Editar</button>
                          <button className="btn-eliminar">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: FICHA DE LEAD */}
      {leadSeleccionado && (
        <div className="modal-overlay" onClick={() => setLeadSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📱 Ficha de Lead</h2>
              <button className="btn-close" onClick={() => setLeadSeleccionado(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Datos personales */}
              <div className="modal-section">
                <h3>📋 Datos Personales</h3>
                <div className="data-grid">
                  <div className="data-item">
                    <label>Nombre:</label>
                    <p>{leadSeleccionado.nombre} {leadSeleccionado.apellidos}</p>
                  </div>
                  <div className="data-item">
                    <label>Email:</label>
                    <p>{leadSeleccionado.email}</p>
                  </div>
                  <div className="data-item">
                    <label>Teléfono:</label>
                    <p>{leadSeleccionado.telefono}</p>
                  </div>
                  <div className="data-item">
                    <label>Empresa:</label>
                    <p>{leadSeleccionado.empresa_nombre || 'N/A'}</p>
                  </div>
                  <div className="data-item">
                    <label>Origen:</label>
                    <p>{leadSeleccionado.origen}</p>
                  </div>
                  <div className="data-item">
                    <label>Fecha Registro:</label>
                    <p>{formatearFecha(leadSeleccionado.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Mensaje original */}
              {leadSeleccionado.mensaje && (
                <div className="modal-section">
                  <h3>💬 Mensaje Original</h3>
                  <div className="mensaje-content">
                    {leadSeleccionado.mensaje}
                  </div>
                </div>
              )}

              {/* Estado */}
              <div className="modal-section">
                <h3>📊 Estado</h3>
                <div className="estado-selector">
                  <select defaultValue={leadSeleccionado.estado} className="estado-select">
                    <option value="recibido">📬 Pendiente de respuesta</option>
                    <option value="contestado">✅ Contestado</option>
                  </select>
                </div>
              </div>

              {/* Responder */}
              <div className="modal-section">
                <h3>📧 Responder al Lead</h3>
                <textarea 
                  placeholder="Escribe tu respuesta aquí..."
                  className="respuesta-textarea"
                />
                <div className="responder-buttons">
                  <button className="btn-guardar">💾 Guardar respuesta</button>
                  <button className="btn-enviar">📧 Enviar por email</button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cerrar" onClick={() => setLeadSeleccionado(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
