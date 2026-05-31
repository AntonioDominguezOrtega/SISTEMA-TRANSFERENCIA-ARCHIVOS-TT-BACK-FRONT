// src/pages/Compartidos.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import FileDetailPanel from '../components/FileDetailPanel';
import FileViewerModal from '../components/FileViewerModal';
import storageService from '../services/storageService';
import fileShareService from '../services/fileShareService';

// React Icons
import { 
  FaFolderOpen, FaFileAlt, FaClock, FaUnlock, FaLock, 
  FaShieldAlt, FaEye, FaDownload, FaStar, FaRegStar,
  FaTrash, FaExclamationTriangle, FaUser, FaCalendarAlt
} from 'react-icons/fa';
import { IoDocumentText, IoImage } from 'react-icons/io5';

// Mapeo de íconos
const getFileIcon = (fileType = '') => {
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf') || type.includes('doc') || type.includes('txt') || type.includes('xls')) 
    return <IoDocumentText />;
  if (type.includes('image')) return <IoImage />;
  return <IoDocumentText />;
};

// Badge de seguridad
const renderSecurityBadge = (securityLevel, isUnlocked, hasPassword) => {
  if (!securityLevel || securityLevel === 'PUBLIC') {
    return <FaUnlock title="Público" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
  }
  if (securityLevel === 'PASSWORD') {
    if (isUnlocked) return <FaUnlock title="Desbloqueado" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
    return <FaLock title="Protegido con contraseña" style={{ color: '#faad14', marginRight: '8px', minWidth: '16px' }} />;
  }
  if (securityLevel === 'TOKEN_SMS') {
    if (isUnlocked) return <FaUnlock title="Desbloqueado" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
    return <FaShieldAlt title="Requiere verificación por correo" style={{ color: '#0a3fff', marginRight: '8px', minWidth: '16px' }} />;
  }
  return null;
};

