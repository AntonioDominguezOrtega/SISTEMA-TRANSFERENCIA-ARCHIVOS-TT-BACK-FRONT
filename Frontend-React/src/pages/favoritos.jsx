import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import CompartirModal from '../components/CompartirModal';
import DetallesModal from '../components/DetallesModal'
import storageService from '../services/storageService'

// Función auxiliar para los niveles de seguridad
const getSecurityBadge = (status) => {
  if (status === 'password') return <span title="Bloqueado con contraseña" style={{ fontSize: '1rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'encrypted') return <span title="Cifrado de alto nivel" style={{ fontSize: '1rem', marginRight: '6px' }}>🛡️</span>;
  return null; // 'public' no renderiza ícono
}

export default function Favoritos() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await storageService.getFavorites();
        const list = result.favorites || result || [];
        setItems(list);
      } catch (err) {
        console.error("Error local al cargar elementos favoritos:", err);
        setError('No se pudieron cargar los elementos favoritos.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [])

  const handleCardClick = (item) => {
    if (item.type === 'folder' || item.type === 'PERSONAL') navigate(`/carpeta/${item.itemId || item.id}`)
    else navigate(`/archivo/${item.itemId || item.id}`)
  }

  return (
    <PrivateLayout>
      <section className="section-top" style={{ marginBottom: '24px' }}>
        <div>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <h1 style={{ fontSize: '2rem', color: '#ffffff' }}>Favoritos</h1>
          <p style={{ color: 'var(--color-medium-dark)' }}>Archivos y carpetas que has marcado como favoritos.</p>
        </div>
      </section>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center' }}>Cargando favoritos...</div>}
      {error && <div style={{ padding: '20px', backgroundColor: '#ffe5e5', color: '#d93025' }}>{error}</div>}

      {!isLoading && !error && (
        <section>
          {items.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-medium-dark)' }}>No hay elementos favoritos.</div>
          ) : (
            <div className="cards-grid">
              {items.map(item => (
                <article key={item.favoriteId || item.itemId || item.id} className={item.type === 'folder' ? 'folder-card' : 'file-card'} onClick={() => handleCardClick(item)} style={{ cursor: 'pointer' }}>
                  <div className={item.type === 'folder' ? 'folder-card-top' : 'file-card-top'}>
                    <span className={item.type === 'folder' ? 'folder-icon' : 'file-type'}>{item.icon || '📄'}</span>
                    <button className="card-menu-btn" onClick={(e) => {
                      e.stopPropagation();
                      setElementoSeleccionado(item);
                    }}>⋮</button>
                  </div>
                  <div className={item.type === 'folder' ? 'folder-card-body' : 'file-card-body'}>
                    <h3 title={item.name || item.fileName || item.itemName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}>
                      {getSecurityBadge(item.securityLevel || item.security)}
                      {item.name || item.fileName || item.itemName}
                    </h3>
                    <p>{item.info || (item.fileSize ? `${item.fileSize} bytes` : '')}</p>
                    <small>Favorito</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      <DetallesModal 
        elemento={elementoSeleccionado} 
        onClose={() => setElementoSeleccionado(null)} 
      />
    </PrivateLayout>
  )
}