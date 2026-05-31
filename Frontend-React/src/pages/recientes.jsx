// src/pages/Recientes.jsx
import { useState, useEffect } from 'react';
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
  FaTrash
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

export default function Recientes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentFiles, setRecentFiles] = useState([]);
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

  // Cargar datos recientes
  const loadRecentFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar archivos personales recientes (últimos 30 días)
      const personalResult = await storageService.getRecentPersonalFiles(30);
      const personalFiles = personalResult.files || [];
      
      // Cargar archivos compartidos recientes (últimos 30 días)
      const sharedResult = await storageService.getRecentSharedFiles(30);
      const sharedFiles = sharedResult.files || [];
      
      // Combinar y formatear
      const formattedPersonal = personalFiles.map(file => ({
        id: file.id,
        shareId: null,
        type: 'personal',
        name: file.name,
        fileSize: file.fileSize,
        fileType: file.fileType,
        securityLevel: file.securityLevel,
        accessLevel: file.accessLevel,
        hasPassword: file.hasPassword,
        isUnlocked: file.isUnlocked,
        unlockedUntil: file.unlockedUntil,
        date: file.uploadedAt,
        isFolder: file.isFolder,
        sharedBy: null,
        sharedWith: null,
        expiresAt: null,
        icon: file.isFolder ? '📁' : null
      }));
      
      const formattedShared = sharedFiles.map(file => ({
        id: null,
        shareId: file.shareId,
        type: 'shared',
        name: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        securityLevel: file.securityLevel,
        accessLevel: file.accessLevel,
        hasPassword: file.hasPassword,
        isUnlocked: file.inUnlocked,
        unlockedUntil: file.unlockedUntil,
        date: file.sharedAt,
        isFolder: false,
        sharedBy: file.sharedBy,
        sharedWith: file.sharedWith,
        expiresAt: file.expiresAt,
        icon: null
      }));
      
      // Combinar y ordenar por fecha (más reciente primero)
      const allFiles = [...formattedPersonal, ...formattedShared];
      allFiles.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setRecentFiles(allFiles);
    } catch (err) {
      console.error('Error cargando recientes:', err);
      setError(err.response?.data?.error || 'Error al cargar archivos recientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentFiles();
    loadFavorites();
  }, []);

  // Mover a papelera
  const handleMoveToTrash = async (itemId, type) => {
    if (!window.confirm('Mover este elemento a la papelera?')) return;
    try {
      if (type === 'personal') {
        await storageService.deleteItem(itemId);
      }
      await loadRecentFiles();
      setElementoDetalle(null);
      setPanelMessage({ type: 'success', text: 'Elemento movido a la papelera' });
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  // Descargar archivo
  const handleDownload = async (item) => {
    try {
      let result;
      if (item.type === 'personal') {
        result = await storageService.downloadPersonalFile(item.id);
      } else {
        result = await fileShareService.downloadFile(item.shareId);
      }
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = item.name;
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
      let previewUrl = null;
      let downloadUrl = null;
      let canDownload = false;
      
      if (item.type === 'personal') {
        const previewResult = await storageService.getPreviewUrl(item.id);
        previewUrl = previewResult.previewUrl;
        canDownload = true;
        const downloadResult = await storageService.downloadPersonalFile(item.id);
        downloadUrl = downloadResult.downloadUrl;
      } else {
        const previewResult = await fileShareService.getPreviewUrl(item.shareId);
        previewUrl = previewResult.previewUrl;
        canDownload = item.accessLevel === 'DOWNLOAD';
        if (canDownload) {
          const downloadResult = await fileShareService.downloadFile(item.shareId);
          downloadUrl = downloadResult.downloadUrl;
        }
      }
      
      setViewerFile({
        id: item.id || item.shareId,
        name: item.name,
        fileName: item.name,
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

  // Renderizar tarjeta
  const renderRecentCard = (item) => {
    const isUnlocked = item.isUnlocked === true;
    const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
    const hasPassword = item.hasPassword === true;
    
    const fav = favoritos.find(f => 
      (f.itemId === item.id || f.itemId === item.shareId) && 
      f.type === (item.type === 'personal' ? 'PERSONAL' : 'SHARED')
    );
    const isFavorite = !!fav;
    
    return (
      <article 
        key={item.id || item.shareId} 
        onClick={() => setElementoDetalle(item)}
        style={{ 
          cursor: 'pointer', 
          backgroundColor: '#1D263C', 
          borderRadius: '12px', 
          padding: '20px', 
          border: elementoDetalle?.id === item.id || elementoDetalle?.shareId === item.shareId ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)',
          opacity: isExpired ? 0.6 : 1,
          position: 'relative',
          transition: 'all 0.2s'
        }}
      >
        {isExpired && (
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
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span style={{ fontSize: '2rem', color: '#46A2FD' }}>
            {item.isFolder ? '📁' : getFileIcon(item.fileType)}
          </span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '4px' }}>
            {item.accessLevel === 'DOWNLOAD' ? 'Descarga' : 'Solo vista'}
          </span>
        </div>
        
        <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', color: 'white' }}>
          {!isExpired && renderSecurityBadge(item.securityLevel, isUnlocked, hasPassword)}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
        </h3>
        
        <p style={{ margin: '6px 0 0 0', fontSize: '0.7rem', color: '#888' }}>
          {formatFileSize(item.fileSize)}
          {item.sharedBy && ` • ${item.sharedBy}`}
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <FaClock style={{ fontSize: '0.7rem', color: '#888' }} />
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#666' }}>
            {formatDate(item.date)}
          </p>
        </div>
        
        {item.expiresAt && !isExpired && (
          <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#faad14' }}>
            Expira {formatDate(item.expiresAt)}
          </p>
        )}
        
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
              const itemId = item.id || item.shareId;
              const type = item.type === 'personal' ? 'PERSONAL' : 'SHARED';
              handleToggleFavorite(itemId, type, isFavorite, fav?.favoriteId);
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMoveToTrash(item.id, item.type);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#f5222d',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
            title="Mover a papelera"
          >
            <FaTrash />
          </button>
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
          <h1 style={{ fontSize: '2rem', color: '#3C60E2' }}>Recientes</h1>
          <p style={{ color: '#888' }}>Archivos y carpetas que has abierto o modificado últimamente.</p>
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

        {/* Contenido principal con grid */}
        <div style={{ display: 'grid', gridTemplateColumns: elementoDetalle ? '1fr 380px' : '1fr', gap: '30px' }}>
          
          <section>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Cargando actividad reciente...</div>
            ) : recentFiles.length === 0 ? (
              <div style={{ 
                padding: '60px', 
                textAlign: 'center', 
                border: '1px dashed rgba(255,255,255,0.1)', 
                borderRadius: '12px' 
              }}>
                <FaClock style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                <p>No hay actividad reciente.</p>
                <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '8px' }}>
                  Sube archivos o comparte documentos para verlos aquí.
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '20px' 
              }}>
                {recentFiles.map(item => renderRecentCard(item))}
              </div>
            )}
          </section>

          {/* Panel de detalle lateral */}
          {elementoDetalle && (
            <FileDetailPanel
              file={{
                ...elementoDetalle,
                itemId: elementoDetalle.id || elementoDetalle.shareId,
                isPersonal: elementoDetalle.type === 'personal',
                tipo: elementoDetalle.type === 'personal' ? 'personal' : (elementoDetalle.sharedBy === 'Tú' ? 'enviado' : 'recibido'),
                name: elementoDetalle.name,
                fileName: elementoDetalle.name,
                fileSize: elementoDetalle.fileSize,
                fileType: elementoDetalle.fileType,
                securityLevel: elementoDetalle.securityLevel,
                accessLevel: elementoDetalle.accessLevel,
                hasPassword: elementoDetalle.hasPassword,
                isUnlocked: elementoDetalle.isUnlocked,
                inUnlocked: elementoDetalle.isUnlocked,
                unlockedUntil: elementoDetalle.unlockedUntil,
                sharedAt: elementoDetalle.date,
                uploadedAt: elementoDetalle.date,
                sharedBy: elementoDetalle.sharedBy,
                sharedWith: elementoDetalle.sharedWith,
                expiresAt: elementoDetalle.expiresAt,
                subject: null,
                message: null
              }}
              onClose={() => setElementoDetalle(null)}
              onRefresh={async () => {
                await loadRecentFiles();
                await loadFavorites();
              }}
              onDownload={() => handleDownload(elementoDetalle)}
              onView={() => handleOpenFile(elementoDetalle)}
              onMoveToTrash={() => handleMoveToTrash(elementoDetalle.id, elementoDetalle.type)}
              onToggleFavorite={async () => {
                const itemId = elementoDetalle.id || elementoDetalle.shareId;
                const type = elementoDetalle.type === 'personal' ? 'PERSONAL' : 'SHARED';
                const fav = favoritos.find(f => f.itemId === itemId && f.type === type);
                await handleToggleFavorite(itemId, type, !!fav, fav?.favoriteId);
                await loadFavorites();
              }}
              isFavorite={!!favoritos.find(f => {
                const itemId = elementoDetalle.id || elementoDetalle.shareId;
                const type = elementoDetalle.type === 'personal' ? 'PERSONAL' : 'SHARED';
                return f.itemId === itemId && f.type === type;
              })}
              showTrashButton={true}
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