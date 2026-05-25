import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import DetallesModal from '../components/DetallesModal'

const getSecurityBadge = (status) => {
  if (status === 'password') return <span title="Bloqueado con contraseña" style={{ fontSize: '1rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'encrypted') return <span title="Cifrado de alto nivel" style={{ fontSize: '1rem', marginRight: '6px' }}>🛡️</span>;
  return null;
}

const fetchSharedData = async () => {
  
    return {
      activos: [
        { id: 'fld-8', type: 'folder', name: 'Documentos Proyecto', owner: 'María G.', date: 'Hoy', icon: '📁', security: 'password' },
        { id: 'f-20', type: 'file', name: 'Llaves_Acceso_BD.txt', owner: 'Carlos R.', date: 'Ayer', icon: '📝', security: 'encrypted' },
        { id: 'f-21', type: 'file', name: 'Presentacion_Final.pptx', owner: 'Ana L.', date: 'Hace 3 días', icon: '📊', security: 'public' },
        { id: 'fld-9', type: 'folder', name: 'Borradores Equipo', owner: 'Roberto M.', date: 'Hace 1 semana', icon: '📁', security: 'public' }
      ],
      vencidos: [
        { id: 'f-22', type: 'file', name: 'Presupuesto_Q1.xlsx', owner: 'Laura S.', date: '20/04/2026', icon: '📊', security: 'encrypted', expiredDate: '08/05/2026' },
        { id: 'f-23', type: 'file', name: 'Reporte_Mensual.pdf', owner: 'Diego P.', date: '15/04/2026', icon: '📄', security: 'password', expiredDate: '05/05/2026' }
      ]
    };
  } 


export default function Compartidos() {
  const navigate = useNavigate()
  const [itemsActivos, setItemsActivos] = useState([])
  const [itemsVencidos, setItemsVencidos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchSharedData();
        setItemsActivos(result.activos);
        setItemsVencidos(result.vencidos);
      } catch (err) {
        console.error("Error local al cargar elementos compartidos:", err);
        setError('No se pudieron cargar los elementos compartidos.');
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
          
          <h1 style={{ fontSize: '2rem', color: '#ffffff' }}>Compartidos conmigo</h1>
          <p style={{ color: 'var(--color-medium-dark)' }}>Archivos y carpetas que otros usuarios han compartido contigo.</p>
        </div>
      </section>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center' }}>Cargando elementos compartidos...</div>}
      {error && <div style={{ padding: '20px', backgroundColor: '#ffe5e5', color: '#d93025' }}>{error}</div>}

      {!isLoading && !error && (
        <>
          {/* Sección de Archivos Activos */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--color-dark)', marginBottom: '16px' }}>Archivos Activos</h2>
            {itemsActivos.length === 0 ? (
               <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-medium-dark)' }}>Nadie ha compartido archivos contigo aún.</div>
            ) : (
              <div className="cards-grid">
                {itemsActivos.map(item => (
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
                      <p>De: {item.owner}</p>
                      <small>Compartido: {item.date}</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Sección de Permisos Vencidos */}
          {itemsVencidos.length > 0 && (
            <section style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#856404', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⏰ Permisos Vencidos
              </h2>
              <p style={{ color: '#856404', marginBottom: '16px' }}>Los siguientes archivos ya no están disponibles porque sus permisos de acceso han expirado.</p>
              <div className="cards-grid">
                {itemsVencidos.map(item => (
                  <article 
                    key={item.id} 
                    className={item.type === 'folder' ? 'folder-card' : 'file-card'} 
                    style={{ 
                      cursor: 'not-allowed', 
                      opacity: '0.6',
                      position: 'relative'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(255,193,7,0.1)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10
                    }}>
                      <span style={{ backgroundColor: 'white', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', color: '#856404' }}>
                        Acceso Expirado
                      </span>
                    </div>
                    <div className={item.type === 'folder' ? 'folder-card-top' : 'file-card-top'}>
                      <span className={item.type === 'folder' ? 'folder-icon' : 'file-type'}>{item.icon}</span>
                    </div>
                    <div className={item.type === 'folder' ? 'folder-card-body' : 'file-card-body'}>
                      <h3 title={item.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}>
                        {getSecurityBadge(item.security)}
                        {item.name}
                      </h3>
                      <p>De: {item.owner}</p>
                      <small>Compartido: {item.date}</small>
                      <small style={{ display: 'block', color: '#d97706', marginTop: '4px' }}>
                        Expirado: {item.expiredDate}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
              <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#856404' }}>
                💡 <strong>Consejo:</strong> Puedes solicitar al propietario que renueve tu acceso a estos archivos.
              </p>
            </section>
          )}
        </>
      )}
        {/* Nuestro nuevo Modal Global */}
      <DetallesModal 
        elemento={elementoSeleccionado} 
        onClose={() => setElementoSeleccionado(null)} 
      />
    </PrivateLayout>
  )
}