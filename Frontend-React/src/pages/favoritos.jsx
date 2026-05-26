import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import FileViewerModal from '../components/FileViewerModal' // ⬅️ NUEVO: Importación del visor
import storageService from '../services/storageService' // ⬅️ Ya lo teníamos para listar los favoritos
import { FaLock, FaUnlock, FaShieldAlt } from 'react-icons/fa'
import { IoDocumentText, IoBarChart, IoImage, IoFolder } from 'react-icons/io5'

const getSecurityBadge = (status) => {
  if (status === 'PASSWORD') {
    return <FaLock title="Bloqueado con contraseña" style={{ color: '#faad14', marginRight: '8px' }} />;
  }
  if (status === 'TOKEN_SMS') {
    return <FaShieldAlt title="Protegido por SMS" style={{ color: '#0a3fff', marginRight: '8px' }} />;
  }
  return <FaUnlock title="Público" style={{ color: '#52c41a', marginRight: '8px' }} />;
}

const getFileIcon = (fileName, isFolder) => {
  if (isFolder) return <IoFolder style={{ color: '#faad14' }} />;
  if (!fileName) return <IoDocumentText />;
  const ext = fileName.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return <IoImage style={{ color: '#46A2FD' }} />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <IoBarChart style={{ color: '#52c41a' }} />;
  return <IoDocumentText style={{ color: '#888' }} />;
}

export default function Favoritos() {
  const navigate = useNavigate()
  
  // Estados de carga y lista
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Estados para Modales
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null) // Para Detalles (⋮)
  const [viewerOpen, setViewerOpen] = useState(false) // ⬅️ NUEVO: Estado del modal del visor
  const [archivoParaVer, setArchivoParaVer] = useState(null) // ⬅️ NUEVO: Archivo que se pasará al visor

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await storageService.getFavorites();
      const list = result.favorites || result.data || result || [];
      setItems(list);
    } catch (err) {
      console.error("Error al cargar elementos favoritos:", err);
      setError('No se pudieron cargar los elementos favoritos.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [])

  // ⬅️ LÓGICA ACTUALIZADA PARA ABRIR EL MODAL DE VISTA
  const handleCardClick = (item) => {
    const isFolder = item.type === 'folder' || item.isFolder === true;
    const id = item.favoriteId || item.itemId || item.fileId || item.id;
    
    if (isFolder) {
      // Si es carpeta, seguimos navegando a su ruta interna
      navigate(`/carpeta/${id}`);
    } else {
      // Si es un archivo, preparamos el objeto y abrimos el visor
      setArchivoParaVer({
        ...item,
        id: id, // Garantizamos que el ID va unificado
        name: item.name || item.fileName || item.itemName
      });
      setViewerOpen(true);
    }
  }

  return (
    <PrivateLayout>
      <section className="section-top" style={{ marginBottom: '24px' }}>
        <div>
          <br /><br /><br /><br />
          <h1 style={{ fontSize: '2rem', color: '#ffffff' }}>Favoritos</h1>
          <p style={{ color: 'var(--color-text-medium)' }}>Archivos y carpetas que has marcado como favoritos.</p>
        </div>
      </section>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)' }}>Cargando favoritos...</div>}
      {error && <div style={{ padding: '20px', backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', borderRadius: '8px' }}>{error}</div>}

      {!isLoading && !error && (
        <section>
          {items.length === 0 ? (
             <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
               No tienes elementos marcados como favoritos aún.
             </div>
          ) : (
            <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {items.map(item => {
                const isFolder = item.type === 'folder' || item.isFolder === true;
                const itemName = item.name || item.fileName || item.itemName;
                const id = item.favoriteId || item.itemId || item.id;

                return (
                  <article 
                    key={id} 
                    className="file-card card-glow-hover"
                    onClick={() => handleCardClick(item)} 
                    style={{ cursor: 'pointer', backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <span style={{ fontSize: '2rem' }}>
                        {getFileIcon(itemName, isFolder)}
                      </span>
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '1.2rem' }}
                        onClick={(e) => {
                          e.stopPropagation(); // Evita que se abra el archivo al dar clic en los 3 puntos
                          setElementoSeleccionado(item);
                        }}
                      >
                        ⋮
                      </button>
                    </div>
                    <div>
                      <h3 title={itemName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', color: 'white', margin: '0 0 8px 0', fontSize: '1rem' }}>
                        {getSecurityBadge(item.securityLevel || item.security)}
                        {itemName}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-medium)' }}>
                        {item.info || (item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : (isFolder ? 'Carpeta' : 'Archivo'))}
                      </p>
                      <small style={{ color: '#faad14', fontWeight: 'bold', display: 'block', marginTop: '8px' }}>★ Favorito</small>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ⬅️ MODAL DE DETALLES (⋮) */}
      {elementoSeleccionado && (
        <DetallesModal 
          elemento={elementoSeleccionado} 
          onClose={() => {
            setElementoSeleccionado(null);
            loadData(); // Recargamos por si lo eliminó de favoritos desde el modal
          }} 
        />
      )}

      {/* ⬅️ NUEVO: MODAL VISOR DE ARCHIVOS */}
      {viewerOpen && archivoParaVer && (
        <FileViewerModal 
          isOpen={viewerOpen} 
          onClose={() => {
            setViewerOpen(false);
            setArchivoParaVer(null);
          }} 
          file={archivoParaVer} 
        />
      )}
    </PrivateLayout>
  )
}