import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import CompartirModal from '../components/CompartirModal'; // Nuevo
import DetallesModal from '../components/DetallesModal'

// Función auxiliar para los niveles de seguridad
const getSecurityBadge = (status) => {
  if (status === 'password') return <span title="Bloqueado con contraseña" style={{ fontSize: '1rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'encrypted') return <span title="Cifrado de alto nivel" style={{ fontSize: '1rem', marginRight: '6px' }}>🛡️</span>;
  return null; // 'public' no renderiza ícono
}

const fetchRecentData = async () => {
  
    return [
      { id: 'fld-2', type: 'folder', name: 'Proyecto terminal', info: '8 archivos', date: 'Hoy, 10:30 AM', icon: '📁', security: 'public' },
      { id: 'f-1', type: 'file', name: 'Contraseñas_Servidor.pdf', info: '2.4 MB', date: 'Hoy, 09:15 AM', icon: '📄', security: 'encrypted' }, // Cifrado
      { id: 'f-2', type: 'file', name: 'Presupuesto.xlsx', info: '1.1 MB', date: 'Ayer, 04:20 PM', icon: '📊', security: 'password' }, // Contraseña
      { id: 'fld-4', type: 'folder', name: 'Carpeta_Privada', info: '10 archivos', date: 'Ayer, 11:00 AM', icon: '📁', security: 'encrypted' }, // Carpeta cifrada
      { id: 'f-3', type: 'file', name: 'Diagrama_Arquitectura.png', info: '4.5 MB', date: 'Hace 2 días', icon: '🖼️', security: 'public' }
    ];
}

export default function Recientes() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null) // <- NUEVO
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchRecentData();
        setItems(result);
      } catch (err) {
        console.error("Error local al cargar elementos recientes:", err);
        setError('No se pudieron cargar los elementos recientes.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [])

  const handleCardClick = (type, itemId) => {
    navigate(type === 'folder' ? `/carpeta/${itemId}` : `/archivo/${itemId}`)
  }

  return (
    <PrivateLayout>
      <section className="section-top" style={{ marginBottom: '24px' }}>
        <div>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <h1 style={{ fontSize: '2rem', color: '#3C60E2' }}>Recientes</h1>
          <p style={{ color: 'var(--color-medium-dark)' }}>Archivos y carpetas que has abierto o modificado últimamente.</p>
        </div>
      </section>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center' }}>Cargando actividad reciente...</div>}
      {error && <div style={{ padding: '20px', backgroundColor: '#ffe5e5', color: '#d93025' }}>{error}</div>}

      {!isLoading && !error && (
        <section>
          {items.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-medium-dark)' }}>No hay actividad reciente.</div>
          ) : (
            <div className="cards-grid">
              {items.map(item => (
                <article key={item.id} className={item.type === 'folder' ? 'folder-card' : 'file-card'} onClick={() => handleCardClick(item.type, item.id)} style={{ cursor: 'pointer' }}>
                  <div className={item.type === 'folder' ? 'folder-card-top' : 'file-card-top'}>
                    <span className={item.type === 'folder' ? 'folder-icon' : 'file-type'}>{item.icon}</span>
                    <button className="card-menu-btn" onClick={(e) => {
                      e.stopPropagation();
                      setElementoSeleccionado(item);
                    }}>⋮</button>
                  </div>
                  <div className={item.type === 'folder' ? 'folder-card-body' : 'file-card-body'}>
                    <h3 title={item.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}>
                      {getSecurityBadge(item.security)}
                      {item.name}
                    </h3>
                    <p>{item.info}</p>
                    <small>Abierto: {item.date}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
        {/* Nuestro nuevo Modal Global */}
      <DetallesModal 
        elemento={elementoSeleccionado} 
        onClose={() => setElementoSeleccionado(null)} 
      />
    </PrivateLayout>
  )
}