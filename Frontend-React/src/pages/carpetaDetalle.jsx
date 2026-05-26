import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import DetallesModal from '../components/DetallesModal'

const getSecurityBadge = (status) => {
  if (status === 'password') return <span title="Bloqueado con contraseña" style={{ fontSize: '1rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'encrypted') return <span title="Cifrado de alto nivel" style={{ fontSize: '1rem', marginRight: '6px' }}>🛡️</span>;
  return null;
}

const fetchFolderDetails = async (folderId) => {
  try {
    return {
      id: folderId,
      name: folderId === 'fld-2' ? 'Proyecto terminal' : 'Documentos privados',
      createdAt: '15 Octubre 2025',
      totalSize: '14.5 MB',
      security: folderId === 'fld-2' ? 'public' : 'encrypted',
      contents: [
        { id: 'sub-1', type: 'folder', name: 'Borradores', info: '3 archivos', date: 'Hace 2 días', icon: '📁', security: 'public' },
        { id: 'f-1', type: 'file', name: 'Reporte_Avance.pdf', info: '2.4 MB', date: 'Hoy', icon: '📄', security: 'encrypted' },
        { id: 'f-11', type: 'file', name: 'Nóminas.xlsx', info: '0.8 MB', date: 'Ayer', icon: '📊', security: 'password' }
      ]
    };
  } catch (error) {
    throw error;
  }
}

export default function CarpetaDetalle() {
  const { id } = useParams() 
  const navigate = useNavigate()
  
  const [folderData, setFolderData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null) // <- NUEVO
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchFolderDetails(id);
        setFolderData(result);
      } catch (err) {
        setError('No se pudo cargar el contenido de la carpeta.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]) 

  const handleCardClick = (type, itemId) => {
    navigate(type === 'folder' ? `/carpeta/${itemId}` : `/archivo/${itemId}`)
  }

  return (
    <PrivateLayout>
      <section className="section-top" style={{ marginBottom: '24px' }}>
        <div>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-medium-dark)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← Volver
          </button>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center' }}>
            {folderData && getSecurityBadge(folderData.security)}
            {folderData ? folderData.name : 'Cargando carpeta...'}
          </h1>
          {folderData && (
            <p style={{ color: 'var(--color-medium-dark)', fontSize: '0.9rem' }}>
              Creada: {folderData.createdAt} • Tamaño: {folderData.totalSize}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary">Compartir</button>
          <button className="btn btn-primary" onClick={() => navigate(`/subir-archivo?carpeta=${id}`)}>+ Subir aquí</button>
        </div>
      </section>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center' }}>Abriendo carpeta...</div>}
      {error && <div style={{ padding: '20px', backgroundColor: '#ffe5e5', color: '#d93025' }}>{error}</div>}

      {!isLoading && !error && folderData && (
        <section>
          {folderData.contents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-medium-dark)' }}>Esta carpeta está vacía.</div>
          ) : (
            <div className="cards-grid">
              {folderData.contents.map(item => (
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
                    <small>Modificado: {item.date}</small>
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