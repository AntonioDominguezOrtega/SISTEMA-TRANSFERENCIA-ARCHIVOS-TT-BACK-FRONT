import { NavLink } from 'react-router-dom'

// Importación de React Icons estandarizados
import { 
  FaHome, FaUser, FaAddressBook, FaRegClock, FaHistory, 
  FaTrashAlt, FaStar, FaCog, FaQuestionCircle, FaTimes 
} from 'react-icons/fa'

export default function Sidebar({ isOpen, closeSidebar }) {
  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-header-mobile">
        <h3 className="sidebar-title" style={{ margin: 0 }}>Menú</h3>
        <button className="sidebar-close-btn" onClick={closeSidebar}>
          <FaTimes />
        </button>
      </div>

      {/* =======================================================
          🌟 CONTROL DE SCROLL DISCRETO Y ADAPTADO AL TEMA OSCURO
         ======================================================= */}
      <nav 
        className="sidebar-nav" 
        style={{ 
          maxHeight: 'calc(100vh - 90px)', 
          overflowY: 'auto',
          paddingBottom: '20px',
          /* Inyección de estilos inline dinámicos para navegadores modernos (Firefox) */
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent'
        }}
      >
        {/* 🌟 BLOQUE DE ESTILOS CSS INYECTADOS EXCLUSIVOS PARA PERSONALIZAR LA BARRA (Chrome, Edge, Safari) */}
        <style>{`
          .sidebar-nav::-webkit-scrollbar {
            width: 5px; /* Hace la barra ultra delgada */
          }
          .sidebar-nav::-webkit-scrollbar-track {
            background: transparent; /* Elimina el fondo gris feo de Windows */
          }
          .sidebar-nav::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.12); /* Indicador sutil y semi-translúcido */
            border-radius: 10px;
          }
          .sidebar-nav::-webkit-scrollbar-thumb:hover {
            background: rgba(10, 63, 255, 0.4); /* Cambia suavemente a tu azul neón al pasar el mouse */
          }
        `}</style>

        <ul>
          <li>
            <NavLink to="/dashboard" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaHome style={{ color: 'var(--color-accent)' }} /> Inicio
            </NavLink>
          </li>
          <li>
            <NavLink to="/perfil" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaUser /> Perfil
            </NavLink>
          </li>
          <li>
            <NavLink to="/contactos" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaAddressBook /> Contactos
            </NavLink>
          </li>
          <li>
            <NavLink to="/recientes" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaRegClock /> Recientes
            </NavLink>
          </li>
          <li>
            <NavLink to="/compartidos" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaHistory style={{ color: '#ff4d4f' }} /> Vencidos
            </NavLink>
          </li>
          <li>
            <NavLink to="/papelera" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaTrashAlt /> Papelera
            </NavLink>
          </li>
          <li>
            <NavLink to="/favoritos" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaStar style={{ color: '#faad14' }} /> Favoritos
            </NavLink>
          </li>
          
          <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '15px 0' }} />
          
          <li>
            <NavLink to="/configuracion" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaCog /> Configuración
            </NavLink>
          </li>
          <li>
            <NavLink to="/ayuda-soporte" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FaQuestionCircle /> Ayuda
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  )
}