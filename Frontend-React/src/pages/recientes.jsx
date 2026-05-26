import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import DetallesModal from '../components/DetallesModal'
import storageService from '../services/storageService'

// Función auxiliar para los niveles de seguridad
const getSecurityBadge = (status) => {
  if (status === 'password') return <span title="Bloqueado con contraseña" style={{ fontSize: '1rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'encrypted') return <span title="Cifrado de alto nivel" style={{ fontSize: '1rem', marginRight: '6px' }}>🛡️</span>;
  return null; // 'public' no renderiza ícono
}

// Formateo de tamaño (reutilizado)
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Recientes() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [personalRes, sharedRes] = await Promise.all([
          storageService.getRecentPersonalFiles(),
          storageService.getRecentSharedFiles()
        ]);
        const personal = personalRes.files || personalRes || [];
        const shared = sharedRes.files || sharedRes || [];
        setItems([...personal, ...shared]);
      } catch (err) {
        console.error("Error al cargar elementos recientes:", err);
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
                <article key={item.id || item.itemId} className={item.isFolder ? 'folder-card' : 'file-card'} onClick={() => handleCardClick(item.isFolder ? 'folder' : 'file', item.id || item.itemId)} style={{ cursor: 'pointer' }}>
                  <div className={item.isFolder ? 'folder-card-top' : 'file-card-top'}>
                    <span className={item.isFolder ? 'folder-icon' : 'file-type'}>{item.icon || '📄'}</span>
                    <button className="card-menu-btn" onClick={(e) => {
                      e.stopPropagation();
                      setElementoSeleccionado(item);
                    }}>⋮</button>
                  </div>
                  <div className={item.isFolder ? 'folder-card-body' : 'file-card-body'}>
                    <h3 title={item.name || item.fileName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}>
                      {getSecurityBadge(item.securityLevel || item.security)}
                      {item.name || item.fileName}
                    </h3>
                    <p>{item.info || (item.fileSize ? `${formatFileSize(item.fileSize)}` : '')}</p>
                    <small>Abierto: {item.sharedAt || item.uploadedAt || 'Reciente'}</small>
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