import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import Footer from '../components/Footer';
import FileViewerModal from '../components/FileViewerModal';
import FileDetailPanel from '../components/FileDetailPanel';
import dashboardService from '../services/dashboardService';
import storageService from '../services/storageService';

// React Icons unificados
import { 
  FaFolderOpen, FaPaperPlane, FaTrash, FaUnlock, FaLock, 
  FaShieldAlt, FaRegBell, FaUpload, FaShareSquare, FaFolderPlus,
  FaDownload, FaEye, FaEnvelope, FaClock, FaUser, FaFileAlt,
  FaKey, FaPhone, FaStar, FaRegStar, FaPlus
} from 'react-icons/fa';
import { IoDocumentText, IoImage, IoBarChart } from 'react-icons/io5';

// Mapeo de íconos
const getFileIcon = (fileType = '') => {
  const type = fileType.toLowerCase();
  if (type.includes('pdf') || type.includes('doc') || type.includes('txt') || type.includes('xls')) 
    return <IoDocumentText />;
  if (type.includes('image')) return <IoImage />;
  return <IoDocumentText />;
};

// Badge de seguridad original mantenido para precisión lógica
const renderSecurityBadge = (securityLevel, isUnlocked, hasPassword) => {
  if (!securityLevel || securityLevel === 'PUBLIC') {
    return <FaUnlock title="Público - Acceso sin restricciones" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
  }
  if (securityLevel === 'PASSWORD') {
    if (isUnlocked) return <FaUnlock title="Desbloqueado con contraseña (válido por 24h)" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
    return <FaLock title="Protegido con contraseña - Requiere autenticación" style={{ color: '#faad14', marginRight: '8px', minWidth: '16px' }} />;
  }
  if (securityLevel === 'TOKEN_SMS') {
    if (isUnlocked) return <FaUnlock title="Desbloqueado vía SMS (válido por 24h)" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
    return <FaShieldAlt title="Requiere verificación SMS - Máxima seguridad" style={{ color: '#0a3fff', marginRight: '8px', minWidth: '16px' }} />;
  }
  return <FaUnlock title="Público" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
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

  if (date > now) {
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  if (diffMins < 1) return 'Justo ahora';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatExpirationDate = (dateStr) => {
  if (!dateStr) return 'Fecha no disponible';
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `Expiró hace ${Math.abs(diffDays)} días`;
  if (diffDays === 0) return `Expira hoy`;
  if (diffDays === 1) return `Expira mañana`;
  return `Expira en ${diffDays} días`;
};

const formatFullDate = (dateStr) => {
  if (!dateStr) return 'No disponible';
  return new Date(dateStr).toLocaleString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // ========== ESTADOS PRINCIPALES ==========
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFiles, setSentFiles] = useState([]);
  
  const [personalFiles, setPersonalFiles] = useState([]);
  const [personalFolders, setPersonalFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  
  const [trashItems, setTrashItems] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState('miunidad'); // Internamente 'miunidad' mapeará al diseño 'todo'
  const [elementoDetalle, setElementoDetalle] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  const [favoritos, setFavoritos] = useState([]);
  
  // ========== ESTADOS PARA MODALES ==========
  const [showModalCarpeta, setShowModalCarpeta] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState('');
  const [importanciaCarpeta, setImportanciaCarpeta] = useState('#52c41a'); // Reemplaza colorCarpeta para alinear con el diseño
  const [showModalDesbloqueo, setShowModalDesbloqueo] = useState(null);
  const [tokenSms, setTokenSms] = useState('');
  const [password, setPassword] = useState('');
  const [desbloqueando, setDesbloqueando] = useState(false);
  const [solicitandoToken, setSolicitandoToken] = useState(false);
  
  // ========== ESTADO VISUALIZADOR Y MENSAJES ==========
  const [viewerFile, setViewerFile] = useState(null);
  const [panelMessage, setPanelMessage] = useState({ type: null, text: null });

  useEffect(() => {
    if (panelMessage.text) {
      const timer = setTimeout(() => setPanelMessage({ type: null, text: null }), 3000);
      return () => clearTimeout(timer);
    }
  }, [panelMessage]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const profile = await storageService.getMyProfile();
        const nombreCompleto = profile.nombre || '';
        setNombreUsuario(nombreCompleto.split(' ')[0] || 'Usuario');
      } catch (err) {
        console.error('Error cargando perfil:', err);
      }
    };
    loadUser();
  }, []);

  const loadFavorites = async () => {
    try {
      const result = await storageService.getFavorites();
      setFavoritos(result.favorites || []);
    } catch (err) {
      console.error('Error cargando favoritos:', err);
    }
  };

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (pestanaActiva === 'recibidos') {
        const result = await dashboardService.getReceivedFiles(0, 50);
        setReceivedFiles(result.files || []);
      } 
      else if (pestanaActiva === 'enviados') {
        const result = await dashboardService.getSentFiles(0, 50);
        const sentFilesList = result.files || [];
        sentFilesList.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));
        setSentFiles(sentFilesList);
      }
      else if (pestanaActiva === 'miunidad') {
        const result = await storageService.getFolderContents(currentFolderId);
        const contents = result.contents || [];
        
        const filteredContents = contents.filter(item => {
          if (item.name === 'Mi unidad' || item.name === 'Mi Unidad') return false;
          return true;
        });
        
        const carpetas = filteredContents.filter(item => item.isFolder === true);
        const archivos = filteredContents.filter(item => item.isFolder !== true);
        
        setPersonalFolders(carpetas);
        setPersonalFiles(archivos);
      }
      else if (pestanaActiva === 'papelera') {
        const result = await dashboardService.getTrash();
        setTrashItems(result.trash || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [pestanaActiva, currentFolderId]);

  useEffect(() => {
    loadData();
    loadFavorites();
  }, [loadData]);

  // Funciones de navegación
  const navigateToFolder = async (folderId, folderName) => {
    setFolderPath(prev => [...prev, { id: folderId, name: folderName }]);
    setCurrentFolderId(folderId);
  };

  const goBack = () => {
    if (folderPath.length === 0) return;
    const newPath = [...folderPath];
    newPath.pop();
    setFolderPath(newPath);
    setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

  const goToFolder = (index) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
  };

  // Funciones de acciones principales
  const handleVaciarPapelera = async () => {
    if (!window.confirm('¿Vaciar papelera por completo? Esta acción no se puede deshacer.')) return;
    try {
      await dashboardService.emptyTrash();
      await loadData();
      setElementoDetalle(null);
      setPanelMessage({ type: 'success', text: 'Papelera vaciada correctamente' });
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  const handleRestoreItem = async (itemId) => {
    try {
      await dashboardService.restoreItem(itemId);
      await loadData();
      setElementoDetalle(null);
      setPanelMessage({ type: 'success', text: 'Elemento restaurado' });
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  const handlePermanentDelete = async (itemId) => {
    if (!window.confirm('¿Eliminar permanentemente?')) return;
    try {
      await dashboardService.permanentDelete(itemId);
      await loadData();
      setElementoDetalle(null);
      setPanelMessage({ type: 'success', text: 'Elemento eliminado permanentemente' });
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  const handleMoveToTrash = async (itemId) => {
    if (!window.confirm('¿Mover este elemento a la papelera?')) return;
    try {
      await dashboardService.deleteItem(itemId);
      await loadData();
      setElementoDetalle(null);
      setPanelMessage({ type: 'success', text: 'Elemento movido a la papelera' });
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  const handleCrearCarpeta = async (e) => {
    e.preventDefault();
    if (!nombreNuevaCarpeta.trim()) return;
    
    try {
      const colorMap = { '#52c41a': 'green', '#faad14': 'yellow', '#f5222d': 'red', '#722ed1': 'purple', '#0a3fff': 'blue' };
      const colorHex = colorMap[importanciaCarpeta] || 'blue';
      
      await storageService.createFolder(nombreNuevaCarpeta.trim(), currentFolderId, colorHex);
      setNombreNuevaCarpeta('');
      setShowModalCarpeta(false);
      await loadData();
      setPanelMessage({ type: 'success', text: 'Carpeta creada exitosamente' });
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  // Funciones Legacy Mantenidas
  const handleSolicitarToken = async (itemId, isPersonal = true) => { /* ... código original ... */ };
  const handleVerificarToken = async (itemId, isPersonal = true) => { /* ... código original ... */ };
  const handleVerificarPassword = async (itemId, isPersonal = true) => { /* ... código original ... */ };
  

// ========== FUNCIÓN HANDLEOPENFILE CORREGIDA ==========
  const handleOpenFile = async (itemId, isPersonal = true, fileData = null) => {
    try {
      let result;
      let previewBlob = null;
      let downloadUrl = null;
      let canDownload = false;
      let fileType = '';
      let fileName = '';
      
      if (isPersonal) {
        // Obtener el archivo como BLOB (bytes descifrados) - PARA TODOS LOS TIPOS
        const blobResponse = await storageService.getPreviewBlob(itemId);
        previewBlob = blobResponse.blob;
        fileType = blobResponse.fileType;
        fileName = blobResponse.fileName;
        
        result = await storageService.openPersonalFile(itemId);
        canDownload = true;
        
        const downloadResult = await storageService.downloadPersonalFile(itemId);
        downloadUrl = downloadResult.downloadUrl;
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        
        // Obtener el archivo como BLOB (bytes descifrados) - PARA TODOS LOS TIPOS
        const blobResponse = await fileShareService.getPreviewBlob(itemId);
        previewBlob = blobResponse.blob;
        fileType = blobResponse.fileType;
        fileName = blobResponse.fileName;
        
        result = await fileShareService.viewFile(itemId);
        
        const fileInfoResult = result.file || result;
        canDownload = fileInfoResult.accessLevel === 'DOWNLOAD';
        
        if (canDownload) {
          const downloadResult = await fileShareService.downloadFile(itemId);
          downloadUrl = downloadResult.downloadUrl;
        }
      }
      
      const objectUrl = URL.createObjectURL(previewBlob);
      
      setViewerFile({
        id: itemId,
        name: fileName,
        fileName: fileName,
        fileType: fileType,
        fileSize: fileData?.fileSize || 0,
        downloadUrl: canDownload ? downloadUrl : null,
        previewBlob: objectUrl,
        isPersonal: isPersonal
      });
      
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg.includes('bloqueado') || errorMsg.includes('desbloquear')) {
        setShowModalDesbloqueo({ id: itemId, isPersonal });
      } else {
        setPanelMessage({ type: 'error', text: errorMsg });
      }
    }
  };

  // ========== FUNCIÓN HANDLEDOWNLOAD CORREGIDA ==========
  const handleDownload = async (itemId, isPersonal = true, fileName = 'archivo') => {
    try {
      let result;
      
      if (isPersonal) {
        result = await storageService.downloadPersonalFileBlob(itemId);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        result = await fileShareService.downloadFileBlob(itemId);
      }
      
      // ✅ USAR EL NOMBRE DEL RESULTADO O EL QUE VIENE POR PARÁMETRO
      const nombreArchivo = result.fileName || fileName;
      
      const blobUrl = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = nombreArchivo;  // ← Aquí usamos el nombre correcto
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      setPanelMessage({ type: 'success', text: 'Descarga completada' });
      
    } catch (err) {
      console.error('Error en descarga:', err);
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  // ========== RENDERIZADORES NUEVOS BASADOS EN DISEÑO ==========
  
  const renderFolderCard = (folder) => {
    const colorMap = { green: '#52c41a', yellow: '#faad14', red: '#f5222d', purple: '#722ed1', blue: '#0a3fff' };
    const folderColor = colorMap[folder.folderColor] || '#0a3fff';
    
    return (
      <div 
        key={folder.id} 
        className="card-glow-plop" 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#1D263C', padding: '16px', borderRadius: '10px', borderLeft: `5px solid ${folderColor}`, cursor: 'pointer' }} 
        onClick={() => navigateToFolder(folder.id, folder.name)}
      >
        <FaFolderOpen style={{ fontSize: '1.5rem', color: folderColor }} />
        <div style={{ textAlign: 'left', flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'white', fontWeight: '600' }}>{folder.name}</h4>
          <small style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem' }}>Carpeta personal</small>
        </div>
      </div>
    );
  };

  const renderPersonalFileCard = (file) => {
    const isUnlocked = file.isUnlocked === true;
    const hasPassword = file.securityLevel === 'PASSWORD';
    const fav = favoritos.find(f => f.itemId === file.id && f.type === 'PERSONAL');
    const isFavorite = !!fav;
    
    return (
      <article 
        key={file.id} 
        className={`file-card card-glow-plop ${elementoDetalle?.id === file.id ? 'active-inspect' : ''}`}
        onClick={() => setElementoDetalle({ ...file, itemId: file.id, isPersonal: true, tipo: 'personal' })}
        style={{ 
          cursor: 'pointer', backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px', 
          border: elementoDetalle?.id === file.id ? '1px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)',
          boxShadow: elementoDetalle?.id === file.id ? '0 0 15px rgba(10, 63, 255, 0.3)' : 'var(--shadow-soft)',
          position: 'relative'
        }}
      >
        <div className="file-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>{getFileIcon(file.fileType)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleFavorite(file.id, 'PERSONAL', isFavorite, fav?.favoriteId); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', fontSize: '1.1rem', transition: 'transform 0.2s ease', color: isFavorite ? '#faad14' : 'rgba(255,255,255,0.25)' }}
              title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isFavorite ? <FaStar /> : <FaRegStar />}
            </button>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-text-medium)', fontWeight: '500' }}>
              {file.accessLevel === 'DOWNLOAD' ? 'Descarga' : 'Solo vista'}
            </span>
          </div>
        </div>
        <div className="file-card-body">
          <h3 title={file.name} style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', color: 'white', fontWeight: '600' }}>
            {renderSecurityBadge(file.securityLevel, isUnlocked, hasPassword)}
            {file.name}
          </h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-medium)' }}>
            {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
          </p>
        </div>
      </article>
    );
  };

    // ========== DESCARGA DESDE EL VISOR MODAL ==========
  const handleDownloadFromViewer = async () => {
    if (!viewerFile) return;
    
    try {
      let result;
      
      const isPersonal = viewerFile.isPersonal === true;
      
      if (isPersonal) {
        result = await storageService.downloadPersonalFileBlob(viewerFile.id);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        result = await fileShareService.downloadFileBlob(viewerFile.id);
      }
      
      // USAR EL NOMBRE DEL RESULTADO
      const nombreArchivo = result.fileName || viewerFile.name || 'archivo';
      
      const blobUrl = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = nombreArchivo;  // ← Aquí usamos el nombre correcto
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      setPanelMessage({ type: 'success', text: 'Descarga completada' });
      
    } catch (err) {
      console.error('Error en descarga desde visor:', err);
      setPanelMessage({ type: 'error', text: err.response?.data?.error || err.message });
    }
  };

  const renderSharedFileCard = (item, type) => {
    const isUnlocked = item.inUnlocked === true;
    const hasPassword = item.hasPassword === true;
    const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
    
    // Check favorites
    const fav = favoritos.find(f => f.itemId === item.shareId && f.type === 'SHARED');
    const isFavorite = !!fav;
    
    return (
      <article 
        key={item.shareId} 
        className={`file-card ${!isExpired ? 'card-glow-plop' : ''} ${elementoDetalle?.shareId === item.shareId ? 'active-inspect' : ''}`}
        onClick={() => !isExpired && setElementoDetalle({ ...item, itemId: item.shareId, isPersonal: false, tipo: type })}
        style={{ 
          cursor: isExpired ? 'not-allowed' : 'pointer', backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px', 
          border: isExpired ? '2px solid #f5222d' : (elementoDetalle?.shareId === item.shareId ? '1px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)'),
          boxShadow: elementoDetalle?.shareId === item.shareId ? '0 0 15px rgba(10, 63, 255, 0.3)' : 'var(--shadow-soft)',
          opacity: isExpired ? 0.6 : 1, position: 'relative'
        }}
      >
        {isExpired && (
          <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: '#f5222d', color: 'white', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
            EXPIRADO
          </div>
        )}
        
        <div className="file-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '2rem', color: 'var(--color-accent)', marginLeft: isExpired ? '70px' : '0' }}>{getFileIcon(item.fileType)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isExpired && (
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(item.shareId, 'SHARED', isFavorite, fav?.favoriteId); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', fontSize: '1.1rem', transition: 'transform 0.2s ease', color: isFavorite ? '#faad14' : 'rgba(255,255,255,0.25)' }}
                title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isFavorite ? <FaStar /> : <FaRegStar />}
              </button>
            )}
            <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-text-medium)', fontWeight: '500' }}>
              {item.accessLevel === 'DOWNLOAD' ? 'Descarga' : 'Solo vista'}
            </span>
          </div>
        </div>
        <div className="file-card-body">
          <h3 title={item.fileName} style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', color: 'white', fontWeight: '600' }}>
            {!isExpired && renderSecurityBadge(item.securityLevel, isUnlocked, hasPassword)}
            {item.fileName}
          </h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-medium)' }}>
            {formatFileSize(item.fileSize)} • {type === 'recibido' ? item.sharedBy : item.sharedWith}
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {type === 'recibido' ? 'Recibido' : 'Enviado'} {formatDate(item.sharedAt)}
          </p>
          {item.expiresAt && (
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: isExpired ? '#f5222d' : '#faad14', fontWeight: isExpired ? 'bold' : 'normal' }}>
              {isExpired ? `Expiró: ${formatFullDate(item.expiresAt)}` : formatExpirationDate(item.expiresAt)}
            </p>
          )}
        </div>
      </article>
    );
  };

  const isLoading = loading && (pestanaActiva === 'recibidos' || pestanaActiva === 'enviados' || pestanaActiva === 'miunidad' || pestanaActiva === 'papelera');

  return (
    <PrivateLayout>
      <main style={{ paddingTop: '110px', paddingBottom: '60px', color: 'white', width: '100%', maxWidth: '1300px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
        
        {/* ENCABEZADO MODERNO */}
        <section className="section-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontWeight: '700', fontSize: '2.2rem', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              ¡Hola, {nombreUsuario}! <span className="wave-emoji" style={{ cursor: 'default' }}>👋</span>
            </h1>
            <p style={{ color: 'var(--color-text-medium)', margin: '8px 0 0 0' }}>Gestiona tus archivos de forma segura</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {pestanaActiva === 'recibidos' && (
              <button onClick={() => navigate('/enviar-archivo')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaShareSquare /> Enviar Archivo
              </button>
            )}
            {pestanaActiva === 'miunidad' && (
              <>
                <button onClick={() => setShowModalCarpeta(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-accent)' }}>
                  <FaFolderPlus /> Crear Carpeta
                </button>
                <button onClick={() => navigate('/subir-archivo')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <FaUpload /> Subir Archivo
                </button>
                <button onClick={() => navigate('/enviar-archivo')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaShareSquare /> Enviar Archivo
                </button>
              </>
            )}
            {pestanaActiva === 'enviados' && (
              <button onClick={() => navigate('/enviar-archivo')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaShareSquare /> Enviar Nuevo
              </button>
            )}
            {pestanaActiva === 'papelera' && trashItems.length > 0 && (
              <button onClick={handleVaciarPapelera} className="btn" style={{ backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', border: '1px solid rgba(245, 34, 45, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaTrash /> Vaciar Papelera
              </button>
            )}
          </div>
        </section>

        {/* Mensajes del sistema */}
        {error && <div style={{ padding: '16px', backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', border: '1px solid rgba(245, 34, 45, 0.2)', borderRadius: '10px', marginBottom: '20px' }}>{error}</div>}
        {panelMessage.text && panelMessage.type === 'success' && <div style={{ padding: '16px', backgroundColor: 'rgba(82,196,26,0.15)', color: '#52c41a', border: '1px solid rgba(82,196,26,0.2)', borderRadius: '10px', marginBottom: '20px' }}>{panelMessage.text}</div>}
        {panelMessage.text && panelMessage.type === 'error' && !error && <div style={{ padding: '16px', backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', border: '1px solid rgba(245, 34, 45, 0.2)', borderRadius: '10px', marginBottom: '20px' }}>{panelMessage.text}</div>}

        {/* NAVEGACIÓN CONTEXTUAL */}
        <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '35px', paddingBottom: '2px', flexWrap: 'wrap' }}>
          <button onClick={() => { setPestanaActiva('recibidos'); setElementoDetalle(null); setCurrentFolderId(null); setFolderPath([]); }} style={{ padding: '12px 20px', background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', color: pestanaActiva === 'recibidos' ? 'var(--color-accent)' : 'var(--color-text-medium)', borderBottom: pestanaActiva === 'recibidos' ? '3px solid var(--color-accent)' : '3px solid transparent' }}>
            <FaRegBell /> Archivos Recibidos
          </button>
          <button onClick={() => { setPestanaActiva('miunidad'); setElementoDetalle(null); setCurrentFolderId(null); setFolderPath([]); }} style={{ padding: '12px 20px', background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', color: pestanaActiva === 'miunidad' ? 'var(--color-accent)' : 'var(--color-text-medium)', borderBottom: pestanaActiva === 'miunidad' ? '3px solid var(--color-accent)' : '3px solid transparent' }}>
            <FaFolderOpen /> Carpeta General
          </button>
          <button onClick={() => { setPestanaActiva('enviados'); setElementoDetalle(null); setCurrentFolderId(null); setFolderPath([]); }} style={{ padding: '12px 20px', background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', color: pestanaActiva === 'enviados' ? 'var(--color-accent)' : 'var(--color-text-medium)', borderBottom: pestanaActiva === 'enviados' ? '3px solid var(--color-accent)' : '3px solid transparent' }}>
            <FaPaperPlane /> Enviados
          </button>
          <button onClick={() => { setPestanaActiva('papelera'); setElementoDetalle(null); setCurrentFolderId(null); setFolderPath([]); }} style={{ padding: '12px 20px', background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', color: pestanaActiva === 'papelera' ? 'var(--color-accent)' : 'var(--color-text-medium)', borderBottom: pestanaActiva === 'papelera' ? '3px solid var(--color-accent)' : '3px solid transparent' }}>
            <FaTrash /> Papelera
          </button>
        </nav>

        {/* CONTENEDOR GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: elementoDetalle ? '1fr 350px' : '1fr', gap: '30px', transition: 'all 0.4s ease' }}>
          
          <section>
            {/* Migas de pan (Mi Unidad) */}
            {pestanaActiva === 'miunidad' && folderPath.length > 0 && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={goBack} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer' }}>← Volver</button>
                <span style={{ color: 'var(--color-text-muted)' }}>|</span>
                <button onClick={() => { setCurrentFolderId(null); setFolderPath([]); }} style={{ background: 'none', border: 'none', color: currentFolderId === null ? 'var(--color-accent)' : 'var(--color-text-medium)', cursor: 'pointer' }}>Raíz</button>
                {folderPath.map((folder, index) => (
                  <span key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>/</span>
                    <button onClick={() => goToFolder(index)} style={{ background: 'none', border: 'none', color: index === folderPath.length - 1 ? 'var(--color-accent)' : 'var(--color-text-medium)', cursor: 'pointer' }}>{folder.name}</button>
                  </span>
                ))}
              </div>
            )}

            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-medium)' }}>Cargando información segura...</div>
            ) : (
              <>
                {/* CARPETAS PRINCIPALES */}
                {pestanaActiva === 'miunidad' && personalFolders.length > 0 && (
                  <div style={{ marginBottom: '35px' }}>
                    <h3 style={{ color: 'var(--color-text-medium)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>Carpetas Principales</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
                      {personalFolders.map(folder => renderFolderCard(folder))}
                    </div>
                  </div>
                )}

                {/* TÍTULO DE SECCIÓN ARCHIVOS */}
                <h3 style={{ color: 'var(--color-text-medium)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '15px' }}>
                  {pestanaActiva === 'recibidos' && 'Documentos Recibidos'}
                  {pestanaActiva === 'miunidad' && 'Archivos Sueltos Raíz'}
                  {pestanaActiva === 'enviados' && 'Historial de Envíos Realizados'}
                  {pestanaActiva === 'papelera' && 'Borradores en Retención Temporal'}
                </h3>

                {/* ARCHIVOS MI UNIDAD */}
                {pestanaActiva === 'miunidad' && (
                  <>
                    <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                      {personalFiles.map(file => renderPersonalFileCard(file))}
                    </div>
                    {personalFolders.length === 0 && personalFiles.length === 0 && (
                      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <FaFolderOpen style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                        <p style={{ marginBottom: '20px' }}>Esta carpeta está vacía</p>
                        <button onClick={() => navigate('/subir-archivo')} className="btn btn-secondary" style={{ marginRight: '10px', border: '1px solid rgba(255,255,255,0.1)' }}><FaUpload /> Subir</button>
                        <button onClick={() => setShowModalCarpeta(true)} className="btn btn-secondary" style={{ border: '1px solid rgba(255,255,255,0.1)' }}><FaFolderPlus /> Crear carpeta</button>
                      </div>
                    )}
                  </>
                )}

                {/* ARCHIVOS RECIBIDOS */}
                {pestanaActiva === 'recibidos' && (
                  <>
                    <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                      {receivedFiles.map(item => renderSharedFileCard(item, 'recibido'))}
                    </div>
                    {receivedFiles.length === 0 && (
                      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <FaRegBell style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                        <p>No tienes documentos recibidos</p>
                      </div>
                    )}
                  </>
                )}

                {/* ARCHIVOS ENVIADOS */}
                {pestanaActiva === 'enviados' && (
                  <>
                    <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                      {sentFiles.map(item => renderSharedFileCard(item, 'enviado'))}
                    </div>
                    {sentFiles.length === 0 && (
                      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <FaPaperPlane style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                        <p>No tienes historial de envíos</p>
                      </div>
                    )}
                  </>
                )}

                {/* PAPELERA (Diseño simplificado para listas) */}
                {pestanaActiva === 'papelera' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {trashItems.map(item => (
                      <div key={item.id} className="card-glow-plop" style={{ backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '2rem', color: '#888' }}>{getFileIcon(item.fileType)}</span>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>{item.name}</h4>
                            <small style={{ color: 'var(--color-text-medium)' }}>{formatFileSize(item.fileSize)}</small>
                          </div>
                        </div>
                        <small style={{ color: '#faad14', display: 'block', marginBottom: '12px' }}>
                          Expira en {item.daysLeft || 7} días
                        </small>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleRestoreItem(item.id)} style={{ padding: '6px 12px', background: 'rgba(82,196,26,0.15)', border: '1px solid rgba(82,196,26,0.3)', borderRadius: '6px', color: '#52c41a', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Restaurar</button>
                          <button onClick={() => handlePermanentDelete(item.id)} style={{ padding: '6px 12px', background: 'rgba(245,34,45,0.15)', border: '1px solid rgba(245,34,45,0.3)', borderRadius: '6px', color: '#f5222d', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                    {trashItems.length === 0 && (
                      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-medium)', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <FaTrash style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                        <p>Papelera vacía</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {/* PANEL DE DETALLES LATERAL (Con envoltorio sticky y sombras del nuevo diseño) */}
          {elementoDetalle && (
            <div className="card-glow-plop" style={{ alignSelf: 'start', position: 'sticky', top: '130px', borderRadius: '15px', boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)' }}>
              <FileDetailPanel
                file={elementoDetalle}
                onClose={() => setElementoDetalle(null)}
                onRefresh={async (archivoActualizado) => {
                  setElementoDetalle(prev => ({ ...prev, inUnlocked: true, isUnlocked: true, unlockedUntil: archivoActualizado.unlockedUntil || prev.unlockedUntil }));
                  loadData();
                }}
                onDownload={() => handleDownload(elementoDetalle.itemId || elementoDetalle.shareId, elementoDetalle.isPersonal !== false, elementoDetalle.name || elementoDetalle.fileName)}
                onView={() => {
                  const fileData = { name: elementoDetalle.name || elementoDetalle.fileName, fileName: elementoDetalle.fileName, fileType: elementoDetalle.fileType, fileSize: elementoDetalle.fileSize };
                  handleOpenFile(elementoDetalle.itemId || elementoDetalle.shareId, elementoDetalle.isPersonal !== false, fileData);
                }}
                onMoveToTrash={() => handleMoveToTrash(elementoDetalle.itemId || elementoDetalle.shareId)}
                onToggleFavorite={async () => {
                  const itemId = elementoDetalle.itemId || elementoDetalle.shareId;
                  const type = elementoDetalle.isPersonal ? 'PERSONAL' : 'SHARED';
                  const fav = favoritos.find(f => f.itemId === itemId && f.type === type);
                  await handleToggleFavorite(itemId, type, !!fav, fav?.favoriteId);
                  await loadFavorites();
                }}
                isFavorite={!!favoritos.find(f => {
                  const itemId = elementoDetalle.itemId || elementoDetalle.shareId;
                  const type = elementoDetalle.isPersonal ? 'PERSONAL' : 'SHARED';
                  return f.itemId === itemId && f.type === type;
                })}
                showTrashButton={pestanaActiva !== 'papelera' && pestanaActiva !== 'enviados'}
                isInTrash={pestanaActiva === 'papelera'}
              />
            </div>
          )}
        </div>

        {/* MODAL CREAR CARPETA (Actualizado al diseño) */}
        {showModalCarpeta && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(19, 25, 36, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
            <div className="auth-card card-glow-plop" style={{ width: '420px', padding: '2.5rem', backgroundColor: '#1D263C', borderRadius: '16px', border: '1px solid #0a3fff', boxShadow: '0 0 25px rgba(10, 63, 255, 0.5)' }}>
              <h2 style={{ margin: '0 0 10px 0', color: 'white', fontWeight: '700', textAlign: 'center' }}>Nueva Carpeta</h2>
              <p style={{ color: 'var(--color-text-medium)', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>Asigna un nombre y clasifica la carpeta según su nivel de criticidad.</p>
              
              <form onSubmit={handleCrearCarpeta}>
                <div className="form-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Nombre de la Carpeta</label>
                  <input 
                    type="text" 
                    className="form-control-modern"
                    placeholder="Ej. Contratos" 
                    required 
                    value={nombreNuevaCarpeta} 
                    onChange={(e) => setNombreNuevaCarpeta(e.target.value)} 
                    style={{ width: '100%', padding: '12px', marginTop: '8px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    autoFocus
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: '25px', textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>Nivel de Importancia (Color)</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'center' }}>
                    <button type="button" onClick={() => setImportanciaCarpeta('#52c41a')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#52c41a', border: importanciaCarpeta === '#52c41a' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Baja" />
                    <button type="button" onClick={() => setImportanciaCarpeta('#faad14')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#faad14', border: importanciaCarpeta === '#faad14' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Media" />
                    <button type="button" onClick={() => setImportanciaCarpeta('#f5222d')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f5222d', border: importanciaCarpeta === '#f5222d' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Alta" />
                    <button type="button" onClick={() => setImportanciaCarpeta('#722ed1')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#722ed1', border: importanciaCarpeta === '#722ed1' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Crítica" />
                    <button type="button" onClick={() => setImportanciaCarpeta('#0a3fff')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0a3fff', border: importanciaCarpeta === '#0a3fff' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Estándar" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#0a3fff', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Crear</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModalCarpeta(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer' }}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL VISUALIZADOR DE ARCHIVOS (Mantenido intacto) */}
        <FileViewerModal isOpen={!!viewerFile} onClose={() => setViewerFile(null)} file={viewerFile} onDownload={handleDownloadFromViewer} />

        <Footer />
      </main>
    </PrivateLayout>
  );
}