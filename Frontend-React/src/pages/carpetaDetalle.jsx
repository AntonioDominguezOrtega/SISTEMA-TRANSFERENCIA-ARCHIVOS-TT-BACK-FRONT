import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import DetallesModal from '../components/DetallesModal'

import { 
  FaFolderOpen, FaLock, FaUnlock, FaShieldAlt, FaChevronLeft, 
  FaUpload, FaShareAlt, FaSortAmountDown 
} from 'react-icons/fa'
import { IoDocumentText, IoBarChart, IoImage } from 'react-icons/io5'

const renderSecurityBadge = (status) => {
  if (status === 'password' || status === 'Bloqueado') {
    return <FaLock title="Bloqueado con contraseña" style={{ color: '#faad14', marginRight: '6px' }} />;
  }
  if (status === 'encrypted' || status === 'Cifrado') {
    return <FaShieldAlt title="Cifrado de alto nivel" style={{ color: '#0a3fff', marginRight: '6px' }} />;
  }
  return <FaUnlock title="Desbloqueado" style={{ color: '#52c41a', marginRight: '6px' }} />;
}

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

  const obtenerContenidoOrdenado = () => {
    if (!folderData || !folderData.contents) return [];
    
    // Hacemos una copia superficial del arreglo para no mutar el estado original directamente
    const listaClonada = [...folderData.contents];

    if (criterioOrden === 'nombre') {
      // Ordenamiento Alfabético A-Z por propiedad name
      return listaClonada.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (criterioOrden === 'tamano') {
      // Ordenamiento por Peso del archivo (De mayor a menor tamaño)
      return listaClonada.sort((a, b) => b.sizeInBytes - a.sizeInBytes);
    }
    return listaClonada;
  };

  const handleCardClick = (type, itemId) => {
    navigate(type === 'folder' ? `/carpeta/${itemId}` : `/archivo/${itemId}`)
  }

  return (
    <PrivateLayout>
      {/* Contenedor central limitado al 100% de pantalla para evitar desparrames de cajas */}
      <main style={{ 
        paddingTop: '110px', paddingBottom: '60px', color: 'white',
        width: '100%', maxWidth: '1300px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px'
      }}>
        
        {/* Barra Superior de Herramientas Contextuales */}
        <section className="section-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={{ background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
            >
              <FaChevronLeft /> Volver al espacio raíz
            </button>
            
            <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              {folderData ? folderData.name : 'Cargando directorio...'}
            </h1>
            
            {folderData && (
              <p style={{ color: 'var(--color-text-medium)', fontSize: '0.9rem', marginTop: '6px' }}>
                Estructura creada: {folderData.createdAt} • Volumen total: {folderData.totalSize}
              </p>
            )}
          </div>

          {/* Botonera y Selector de Ordenamiento estilo Google Drive */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            
            {/* 🌟 SELECTOR DE ORDENAMIENTO EN VIVO */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <FaSortAmountDown style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} />
              <select
                value={criterioOrden}
                onChange={(e) => setCriterioOrden(e.target.value)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.9rem', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
              >
                <option value="nombre" style={{ backgroundColor: 'var(--color-dark)' }}>Ordenar por: Nombre (A-Z)</option>
                <option value="tamano" style={{ backgroundColor: 'var(--color-dark)' }}>Ordenar por: Mayor Tamaño</option>
              </select>
            </div>

            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate(`/subir-archivo?carpeta=${id}`)}>
              <FaUpload /> + Subir aquí
            </button>
          </div>
        </section>

        {isLoading && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)' }}>Descifrando índice de archivos...</div>}
        {error && <div style={{ padding: '20px', backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', borderRadius: '8px' }}>{error}</div>}

        {!isLoading && !error && folderData && (
          /* Rejilla de división dinámia si el inspector lateral está abierto */
          <div style={{ display: 'grid', gridTemplateColumns: elementoDetalle ? '1fr 350px' : '1fr', gap: '30px', transition: 'all 0.4s ease' }}>
            
            {/* GRID DE ELEMENTOS CONTENIDOS */}
            <section style={{ textAlign: 'left' }}>
              <h3 style={{ color: 'var(--color-text-medium)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '20px' }}>
                Elementos guardados en este directorio ({folderData.contents.length})
              </h3>

              {folderData.contents.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  Esta carpeta de resguardo se encuentra vacía.
                </div>
              ) : (
                <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: '20px' }}>
                  {obtenerContenidoOrdenado().map(item => (
                    
                    /* TARJETA DE VISTA PREVIA CON FILTROS DE DISEÑO */
                    <article 
                      key={item.id} 
                      className={`file-card card-glow-plop ${elementoDetalle?.id === item.id ? 'active-inspect' : ''}`}
                      onClick={() => item.type === 'folder' ? handleCardClick(item.type, item.id) : setElementoDetalle(item)} 
                      style={{ 
                        cursor: 'pointer', backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px',
                        border: elementoDetalle?.id === item.id ? '1px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)',
                        boxShadow: elementoDetalle?.id === item.id ? '0 0 15px rgba(10, 63, 255, 0.3)' : 'var(--shadow-soft)'
                      }}
                    >
                      <div className="file-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>{item.componentIcon}</span>
                        <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-text-medium)', fontWeight: '500' }}>
                          {item.acceso}
                        </span>
                      </div>
                      
                      <div className="file-card-body">
                        <h3 title={item.name} style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', color: 'white', fontWeight: '600' }}>
                          {renderSecurityBadge(item.security)}
                          {item.name}
                        </h3>
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-medium)' }}>{item.size}</p>
                      </div>
                    </article>

                  ))}
                </div>
              )}
            </section>

            {/* =======================================================
                🌟 INSPECTOR DE DETALLES LATERAL INTEGRADO
               ======================================================= */}
            {elementoDetalle && (
              <aside className="card-glow-plop" style={{ 
                backgroundColor: '#1D263C', borderRadius: '15px', border: '1px solid #0a3fff', padding: '24px', 
                boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)', alignSelf: 'start', position: 'sticky', top: '130px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-accent)' }}>Detalles de Archivo</h3>
                  <button onClick={() => setElementoDetalle(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left', fontSize: '0.9rem' }}>
                  <div>
                    <label style={{ color: 'var(--color-text-medium)', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>Nombre del archivo</label>
                    <strong style={{ color: 'white', wordBreak: 'break-all' }}>{elementoDetalle.name}</strong>
                  </div>
                  <div>
                    <label style={{ color: 'var(--color-text-medium)', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>Quién lo envió</label>
                    <span style={{ color: 'white', fontWeight: '500' }}>{elementoDetalle.remitente}</span>
                  </div>
                  <div>
                    <label style={{ color: 'var(--color-text-medium)', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>Fecha de transferencia</label>
                    <span style={{ color: 'white' }}>{elementoDetalle.fecha}</span>
                  </div>
                  <div>
                    <label style={{ color: 'var(--color-text-medium)', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>Fecha de expiración</label>
                    <span style={{ color: '#ff4d4f', fontWeight: '600' }}>{elementoDetalle.expiracion}</span>
                  </div>
                  <div>
                    <label style={{ color: 'var(--color-text-medium)', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>Asunto</label>
                    <p style={{ color: 'var(--color-text-light)', margin: 0, lineHeight: '1.4' }}>{elementoDetalle.asunto}</p>
                  </div>
                  <div>
                    <label style={{ color: 'var(--color-text-medium)', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>Estado de protección</label>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontWeight: '500' }}>
                      {renderSecurityBadge(elementoDetalle.security)}
                      {elementoDetalle.security === 'public' || elementoDetalle.security === 'Desbloqueado' ? 'Desbloqueado' : 'Bloqueado por Criptografía'}
                    </span>
                  </div>
                  <div>
                    <label style={{ color: 'var(--color-text-medium)', fontSize: '0.78rem', display: 'block', marginBottom: '2px' }}>Nivel de acceso</label>
                    <span style={{ 
                      display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold',
                      backgroundColor: elementoDetalle.acceso === 'Descarga' ? 'rgba(82, 196, 26, 0.15)' : 'rgba(255, 197, 61, 0.15)',
                      color: elementoDetalle.acceso === 'Descarga' ? '#52c41a' : '#faad14'
                    }}>
                      Permiso de {elementoDetalle.acceso}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '25px' }}>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }} onClick={() => alert(`Procesando acción cifrada de ${elementoDetalle.acceso.toLowerCase()}...`)}>
                    {elementoDetalle.acceso === 'Descarga' ? '📥 Descargar Documento' : '👁️ Ver Vista Previa'}
                  </button>
                </div>
              </aside>
            )}

          </div>
        )}
      </main>
      {/* 🌟 CORRECCIÓN: Quitamos la etiqueta manual de Footer para solucionar el doble renderizado */}
    </PrivateLayout>
  )
}