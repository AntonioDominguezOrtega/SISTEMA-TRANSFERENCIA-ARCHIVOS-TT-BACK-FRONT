import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import DetallesModal from '../components/DetallesModal' // <-- Usamos el modal que creamos

const getSecurityBadge = (status) => {
  if (status === 'password') return <span title="Bloqueado" style={{ fontSize: '1rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'encrypted') return <span title="Cifrado" style={{ fontSize: '1rem', marginRight: '6px' }}>🛡️</span>;
  return null;
}

const fetchFullSearchResults = async (query, context) => {
  try {
    // 🔗 API REAL AQUÍ: fetch(`/api/buscar?q=${query}&context=${context}`)
    return [
      { id: 'f-1', type: 'file', name: 'Reporte_Avance.pdf', info: '2.4 MB', date: 'Hoy', icon: '📄', security: 'encrypted' },
      { id: 'fld-2', type: 'folder', name: 'Reportes_Proyecto', info: '8 archivos', date: 'Ayer', icon: '📁', security: 'public' }
    ];
  } catch (error) {
    throw error;
  }
}

export default function ResultadosBusqueda() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const context = searchParams.get('context') || 'global'
  
  const navigate = useNavigate()
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      if (!query) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await fetchFullSearchResults(query, context);
        setResults(data);
      } catch (err) {
        setError('No se pudieron cargar los resultados.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [query, context])

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
          <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>Resultados de búsqueda</h1>
          <p style={{ color: 'var(--color-medium-dark)' }}>
            Mostrando coincidencias para: <strong style={{ color: 'var(--color-dark)' }}>"{query}"</strong>
          </p>
        </div>
      </section>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center' }}>Buscando archivos...</div>}
      {error && <div style={{ padding: '20px', backgroundColor: '#ffe5e5', color: '#d93025' }}>{error}</div>}

      {!isLoading && !error && (
        <section>
          {results.length === 0 ? (
             <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-medium-dark)', backgroundColor: 'var(--color-white)', borderRadius: '16px' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔍</span>
                No encontramos nada que coincida con "{query}" en esta ubicación.
             </div>
          ) : (
            <div className="cards-grid">
              {results.map(item => (
                <article key={item.id} className={item.type === 'folder' ? 'folder-card' : 'file-card'} onClick={() => handleCardClick(item.type, item.id)} style={{ cursor: 'pointer' }}>
                  <div className={item.type === 'folder' ? 'folder-card-top' : 'file-card-top'}>
                    <span className={item.type === 'folder' ? 'folder-icon' : 'file-type'}>{item.icon}</span>
                    <button className="card-menu-btn" onClick={(e) => { e.stopPropagation(); setElementoSeleccionado(item); }}>⋮</button>
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

      {/* Modal de Detalles para los resultados */}
      <DetallesModal elemento={elementoSeleccionado} onClose={() => setElementoSeleccionado(null)} />

    </PrivateLayout>
  )
}