import { NavLink } from 'react-router-dom'

export default function Sidebar({ isOpen, closeSidebar }) {
  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-header-mobile">
        <h3 className="sidebar-title" style={{ margin: 0 }}>Menú</h3>
        <button className="sidebar-close-btn" onClick={closeSidebar}>&times;</button>
      </div>

      <nav className="sidebar-nav">
        <ul>
        {/* <li><NavLink to="/nosotros" onClick={closeSidebar}>Nosotros</NavLink></li> */}
        {/* <li><NavLink to="/servicios" onClick={closeSidebar}>Servicios</NavLink></li> */}

        {/* <hr style={{ border: 'none', borderTop: '1px solid #e3e3e3', margin: '10px 0' }} /> */}

          <li><NavLink to="/dashboard" onClick={closeSidebar}>Inicio</NavLink></li>
          <li><NavLink to="/perfil" onClick={closeSidebar}>Perfil</NavLink></li>
          <li><NavLink to="/contactos" onClick={closeSidebar}>Contactos</NavLink></li>
          {/* <li><NavLink to="/carpetas" onClick={closeSidebar}>Carpetas</NavLink></li> */}
          <li><NavLink to="/recientes" onClick={closeSidebar}>Recientes</NavLink></li>
          <li><NavLink to="/compartidos" onClick={closeSidebar}>Vencidos</NavLink></li>
          <li><NavLink to="/subir-archivo" onClick={closeSidebar}>Subir archivo</NavLink></li>
          <li><NavLink to="/papelera" onClick={closeSidebar}>Papelera</NavLink></li>
          <li><NavLink to="/favoritos" onClick={closeSidebar}>Favoritos</NavLink></li>
          
          <hr style={{ border: 'none', borderTop: '1px solid #e3e3e3', margin: '10px 0' }} />
          
          <li><NavLink to="/configuracion" onClick={closeSidebar}>Configuración</NavLink></li>
          <li><NavLink to="/ayuda-soporte" onClick={closeSidebar}>Ayuda</NavLink></li>
        </ul>
      </nav>
    </aside>
  )
}