// Formatear tamaño
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Formatear fecha
const formatDate = (dateStr) => {
  if (!dateStr) return 'Fecha no disponible';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Justo ahora';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Formatear fecha completa
const formatFullDate = (dateStr) => {
  if (!dateStr) return 'No disponible';
  return new Date(dateStr).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Compartidos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFiles, setActiveFiles] = useState([]);
  const [expiredFiles, setExpiredFiles] = useState([]);
  const [elementoDetalle, setElementoDetalle] = useState(null);
  const [viewerFile, setViewerFile] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [panelMessage, setPanelMessage] = useState({ type: null, text: null });

  // Limpiar mensajes
  useEffect(() => {
    if (panelMessage.text) {
      const timer = setTimeout(() => setPanelMessage({ type: null, text: null }), 3000);
      return () => clearTimeout(timer);
    }
  }, [panelMessage]);

  // Cargar favoritos
  const loadFavorites = async () => {
    try {
      const result = await storageService.getFavorites();
      setFavoritos(result.favorites || []);
    } catch (err) {
      console.error('Error cargando favoritos:', err);
    }
  };

  // Alternar favorito
  const handleToggleFavorite = async (itemId, type, isCurrentlyFavorite, favoriteId) => {
    try {
      if (isCurrentlyFavorite) {
        await storageService.removeFavorite(favoriteId);
      } else {
        await storageService.addFavorite(itemId, type);
      }
      await loadFavorites();
      setPanelMessage({ type: 'success', text: isCurrentlyFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos' });
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  // Cargar datos
  const loadSharedFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar archivos activos (compartidos conmigo que no han expirado)
      const activeResult = await storageService.getSharedWithMe(0, 50);
      const activeList = activeResult.files || [];
      
      // Filtrar solo los que no han expirado
      const now = new Date();
      const validActive = activeList.filter(file => {
        if (!file.expiresAt) return true;
        return new Date(file.expiresAt) > now;
      });
      
      // Cargar archivos expirados
      const expiredResult = await storageService.getExpiredShares();
      const expiredList = expiredResult.expired || [];
      
      setActiveFiles(validActive);
      setExpiredFiles(expiredList);
    } catch (err) {
      console.error('Error cargando archivos compartidos:', err);
      setError(err.response?.data?.error || 'Error al cargar archivos compartidos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSharedFiles();
    loadFavorites();
  }, [loadSharedFiles]);

  // Mover a papelera (solo para archivos personales, no aplica para compartidos)
  const handleMoveToTrash = async (itemId) => {
    if (!window.confirm('Mover este elemento a la papelera?')) return;
    try {
      await storageService.deleteItem(itemId);
      await loadSharedFiles();
      setElementoDetalle(null);
      setPanelMessage({ type: 'success', text: 'Elemento movido a la papelera' });
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  // Descargar archivo (solo si tiene permiso)
  const handleDownload = async (item) => {
    if (item.accessLevel !== 'DOWNLOAD') {
      setPanelMessage({ type: 'error', text: 'No tienes permiso para descargar este archivo' });
      return;
    }
    try {
      const result = await fileShareService.downloadFile(item.shareId);
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = item.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  // Abrir/Visualizar archivo
  const handleOpenFile = async (item) => {
    try {
      const previewResult = await fileShareService.getPreviewUrl(item.shareId);
      const previewUrl = previewResult.previewUrl;
      const canDownload = item.accessLevel === 'DOWNLOAD';
      
      let downloadUrl = null;
      if (canDownload) {
        const downloadResult = await fileShareService.downloadFile(item.shareId);
        downloadUrl = downloadResult.downloadUrl;
      }
      
      // Marcar como visto
      await fileShareService.viewFile(item.shareId);
      
      setViewerFile({
        id: item.shareId,
        name: item.fileName,
        fileName: item.fileName,
        fileType: item.fileType,
        fileSize: item.fileSize,
        downloadUrl: canDownload ? downloadUrl : null,
        previewUrl: previewUrl
      });
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg.includes('bloqueado') || errorMsg.includes('desbloquear')) {
        setElementoDetalle(item);
      } else {
        setPanelMessage({ type: 'error', text: errorMsg });
      }
    }
  };

  const handleDownloadFromViewer = () => {
    if (viewerFile?.downloadUrl) {
      const link = document.createElement('a');
      link.href = viewerFile.downloadUrl;
      link.download = viewerFile.name || 'archivo';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Renderizar tarjeta de archivo activo
  const renderActiveCard = (item) => {
    const isUnlocked = item.inUnlocked === true;
    const hasPassword = item.hasPassword === true;
    
    const fav = favoritos.find(f => f.itemId === item.shareId && f.type === 'SHARED');
    const isFavorite = !!fav;
    
    return (
      <article 
        key={item.shareId} 
        onClick={() => setElementoDetalle(item)}
        style={{ 
          cursor: 'pointer', 
          backgroundColor: '#1D263C', 
          borderRadius: '12px', 
          padding: '20px', 
          border: elementoDetalle?.shareId === item.shareId ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)',
          transition: 'all 0.2s',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span style={{ fontSize: '2rem', color: '#46A2FD' }}>{getFileIcon(item.fileType)}</span>
          <span style={{ 
            fontSize: '0.7rem', 
            backgroundColor: item.accessLevel === 'DOWNLOAD' ? 'rgba(82,196,26,0.15)' : 'rgba(255,197,61,0.15)',
            padding: '4px 8px', 
            borderRadius: '4px',
            color: item.accessLevel === 'DOWNLOAD' ? '#52c41a' : '#faad14'
          }}>
            {item.accessLevel === 'DOWNLOAD' ? 'Descarga' : 'Solo vista'}
          </span>
        </div>
        
        <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', color: 'white' }}>
          {renderSecurityBadge(item.securityLevel, isUnlocked, hasPassword)}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.fileName}</span>
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <FaUser style={{ fontSize: '0.7rem', color: '#888' }} />
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>{item.sharedBy}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <FaCalendarAlt style={{ fontSize: '0.7rem', color: '#888' }} />
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#666' }}>
            Recibido {formatDate(item.sharedAt)}
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '15px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(item.shareId, 'SHARED', isFavorite, fav?.favoriteId);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: isFavorite ? '#faad14' : '#888',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {isFavorite ? <FaStar /> : <FaRegStar />}
          </button>
        </div>
      </article>
    );
  };

  // Renderizar tarjeta de archivo expirado
  const renderExpiredCard = (item) => {
    return (
      <article 
        key={item.shareId} 
        style={{ 
          cursor: 'not-allowed', 
          backgroundColor: '#2a2a3a', 
          borderRadius: '12px', 
          padding: '20px', 
          border: '1px solid rgba(245,34,45,0.3)',
          opacity: 0.7,
          position: 'relative',
          transition: 'all 0.2s'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#f5222d',
          color: 'white',
          fontSize: '0.7rem',
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          EXPIRADO
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span style={{ fontSize: '2rem', color: '#888' }}>{getFileIcon(item.fileType)}</span>
          <span style={{ 
            fontSize: '0.7rem', 
            backgroundColor: 'rgba(255,255,255,0.1)',
            padding: '4px 8px', 
            borderRadius: '4px',
            color: '#888'
          }}>
            {item.accessLevel === 'DOWNLOAD' ? 'Descarga' : 'Solo vista'}
          </span>
        </div>
        
        <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', color: '#aaa' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.fileName}</span>
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <FaUser style={{ fontSize: '0.7rem', color: '#666' }} />
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>{item.sharedBy}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <FaCalendarAlt style={{ fontSize: '0.7rem', color: '#666' }} />
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#666' }}>
            Compartido {formatDate(item.sharedAt)}
          </p>
        </div>
        
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(245,34,45,0.1)', borderRadius: '6px' }}>
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#f5222d' }}>
            ⚠️ Expirado el {formatFullDate(item.expiredAt)}
          </p>
        </div>
      </article>
    );
  };

  const isLoading = loading;

  return (
    <PrivateLayout>
      <main style={{ 
        paddingTop: '110px', 
        paddingBottom: '60px', 
        maxWidth: '1300px', 
        margin: '0 auto', 
        paddingLeft: '20px', 
        paddingRight: '20px' 
      }}>
        
        {/* Header */}
        <div style={{ marginBottom: '35px' }}>
          <h1 style={{ fontSize: '2rem', color: '#3C60E2' }}>Compartidos conmigo</h1>
          <p style={{ color: '#888' }}>Archivos y carpetas que otros usuarios han compartido contigo.</p>
        </div>

        {/* Mensajes */}
        {error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'rgba(245, 34, 45, 0.15)', 
            color: '#f5222d', 
            border: '1px solid rgba(245, 34, 45, 0.2)', 
            borderRadius: '10px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}
        
        {panelMessage.text && panelMessage.type === 'success' && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'rgba(82,196,26,0.15)', 
            color: '#52c41a', 
            border: '1px solid rgba(82,196,26,0.2)', 
            borderRadius: '10px', 
            marginBottom: '20px' 
          }}>
            {panelMessage.text}
          </div>
        )}
        
        {panelMessage.text && panelMessage.type === 'error' && !error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'rgba(245, 34, 45, 0.15)', 
            color: '#f5222d', 
            border: '1px solid rgba(245, 34, 45, 0.2)', 
            borderRadius: '10px', 
            marginBottom: '20px' 
          }}>
            {panelMessage.text}
          </div>
        )}

        {/* Contenido principal */}
        <div style={{ display: 'grid', gridTemplateColumns: elementoDetalle ? '1fr 380px' : '1fr', gap: '30px' }}>
          
          <section>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Cargando archivos compartidos...</div>
            ) : (
              <>
                {/* Sección de Archivos Activos */}
                <div style={{ marginBottom: '48px' }}>
                  <h2 style={{ 
                    fontSize: '1.3rem', 
                    color: '#52c41a', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#52c41a', borderRadius: '50%' }}></span>
                    Archivos Activos
                  </h2>
                  
                  {activeFiles.length === 0 ? (
                    <div style={{ 
                      padding: '40px', 
                      textAlign: 'center', 
                      border: '1px dashed rgba(255,255,255,0.1)', 
                      borderRadius: '12px' 
                    }}>
                      <FaFileAlt style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                      <p>No hay archivos activos compartidos contigo.</p>
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                      gap: '20px' 
                    }}>
                      {activeFiles.map(item => renderActiveCard(item))}
                    </div>
                  )}
                </div>

                {/* Sección de Permisos Vencidos */}
                {expiredFiles.length > 0 && (
                  <div style={{ 
                    backgroundColor: 'rgba(245,34,45,0.05)', 
                    border: '1px solid rgba(245,34,45,0.2)', 
                    borderRadius: '16px', 
                    padding: '24px' 
                  }}>
                    <h2 style={{ 
                      fontSize: '1.3rem', 
                      color: '#f5222d', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FaExclamationTriangle /> Permisos Vencidos
                    </h2>
                    <p style={{ color: '#f5222d', marginBottom: '20px', fontSize: '0.85rem' }}>
                      Los siguientes archivos ya no están disponibles porque sus permisos de acceso han expirado.
                    </p>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                      gap: '20px' 
                    }}>
                      {expiredFiles.map(item => renderExpiredCard(item))}
                    </div>
                    
                    <p style={{ 
                      marginTop: '20px', 
                      fontSize: '0.85rem', 
                      color: '#f5222d',
                      padding: '12px',
                      backgroundColor: 'rgba(245,34,45,0.1)',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      💡 <strong>Consejo:</strong> Puedes solicitar al propietario que renueve tu acceso a estos archivos.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Panel de detalle lateral */}
          {elementoDetalle && (
            <FileDetailPanel
              file={{
                ...elementoDetalle,
                itemId: elementoDetalle.shareId,
                shareId: elementoDetalle.shareId,
                isPersonal: false,
                tipo: 'recibido',
                name: elementoDetalle.fileName,
                fileName: elementoDetalle.fileName,
                fileSize: elementoDetalle.fileSize,
                fileType: elementoDetalle.fileType,
                securityLevel: elementoDetalle.securityLevel,
                accessLevel: elementoDetalle.accessLevel,
                hasPassword: elementoDetalle.hasPassword,
                isUnlocked: elementoDetalle.inUnlocked,
                inUnlocked: elementoDetalle.inUnlocked,
                unlockedUntil: elementoDetalle.unlockedUntil,
                sharedAt: elementoDetalle.sharedAt,
                sharedBy: elementoDetalle.sharedBy,
                sharedWith: elementoDetalle.sharedWith,
                expiresAt: elementoDetalle.expiresAt,
                subject: elementoDetalle.subject,
                message: elementoDetalle.message,
                viewCount: elementoDetalle.viewCount,
                downloadCount: elementoDetalle.donwloadCount
              }}
              onClose={() => setElementoDetalle(null)}
              onRefresh={async () => {
                await loadSharedFiles();
                await loadFavorites();
              }}
              onDownload={() => handleDownload(elementoDetalle)}
              onView={() => handleOpenFile(elementoDetalle)}
              showTrashButton={false}
              isInTrash={false}
            />
          )}
        </div>

        {/* Modal visualizador de archivos */}
        <FileViewerModal
          isOpen={!!viewerFile}
          onClose={() => setViewerFile(null)}
          file={viewerFile}
          onDownload={handleDownloadFromViewer}
        />
      </main>
    </PrivateLayout>
  );
}