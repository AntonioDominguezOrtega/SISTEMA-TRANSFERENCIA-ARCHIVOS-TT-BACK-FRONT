import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import profileService from '../services/profileService';
import searchService from '../services/searchService';
import storageService from '../services/storageService';
import fileShareService from '../services/fileShareService';
import notificationService from '../services/notificationService';
//import websocketService from '../services/websocketService';

// React Icons
import { 
  FaBars, FaSearch, FaRegBell, FaChevronDown, FaChevronUp, 
  FaUser, FaCog, FaSignOutAlt, FaLock, FaShieldAlt, FaEye 
} from 'react-icons/fa';

// Helper para obtener iniciales
const getInitials = (nombre, apellido) => {
  if (!nombre) return 'U';
  const primera = nombre.charAt(0).toUpperCase();
  const segunda = apellido ? apellido.charAt(0).toUpperCase() : '';
  return `${primera}${segunda}`;
};

// Helper para el icono según tipo
const getResultIcon = (item) => {
  if (item.isFolder) return '📁';
  if (item.type === 'SHARED') return '📩';
  return '📄';
};

// Badge de seguridad para resultados de búsqueda
const getSecurityBadge = (securityLevel) => {
  if (securityLevel === 'PASSWORD') return <FaLock title="Protegido con contraseña" className="security-badge security-badge-password" />;
  if (securityLevel === 'TOKEN_SMS') return <FaShieldAlt title="Verificación por correo" className="security-badge security-badge-token" />;
  return null;
};

