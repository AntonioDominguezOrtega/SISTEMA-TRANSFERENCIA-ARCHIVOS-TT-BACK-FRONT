import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import Footer from '../components/Footer';
import dashboardService from '../services/dashboardService';
import storageService from '../services/storageService';

// React Icons
import { 
  FaFolderOpen, FaPaperPlane, FaTrash, FaUnlock, FaLock, 
  FaShieldAlt, FaRegBell, FaUpload, FaShareSquare, FaFolderPlus,
  FaDownload, FaEye, FaEnvelope, FaClock, FaUser, FaFileAlt,
  FaKey, FaPhone, FaStar, FaRegStar
} from 'react-icons/fa';
import { IoDocumentText, IoImage } from 'react-icons/io5';

// Mapeo de íconos
const getFileIcon = (fileType = '') => {
  const type = fileType.toLowerCase();
  if (type.includes('pdf') || type.includes('doc') || type.includes('txt') || type.includes('xls')) 
    return <IoDocumentText />;
  if (type.includes('image')) return <IoImage />;
  return <IoDocumentText />;
};

// Badge de seguridad
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

  if (diffMins < 1) return 'Justo ahora';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Formatear fecha completa para detalles
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

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFiles, setSentFiles] = useState([]);
  
  // Estados para Mi Unidad
  const [personalFiles, setPersonalFiles] = useState([]);
  const [personalFolders, setPersonalFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  
  const [trashItems, setTrashItems] = useState([]);
  const [pestanaActiva, setPestanaActiva] = useState('miunidad');
  const [elementoDetalle, setElementoDetalle] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  
  // Estados para favoritos
  const [favoritos, setFavoritos] = useState([]);
  
  // Estados para modales
  const [showModalCarpeta, setShowModalCarpeta] = useState(false);
  const [nombreNuevaCarpeta, setNombreNuevaCarpeta] = useState('');
  const [colorCarpeta, setColorCarpeta] = useState('#52c41a');
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

  // ========== CAPTURAR BÚSQUEDA DEL HEADER ==========
  useEffect(() => {
    if (location.state && location.state.selectedFile) {
      const file = location.state.selectedFile;
      
      // Limpiamos el estado del historial para prevenir que se reabra al refrescar con F5
      window.history.replaceState({}, document.title);

      // Abrimos el panel lateral respetando la pestaña y carpeta actual del usuario
      setElementoDetalle({
        ...file,
        tipo: file.isPersonal ? 'personal' : 'recibido'
      });
    }
  }, [location.state]);

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
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // Cargar datos según pestaña
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
        setSentFiles(result.files || []);
      }
      else if (pestanaActiva === 'miunidad') {
        const result = await storageService.getFolderContents(currentFolderId);
        const contents = result.contents || [];
        
        // ✅ FILTRO CORREGIDO - Solo excluir la carpeta raíz "Mi unidad"
        // Ya no filtramos por isPersonal porque el backend ya nos da solo los archivos del usuario
        const filteredContents = contents.filter(item => {
          // Excluir la carpeta raíz
          if (item.name === 'Mi unidad' || item.name === 'Mi Unidad') return false;
          // Mostrar todo lo demás (carpetas y archivos)
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

  // Navegar dentro de carpeta
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

  // Vaciar papelera
  const handleVaciarPapelera = async () => {
    if (!window.confirm('⚠️ ¿Vaciar papelera? Esta acción no se puede deshacer.')) return;
    try {
      await dashboardService.emptyTrash();
      await loadData();
      setElementoDetalle(null);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // Restaurar
  const handleRestoreItem = async (itemId) => {
    try {
      await dashboardService.restoreItem(itemId);
      await loadData();
      setElementoDetalle(null);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // Eliminar permanente
  const handlePermanentDelete = async (itemId) => {
    if (!window.confirm('⚠️ ¿Eliminar permanentemente? No podrás recuperarlo.')) return;
    try {
      await dashboardService.permanentDelete(itemId);
      await loadData();
      setElementoDetalle(null);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // Mover a papelera
  const handleMoveToTrash = async (itemId) => {
    if (!window.confirm('Mover este elemento a la papelera?')) return;
    try {
      await dashboardService.deleteItem(itemId);
      await loadData();
      setElementoDetalle(null);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  // Crear carpeta
  const handleCrearCarpeta = async (e) => {
    e.preventDefault();
    if (!nombreNuevaCarpeta.trim()) return;
    
    try {
      const colorMap = { '#52c41a': 'green', '#faad14': 'yellow', '#f5222d': 'red', '#722ed1': 'purple', '#0a3fff': 'blue' };
      const colorHex = colorMap[colorCarpeta] || 'blue';
      
      await storageService.createFolder(nombreNuevaCarpeta.trim(), currentFolderId, colorHex);
      setNombreNuevaCarpeta('');
      setShowModalCarpeta(false);
      await loadData();
    } catch (err) {
      alert('Error al crear carpeta: ' + (err.response?.data?.error || err.message));
    }
  };

  // Solicitar token SMS
  const handleSolicitarToken = async (itemId, isPersonal = true) => {
    setSolicitandoToken(true);
    try {
      if (isPersonal) {
        await storageService.requestPersonalFileToken(itemId);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        await fileShareService.requestSmsToken(itemId);
      }
      alert('📱 Código SMS enviado. Revisa tu teléfono y correo.');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSolicitandoToken(false);
    }
  };

  // Verificar token
  const handleVerificarToken = async (itemId, isPersonal = true) => {
    if (!tokenSms.trim()) {
      alert('Ingresa el código de 6 dígitos');
      return;
    }
    setDesbloqueando(true);
    try {
      if (isPersonal) {
        await storageService.verifyPersonalFileToken(itemId, tokenSms);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        await fileShareService.verifySmsToken(itemId, tokenSms);
      }
      alert('✅ Archivo desbloqueado por 24 horas');
      setShowModalDesbloqueo(null);
      setTokenSms('');
      await loadData();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setDesbloqueando(false);
    }
  };

  // Verificar contraseña
  const handleVerificarPassword = async (itemId, isPersonal = true) => {
    if (!password.trim()) {
      alert('Ingresa la contraseña');
      return;
    }
    setDesbloqueando(true);
    try {
      if (isPersonal) {
        await storageService.verifyPersonalFilePassword(itemId, password);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        await fileShareService.verifyPassword(itemId, password);
      }
      alert('✅ Archivo desbloqueado por 24 horas');
      setShowModalDesbloqueo(null);
      setPassword('');
      await loadData();
    } catch (err) {
      alert('Error: Contraseña incorrecta o ' + (err.response?.data?.error || err.message));
    } finally {
      setDesbloqueando(false);
    }
  };

  // Descargar
  const handleDownload = async (itemId, isPersonal = true, fileName = 'archivo') => {
    try {
      let result;
      if (isPersonal) {
        result = await storageService.downloadPersonalFile(itemId);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        result = await fileShareService.downloadFile(itemId);
      }
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error al descargar: ' + (err.response?.data?.error || err.message));
    }
  };

  // Abrir archivo
  const handleOpenFile = async (itemId, isPersonal = true) => {
    try {
      let result;
      if (isPersonal) {
        result = await storageService.openPersonalFile(itemId);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        result = await fileShareService.viewFile(itemId);
      }
      setElementoDetalle(result.file || result);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg.includes('bloqueado') || errorMsg.includes('desbloquear')) {
        setShowModalDesbloqueo({ id: itemId, isPersonal });
      } else {
        alert('Error: ' + errorMsg);
      }
    }
  };

  // Renderizar carpeta CON acciones
  const renderFolderCard = (folder) => {
    const colorMap = {
      green: '#52c41a', yellow: '#faad14', red: '#f5222d', purple: '#722ed1', blue: '#0a3fff'
    };
    const folderColor = colorMap[folder.folderColor] || '#0a3fff';
    
    const fav = favoritos.find(f => f.itemId === folder.id && f.type === 'PERSONAL');
    const isFavorite = !!fav;
    
    return (
      <article 
        key={folder.id} 
        style={{ 
          cursor: 'pointer', 
          backgroundColor: '#1D263C', 
          borderRadius: '12px', 
          padding: '20px', 
          border: '1px solid rgba(255,255,255,0.05)',
          transition: 'all 0.2s',
          position: 'relative'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = folderColor}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
      >
        {/* Contenido clickeable para navegar */}
        <div onClick={() => navigateToFolder(folder.id, folder.name)}>
          <div style={{ marginBottom: '15px' }}>
            <FaFolderOpen style={{ fontSize: '2rem', color: folderColor }} />
          </div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'white' }}>{folder.name}</h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.7rem', color: 'var(--color-text-medium)' }}>Carpeta personal</p>
        </div>
        
        {/* Botones de acción */}
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
              handleToggleFavorite(folder.id, 'PERSONAL', isFavorite, fav?.favoriteId);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: isFavorite ? '#faad14' : 'var(--color-text-medium)',
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
              handleMoveToTrash(folder.id);
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

  // Renderizar archivo personal CON acciones
  const renderPersonalFileCard = (file) => {
    const isUnlocked = file.isUnlocked === true;
    const hasPassword = file.securityLevel === 'PASSWORD';
    
    const fav = favoritos.find(f => f.itemId === file.id && f.type === 'PERSONAL');
    const isFavorite = !!fav;
    
    return (
      <article 
        key={file.id} 
        style={{ 
          cursor: 'pointer', 
          backgroundColor: '#1D263C', 
          borderRadius: '12px', 
          padding: '20px', 
          border: elementoDetalle?.id === file.id ? '1px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)'
        }}
      >
        {/* Contenido clickeable para ver detalles */}
        <div onClick={() => setElementoDetalle({ ...file, itemId: file.id, isPersonal: true, tipo: 'personal' })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>{getFileIcon(file.fileType)}</span>
            <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '4px' }}>
              {file.accessLevel === 'DOWNLOAD' ? 'Descarga' : 'Solo vista'}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', color: 'white' }}>
            {renderSecurityBadge(file.securityLevel, isUnlocked, hasPassword)}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
          </h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.7rem', color: 'var(--color-text-medium)' }}>
            {formatFileSize(file.fileSize)} • {formatDate(file.uploadedAt)}
          </p>
        </div>
        
        {/* Botones de acción */}
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
              handleToggleFavorite(file.id, 'PERSONAL', isFavorite, fav?.favoriteId);
            }}
            style={{ background: 'none', border: 'none', color: isFavorite ? '#faad14' : 'var(--color-text-medium)', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px', borderRadius: '4px' }}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {isFavorite ? <FaStar /> : <FaRegStar />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMoveToTrash(file.id);
            }}
            style={{ background: 'none', border: 'none', color: '#f5222d', cursor: 'pointer', fontSize: '1rem', padding: '4px 8px', borderRadius: '4px' }}
            title="Mover a papelera"
          >
            <FaTrash />
          </button>
        </div>
      </article>
    );
  };

  // Renderizar archivo compartido RECIBIDO
  const renderReceivedFileCard = (item) => {
    const isUnlocked = item.inUnlocked === true;
    const hasPassword = item.hasPassword === true;
    
    return (
      <article 
        key={item.shareId} 
        onClick={() => setElementoDetalle({ ...item, itemId: item.shareId, isPersonal: false, tipo: 'recibido' })}
        style={{ cursor: 'pointer', backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px', border: elementoDetalle?.shareId === item.shareId ? '1px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>{getFileIcon(item.fileType)}</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '4px' }}>
            {item.accessLevel === 'DOWNLOAD' ? 'Descarga' : 'Solo vista'}
          </span>
        </div>
        <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', color: 'white' }}>
          {renderSecurityBadge(item.securityLevel, isUnlocked, hasPassword)}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.fileName}</span>
        </h3>
        <p style={{ margin: '6px 0 0 0', fontSize: '0.7rem', color: 'var(--color-text-medium)' }}>
          {formatFileSize(item.fileSize)} • 📤 {item.sharedBy}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
          Recibido {formatDate(item.sharedAt)}
        </p>
      </article>
    );
  };

  // Renderizar archivo compartido ENVIADO
  const renderSentFileCard = (item) => {
    const isUnlocked = item.inUnlocked === true;
    const hasPassword = item.hasPassword === true;
    
    return (
      <article 
        key={item.shareId} 
        onClick={() => setElementoDetalle({ ...item, itemId: item.shareId, isPersonal: false, tipo: 'enviado' })}
        style={{ cursor: 'pointer', backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px', border: elementoDetalle?.shareId === item.shareId ? '1px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>{getFileIcon(item.fileType)}</span>
          <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '4px' }}>
            {item.accessLevel === 'DOWNLOAD' ? 'Descarga' : 'Solo vista'}
          </span>
        </div>
        <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', color: 'white' }}>
          {renderSecurityBadge(item.securityLevel, isUnlocked, hasPassword)}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.fileName}</span>
        </h3>
        <p style={{ margin: '6px 0 0 0', fontSize: '0.7rem', color: 'var(--color-text-medium)' }}>
          {formatFileSize(item.fileSize)} • 📥 {item.sharedWith}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
          Enviado {formatDate(item.sharedAt)}
        </p>
      </article>
    );
  };

  const isLoading = loading && (pestanaActiva === 'recibidos' || pestanaActiva === 'enviados' || pestanaActiva === 'miunidad' || pestanaActiva === 'papelera');

  return (
    <PrivateLayout>
      <main style={{ paddingTop: '110px', paddingBottom: '60px', maxWidth: '1300px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              ¡Hola, {nombreUsuario}! 👋
            </h1>
            <p style={{ color: 'var(--color-text-medium)' }}>Gestiona tus archivos de forma segura</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {pestanaActiva === 'recibidos' && (
              <button onClick={() => navigate('/enviar-archivo')} className="btn btn-primary">
                <FaShareSquare /> Enviar Archivo
              </button>
            )}
            {pestanaActiva === 'miunidad' && (
              <>
                <button onClick={() => setShowModalCarpeta(true)} className="btn btn-secondary">
                  <FaFolderPlus /> Crear Carpeta
                </button>
                <button onClick={() => navigate('/subir-archivo')} className="btn btn-secondary">
                  <FaUpload /> Subir Archivo
                </button>
                <button onClick={() => navigate('/enviar-archivo')} className="btn btn-primary">
                  <FaShareSquare /> Enviar Archivo
                </button>
              </>
            )}
            {pestanaActiva === 'enviados' && (
              <button onClick={() => navigate('/enviar-archivo')} className="btn btn-primary">
                <FaShareSquare /> Enviar Nuevo
              </button>
            )}
            {pestanaActiva === 'papelera' && trashItems.length > 0 && (
              <button onClick={handleVaciarPapelera} className="btn" style={{ backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d' }}>
                <FaTrash /> Vaciar Papelera
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ padding: '20px', backgroundColor: '#ffe5e5', color: '#d93025', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

        {/* TABS */}
        <nav style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '35px', flexWrap: 'wrap' }}>
          <button onClick={() => { setPestanaActiva('recibidos'); setElementoDetalle(null); setCurrentFolderId(null); setFolderPath([]); }} style={{ padding: '12px 20px', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer', color: pestanaActiva === 'recibidos' ? 'var(--color-accent)' : 'var(--color-text-medium)', borderBottom: pestanaActiva === 'recibidos' ? '3px solid var(--color-accent)' : '3px solid transparent' }}>
            <FaRegBell /> Recibidos
          </button>
          <button onClick={() => { setPestanaActiva('miunidad'); setElementoDetalle(null); setCurrentFolderId(null); setFolderPath([]); }} style={{ padding: '12px 20px', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer', color: pestanaActiva === 'miunidad' ? 'var(--color-accent)' : 'var(--color-text-medium)', borderBottom: pestanaActiva === 'miunidad' ? '3px solid var(--color-accent)' : '3px solid transparent' }}>
            <FaFolderOpen /> Mi Unidad
          </button>
          <button onClick={() => { setPestanaActiva('enviados'); setElementoDetalle(null); setCurrentFolderId(null); setFolderPath([]); }} style={{ padding: '12px 20px', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer', color: pestanaActiva === 'enviados' ? 'var(--color-accent)' : 'var(--color-text-medium)', borderBottom: pestanaActiva === 'enviados' ? '3px solid var(--color-accent)' : '3px solid transparent' }}>
            <FaPaperPlane /> Enviados
          </button>
          <button onClick={() => { setPestanaActiva('papelera'); setElementoDetalle(null); setCurrentFolderId(null); setFolderPath([]); }} style={{ padding: '12px 20px', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer', color: pestanaActiva === 'papelera' ? 'var(--color-accent)' : 'var(--color-text-medium)', borderBottom: pestanaActiva === 'papelera' ? '3px solid var(--color-accent)' : '3px solid transparent' }}>
            <FaTrash /> Papelera
          </button>
        </nav>

        {/* CONTENIDO PRINCIPAL */}
        <div style={{ display: 'grid', gridTemplateColumns: elementoDetalle ? '1fr 380px' : '1fr', gap: '30px' }}>
          
          <section>
            {/* Migas de pan - solo en Mi Unidad */}
            {pestanaActiva === 'miunidad' && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={goBack} disabled={folderPath.length === 0} style={{ background: 'none', border: 'none', color: folderPath.length === 0 ? 'var(--color-text-muted)' : 'var(--color-accent)', cursor: folderPath.length === 0 ? 'not-allowed' : 'pointer' }}>← Volver</button>
                <span style={{ color: 'var(--color-text-muted)' }}>|</span>
                <button onClick={() => { setCurrentFolderId(null); setFolderPath([]); }} style={{ background: 'none', border: 'none', color: currentFolderId === null ? 'var(--color-accent)' : 'var(--color-text-medium)', cursor: 'pointer' }}>Mi unidad</button>
                {folderPath.map((folder, index) => (
                  <span key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>/</span>
                    <button onClick={() => goToFolder(index)} style={{ background: 'none', border: 'none', color: index === folderPath.length - 1 ? 'var(--color-accent)' : 'var(--color-text-medium)', cursor: 'pointer' }}>{folder.name}</button>
                  </span>
                ))}
              </div>
            )}

            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>
            ) : (
              <>
                {/* MI UNIDAD - Carpetas */}
                {pestanaActiva === 'miunidad' && personalFolders.length > 0 && (
                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ marginBottom: '15px', color: 'var(--color-text-medium)', fontSize: '0.85rem', textTransform: 'uppercase' }}>MIS CARPETAS</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                      {personalFolders.map(folder => renderFolderCard(folder))}
                    </div>
                  </div>
                )}

                {/* MI UNIDAD - Archivos */}
                {pestanaActiva === 'miunidad' && personalFiles.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '15px', color: 'var(--color-text-medium)', fontSize: '0.85rem', textTransform: 'uppercase' }}>MIS ARCHIVOS</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {personalFiles.map(file => renderPersonalFileCard(file))}
                    </div>
                  </div>
                )}

                {/* MI UNIDAD - Vacía */}
                {pestanaActiva === 'miunidad' && personalFolders.length === 0 && personalFiles.length === 0 && (
                  <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                    <FaFolderOpen style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                    <p style={{ marginBottom: '10px' }}>Tu unidad está vacía</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-medium)', marginBottom: '20px' }}>Sube archivos o crea carpetas para comenzar</p>
                    <button onClick={() => navigate('/subir-archivo')} className="btn btn-secondary" style={{ marginRight: '10px' }}><FaUpload /> Subir archivo</button>
                    <button onClick={() => setShowModalCarpeta(true)} className="btn btn-secondary"><FaFolderPlus /> Crear carpeta</button>
                  </div>
                )}

                {/* RECIBIDOS */}
                {pestanaActiva === 'recibidos' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {receivedFiles.map(item => renderReceivedFileCard(item))}
                    </div>
                    {receivedFiles.length === 0 && (
                      <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                        <FaRegBell style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                        <p>No has recibido archivos</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-medium)' }}>Cuando alguien te comparta un archivo, aparecerá aquí</p>
                      </div>
                    )}
                  </>
                )}

                {/* ENVIADOS */}
                {pestanaActiva === 'enviados' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                      {sentFiles.map(item => renderSentFileCard(item))}
                    </div>
                    {sentFiles.length === 0 && (
                      <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                        <FaPaperPlane style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                        <p>No has enviado archivos</p>
                        <button onClick={() => navigate('/enviar-archivo')} className="btn btn-primary" style={{ marginTop: '15px' }}><FaShareSquare /> Enviar archivo</button>
                      </div>
                    )}
                  </>
                )}

                {/* PAPELERA */}
                {pestanaActiva === 'papelera' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {trashItems.map(item => (
                      <div key={item.id} style={{ backgroundColor: '#1D263C', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <span style={{ fontSize: '2rem', color: '#888' }}>{getFileIcon(item.fileType)}</span>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white' }}>{item.name}</h4>
                            <small style={{ color: 'var(--color-text-medium)' }}>{formatFileSize(item.fileSize)}</small>
                          </div>
                        </div>
                        <small style={{ color: '#faad14', display: 'block', marginBottom: '12px' }}>
                          ⏰ Expira en {item.daysLeft || 7} días
                        </small>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleRestoreItem(item.id)} style={{ padding: '6px 12px', background: 'rgba(82,196,26,0.2)', border: 'none', borderRadius: '6px', color: '#52c41a', cursor: 'pointer', fontSize: '0.75rem' }}>Restaurar</button>
                          <button onClick={() => handlePermanentDelete(item.id)} style={{ padding: '6px 12px', background: 'rgba(245,34,45,0.2)', border: 'none', borderRadius: '6px', color: '#f5222d', cursor: 'pointer', fontSize: '0.75rem' }}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                    {trashItems.length === 0 && (
                      <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                        <FaTrash style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                        <p>Papelera vacía</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          {/* PANEL DE DETALLE LATERAL */}
          {elementoDetalle && (
            <aside style={{ 
              backgroundColor: '#1D263C', 
              borderRadius: '16px', 
              border: '1px solid #0a3fff', 
              padding: '24px', 
              position: 'sticky', 
              top: '130px',
              maxHeight: 'calc(100vh - 150px)',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaFileAlt /> Detalles del archivo
                </h3>
                <button onClick={() => setElementoDetalle(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Icono y nombre */}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '3rem', color: 'var(--color-accent)', marginBottom: '10px' }}>
                    {getFileIcon(elementoDetalle.fileType || elementoDetalle.fileType)}
                  </div>
                  <h4 style={{ margin: 0, color: 'white', wordBreak: 'break-all' }}>{elementoDetalle.name || elementoDetalle.fileName}</h4>
                </div>

                {/* Información básica */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FaUser style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} />
                    <span style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem', width: '100px' }}>Remitente:</span>
                    <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '500' }}>
                      {elementoDetalle.sharedBy || elementoDetalle.remitente || 'Tú'}
                    </span>
                  </div>
                  {elementoDetalle.sharedWith && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <FaUser style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} />
                      <span style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem', width: '100px' }}>Destinatario:</span>
                      <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '500' }}>{elementoDetalle.sharedWith}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FaFileAlt style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} />
                    <span style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem', width: '100px' }}>Tamaño:</span>
                    <span style={{ color: 'white', fontSize: '0.85rem' }}>{formatFileSize(elementoDetalle.fileSize)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FaClock style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} />
                    <span style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem', width: '100px' }}>Fecha:</span>
                    <span style={{ color: 'white', fontSize: '0.85rem' }}>
                      {elementoDetalle.tipo === 'recibido' ? formatFullDate(elementoDetalle.sharedAt) : 
                       elementoDetalle.tipo === 'enviado' ? formatFullDate(elementoDetalle.sharedAt) :
                       formatFullDate(elementoDetalle.uploadedAt)}
                    </span>
                  </div>
                  {elementoDetalle.expiresAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FaClock style={{ color: '#ff4d4f', fontSize: '0.9rem' }} />
                      <span style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem', width: '100px' }}>Expira:</span>
                      <span style={{ color: '#ff4d4f', fontSize: '0.85rem', fontWeight: '500' }}>{formatFullDate(elementoDetalle.expiresAt)}</span>
                    </div>
                  )}
                </div>

                {/* Seguridad */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FaShieldAlt style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} />
                    <span style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem', width: '100px' }}>Seguridad:</span>
                    <span style={{ color: 'white', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {renderSecurityBadge(
                        elementoDetalle.securityLevel, 
                        elementoDetalle.isUnlocked || elementoDetalle.inUnlocked, 
                        elementoDetalle.hasPassword
                      )}
                      {elementoDetalle.securityLevel || 'PUBLIC'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaKey style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} />
                    <span style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem', width: '100px' }}>Permiso:</span>
                    <span style={{ 
                      display: 'inline-block', 
                      padding: '4px 10px', 
                      borderRadius: '6px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      backgroundColor: elementoDetalle.accessLevel === 'DOWNLOAD' ? 'rgba(82,196,26,0.2)' : 'rgba(255,197,61,0.2)',
                      color: elementoDetalle.accessLevel === 'DOWNLOAD' ? '#52c41a' : '#faad14'
                    }}>
                      {elementoDetalle.accessLevel === 'DOWNLOAD' ? 'Descarga permitida' : 'Solo visualización'}
                    </span>
                  </div>
                </div>

                {/* Asunto y mensaje */}
                {elementoDetalle.subject && (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <FaEnvelope style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} />
                      <span style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem' }}>Asunto:</span>
                    </div>
                    <p style={{ margin: 0, color: 'white', fontSize: '0.85rem' }}>{elementoDetalle.subject}</p>
                  </div>
                )}

                {elementoDetalle.message && (
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <FaEnvelope style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }} />
                      <span style={{ color: 'var(--color-text-medium)', fontSize: '0.8rem' }}>Mensaje:</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.85rem', fontStyle: 'italic' }}>"{elementoDetalle.message}"</p>
                  </div>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                  {elementoDetalle.accessLevel !== 'READ_ONLY' && (
                    <button 
                      onClick={() => handleDownload(
                        elementoDetalle.itemId, 
                        elementoDetalle.isPersonal !== false, 
                        elementoDetalle.name || elementoDetalle.fileName
                      )} 
                      style={{ flex: 1, backgroundColor: 'rgba(10,63,255,0.2)', border: 'none', padding: '10px', borderRadius: '8px', color: '#0a3fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '500' }}
                    >
                      <FaDownload /> Descargar
                    </button>
                  )}
                  <button 
                    onClick={() => handleOpenFile(elementoDetalle.itemId, elementoDetalle.isPersonal !== false)} 
                    style={{ flex: 1, backgroundColor: 'rgba(82,196,26,0.2)', border: 'none', padding: '10px', borderRadius: '8px', color: '#52c41a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '500' }}
                  >
                    <FaEye /> Abrir / Ver
                  </button>
                </div>

                {pestanaActiva !== 'papelera' && pestanaActiva !== 'enviados' && elementoDetalle.isPersonal !== false && (
                  <button 
                    onClick={() => handleMoveToTrash(elementoDetalle.itemId)} 
                    style={{ width: '100%', backgroundColor: 'rgba(245,34,45,0.15)', border: '1px solid rgba(245,34,45,0.3)', padding: '10px', borderRadius: '8px', color: '#f5222d', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
                  >
                    <FaTrash /> Mover a papelera
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>

      {/* MODAL CREAR CARPETA */}
      {showModalCarpeta && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(19,25,36,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '420px', padding: '2.5rem', backgroundColor: '#1D263C', borderRadius: '16px', border: '1px solid #0a3fff' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px', color: 'white' }}>Nueva Carpeta</h2>
            <form onSubmit={handleCrearCarpeta}>
              <input 
                type="text" 
                placeholder="Nombre de la carpeta" 
                required 
                value={nombreNuevaCarpeta} 
                onChange={(e) => setNombreNuevaCarpeta(e.target.value)} 
                style={{ width: '100%', padding: '12px', marginBottom: '20px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '25px', justifyContent: 'center' }}>
                <button type="button" onClick={() => setColorCarpeta('#52c41a')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#52c41a', border: colorCarpeta === '#52c41a' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Verde" />
                <button type="button" onClick={() => setColorCarpeta('#faad14')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#faad14', border: colorCarpeta === '#faad14' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Amarillo" />
                <button type="button" onClick={() => setColorCarpeta('#f5222d')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f5222d', border: colorCarpeta === '#f5222d' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Rojo" />
                <button type="button" onClick={() => setColorCarpeta('#722ed1')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#722ed1', border: colorCarpeta === '#722ed1' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Morado" />
                <button type="button" onClick={() => setColorCarpeta('#0a3fff')} style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0a3fff', border: colorCarpeta === '#0a3fff' ? '3px solid white' : 'none', cursor: 'pointer' }} title="Azul" />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Crear</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModalCarpeta(false)} style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DESBLOQUEO */}
      {showModalDesbloqueo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(19,25,36,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '400px', padding: '2rem', backgroundColor: '#1D263C', borderRadius: '16px', border: '1px solid #0a3fff' }}>
            <h3 style={{ marginBottom: '15px', textAlign: 'center', color: 'white' }}>🔒 Desbloquear Archivo</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-medium)', textAlign: 'center', marginBottom: '20px' }}>
              Este archivo está protegido. Elige un método para desbloquearlo.
            </p>
            
            <button 
              onClick={() => handleSolicitarToken(showModalDesbloqueo.id, showModalDesbloqueo.isPersonal)} 
              disabled={solicitandoToken} 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: 'rgba(10,63,255,0.2)', border: '1px solid rgba(10,63,255,0.3)', borderRadius: '8px', color: '#0a3fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <FaPhone /> {solicitandoToken ? 'Enviando...' : '📱 Enviar código SMS'}
            </button>
            
            <input 
              type="text" 
              placeholder="Código de 6 dígitos" 
              value={tokenSms} 
              onChange={(e) => setTokenSms(e.target.value)} 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', textAlign: 'center', fontSize: '1.1rem' }}
              maxLength="6"
            />
            
            <button 
              onClick={() => handleVerificarToken(showModalDesbloqueo.id, showModalDesbloqueo.isPersonal)} 
              disabled={desbloqueando} 
              style={{ width: '100%', padding: '12px', marginBottom: '20px', backgroundColor: '#0a3fff', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: '500' }}
            >
              {desbloqueando ? 'Verificando...' : 'Verificar código'}
            </button>
            
            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0' }} />
            
            <input 
              type="password" 
              placeholder="O ingresa la contraseña" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            />
            
            <button 
              onClick={() => handleVerificarPassword(showModalDesbloqueo.id, showModalDesbloqueo.isPersonal)} 
              disabled={desbloqueando} 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
            >
              {desbloqueando ? 'Verificando...' : '🔐 Desbloquear con contraseña'}
            </button>
            
            <button 
              onClick={() => { setShowModalDesbloqueo(null); setTokenSms(''); setPassword(''); }} 
              style={{ width: '100%', padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: 'var(--color-text-medium)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      </main>
    </PrivateLayout>
  );
}