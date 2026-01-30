import React from 'react'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroOrigen, setFiltroOrigen] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [editandoLead, setEditandoLead] = useState(null)
  const [respuestaMensaje, setRespuestaMensaje] = useState('')
  const [leadSeleccionado, setLeadSeleccionado] = useState(null) // NUEVO: Para modal del mensaje

  const token = localStorage.getItem('token')
  const API_URL = '/api'

  // Cargar estadísticas
  useEffect(() => {
    cargarDatos()
  }, [filtroEstado, filtroOrigen, paginaActual])

  const cargarDatos = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Obtener estadísticas
      const statsRes = await fetch(`${API_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const statsData = await statsRes.json()
      if (statsData.success) {
        setStats(statsData.stats)
      }

      // Obtener leads
      let url = `${API_URL}/dashboard/leads?pagina=${paginaActual}`
      if (filtroEstado) url += `&estado=${filtroEstado}`
      if (filtroOrigen) url += `&origen=${filtroOrigen}`

      const leadsRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const leadsData = await leadsRes.json()
      if (leadsData.success) {
        setLeads(leadsData.leads)
      }
    } catch (err) {
      setError('Error al cargar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstado = async (leadId, nuevoEstado) => {
    try {
      const res = await fetch(`${API_URL}/dashboard/leads/${leadId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          respuesta_mensaje: respuestaMensaje
        })
      })

      const data = await res.json()
      if (data.success) {
        setEditandoLead(null)
        setRespuestaMensaje('')
        cargarDatos()
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Error al cambiar estado: ' + err.message)
    }
  }

  // NUEVO: Función para truncar mensaje
  const truncarMensaje = (mensaje, maxCaracteres = 50) => {
    if (!mensaje) return '-'
    return mensaje.length > maxCaracteres 
      ? mensaje.substring(0, maxCaracteres) + '...' 
      : mensaje
  }

  if (loading && !stats) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando...</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>📊 Dashboard de Leads</h1>

      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', marginBottom: '20px', borderRadius: '5px' }}>
          {error}
        </div>
      )}

      {/* ESTADÍSTICAS */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Total de Leads</h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1976d2' }}>{stats.totalLeads}</div>
          </div>

          {stats.porEstado && stats.porEstado.map((item) => (
            <div key={item.estado} style={{ background: '#f3e5f5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2', textTransform: 'capitalize' }}>{item.estado}</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#7b1fa2' }}>{item.cantidad}</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTROS */}
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1) }}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">Todos los estados</option>
          <option value="recibido">Recibido</option>
          <option value="contestado">Contestado</option>
        </select>

        <select
          value={filtroOrigen}
          onChange={(e) => { setFiltroOrigen(e.target.value); setPaginaActual(1) }}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="">Todos los orígenes</option>
          <option value="formulario_web">Formulario Web</option>
          <option value="formulario_leads">Formulario Leads</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {/* TABLA DE LEADS */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Nombre</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Teléfono</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Mensaje</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Origen</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Fecha</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{lead.nombre} {lead.apellidos}</td>
                <td style={{ padding: '12px' }}>{lead.email}</td>
                <td style={{ padding: '12px' }}>{lead.telefono}</td>
                {/* NUEVO: Columna Mensaje */}
                <td 
                  style={{ 
                    padding: '12px',
                    maxWidth: '200px',
                    cursor: 'pointer',
                    color: '#0066cc',
                    textDecoration: 'underline'
                  }}
                  onClick={() => setLeadSeleccionado(lead)}
                  title={lead.mensaje || 'Sin mensaje'}
                >
                  {truncarMensaje(lead.mensaje)}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: lead.estado === 'contestado' ? '#c8e6c9' : '#ffe0b2',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    textTransform: 'capitalize'
                  }}>
                    {lead.estado}
                  </span>
                </td>
                <td style={{ padding: '12px', textTransform: 'capitalize' }}>{lead.origen}</td>
                <td style={{ padding: '12px', fontSize: '12px' }}>
                  {new Date(lead.created_at).toLocaleDateString('es-ES')}
                </td>
                <td style={{ padding: '12px' }}>
                  {editandoLead === lead.id ? (
                    <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                      <textarea
                        value={respuestaMensaje}
                        onChange={(e) => setRespuestaMensaje(e.target.value)}
                        placeholder="Mensaje de respuesta (opcional)"
                        style={{ width: '200px', height: '60px', padding: '5px' }}
                      />
                      <button
                        onClick={() => cambiarEstado(lead.id, 'contestado')}
                        style={{ background: '#4caf50', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Marcar Contestado
                      </button>
                      <button
                        onClick={() => setEditandoLead(null)}
                        style={{ background: '#999', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditandoLead(lead.id)}
                      disabled={lead.estado === 'contestado'}
                      style={{
                        background: lead.estado === 'contestado' ? '#ccc' : '#2196f3',
                        color: 'white',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: lead.estado === 'contestado' ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {lead.estado === 'contestado' ? 'Contestado' : 'Responder'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leads.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No hay leads para mostrar
        </div>
      )}

      {/* NUEVO: MODAL PARA VER MENSAJE COMPLETO */}
      {leadSeleccionado && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setLeadSeleccionado(null)}
        >
          <div 
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Detalles del Lead</h2>
              <button
                onClick={() => setLeadSeleccionado(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ✕
              </button>
            </div>

            {/* Información del lead */}
            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999', fontWeight: 'bold' }}>NOMBRE</p>
                  <p style={{ margin: '5px 0 0 0', color: '#333' }}>{leadSeleccionado.nombre} {leadSeleccionado.apellidos}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999', fontWeight: 'bold' }}>EMAIL</p>
                  <p style={{ margin: '5px 0 0 0', color: '#0066cc', wordBreak: 'break-all' }}>{leadSeleccionado.email}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999', fontWeight: 'bold' }}>TELÉFONO</p>
                  <p style={{ margin: '5px 0 0 0', color: '#333' }}>{leadSeleccionado.telefono}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999', fontWeight: 'bold' }}>FECHA</p>
                  <p style={{ margin: '5px 0 0 0', color: '#333' }}>{new Date(leadSeleccionado.created_at).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
            </div>

            {/* Mensaje */}
            <div style={{ background: '#f0f4f8', padding: '15px', borderRadius: '4px', borderLeft: '4px solid #2196f3', marginBottom: '20px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#999', fontWeight: 'bold', marginBottom: '10px' }}>MENSAJE</p>
              <p style={{ 
                margin: 0, 
                color: '#333', 
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {leadSeleccionado.mensaje || 'Sin mensaje'}
              </p>
            </div>

            {/* Estado y Origen */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#999', fontWeight: 'bold', marginBottom: '8px' }}>ESTADO</p>
                <span style={{
                  background: leadSeleccionado.estado === 'contestado' ? '#c8e6c9' : '#ffe0b2',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  textTransform: 'capitalize',
                  fontWeight: 'bold'
                }}>
                  {leadSeleccionado.estado}
                </span>
              </div>
              <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#999', fontWeight: 'bold', marginBottom: '8px' }}>ORIGEN</p>
                <p style={{ margin: 0, color: '#333', textTransform: 'capitalize' }}>{leadSeleccionado.origen}</p>
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setLeadSeleccionado(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
