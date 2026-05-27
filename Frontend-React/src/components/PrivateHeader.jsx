import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import profileService from '../services/profileService';
import searchService from '../services/searchService';
import notificationService from '../services/notificationService';
//import websocketService from '../services/websocketService';

// React Icons
import { 
  FaBars, FaSearch, FaRegBell, FaChevronDown, FaChevronUp, 
  FaUser, FaCog, FaSignOutAlt, FaLock, FaShieldAlt 
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
  if (securityLevel === 'PASSWORD') return <FaLock title="Protegido con contraseña" style={{ color: '#faad14', marginRight: '4px', fontSize: '0.75rem' }} />;
  if (securityLevel === 'TOKEN_SMS') return <FaShieldAlt title="Verificación SMS" style={{ color: '#0a3fff', marginRight: '4px', fontSize: '0.75rem' }} />;
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
        searchService.suggestFiles(query)
          .then(response => {
            setSearchResults(response.data.suggestions || []);
            setIsSearching(false);
          })
          .catch(error => {
            console.error("Error al buscar archivos:", error);
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
  // CERRAR MENÚS AL CLICAR FUERA (CON AUTO-MARCADO DE NOTIFICACIONES)
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        if (showNotifications && unreadCount > 0) {
          handleMarkAllAsRead();
        }
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, unreadCount]);

  // ============================================================
  // MANEJADORES
  // ============================================================
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowResults(false);
      navigate(`/busqueda?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleResultClick = (item) => {
    setShowResults(false);
    setSearchTerm('');
    
    if (item.type === 'FOLDER') {
      navigate(`/dashboard?carpeta=${item.id}&tab=miunidad`);
      return;
    }

    // Enviamos el objeto con toda la metadata recolectada directamente al estado de navegación
    navigate('/dashboard', { 
      state: { 
        selectedFile: {
          id: item.type === 'PERSONAL' ? item.id : undefined,
          shareId: item.type === 'SHARED' ? item.id : undefined,
          itemId: item.id,
          name: item.name,
          fileName: item.name,
          fileType: item.fileType,
          fileSize: item.fileSize,
          securityLevel: item.securityLevel,
          isUnlocked: item.isUnlocked,
          isExpired: item.isExpired,
          accessLevel: item.accessLevel,
          sharedBy: item.sharedBy,
          isPersonal: item.type === 'PERSONAL'
        }
      }
    });
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

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Desconectar websocket si está disponible
      // websocketService.disconnect();
      
      // Limpiar almacenamiento local
      localStorage.clear();
      sessionStorage.clear();
      
      // Navegar a home
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aun así limpia y navega aunque falle
      localStorage.clear();
      sessionStorage.clear();
      navigate('/', { replace: true });
    }
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
      <header className={`private-header ${scrolled ? 'header-scrolled' : ''}`} style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000,
        transition: 'all 0.4s ease',
        padding: scrolled ? '0.5rem 2rem' : '0.85rem 2rem',
        backgroundColor: scrolled ? 'rgba(24, 35, 60, 0.95)' : '#18233C',
        boxShadow: scrolled ? '0 4px 20px rgba(10, 63, 255, 0.5)' : '0 4px 14px rgba(0, 0, 0, 0.15)',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>☰</button>
          <Link to="/dashboard"><img src="/assets2/img/logo.png" alt="Logo" style={{ height: scrolled ? '30px' : '60px', width: 'auto', objectFit: 'contain', transition: 'height 0.3s ease' }} /></Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#0a3fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>?</div>
          <span style={{ color: 'white' }}>Cargando...</span>
        </div>
      </header>
    );
  }

  // ============================================================
  // RENDER PRINCIPAL
  // ============================================================
  return (
    <header className={`private-header ${scrolled ? 'header-scrolled' : ''}`} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000,
      transition: 'all 0.4s ease',
      padding: scrolled ? '0.5rem 2rem' : '0.85rem 2rem',
      backgroundColor: scrolled ? 'rgba(24, 35, 60, 0.95)' : '#18233C',
      boxShadow: scrolled ? '0 4px 20px rgba(10, 63, 255, 0.5)' : '0 4px 14px rgba(0, 0, 0, 0.15)',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px'
    }}>
      
      {/* LEFT: Logo y menú */}
      <div className="private-header-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button className="menu-toggle-btn" onClick={toggleSidebar} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
          <FaBars />
        </button>
        <Link to="/dashboard" className="private-logo">
          <img 
            src="/assets2/img/logo.png" 
            alt="Logo Capara" 
            className='logo-img'
            style={{
              height: scrolled ? '30px' : '60px', 
              width: 'auto',          
              objectFit: 'contain',   
              transition: 'height 0.3s ease' 
            }} 
          />
        </Link>
      </div>

      {/* CENTER: Buscador */}
      <div className="private-header-center" ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '720px' }}>
        <form className="header-search" onSubmit={handleSearchSubmit} style={{ margin: 0, display: 'flex' }}>
          <input 
            type="text" 
            placeholder={`Buscar en ${location.pathname === '/dashboard' ? 'todo tu espacio' : 'esta sección'}...`} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if(searchTerm.trim().length >= 2) setShowResults(true) }}
            style={{
              flex: 1,
              padding: '10px 15px',
              border: 'none',
              borderRadius: '8px 0 0 8px',
              outline: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white'
            }}
          />
          <button type="submit" style={{
            padding: '10px 15px',
            border: 'none',
            borderRadius: '0 8px 8px 0',
            backgroundColor: '#0a3fff',
            color: 'white',
            cursor: 'pointer'
          }}>
            <FaSearch />
          </button>
        </form>

        {/* Dropdown de resultados */}
        {showResults && searchTerm.trim().length >= 2 && (
          <div className="search-results-dropdown" style={{
            position: 'absolute', top: '110%', left: 0, width: '100%',
            backgroundColor: '#1D263C', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1000,
            overflow: 'hidden', textAlign: 'left'
          }}>
            {isSearching ? (
              <div style={{ padding: '16px', color: '#888', textAlign: 'center' }}>
                Buscando archivos...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '16px', color: '#888', textAlign: 'center' }}>
                No se encontraron archivos con "{searchTerm}"
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{ padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', color: '#888' }}>
                  Resultados sugeridos
                </div>
                {searchResults.map((item, index) => (
                  <div 
                    key={item.id || index}
                    onClick={() => handleResultClick(item)}
                    className="search-item"
                    style={{ 
                      padding: '12px 16px', 
                      borderBottom: '1px solid rgba(255,255,255,0.05)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{getResultIcon(item)}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                        {getSecurityBadge(item.securityLevel)}
                        {item.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#888' }}>
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
      <div className="private-header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* NOTIFICACIONES */}
        <div style={{ position: 'relative' }} ref={notificationsRef}>
          <button 
            className="icon-btn" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                loadNotifications();
              }
            }}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}
          >
            <FaRegBell />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 'bold',
                minWidth: '18px',
                textAlign: 'center'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown" style={{
              position: 'absolute', top: '130%', right: '0', width: '340px',
              backgroundColor: '#1D263C', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1000,
              overflow: 'hidden', maxHeight: '420px', display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid rgba(255,255,255,0.08)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.03)'
              }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600', color: 'white' }}>Notificaciones</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    style={{ background: 'none', border: 'none', color: '#46A2FD', cursor: 'pointer', fontSize: '0.7rem' }}
                  >
                    Marcar todas
                  </button>
                )}
              </div>
              
              <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
                {isLoadingNotifications ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Cargando...</div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                    <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔔</span>
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
                          
                          // Como el backend devuelve la entidad anidada, la extraemos
                          const shareData = notif.fileShare; 
                          const targetShareId = shareData ? shareData.id : notif.fileShareId;

                          if (targetShareId) {
                            setShowNotifications(false);
                            
                            // Verificamos si la notificación es de algo que enviaste o recibiste
                            // Dependiendo del tipo de notificación, lo mandamos a recibidos o enviados
                            const isSentByMe = notif.type === 'FILE_DOWNLOADED' || notif.type === 'FILE_VIEWED';
                            const panelType = isSentByMe ? 'sent' : 'shared';
                            
                            navigate('/dashboard', {
                              state: {
                                selectedFile: {
                                  type: panelType, // 'shared' (recibidos) o 'sent' (enviados)
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
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          backgroundColor: notif.isRead ? 'transparent' : 'rgba(70, 162, 253, 0.1)',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.isRead ? 'transparent' : 'rgba(70, 162, 253, 0.1)'}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'white', lineHeight: '1.4' }}>
                              {notif.message}
                            </p>
                            <small style={{ fontSize: '0.65rem', color: '#888', display: 'block', marginTop: '4px' }}>
                              {formatNotificationTime(notif.cratedAt || notif.createdAt)}
                            </small>
                          </div>
                          {!notif.isRead && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#46A2FD', alignSelf: 'center' }} />
                          )}
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
        <div className="user-menu-container" ref={userMenuRef} style={{ position: 'relative' }}>
          <div 
            className="user-box" 
            onClick={() => setShowUserMenu(!showUserMenu)} 
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '4px 8px',
              borderRadius: '30px',
              transition: 'background 0.2s'
            }}
          >
            <div className="user-avatar" style={{
              width: '38px', 
              height: '38px', 
              borderRadius: '50%',
              backgroundColor: userFotoUrl ? 'transparent' : '#0a3fff',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white', 
              fontWeight: 'bold', 
              fontSize: '14px',
              overflow: 'hidden'
            }}>
              {userFotoUrl ? (
                <img 
                  src={userFotoUrl} 
                  alt="Perfil" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            <span className="user-name" style={{ color: 'white', fontWeight: '500', fontSize: '0.9rem' }}>
              {user?.nombre?.split(' ')[0] || 'Usuario'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#46A2FD' }}>
              {showUserMenu ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          </div>

          {showUserMenu && (
            <div className="user-dropdown" style={{
              position: 'absolute', top: '130%', right: '0', width: '200px',
              backgroundColor: '#1D263C', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 1001, overflow: 'hidden', padding: '5px 0'
            }}>
              <button 
                onClick={() => { navigate('/perfil'); setShowUserMenu(false); }}
                style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '0.85rem' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaUser style={{ color: '#46A2FD' }} /> Mi Perfil
              </button>
              <button 
                onClick={() => { navigate('/configuracion'); setShowUserMenu(false); }}
                style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '0.85rem' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaCog style={{ color: '#46A2FD' }} /> Configuración
              </button>
              <button 
                onClick={handleLogout}
                style={{ width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#ff4d4f', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaSignOutAlt /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}