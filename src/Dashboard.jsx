import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard({ usuarioLogueado: initialUsuario }) {
  const [tabActivo, setTabActivo] = useState('leads');
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
  const [usuarioLogueado, setUsuarioLogueado] = useState(initialUsuario || null);
  
  // Estados para modal de usuario
  const [modalUsuario, setModalUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    role: 'comercial',
    empresa_id: null,
    activo: true
  });

  const API_BASE = 'https://app.alfredosimon.com/api';
  const token = localStorage.getItem('token');

  // ✅ NUEVOS ROLES DISPONIBLES
  const ROLES_DISPONIBLES = {
    superadmin: '🔑 Superadmin',
    ceo: '👔 CEO',
    directivo: '📊 Directivo',
    comercial: '💼 Comercial'
  };

  // Obtener estadísticas
  useEffect(() => {
    if (!token) return;
    
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
  }, [token, API_BASE]);

  // Obtener empresas (solo para superadmin y CEO)
  useEffect(() => {
    if (['superadmin', 'ceo'].includes(usuarioLogueado?.role) && token) {
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
  }, [usuarioLogueado, token, API_BASE]);

  // Cargar leads
  const cargarLeads = async () => {
    if (!token) return;
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
    if (!token) return;
    setCargando(true);
    try {
      const response = await fetch(`${API_BASE}/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.usuarios);
      } else {
        alert(data.error || 'Error al cargar usuarios');
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
  }, [busqueda, tabActivo, token]);

  // Effect para cambiar tab
  useEffect(() => {
    if (tabActivo === 'usuarios') {
      cargarUsuarios();
    } else if (tabActivo === 'leads') {
      cargarLeads();
    }
  }, [tabActivo, token]);

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

  // Funciones para modal de usuario
  const abrirModalCrear = () => {
    setUsuarioEditando(null);
    
    // Roles que puede crear el usuario actual
    let rolPorDefecto = 'comercial';
    if (usuarioLogueado?.role === 'ceo') {
      // CEO solo puede crear Directivo o Comercial
      rolPorDefecto = 'comercial';
    }
    
    setFormUsuario({
      nombre: '',
      email: '',
      password: '',
      role: rolPorDefecto,
      empresa_id: usuarioLogueado?.role === 'ceo' ? usuarioLogueado.empresa_id : null,
      activo: true
    });
    setModalUsuario(true);
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setFormUsuario({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      role: usuario.role,
      empresa_id: usuario.empresa_id,
      activo: usuario.activo
    });
    setModalUsuario(true);
  };

  const cerrarModal = () => {
    setModalUsuario(false);
    setUsuarioEditando(null);
  };

  const manejarCambioForm = (e) => {
    const { name, value, type, checked } = e.target;
    setFormUsuario(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'empresa_id' ? (value ? parseInt(value) : null) : value)
    }));
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();

    if (!formUsuario.nombre || !formUsuario.email) {
      alert('Nombre y email son requeridos');
      return;
    }

    if (!usuarioEditando && !formUsuario.password) {
      alert('La contraseña es requerida para nuevo usuario');
      return;
    }

    try {
      const url = usuarioEditando 
        ? `${API_BASE}/usuarios/${usuarioEditando.id}`
        : `${API_BASE}/usuarios`;

      const metodo = usuarioEditando ? 'PUT' : 'POST';

      const datosEnvio = { ...formUsuario };
      if (!datosEnvio.password) {
        delete datosEnvio.password;
      }

      const response = await fetch(url, {
        method: metodo,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosEnvio)
      });

      const data = await response.json();

      if (data.success) {
        alert(usuarioEditando ? 'Usuario actualizado' : 'Usuario creado');
        cerrarModal();
        cargarUsuarios();
      } else {
        alert(data.error || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error guardando usuario:', error);
      alert('Error al guardar usuario');
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Usuario eliminado correctamente');
        cargarUsuarios();
      } else {
        alert(data.error || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('Error al eliminar usuario');
    }
  };

  // 🔐 Función auxiliar: ¿Puede este usuario crear/editar roles?
  const puedeCrearRol = (rol) => {
    if (usuarioLogueado?.role === 'superadmin') {
      return true; // Superadmin puede crear cualquier rol
    }
    if (usuarioLogueado?.role === 'ceo') {
      // CEO solo puede crear Directivo y Comercial
      return ['directivo', 'comercial'].includes(rol);
    }
    return false;
  };

  // 🔐 Función auxiliar: ¿Qué roles puede crear el usuario actual?
  const getRolesDisponiblesParaCrear = () => {
    if (usuarioLogueado?.role === 'superadmin') {
      return Object.keys(ROLES_DISPONIBLES);
    }
    if (usuarioLogueado?.role === 'ceo') {
      return ['directivo', 'comercial'];
    }
    return [];
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
            {ROLES_DISPONIBLES[usuarioLogueado?.role] || '👤 Usuario'}
          </span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      {/* TABS - Mostrar según rol */}
      <div className="dashboard-tabs">
        {/* Tab: LEADS - Lo ven TODOS */}
        <button 
          className={`tab-btn ${tabActivo === 'leads' ? 'active' : ''}`}
          onClick={() => setTabActivo('leads')}
        >
          📋 Leads
        </button>

        {/* Tab: USUARIOS - Lo ven SUPERADMIN y CEO */}
        {['superadmin', 'ceo'].includes(usuarioLogueado?.role) && (
          <button 
            className={`tab-btn ${tabActivo === 'usuarios' ? 'active' : ''}`}
            onClick={() => setTabActivo('usuarios')}
          >
            👥 Usuarios
          </button>
        )}

        {/* Tab: EMPRESAS - Solo SUPERADMIN */}
        {usuarioLogueado?.role === 'superadmin' && (
          <button 
            className={`tab-btn ${tabActivo === 'empresas' ? 'active' : ''}`}
            onClick={() => setTabActivo('empresas')}
          >
            🏢 Empresas
          </button>
        )}
      </div>

      {/* TAB: LEADS */}
      {tabActivo === 'leads' && (
        <div className="tab-content">
          {/* PANEL GENERAL */}
          <div className="panel-general">
            <h2>📊 Panel General</h2>
            
            {/* Selector de empresa solo para SUPERADMIN */}
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
                      <th>Fecha</th>
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
                        <td className="mensaje-cell">{truncarMensaje(lead.mensaje)}</td>
                        <td>
                          <span className={`estado-badge estado-${lead.estado}`}>
                            {lead.estado === 'pendiente' ? '⏳' : '✅'} {lead.estado}
                          </span>
                        </td>
                        <td>{formatearFecha(lead.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: USUARIOS - Solo SUPERADMIN y CEO */}
      {tabActivo === 'usuarios' && ['superadmin', 'ceo'].includes(usuarioLogueado?.role) && (
        <div className="tab-content">
          <div className="seccion-usuarios">
            <div className="usuarios-header">
              <h2>👥 Gestión de Usuarios</h2>
              <button onClick={abrirModalCrear} className="btn-crear">+ Crear Usuario</button>
            </div>

            {cargando ? (
              <p className="loading">Cargando...</p>
            ) : usuarios.length === 0 ? (
              <p className="no-data">No hay usuarios para mostrar</p>
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
                          <span className="role-badge-table">
                            {ROLES_DISPONIBLES[usuario.role] || usuario.role}
                          </span>
                        </td>
                        <td>{usuario.nombre_empresa || 'N/A'}</td>
                        <td>
                          <span className={`estado-badge ${usuario.activo ? 'activo' : 'inactivo'}`}>
                            {usuario.activo ? '✅ Activo' : '❌ Inactivo'}
                          </span>
                        </td>
                        <td className="acciones-cell">
                          <button 
                            onClick={() => abrirModalEditar(usuario)} 
                            className="btn-editar"
                            title="Editar usuario"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => eliminarUsuario(usuario.id)} 
                            className="btn-eliminar"
                            title="Eliminar usuario"
                          >
                            🗑️
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

      {/* MODAL: CREAR/EDITAR USUARIO */}
      {modalUsuario && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{usuarioEditando ? '✏️ Editar Usuario' : '➕ Crear Usuario'}</h2>
              <button onClick={cerrarModal} className="btn-close">✕</button>
            </div>

            <form onSubmit={guardarUsuario} className="modal-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formUsuario.nombre}
                  onChange={manejarCambioForm}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formUsuario.email}
                  onChange={manejarCambioForm}
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Contraseña {!usuarioEditando && '*'}</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formUsuario.password}
                  onChange={manejarCambioForm}
                  placeholder={usuarioEditando ? 'Dejar en blanco para no cambiar' : 'Nueva contraseña'}
                  required={!usuarioEditando}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Rol *</label>
                <select
                  id="role"
                  name="role"
                  value={formUsuario.role}
                  onChange={manejarCambioForm}
                  required
                >
                  {getRolesDisponiblesParaCrear().map(rol => (
                    <option key={rol} value={rol}>
                      {ROLES_DISPONIBLES[rol]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mostrar selector de empresa solo para SUPERADMIN */}
              {usuarioLogueado?.role === 'superadmin' && (
                <div className="form-group">
                  <label htmlFor="empresa_id">Empresa</label>
                  <select
                    id="empresa_id"
                    name="empresa_id"
                    value={formUsuario.empresa_id || ''}
                    onChange={manejarCambioForm}
                  >
                    <option value="">Ninguna (Superadmin)</option>
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Para CEO, la empresa está predeterminada */}
              {usuarioLogueado?.role === 'ceo' && (
                <div className="form-group">
                  <label>Empresa</label>
                  <div className="empresa-readonly">
                    {empresas.find(e => e.id === formUsuario.empresa_id)?.nombre || 'Tu Empresa'}
                  </div>
                </div>
              )}

              <div className="form-group checkbox">
                <label htmlFor="activo">
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formUsuario.activo}
                    onChange={manejarCambioForm}
                  />
                  Activo
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={cerrarModal} className="btn-cancelar">Cancelar</button>
                <button type="submit" className="btn-guardar">
                  {usuarioEditando ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
