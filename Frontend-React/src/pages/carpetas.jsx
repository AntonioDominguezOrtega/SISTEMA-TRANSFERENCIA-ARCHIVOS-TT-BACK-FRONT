import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import DetallesModal from '../components/DetallesModal'
import storageService from '../services/storageService'

const getSecurityBadge = (status) => {
  if (status === 'password') return <span title="Bloqueada con contraseña" style={{ fontSize: '1rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'encrypted') return <span title="Cifrada de alto nivel" style={{ fontSize: '1rem', marginRight: '6px' }}>🛡️</span>;
  return null;
}

// Carga reales de carpetas/archivos personales desde el servicio
const fetchFolderContents = async () => {
  const result = await storageService.getFolderContents();
  return result.contents || result || [];
}

export default function Carpetas() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null) // <- NUEVO
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const contents = await fetchFolderContents();
        const carpetas = contents.filter(item => item.isFolder === true);
        setData({ folders: carpetas });
      } catch (err) {
        console.error("Error local al cargar carpetas:", err);
        setError('No se pudo cargar la información de las carpetas.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [])

  return (
    <PrivateLayout>
      <section className="section-top" style={{ marginBottom: '24px' }}>
        <div>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <h1 style={{ fontSize: '2rem', color: '#ffffff' }}>Mis carpetas</h1>
          <p style={{ color: 'var(--color-medium-dark)' }}>Organiza, consulta y administra tus carpetas.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary">Ordenar</button>
          <button className="btn btn-primary" onClick={() => alert('Crear nueva carpeta')}>+ Nueva carpeta</button>
        </div>
      </section>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center' }}>Cargando carpetas...</div>}
      {error && <div style={{ padding: '20px', backgroundColor: '#ffe5e5', color: '#d93025' }}>{error}</div>}

      {!isLoading && !error && data && (
        <>  
          <section style={{ marginTop: '36px' }}>
            <h2 style={{ color: '#1C40E8', marginBottom: '20px', fontSize: '1.5rem' }}>Carpetas disponibles</h2>
            <div className="cards-grid">
              {data.folders.map(folder => (
                <article key={folder.id} className="folder-card" onClick={() => navigate(`/carpeta/${folder.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="folder-card-top">
                    <span className="folder-icon">{folder.icon}</span>
                    <button className="card-menu-btn" onClick={(e) => {
                      e.stopPropagation();
                      setElementoSeleccionado(folder);
                    }}>⋮</button>
                  </div>
                  <div className="folder-card-body">
                    <h3 title={folder.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}>
                      {getSecurityBadge(folder.security)}
                      {folder.name}
                    </h3>
                    <p>{folder.fileCount} archivos</p>
                    <small>Modificado: {folder.lastModified}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
      {/* Modal Global */}
      <DetallesModal 
        elemento={elementoSeleccionado} 
        onClose={() => setElementoSeleccionado(null)} 
      />
    </PrivateLayout>
  )
}