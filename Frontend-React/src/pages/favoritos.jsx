// src/pages/Favoritos.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import FileDetailPanel from '../components/FileDetailPanel';
import FileViewerModal from '../components/FileViewerModal';
import storageService from '../services/storageService';
import fileShareService from '../services/fileShareService';

// React Icons
import { 
  FaFolderOpen, FaFileAlt, FaStar, FaRegStar, FaTrash, 
  FaUnlock, FaLock, FaShieldAlt, FaEye, FaDownload,
  FaClock, FaUser, FaFolder
} from 'react-icons/fa';
import { IoDocumentText, IoImage } from 'react-icons/io5';

// Mapa de colores para carpetas
const folderColorMap = {
  green: '#52c41a',
  yellow: '#faad14',
  red: '#f5222d',
  purple: '#722ed1',
  blue: '#0a3fff',
  orange: '#fa8c16',
  gray: '#888'
};

// Obtener color de carpeta
const getFolderColorHex = (folderColor) => {
  if (!folderColor) return folderColorMap.blue;
  return folderColorMap[folderColor] || folderColorMap.blue;
};

// Mapeo de íconos
const getFileIcon = (fileType = '', isFolder = false, folderColorHex = null) => {
  if (isFolder) {
    return <FaFolder style={{ fontSize: '1.5rem', color: folderColorHex || folderColorMap.blue }} />;
  }
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf') || type.includes('doc') || type.includes('txt') || type.includes('xls')) 
    return <IoDocumentText />;
  if (type.includes('image')) return <IoImage />;
  return <IoDocumentText />;
};

