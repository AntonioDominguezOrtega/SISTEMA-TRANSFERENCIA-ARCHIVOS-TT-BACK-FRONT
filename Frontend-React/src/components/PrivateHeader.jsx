import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import profileService from '../services/profileService'
import searchService from '../services/searchService' // 🌟 NUEVO IMPORT

export default function PrivateHeader({ toggleSidebar }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [scrolled, setScrolled] = useState(false);

  // Estados de Búsqueda y Notificaciones
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false) // 🌟 Control de carga
  const searchRef = useRef(null)

  // Menú de Usuario
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Estado del usuario (con foto actualizada)
  const [userData, setUserData] = useState({
    nombre: 'Usuario',
    iniciales: 'U',
    fotoUrl: null
  });

  // 🌟 Control del Scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 🌟 Cargar datos frescos del usuario
  useEffect(() => {
    const session = localStorage.getItem('user');
    if (session) {
      try {
        const userObj = JSON.parse(session);
        setUserData({
          nombre: (userObj.nombre || 'Usuario').split(' ')[0],
          iniciales: (userObj.nombre || 'Us').substring(0, 2).toUpperCase(),
          fotoUrl: userObj.profilePictureUrl || null
        });
      } catch (error) {}
    }

    profileService.getMyProfile()
      .then(response => {
        const perfilReal = response.data;
        const nuevaFoto = perfilReal.profilePictureUrl || null;
        setUserData({
          nombre: (perfilReal.nombre || 'Usuario').split(' ')[0],
          iniciales: (perfilReal.nombre || 'Us').substring(0, 2).toUpperCase(),
          fotoUrl: nuevaFoto
        });
        if (session) {
          const userObj = JSON.parse(session);
          userObj.profilePictureUrl = nuevaFoto;
          localStorage.setItem('user', JSON.stringify(userObj));
        }
      })
      .catch(err => console.error("No se pudo refrescar el perfil en el Header", err));
  }, []);

  // 🌟 BÚSQUEDA REAL CONECTADA AL BACKEND
  useEffect(() => {
    const query = searchTerm.trim();
    
    // Tu backend de sugerencias exige mínimo 2 caracteres
    if (query.length >= 2) {
      setIsSearching(true);
      setShowResults(true);

      const delayBusqueda = setTimeout(() => {
        searchService.suggestFiles(query)
          .then(response => {
            // El backend devuelve { suggestions: [...] }
            setSearchResults(response.data.suggestions || []);
            setIsSearching(false);
          })
          .catch(error => {
            console.error("Error al buscar archivos:", error);
            setIsSearching(false);
          });
      }, 400); // 400ms de Debounce

      return () => clearTimeout(delayBusqueda);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  // Cierra menús al clickear fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowResults(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowResults(false);
      // Redirige a la página de búsqueda avanzada (donde podrás usar searchService.searchFiles)
      navigate(`/busqueda?q=${encodeURIComponent(searchTerm)}`);
    }
  }

  const handleLogout = () => {
    localStorage.clear(); 
    setShowUserMenu(false);
    navigate('/'); 
  };

  return (
    <header className={`private-header ${scrolled ? 'header-scrolled' : ''}`} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000,
      transition: 'all 0.4s ease',
      padding: scrolled ? '0.5rem 28px' : '0.85rem 28px',
      minHeight: scrolled ? '65px' : '82px',
      backgroundColor: scrolled ? 'rgba(24, 35, 60, 0.95)' : '#18233C', 
      boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.3)' : '0 6px 16px rgba(0, 0, 0, 0.12)',
      backdropFilter: scrolled ? 'blur(10px)' : 'none',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      
      <div className="private-header-left">
        <button className="menu-toggle-btn" onClick={toggleSidebar}>☰</button>
        <Link to="/dashboard" className="private-logo" style={{ color: 'var(--color-white)', fontWeight: '700' }}>
          <img src="/assets2/img/logo.png" 
               alt="Logo Capara" 
               className='logo-img'
               style={{
                  height: scrolled ? '40px' : '70px', 
                  width: 'auto',          
                  objectFit: 'contain',   
                  transition: 'height 0.3s ease' 
                }} />
        </Link>
      </div>

      {/* --- BUSCADOR --- */}
      <div className="private-header-center" ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '720px' }}>
        <form className="header-search" onSubmit={handleSearchSubmit} style={{ margin: 0 }}>
          <input 
            type="text" 
            placeholder="Buscar en todos tus archivos y compartidos..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if(searchTerm.trim().length >= 2) setShowResults(true) }}
          />
          <button type="submit">🔍</button>
        </form>

        {/* 🌟 Dropdown Dinámico del Servidor */}
        {showResults && searchTerm.trim().length >= 2 && (
          <div className="search-results-dropdown" style={{
            position: 'absolute', top: '110%', left: 0, width: '100%',
            backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-medium)',
            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1000,
            overflow: 'hidden', textAlign: 'left'
          }}>
            {isSearching ? (
               <div style={{ padding: '16px', color: 'var(--color-text-medium)', textAlign: 'center' }}>
                 Buscando archivos...
               </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--color-text-medium)', textAlign: 'center' }}>
                No se encontraron archivos con "{searchTerm}"
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-dark)', fontSize: '0.8rem', color: 'var(--color-text-medium)' }}>
                  Resultados sugeridos
                </div>
                {searchResults.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setShowResults(false);
                      setSearchTerm('');
                      // El backend nos dice si es FOLDER o archivo (PERSONAL / SHARED)
                      navigate(item.type === 'FOLDER' ? `/carpeta/${item.id}` : `/archivo/${item.id}`);
                    }}
                    className="search-item"
                    style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-white)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {item.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-medium)' }}>
                        {item.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- SECCIÓN DERECHA --- */}
      <div className="private-header-right">
        <div style={{ position: 'relative' }}>
          <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>🔔</button>
          
          {showNotifications && (
            <div className="notifications-dropdown" style={{ position: 'absolute', top: '130%', right: '0', width: '300px', backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-medium)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', zIndex: 1000, padding: '16px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--color-accent)' }}>Notificaciones</h3>
              <p style={{ color: 'var(--color-text-medium)', textAlign: 'center', margin: 0, fontSize: '0.9rem' }}>No hay novedades</p>
            </div>
          )}
        </div>

        {/* --- MENU DESPLEGABLE DE USUARIO --- */}
        <div className="user-menu-container" ref={userMenuRef} style={{ position: 'relative' }}>
          <div className="user-box" onClick={() => setShowUserMenu(!showUserMenu)} style={{ cursor: 'pointer' }}>
            
            <div className="user-avatar" style={{ 
              backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', width: '38px', height: '38px', borderRadius: '50%'
            }}>
              {userData.fotoUrl ? (
                <img src={userData.fotoUrl} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                userData.iniciales
              )}
            </div>

            <span className="user-name" style={{ color: 'var(--color-white)' }}>
              {userData.nombre}
            </span>
            <span style={{ fontSize: '0.7rem', marginLeft: '5px', color: 'var(--color-accent)' }}>{showUserMenu ? '▲' : '▼'}</span>
          </div>

          {showUserMenu && (
            <div className="user-dropdown" style={{
              position: 'absolute', top: '130%', right: '0', width: '190px',
              backgroundColor: 'var(--color-primary)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'var(--shadow-medium)', zIndex: 1001, overflow: 'hidden', padding: '5px 0'
            }}>
              <button className="dropdown-item" onClick={() => { navigate('/perfil'); setShowUserMenu(false); }} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--color-white)' }}>👤 Mi Perfil</button>
              <button className="dropdown-item" onClick={() => { navigate('/configuracion'); setShowUserMenu(false); }} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--color-white)' }}>⚙️ Configuración</button>
              <button className="dropdown-item logout" onClick={handleLogout} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#ff4d4f', borderTop: '1px solid rgba(255,255,255,0.05)' }}>🚪 Cerrar Sesión</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}