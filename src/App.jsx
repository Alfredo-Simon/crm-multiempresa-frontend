import React from 'react'
import { useState } from 'react'
import Dashboard from './Dashboard'

export default function App() {
  const [email, setEmail] = useState('admin@empresa-a.com')
  const [password, setPassword] = useState('password123')
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setLoggedIn(true)
        setUser(data.usuario)
        localStorage.setItem('token', data.token)
      } else {
        setError(data.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error de conexión: ' + err.message)
    }
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setUser(null)
    setEmail('admin@empresa-a.com')
    setPassword('password123')
    localStorage.removeItem('token')
  }

  if (loggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <div style={{ background: 'white', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0', color: '#667eea' }}>CRM Multiempresa</h2>
            <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '14px' }}>Bienvenido, {user.nombre} ({user.role})</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Cerrar Sesión
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <Dashboard />
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '10px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', color: '#667eea' }}>CRM Multiempresa</h1>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Email:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@empresa-a.com"
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Contraseña:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{ 
              background: '#ffebee', 
              color: '#c62828', 
              padding: '10px', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit"
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#667eea', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Iniciar Sesión
          </button>
        </form>

        <div style={{ marginTop: '30px', background: '#f0f4ff', padding: '15px', borderRadius: '5px', fontSize: '14px' }}>
          <p><strong>Usuarios de prueba:</strong></p>
          <p>📧 admin@empresa-a.com</p>
          <p>🔑 password123</p>
        </div>
      </div>
    </div>
  )
}