export default function PrivateHeader({ toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados de UI
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Estados de búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // <-- NUEVO ESTADO PARA CONTROLAR EXPANSIÓN
  const [isMobile, setIsMobile] = useState(false);
  const searchRef = useRef(null);
  
  // Estados de notificaciones
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const notificationsRef = useRef(null);
  
  // Estados de usuario
  const [user, setUser] = useState(null);
  const [userInitials, setUserInitials] = useState('');
  const [userFotoUrl, setUserFotoUrl] = useState(null);
  const userMenuRef = useRef(null);

  // ============================================================
  // EFECTO DE SCROLL
  // ============================================================
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================================
  // CARGAR DATOS DEL USUARIO
  // ============================================================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = localStorage.getItem('user');
        let currentUser = null;
        
        if (session) {
          currentUser = JSON.parse(session);
          setUser(currentUser);
          const nombreInicial = currentUser.nombre?.charAt(0) || '';
          const apellidoInicial = currentUser.apellido?.charAt(0) || '';
          setUserInitials(`${nombreInicial}${apellidoInicial}`.toUpperCase());
          setUserFotoUrl(currentUser.profilePictureUrl || null);
        }
        
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const profile = await profileService.getMyProfile();
            setUser(prev => ({ ...prev, ...profile }));
            setUserInitials(getInitials(profile.nombre, profile.apellido));
            setUserFotoUrl(profile.profilePictureUrl || null);
            if (currentUser) {
              localStorage.setItem('user', JSON.stringify({ ...currentUser, ...profile }));
            }
          } catch (profileError) {
            console.error('Error obteniendo perfil:', profileError);
          }
        }
      } catch (error) {
        console.error('Error cargando usuario:', error);
      }
    };
    
    loadUser();
  }, []);

  // ============================================================
  // CARGAR NOTIFICACIONES
  // ============================================================
  const loadNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const data = await notificationService.getNotifications(0, 30);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // ============================================================
  // BÚSQUEDA EN VIVO
  // ============================================================
  useEffect(() => {
    const query = searchTerm.trim();
    
    if (query.length >= 2) {
      setIsSearching(true);
      setShowResults(true);

      const delayBusqueda = setTimeout(() => {
        searchService.searchFilesComplete(query, 0, 20)
          .then(response => {
            const results = response.data.results || response.data.files || [];
            setSearchResults(results);
            setIsSearching(false);
          })
          .catch(error => {
            console.error("Error al buscar archivos:", error);
            setSearchResults([]);
            setIsSearching(false);
          });
      }, 400);

      return () => clearTimeout(delayBusqueda);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  // ============================================================
  // CERRAR MENÚS AL CLICAR FUERA
  // ============================================================
  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 850);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    
    const handleClickOutside = (event) => {
      // Manejo del buscador: cerrar sugerencias y colapsar si está vacío
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        if (searchTerm.trim() === '') {
          setIsSearchOpen(false);
        }
      }
      
      // Manejo de notificaciones
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      
      // Manejo del menú de usuario
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateIsMobile);
    };
  }, [showNotifications, unreadCount, searchTerm]);

  // ============================================================
  // MANEJADORES
  // ============================================================
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Al presionar Enter, simplemente limpiar sin navegar a búsqueda
    setShowResults(false);
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  const handleResultClick = async (item) => {
    setShowResults(false);
    setSearchTerm('');
    setIsSearchOpen(false);
    setIsSearching(true);
    
    try {
      let selectedFileData = null;

      // CASO 1: Es una carpeta
      if (item.type === 'FOLDER' || item.isFolder === true) {
        navigate(`/dashboard?carpeta=${item.id}&tab=miunidad`);
        setIsSearching(false);
        return;
      }

      // CASO 2: Es un archivo personal
      if (item.type === 'PERSONAL' || item.isPersonal === true || item.tipo === 'personal') {
        try {
          const fullMetadata = await storageService.getItemInfo(item.id);
          selectedFileData = {
            id: item.id,
            itemId: item.id,
            name: fullMetadata.name || item.name,
            fileName: fullMetadata.name || item.name,
            fileType: fullMetadata.fileType || item.fileType || '',
            fileSize: fullMetadata.fileSize || item.fileSize || 0,
            uploadedAt: fullMetadata.uploadedAt || item.uploadedAt || new Date().toISOString(),
            createdAt: fullMetadata.createdAt || item.createdAt,
            updatedAt: fullMetadata.updatedAt || item.updatedAt,
            securityLevel: fullMetadata.securityLevel || item.securityLevel || 'PUBLIC',
            isUnlocked: fullMetadata.isUnlocked || item.isUnlocked || false,
            inUnlocked: fullMetadata.inUnlocked || item.inUnlocked || false,
            isExpired: false,
            isPersonal: true,
            tipo: 'personal',
            accessLevel: fullMetadata.accessLevel || item.accessLevel,
            parentFolderId: fullMetadata.parentFolderId || item.parentFolderId,
            hasPassword: fullMetadata.hasPassword || item.hasPassword || false,
            smsVerificationEnabled: fullMetadata.smsVerificationEnabled || item.smsVerificationEnabled || false,
            passwordProtected: fullMetadata.passwordProtected || item.passwordProtected || false,
            tokenSmsProtected: fullMetadata.tokenSmsProtected || item.tokenSmsProtected || false,
            ...fullMetadata
          };
        } catch (error) {
          console.error('Error obteniendo metadata de archivo personal:', error);
          selectedFileData = {
            id: item.id,
            name: item.name,
            fileType: item.fileType || '',
            fileSize: item.fileSize || 0,
            isPersonal: true,
            tipo: 'personal',
            securityLevel: item.securityLevel || 'PUBLIC'
          };
        }
      } 
      // CASO 3: Es un archivo compartido
      else if (item.type === 'SHARED' || item.isShared === true || item.shareId || item.tipo === 'recibido' || item.tipo === 'enviado') {
        const shareId = item.shareId || item.id;
        try {
          const fullMetadata = await fileShareService.getFileDetails(shareId);
          selectedFileData = {
            shareId: shareId,
            id: shareId,
            itemId: shareId,
            name: fullMetadata.fileName || item.name,
            fileName: fullMetadata.fileName || item.name,
            fileType: fullMetadata.fileType || item.fileType || '',
            fileSize: fullMetadata.fileSize || item.fileSize || 0,
            sharedAt: fullMetadata.sharedAt || item.sharedAt || new Date().toISOString(),
            securityLevel: fullMetadata.securityLevel || item.securityLevel || 'PUBLIC',
            isUnlocked: fullMetadata.isUnlocked || item.isUnlocked || false,
            inUnlocked: fullMetadata.inUnlocked || item.inUnlocked || false,
            isExpired: item.isExpired || false,
            isPersonal: false,
            tipo: item.tipo || 'recibido',
            sharedBy: fullMetadata.sharedBy || item.sharedBy || 'Desconocido',
            sharedWith: fullMetadata.sharedWith || item.sharedWith,
            accessLevel: fullMetadata.accessLevel || item.accessLevel,
            expiresAt: fullMetadata.expiresAt || item.expiresAt,
            downloadCount: fullMetadata.downloadCount || item.downloadCount || 0,
            viewCount: fullMetadata.viewCount || item.viewCount || 0,
            hasPassword: fullMetadata.hasPassword || item.hasPassword || false,
            smsVerificationEnabled: fullMetadata.smsVerificationEnabled || item.smsVerificationEnabled || false,
            passwordProtected: fullMetadata.passwordProtected || item.passwordProtected || false,
            tokenSmsProtected: fullMetadata.tokenSmsProtected || item.tokenSmsProtected || false,
            ...fullMetadata
          };
        } catch (error) {
          console.error('Error obteniendo metadata de archivo compartido:', error);
          selectedFileData = {
            shareId: shareId,
            id: shareId,
            name: item.name,
            fileName: item.name,
            fileType: item.fileType || '',
            fileSize: item.fileSize || 0,
            isPersonal: false,
            tipo: item.tipo || 'recibido',
            securityLevel: item.securityLevel || 'PUBLIC'
          };
        }
      }
      
      // Navegar al dashboard con los datos completos
      if (selectedFileData) {
        navigate('/dashboard', { 
          state: { 
            selectedFile: selectedFileData,
            fromSearch: true
          }
        });
      }
    } catch (error) {
      console.error('Error al procesar resultado de búsqueda:', error);
      navigate('/dashboard');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMarkNotificationAsRead = async (event, notificationId) => {
    event.stopPropagation();
    if (!notificationId) return;
    await handleMarkAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogout = () => {
    if (typeof websocketService !== 'undefined') {
      try {
        websocketService.disconnect();
      } catch(e) {
        console.error('Error al desconectar WebSocket:', e);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.clear();
    setShowUserMenu(false);
    navigate('/');
  };

  // Formatear tiempo de notificación
  const formatNotificationTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${diffDays} d`;
  };

  // ============================================================
  // RENDER CONDICIONAL
  // ============================================================
  if (!user) {
    return (
      <header className={`private-header ${scrolled ? 'header-scrolled' : ''} private-header-fixed`}>
        <div className="header-loading-container">
          <button className="menu-toggle-btn" onClick={toggleSidebar}>☰</button>
          <Link to="/dashboard">
            <img src="/assets2/img/logo.png" alt="Logo" className="logo-img" />
          </Link>
        </div>
        <div className="header-loading-status">
          <div className="header-loading-avatar">?</div>
          <span>Cargando...</span>
        </div>
      </header>
    );
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <header className={`private-header ${scrolled ? 'header-scrolled' : ''} private-header-fixed`}>
      
      {/* LEFT: Logo y menú */}
      <div className="private-header-left" style={{ display: (isMobile && isSearchOpen) ? 'none' : 'flex' }}>
        <button className="menu-toggle-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <Link to="/dashboard" className="private-logo">
          <img 
            src="/assets2/img/logo.png" 
            alt="Logo Capara" 
            className='logo-img'
          />
        </Link>
      </div>

      {/* CENTER: Buscador Responsivo */}
      <div
        className="private-header-center"
        ref={searchRef}
      >
        {isMobile ? (
          !isSearchOpen ? (
            <button 
              className="icon-btn header-search-toggle" 
              onClick={() => setIsSearchOpen(true)}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--color-text-medium, #A0ABC0)', 
                fontSize: '1.2rem', 
                cursor: 'pointer',
                padding: '10px'
              }}
            >
              <FaSearch />
            </button>
          ) : (
            <form 
              className="header-search" 
              onSubmit={handleSearchSubmit} 
              style={{ 
                width: '100%', 
                maxWidth: '600px', 
                display: 'flex',
                animation: 'fadeIn 0.2s ease-in-out'
              }}
            >
              <input 
                autoFocus
                type="text" 
                className="header-search-input"
                placeholder={`Buscar en ${location.pathname === '/dashboard' ? 'todo tu espacio' : 'esta sección'}...`} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => { if(searchTerm.trim().length >= 2) setShowResults(true) }}
                style={{ flex: 1 }}
              />
              <button type="submit" className="header-search-btn">
                <FaSearch />
              </button>
            </form>
          )
        ) : (
          <form 
            className="header-search" 
            onSubmit={handleSearchSubmit} 
            style={{ 
              width: '100%', 
              maxWidth: '600px', 
              display: 'flex',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <input 
              type="text" 
              className="header-search-input"
              placeholder={`Buscar en ${location.pathname === '/dashboard' ? 'todo tu espacio' : 'esta sección'}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => { if(searchTerm.trim().length >= 2) setShowResults(true) }}
              style={{ flex: 1 }}
            />
            <button type="submit" className="header-search-btn">
              <FaSearch />
            </button>
          </form>
        )}

        {/* Dropdown de resultados */}
        {showResults && isSearchOpen && searchTerm.trim().length >= 2 && (
          <div className="search-results-dropdown" style={{ width: '100%', maxWidth: '600px', right: 'auto' }}>
            {isSearching ? (
              <div className="search-dropdown-message">
                Buscando archivos...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="search-dropdown-message">
                No se encontraron archivos con "{searchTerm}"
              </div>
            ) : (
              <div className="search-results-scroll">
                <div className="search-results-label">
                  Resultados sugeridos
                </div>
                {searchResults.map((item, index) => (
                  <div 
                    key={item.id || index}
                    onClick={() => handleResultClick(item)}
                    className="search-item"
                  >
                    <span className="search-result-icon">{getResultIcon(item)}</span>
                    <div className="search-result-content">
                      <p className="search-result-title">
                        {getSecurityBadge(item.securityLevel)}
                        {item.name}
                      </p>
                      <p className="search-result-subtitle">
                        {item.location || 'Mis archivos'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Notificaciones y Usuario */}
      <div className="private-header-right" style={{ display: (isMobile && isSearchOpen) ? 'none' : 'flex' }}>
        
        {/* NOTIFICACIONES */}
        <div className="notifications-wrapper" ref={notificationsRef}>
          <button 
            className="icon-btn notification-toggle-btn" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                loadNotifications();
              }
            }}
          >
            <FaRegBell />
            {unreadCount > 0 && (
              <span className="notification-count-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-dropdown-header">
                <h3>Notificaciones</h3>
                {unreadCount > 0 && (
                  <button className="notifications-action-btn" onClick={handleMarkAllAsRead}>
                    Marcar todas
                  </button>
                )}
              </div>
              <div className="notifications-dropdown-body">
                {isLoadingNotifications ? (
                  <div className="notifications-empty-state">Cargando...</div>
                ) : notifications.length === 0 ? (
                  <div className="notifications-empty-state">
                    <span className="notifications-empty-icon">🔔</span>
                    No hay notificaciones
                  </div>
                ) : (
                  notifications.map(notif => {
                    let icon = '📢';
                    if (notif.type === 'NEW_FILE_SHARED') icon = '📤';
                    else if (notif.type === 'FILE_VIEWED') icon = '👁️';
                    else if (notif.type === 'FILE_DOWNLOADED') icon = '⬇️';
                    else if (notif.type === 'FILE_EXPIRING') icon = '⚠️';
                    
                    return (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          if (!notif.isRead) {
                            handleMarkAsRead(notif.id);
                          }
                          
                          const shareData = notif.fileShare; 
                          const targetShareId = shareData ? shareData.id : notif.fileShareId;

                          if (targetShareId) {
                            setShowNotifications(false);
                            
                            const isSentByMe = notif.type === 'FILE_DOWNLOADED' || notif.type === 'FILE_VIEWED';
                            const panelType = isSentByMe ? 'sent' : 'shared';
                            
                            navigate('/dashboard', {
                              state: {
                                selectedFile: {
                                  type: panelType,
                                  shareId: targetShareId,
                                  fileName: shareData?.file?.fileName || shareData?.fileName || 'Archivo',
                                  fileType: shareData?.file?.fileType || shareData?.fileType || '',
                                  fileSize: shareData?.file?.fileSize || shareData?.fileSize || 0,
                                  securityLevel: shareData?.securityLevel || 'PUBLIC',
                                  isPersonal: false
                                }
                              }
                            });
                          }
                        }}
                        className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                      >
                        <div className="notification-item-inner">
                          <span className="notification-icon">{icon}</span>
                          <div className="notification-item-content">
                            <p>{notif.message}</p>
                            <div className="notification-item-meta">
                              <small>{formatNotificationTime(notif.createdAt || notif.cratedAt || notif.date)}</small>
                              {!notif.isRead && (
                                <button
                                  className="notification-action-btn"
                                  onClick={(e) => handleMarkNotificationAsRead(e, notif.id)}
                                  title="Marcar como vista"
                                  type="button"
                                >
                                  <FaEye />
                                </button>
                              )}
                            </div>
                          </div>
                          {!notif.isRead && <div className="notification-unread-dot" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* MENÚ DE USUARIO */}
        <div className="user-menu-container" ref={userMenuRef}>
          <div 
            className="user-box user-box-toggle" 
            onClick={() => setShowUserMenu(!showUserMenu)} 
          >
            <div className={`user-avatar ${userFotoUrl ? 'user-avatar-image' : 'user-avatar-initials'}`}>
              {userFotoUrl ? (
                <img 
                  src={userFotoUrl} 
                  alt="Perfil" 
                  className="user-avatar-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerText = userInitials;
                    e.target.parentElement.style.backgroundColor = '#0a3fff';
                  }}
                />
              ) : (
                userInitials
              )}
            </div>
            <span className="user-name">
              {user?.nombre?.split(' ')[0] || 'Usuario'}
            </span>
            <span className="user-menu-icon">
              {showUserMenu ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          </div>

          {showUserMenu && (
            <div className="user-dropdown">
              <button 
                onClick={() => { navigate('/perfil'); setShowUserMenu(false); }}
                className="dropdown-item"
              >
                <FaUser className="dropdown-icon" /> Mi Perfil
              </button>
              <button 
                onClick={() => { navigate('/configuracion'); setShowUserMenu(false); }}
                className="dropdown-item"
              >
                <FaCog className="dropdown-icon" /> Configuración
              </button>
              <button 
                onClick={handleLogout}
                className="dropdown-item dropdown-item-logout"
              >
                <FaSignOutAlt className="dropdown-icon" /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}