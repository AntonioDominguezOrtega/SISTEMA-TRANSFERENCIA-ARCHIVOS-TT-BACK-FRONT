import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import DetallesModal from '../components/DetallesModal'
import { FaLock, FaUnlock, FaShieldAlt, FaHistory, FaUserCircle, FaSyncAlt } from 'react-icons/fa'
import { IoDocumentText, IoBarChart, IoImage } from 'react-icons/io5'

const renderSecurityBadge = (status) => {
  if (status === 'password' || status === 'Bloqueado') {
    return <FaLock title="Bloqueado con contraseña" style={{ color: '#faad14', marginRight: '8px' }} />;
  }
  if (status === 'encrypted' || status === 'Cifrado') {
    return <FaShieldAlt title="Cifrado de alto nivel" style={{ color: '#0a3fff', marginRight: '8px' }} />;
  }
  return <FaUnlock title="Desbloqueado" style={{ color: '#52c41a', marginRight: '8px' }} />;
}

// SIMULACIÓN DE DATOS LOCALES EXCLUSIVOS DE VENCIDOS
const fetchExpiredSharedData = async () => {
  return {
    compartidosConmigo: [
      { id: 'v-1', name: 'Presupuesto_Q1_Análisis.xlsx', componentIcon: <IoBarChart />, size: '2.4 MB', security: 'Cifrado', owner: 'Dra. Tania Rodríguez', date: '20/04/2026', expiredDate: '08/05/2026', asunto: 'Revisión presupuestal académica para el TT2' },
      { id: 'v-2', name: 'Reporte_Mensual_Infraestructura.pdf', componentIcon: <IoDocumentText />, size: '1.1 MB', security: 'Bloqueado', owner: 'Dr. Ariel López Rojas', date: '15/04/2026', expiredDate: '05/05/2026', asunto: 'Auditoría mensual de servidores Azure' }
    ],
    compartidosPorMi: [
      { id: 'v-3', name: 'Diagrama_Bloques_Cifrado.png', componentIcon: <IoImage />, size: '4.5 MB', security: 'Desbloqueado', owner: 'Alejandro (Tú)', date: '01/05/2026', expiredDate: '18/05/2026', asunto: 'Arquitectura criptográfica local AES-256 enviado a Héctor' }
    ]
  };
}

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
  const [vencidosConmigo, setVencidosConmigo] = useState([])
  const [vencidosPorMi, setVencidosPorMi] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
   const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchExpiredSharedData();
        setVencidosConmigo(result.compartidosConmigo);
        setVencidosPorMi(result.compartidosPorMi);
      } catch (err) {
        console.error("Error local al cargar elementos vencidos:", err);
        setError('No se pudieron cargar las políticas de archivos vencidos.');
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
      <main style={{ 
        paddingTop: '110px', paddingBottom: '60px', color: 'white',
        width: '100%', maxWidth: '1300px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' 
      }}>
        
        {/* Encabezado */}
        <section className="section-top" style={{ marginBottom: '35px', textAlign: 'left' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaHistory style={{ color: '#ff4d4f' }} /> Historial de Vencidos
            </h1>
          </div>
        </section>

        {isLoading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)' }}>Escaneando directivas de tiempo de vida (TTL)...</div>}
        {error && <div style={{ padding: '20px', backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', borderRadius: '8px' }}>{error}</div>}

        {!isLoading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '45px' }}>
            
            {/* =======================================================
                SECCIÓN 1: VENCIDOS COMPARTIDOS CONMIGO
               ======================================================= */}
            <section style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px', fontWeight: '600' }}>
                📥 Vencidos Compartidos Conmigo
              </h2>
              {vencidosConmigo.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  No tienes accesos inbound expirados.
                </div>
              ) : (
                <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {vencidosConmigo.map(item => (
                    <article 
                      key={item.id} 
                      className="file-card card-glow-plop" 
                      style={{ 
                        cursor: 'not-allowed', opacity: '0.55', position: 'relative',
                        backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px',
                        border: '1px solid rgba(255, 34, 45, 0.25)',
                        boxShadow: '0 0 10px rgba(245, 34, 45, 0.05)'
                      }}
                    >
                      {/* Capa de Bloqueo Visual Acceso Expirado */}
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(19, 25, 36, 0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <span style={{ backgroundColor: '#f5222d', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                          ACCESO CADUCADO
                        </span>
                      </div>

                      <div className="file-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        {/* 🌟 ICONO CORREGIDO A REACT ICONS */}
                        <span style={{ fontSize: '2rem', color: 'var(--color-text-medium)' }}>{item.componentIcon}</span>
                        <span style={{ fontSize: '0.75rem', color: '#f5222d', fontWeight: 'bold' }}>{item.size}</span>
                      </div>
                      
                      <div className="file-card-body">
                        <h3 title={item.name} style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', color: 'white', fontWeight: '600' }}>
                          {renderSecurityBadge(item.security)}
                          {item.name}
                        </h3>
                        <p style={{ margin: '6px 0 2px 0', fontSize: '0.85rem', color: 'var(--color-text-medium)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaUserCircle style={{ color: 'var(--color-accent)' }} /> De: {item.owner}
                        </p>
                        <small style={{ color: 'var(--color-text-medium)', display: 'block', fontSize: '0.78rem' }}>Enviado: {item.date}</small>
                        <small style={{ color: '#ff4d4f', display: 'block', fontWeight: '600', fontSize: '0.78rem', marginTop: '4px' }}>
                          Expiró el: {item.expiredDate}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* =======================================================
                SECCIÓN 2: VENCIDOS QUE COMPARTÍ
               ======================================================= */}
            <section style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px', fontWeight: '600' }}>
                📤 Vencidos que Compartí
              </h2>
              {vencidosPorMi.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  No tienes transferencias outbound expiradas.
                </div>
              ) : (
                <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {vencidosPorMi.map(item => (
                    <article 
                      key={item.id} 
                      className="file-card card-glow-plop" 
                      style={{ 
                        cursor: 'pointer', position: 'relative',
                        backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: 'var(--shadow-soft)'
                      }}
                      onClick={() => navigate(`/archivo/${item.id}`)}
                      title="Haz clic para gestionar políticas de renovación"
                    >
                      <div className="file-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        {/* 🌟 ICONO CORREGIDO A REACT ICONS */}
                        <span style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>{item.componentIcon}</span>
                        <button className="btn" style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: 'rgba(10, 63, 255, 0.15)', color: '#46A2FD', border: '1px solid rgba(10, 63, 255, 0.25)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaSyncAlt /> Renovar TTL
                        </button>
                      </div>
                      
                      <div className="file-card-body">
                        <h3 title={item.name} style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', color: 'white', fontWeight: '600' }}>
                          {renderSecurityBadge(item.security)}
                          {item.name}
                        </h3>
                        <p style={{ margin: '6px 0 2px 0', fontSize: '0.85rem', color: 'var(--color-text-medium)' }}>
                          Peso del archivo: {item.size}
                        </p>
                        <small style={{ color: 'var(--color-text-medium)', display: 'block', fontSize: '0.78rem' }}>Compartido el: {item.date}</small>
                        <small style={{ color: '#faad14', display: 'block', fontWeight: '600', fontSize: '0.78rem', marginTop: '4px' }}>
                          Revocado el: {item.expiredDate}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </main>
      
    </PrivateLayout>
  )
}