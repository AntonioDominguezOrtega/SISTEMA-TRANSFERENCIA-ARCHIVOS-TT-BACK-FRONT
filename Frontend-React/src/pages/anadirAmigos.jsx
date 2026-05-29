import React, { useState } from 'react'
import PrivateHeader from '../components/PrivateHeader'
import Footer from '../components/Footer'

// 🌟 BASE DE DATOS LOCAL SIMULADA (Mock Data para tus pruebas de Front-end)
const baseUsuariosPlataforma = [
  { id: 'u-1', nombre: 'José Manuel', apellidos: 'Pérez Gómez', username: 'jose_perez', avatar: 'JM' },
  { id: 'u-2', nombre: 'José Antonio', apellidos: 'Rodríguez Silva', username: 'jose_antonio', avatar: 'JA' },
  { id: 'u-3', nombre: 'María José', apellidos: 'López Hernández', username: 'majo_lopez', avatar: 'MJ' },
  { id: 'u-4', nombre: 'Héctor Alejandro', apellidos: 'Hernández Aranda', username: 'hector_ha', avatar: 'HH' },
  { id: 'u-5', nombre: 'Antonio de Jesús', apellidos: 'Domínguez Ortega', username: 'antonio_do', avatar: 'AD' },
  { id: 'u-6', nombre: 'José de Jesús', apellidos: 'Martínez Ruíz', username: 'jose_chuy', avatar: 'JJ' },
  { id: 'u-7', nombre: 'Ambar Stephania', apellidos: 'García Gaspar', username: 'ambar_g', avatar: 'AG' },
];

export default function AñadirAmigo() {
  // 1. Solo necesitamos estos dos estados
  const [criterioBusqueda, setCriterioBusqueda] = useState('');
  const [amigosAgregados, setAmigosAgregados] = useState([]);

  // 🌟 LA MAGIA: Calculamos el filtrado directamente en cada renderizado.
  // Esto elimina el useEffect y corrige el error de ESLint al 100%.
  const busquedaLimpia = criterioBusqueda.trim().toLowerCase();
  
  const resultadosFiltrados = busquedaLimpia.length >= 2 
    ? baseUsuariosPlataforma.filter(usuario => 
        usuario.nombre.toLowerCase().includes(busquedaLimpia) ||
        usuario.apellidos.toLowerCase().includes(busquedaLimpia) ||
        usuario.username.toLowerCase().includes(busquedaLimpia)
      )
    : [];

  const handleEnviarSolicitud = (id, username) => {
    if (amigosAgregados.includes(id)) return;
    alert(`Solicitud de vinculación cifrada enviada a @${username}`);
    setAmigosAgregados([...amigosAgregados, id]);
  };

  // Tu return() con todo el HTML se queda exactamente igual...
  return (
    <>
      <PrivateHeader />

      <main style={{ backgroundColor: 'var(--color-dark)', minHeight: '100vh', paddingTop: '120px', paddingBottom: '60px', color: 'white' }}>
        <div className="container" style={{ maxWidth: '650px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* TARJETA PRINCIPAL CON BORDE ILUMINADO FIJO */}
          <div style={{
            backgroundColor: '#1D263C',
            border: '1px solid #0a3fff',
            borderRadius: '16px',
            padding: '40px 30px',
            boxShadow: 'var(--shadow-medium), 0 0 25px rgba(10, 63, 255, 0.35)',
            textAlign: 'center'
          }}>
            
            <div style={{ marginBottom: '30px' }}>
              <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(10, 63, 255, 0.15)', color: '#46A2FD', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '1px' }}>
                RED PRIVADA CAPARA
              </span>
              <h2 style={{ fontSize: '2rem', marginTop: '15px', color: 'white', fontWeight: '700' }}>
                Añadir Amigos
              </h2>
              <p style={{ color: 'var(--color-text-medium)', fontSize: '0.95rem', marginTop: '8px' }}>
                Busca a tus compañeros por su nombre o alias para compartirles contratos y datos confidenciales de forma segura.
              </p>
            </div>

            {/* BARRA DE BÚSQUEDA INTERACTIVA */}
            <div style={{ position: 'relative', marginBottom: '25px' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.2rem' }}>🔍</span>
              <input 
                type="text"
                placeholder="Escribe un nombre (ej. jose)..."
                value={criterioBusqueda}
                onChange={(e) => setCriterioBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 50px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'var(--color-dark)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0a3fff'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>

            {/* CONTENEDOR DE RESULTADOS EN TIEMPO REAL */}
            <div style={{ marginTop: '20px', textAlign: 'left' }}>
              
              {/* Caso 1: Mostrando los resultados encontrados */}
              {resultadosFiltrados.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-medium)', marginBottom: '4px', fontWeight: '600' }}>
                    Usuarios encontrados ({resultadosFiltrados.length}):
                  </p>
                  
                  {resultadosFiltrados.map((usuario) => (
                    <div 
                      key={usuario.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'between',
                        padding: '14px 18px',
                        backgroundColor: 'rgba(24, 35, 60, 0.7)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Avatar Circular */}
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.95rem' }}>
                          {usuario.avatar}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: '600' }}>
                            {usuario.nombre} {usuario.apellidos}
                          </h4>
                          <p style={{ margin: 0, color: 'var(--color-text-medium)', fontSize: '0.85rem', marginTop: '2px' }}>
                            @{usuario.username}
                          </p>
                        </div>
                      </div>

                      {/* Botón de Acción Dinámico */}
                      <button
                        onClick={() => handleEnviarSolicitud(usuario.id, usuario.username)}
                        disabled={amigosAgregados.includes(usuario.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: amigosAgregados.includes(usuario.id) ? 'default' : 'pointer',
                          backgroundColor: amigosAgregados.includes(usuario.id) ? 'rgba(82, 196, 26, 0.15)' : 'var(--color-accent)',
                          color: amigosAgregados.includes(usuario.id) ? '#52c41a' : 'var(--color-dark)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {amigosAgregados.includes(usuario.id) ? '✓ Enviada' : '➕ Añadir'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Caso 2: El usuario escribió pero no hubo coincidencias */}
              {criterioBusqueda.trim().length >= 2 && resultadosFiltrados.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-medium)' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}>🕵️‍♂️</span>
                  <p style={{ fontSize: '0.95rem', margin: 0 }}>No se encontraron usuarios que coincidan con "{criterioBusqueda}"</p>
                </div>
              )}

              {/* Caso 3: Estado inicial (Barra vacía) */}
              {criterioBusqueda.trim().length < 2 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>Comienza a escribir un nombre para realizar el escaneo...</p>
                </div>
              )}

            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}