import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import api from '../services/api'
import FileViewerModal from '../components/FileViewerModal';
import storageService from '../services/storageService';
import { FaLock, FaUnlock, FaShieldAlt, FaHistory, FaUserCircle, FaSyncAlt } from 'react-icons/fa'
import { IoDocumentText, IoBarChart, IoImage } from 'react-icons/io5'

const renderSecurityBadge = (status) => {
  if (status === 'PASSWORD') {
    return <FaLock title="Bloqueado con contraseña" style={{ color: '#faad14', marginRight: '8px' }} />;
  }
  if (status === 'TOKEN_SMS') {
    return <FaShieldAlt title="Protegido por SMS" style={{ color: '#0a3fff', marginRight: '8px' }} />;
  }
  return <FaUnlock title="Público" style={{ color: '#52c41a', marginRight: '8px' }} />;
}

// Función para asignar un icono dependiendo de la extensión
const getFileIcon = (fileName) => {
  if (!fileName) return <IoDocumentText />;
  const ext = fileName.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return <IoImage />;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return <IoBarChart />;
  return <IoDocumentText />;
}

export default function Compartidos() {
  const navigate = useNavigate()
  const [vencidosConmigo, setVencidosConmigo] = useState([])
  const [vencidosPorMi, setVencidosPorMi] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // 1. CARGA REAL DESDE EL BACKEND
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Ajusta esta ruta a los endpoints reales que hayas creado en tu Spring Boot
        const responseConmigo = await api.get('/storage/shared-with-me/expired');
        const responsePorMi = await api.get('/storage/shared-by-me/expired');
        
        setVencidosConmigo(responseConmigo.data || []);
        setVencidosPorMi(responsePorMi.data || []);
      } catch (err) {
        console.error("Error al cargar elementos vencidos:", err);
        setError('No tienes archivos expirados.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [])

  // 2. FUNCIÓN REAL PARA RENOVAR
  const handleRenovarTTL = async (e, shareId) => {
    e.stopPropagation(); // Evita que se abra el archivo al hacer clic en el botón
    
    if(!window.confirm("¿Deseas extender el acceso a este archivo por 24 horas más?")) return;

    try {
      // Ajusta la ruta a tu endpoint de renovación en Java
      await api.put(`/storage/share/${shareId}/renew`); 
      alert("¡Tiempo de vida renovado exitosamente!");
      
      // Recargar la lista para que desaparezca de los "vencidos"
      setVencidosPorMi(prev => prev.filter(item => item.id !== shareId));
    } catch (err) {
      console.error(err);
      alert("Error al intentar renovar el acceso.");
    }
  }

  return (
    <PrivateLayout>
      <main style={{ 
        paddingTop: '110px', paddingBottom: '60px', color: 'white',
        width: '100%', maxWidth: '1300px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' 
      }}>
        
        <section className="section-top" style={{ marginBottom: '35px', textAlign: 'left' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaHistory style={{ color: '#ff4d4f' }} /> Historial de Vencidos
            </h1>
          </div>
        </section>

        {isLoading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)' }}>Escaneando archivos expirados...</div>}
        {error && <div style={{ padding: '20px', backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', borderRadius: '8px' }}>{error}</div>}

        {!isLoading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '45px' }}>
            
            {/* SECCIÓN 1: VENCIDOS COMPARTIDOS CONMIGO */}
            <section style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px', fontWeight: '600' }}>
                📥 Vencidos Compartidos Conmigo
              </h2>
              {vencidosConmigo.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  No tienes accesos expirados.
                </div>
              ) : (
                <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {vencidosConmigo.map(item => (
                    <article 
                      key={item.id} 
                      style={{ 
                        cursor: 'not-allowed', opacity: '0.55', position: 'relative',
                        backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px',
                        border: '1px solid rgba(255, 34, 45, 0.25)'
                      }}
                    >
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(19, 25, 36, 0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <span style={{ backgroundColor: '#f5222d', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.78rem' }}>
                          ACCESO CADUCADO
                        </span>
                      </div>

                      <div className="file-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '2rem', color: 'var(--color-text-medium)' }}>
                          {getFileIcon(item.fileName)}
                        </span>
                      </div>
                      
                      <div className="file-card-body">
                        <h3 style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', color: 'white' }}>
                          {renderSecurityBadge(item.securityLevel)}
                          {item.fileName}
                        </h3>
                        <p style={{ margin: '6px 0 2px 0', fontSize: '0.85rem', color: 'var(--color-text-medium)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaUserCircle style={{ color: 'var(--color-accent)' }} /> De: {item.sharedByUsername || 'Usuario'}
                        </p>
                        <small style={{ color: '#ff4d4f', display: 'block', fontWeight: '600', fontSize: '0.78rem', marginTop: '4px' }}>
                          Expiró el: {new Date(item.expiresAt).toLocaleDateString()}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* SECCIÓN 2: VENCIDOS QUE COMPARTÍ */}
            <section style={{ textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '8px', fontWeight: '600' }}>
                📤 Vencidos que Compartí
              </h2>
              {vencidosPorMi.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  No tienes transferencias expiradas.
                </div>
              ) : (
                <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {vencidosPorMi.map(item => (
                    <article 
                      key={item.id} 
                      onClick={() => navigate(`/archivo/${item.fileId}`)}
                      style={{ 
                        cursor: 'pointer', position: 'relative',
                        backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="file-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>
                          {getFileIcon(item.fileName)}
                        </span>
                        
                        {/* BOTÓN CON ACCIÓN REAL */}
                        <button 
                          onClick={(e) => handleRenovarTTL(e, item.id)}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: 'rgba(10, 63, 255, 0.15)', color: '#46A2FD', border: '1px solid rgba(10, 63, 255, 0.25)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', borderRadius: '6px' }}
                        >
                          <FaSyncAlt /> Renovar TTL
                        </button>
                      </div>
                      
                      <div className="file-card-body">
                        <h3 style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', color: 'white' }}>
                          {renderSecurityBadge(item.securityLevel)}
                          {item.fileName}
                        </h3>
                        <p style={{ margin: '6px 0 2px 0', fontSize: '0.85rem', color: 'var(--color-text-medium)' }}>
                          Compartido con: {item.sharedWithUsername || item.sharedWithEmail}
                        </p>
                        <small style={{ color: '#faad14', display: 'block', fontWeight: '600', fontSize: '0.78rem', marginTop: '4px' }}>
                          Caducó el: {new Date(item.expiresAt).toLocaleDateString()}
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