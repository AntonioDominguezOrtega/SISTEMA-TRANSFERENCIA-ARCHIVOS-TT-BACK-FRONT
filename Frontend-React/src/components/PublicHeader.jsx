import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`site-header ${scrolled ? 'header-scrolled' : ''}`} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000,
      transition: 'all 0.4s ease', // Cambiado a 0.4s para que haga juego con el CSS
      padding: scrolled ? '0.5rem 2rem' : '0.85rem 2rem',
      
      /* 🌟 CORRECCIÓN: Ahora mantiene tu azul oscuro base arriba, y con opacidad al bajar */
      backgroundColor: scrolled ? 'rgba(24, 35, 60, 0.95)' : '#18233C', 
      
      boxShadow: scrolled ? '0 4px 20px rgba(10, 63, 255, 0.5)' : '0 4px 14px rgba(0, 0, 0, 0.15)',
      backdropFilter: scrolled ? 'blur(10px)' : 'none' 
    }}>
      <div className="container header-container">
        <Link to="/" className="site-logo">
          {/* 🌟 CORRECCIÓN: Agregada la diagonal inicial / para asegurar que cargue desde public */}
          <img src="/assets2/img/logo.png" 
               alt="Logo Capara" 
               className='logo-img'
               style={{
                  /* 🌟 AQUÍ SE CAMBIA EL TAMAÑO: Si el usuario baja mide 32px, si está arriba mide 40px */
                  height: scrolled ? '50px' : '100px', 
                  width: 'auto',          /* Mantiene la proporción para que no se aplaste */
                  objectFit: 'contain',   /* Evita que se deforme */
                  transition: 'height 0.3s ease' /* Hace el cambio de tamaño suave */
                }}
          />
        </Link>

        <nav className="site-nav" aria-label="Navegación principal">
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/nosotros">Nosotros</Link></li>
            <li><Link to="/login" className="nav-btn">Iniciar sesión</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}