// Badge de seguridad
const renderSecurityBadge = (securityLevel, isUnlocked, hasPassword, isFolder = false) => {
  if (isFolder) {
    return <FaFolderOpen title="Carpeta" style={{ color: '#0a3fff', marginRight: '8px', minWidth: '16px' }} />;
  }
  if (!securityLevel || securityLevel === 'PUBLIC') {
    return <FaUnlock title="Público" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
  }
  if (securityLevel === 'PASSWORD') {
    if (isUnlocked) return <FaUnlock title="Desbloqueado" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
    return <FaLock title="Protegido con contraseña" style={{ color: '#faad14', marginRight: '8px', minWidth: '16px' }} />;
  }
  if (securityLevel === 'TOKEN_SMS') {
    if (isUnlocked) return <FaUnlock title="Desbloqueado" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
    return <FaShieldAlt title="Requiere verificación SMS" style={{ color: '#0a3fff', marginRight: '8px', minWidth: '16px' }} />;
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

export default function Favoritos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [elementoDetalle, setElementoDetalle] = useState(null);
  const [viewerFile, setViewerFile] = useState(null);
  const [panelMessage, setPanelMessage] = useState({ type: null, text: null });
  const [accionEnProceso, setAccionEnProceso] = useState(false);

  // Limpiar mensajes
  useEffect(() => {
    if (panelMessage.text) {
      const timer = setTimeout(() => setPanelMessage({ type: null, text: null }), 3000);
      return () => clearTimeout(timer);
    }
  }, [panelMessage]);

  // Cargar favoritos
  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await storageService.getFavorites();
      const items = result.favorites || [];
      
      // Ordenar por fecha de favorito (más reciente primero)
      items.sort((a, b) => new Date(b.favoritedAt) - new Date(a.favoritedAt));
      
      setFavorites(items);
    } catch (err) {
      console.error('Error cargando favoritos:', err);
      setError(err.response?.data?.error || 'Error al cargar favoritos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Eliminar de favoritos
  const handleRemoveFavorite = async (favoriteId, itemName) => {
    setAccionEnProceso(true);
    try {
      await storageService.removeFavorite(favoriteId);
      setPanelMessage({ type: 'success', text: `⭐ "${itemName}" eliminado de favoritos` });
      await loadFavorites();
      if (elementoDetalle?.favoriteId === favoriteId) {
        setElementoDetalle(null);
      }
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || `Error al eliminar de favoritos` });
    } finally {
      setAccionEnProceso(false);
    }
  };

  // Navegar a carpeta (redirige al Dashboard mostrando el contenido de la carpeta)
  const handleNavigateToFolder = (folderId, folderName, folderColor) => {
    // Guardar el color de la carpeta en sessionStorage para mantenerlo en el Dashboard
    if (folderColor) {
      sessionStorage.setItem(`folder_color_${folderId}`, folderColor);
    }
    // Redirigir al Dashboard con el parámetro de carpeta
    navigate(`/dashboard?carpeta=${folderId}&tab=miunidad`);
  };

  // Abrir archivo (muestra el panel lateral)
  const handleOpenFile = (item) => {
    if (item.isFolder) {
      // Si es carpeta, navegar a ella (mostrar su contenido)
      handleNavigateToFolder(item.itemId, item.name, item.folderColor);
    } else {
      // Si es archivo, mostrar el panel lateral
      setElementoDetalle(item);
    }
  };

  // Abrir visualizador después de desbloquear
  const handleViewFile = async (item) => {
    try {
      let previewUrl = null;
      let downloadUrl = null;
      let canDownload = false;
      
      if (item.type === 'PERSONAL') {
        const previewResult = await storageService.getPreviewUrl(item.itemId);
        previewUrl = previewResult.previewUrl;
        canDownload = true;
        const downloadResult = await storageService.downloadPersonalFile(item.itemId);
        downloadUrl = downloadResult.downloadUrl;
      } else {
        const previewResult = await fileShareService.getPreviewUrl(item.itemId);
        previewUrl = previewResult.previewUrl;
        canDownload = item.accessLevel === 'DOWNLOAD';
        if (canDownload) {
          const downloadResult = await fileShareService.downloadFile(item.itemId);
          downloadUrl = downloadResult.downloadUrl;
        }
        await fileShareService.viewFile(item.itemId);
      }
      
      setViewerFile({
        id: item.itemId,
        name: item.name,
        fileName: item.name,
        fileType: item.fileType,
        fileSize: item.fileSize,
        downloadUrl: canDownload ? downloadUrl : null,
        previewUrl: previewUrl
      });
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setPanelMessage({ type: 'error', text: errorMsg });
    }
  };

  // Descargar archivo
  const handleDownload = async (item) => {
    if (item.isFolder) {
      setPanelMessage({ type: 'error', text: 'No se pueden descargar carpetas completas' });
      return;
    }
    try {
      let result;
      if (item.type === 'PERSONAL') {
        result = await storageService.downloadPersonalFile(item.itemId);
      } else {
        result = await fileShareService.downloadFile(item.itemId);
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

  // Mover a papelera (solo para archivos personales)
  const handleMoveToTrash = async (item) => {
    if (item.type !== 'PERSONAL') {
      setPanelMessage({ type: 'error', text: 'No puedes mover archivos compartidos a la papelera' });
      return;
    }
    if (item.isFolder) {
      setPanelMessage({ type: 'error', text: 'No puedes mover carpetas completas a la papelera desde favoritos' });
      return;
    }
    if (!window.confirm(`¿Mover "${item.name}" a la papelera?`)) return;
    try {
      await storageService.deleteItem(item.itemId);
      await storageService.removeFavorite(item.favoriteId);
      setPanelMessage({ type: 'success', text: `📁 "${item.name}" movido a la papelera` });
      await loadFavorites();
      setElementoDetalle(null);
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
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

  // Renderizar tarjeta de favorito
  const renderFavoriteCard = (item) => {
    const isUnlocked = item.isUnlocked === true;
    const hasPassword = item.hasPassword === true;
    const isExpired = item.isExpired === true;
    const isPersonal = item.type === 'PERSONAL';
    const isFolder = item.isFolder === true;
    const folderColorHex = isFolder ? getFolderColorHex(item.folderColor) : null;
    
    return (
      <article 
        key={item.favoriteId} 
        onClick={() => handleOpenFile(item)}
        style={{ 
          cursor: 'pointer', 
          backgroundColor: '#1D263C', 
          borderRadius: '12px', 
          padding: '20px', 
          border: elementoDetalle?.favoriteId === item.favoriteId ? '2px solid #faad14' : '1px solid rgba(255,255,255,0.05)',
          opacity: isExpired ? 0.6 : 1,
          position: 'relative',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (isFolder && folderColorHex) {
            e.currentTarget.style.borderColor = folderColorHex;
          }
        }}
        onMouseLeave={(e) => {
          if (isFolder) {
            e.currentTarget.style.borderColor = elementoDetalle?.favoriteId === item.favoriteId ? '#faad14' : 'rgba(255,255,255,0.05)';
          }
        }}
      >
        {/* Badge de favorito */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#faad14',
          color: '#1D263C',
          fontSize: '0.7rem',
          padding: '4px 8px',
          borderRadius: '4px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <FaStar style={{ fontSize: '0.6rem' }} /> Favorito
        </div>
        
        {isExpired && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
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
          <span style={{ fontSize: '2rem' }}>
            {getFileIcon(item.fileType, isFolder, folderColorHex)}
          </span>
          {!isFolder && (
            <span style={{ 
              fontSize: '0.7rem', 
              backgroundColor: item.accessLevel === 'DOWNLOAD' ? 'rgba(82,196,26,0.15)' : 'rgba(255,197,61,0.15)',
              padding: '4px 8px', 
              borderRadius: '4px',
              color: item.accessLevel === 'DOWNLOAD' ? '#52c41a' : '#faad14'
            }}>
              {item.accessLevel === 'DOWNLOAD' ? 'Descarga' : 'Solo vista'}
            </span>
          )}
        </div>
        
        <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', color: 'white' }}>
          {!isExpired && renderSecurityBadge(item.securityLevel, isUnlocked, hasPassword, isFolder)}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
        </h3>
        
        {!isFolder && (
          <p style={{ margin: '6px 0 0 0', fontSize: '0.7rem', color: '#888' }}>
            {formatFileSize(item.fileSize)}
          </p>
        )}
        
        {!isPersonal && !isFolder && item.sharedBy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <FaUser style={{ fontSize: '0.7rem', color: '#666' }} />
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#666' }}>{item.sharedBy}</p>
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <FaClock style={{ fontSize: '0.7rem', color: '#666' }} />
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#666' }}>
            {isFolder ? 'Creada' : isPersonal ? 'Subido' : isExpired ? 'Expiró' : 'Recibido'} {formatDate(item.createdAt)}
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
              handleRemoveFavorite(item.favoriteId, item.name);
            }}
            disabled={accionEnProceso}
            style={{
              background: 'none',
              border: 'none',
              color: '#f5222d',
              cursor: accionEnProceso ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(245,34,45,0.1)',
              opacity: accionEnProceso ? 0.6 : 1
            }}
            title="Quitar de favoritos"
          >
            <FaRegStar /> Quitar
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
          <h1 style={{ fontSize: '2rem', color: '#faad14', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaStar /> Favoritos
          </h1>
          <p style={{ color: '#888' }}>Archivos y carpetas que has marcado como favoritos para acceso rápido.</p>
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '8px' }}>
            💡 Las carpetas favoritas conservan su color original y al hacer clic te llevan directamente a su contenido.
          </p>
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

        {/* Contenido principal con grid para panel lateral */}
        <div style={{ display: 'grid', gridTemplateColumns: elementoDetalle ? '1fr 380px' : '1fr', gap: '30px' }}>
          
          <section>
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Cargando favoritos...</div>
            ) : favorites.length === 0 ? (
              <div style={{ 
                padding: '60px 20px', 
                textAlign: 'center', 
                border: '1px dashed rgba(255,255,255,0.1)', 
                borderRadius: '16px' 
              }}>
                <FaStar style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.5, color: '#888' }} />
                <h3 style={{ color: 'white', marginBottom: '8px' }}>No hay favoritos</h3>
                <p style={{ color: '#888' }}>
                  Marca archivos o carpetas como favoritos haciendo clic en la estrella ⭐ 
                  para que aparezcan aquí.
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '20px' 
              }}>
                {favorites.map(item => renderFavoriteCard(item))}
              </div>
            )}
          </section>

          {/* Panel de detalle lateral (solo para archivos, no para carpetas) */}
          {elementoDetalle && !elementoDetalle.isFolder && (
            <FileDetailPanel
              file={{
                ...elementoDetalle,
                itemId: elementoDetalle.itemId,
                shareId: elementoDetalle.type === 'SHARED' ? elementoDetalle.itemId : null,
                isPersonal: elementoDetalle.type === 'PERSONAL',
                tipo: elementoDetalle.type === 'PERSONAL' ? 'personal' : 'recibido',
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
                sharedAt: elementoDetalle.createdAt,
                uploadedAt: elementoDetalle.createdAt,
                sharedBy: elementoDetalle.sharedBy,
                expiresAt: elementoDetalle.isExpired ? new Date() : null,
                subject: null,
                message: null
              }}
              onClose={() => setElementoDetalle(null)}
              onRefresh={async () => {
                await loadFavorites();
              }}
              onDownload={() => handleDownload(elementoDetalle)}
              onView={() => handleViewFile(elementoDetalle)}
              onMoveToTrash={() => handleMoveToTrash(elementoDetalle)}
              showTrashButton={elementoDetalle.type === 'PERSONAL'}
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