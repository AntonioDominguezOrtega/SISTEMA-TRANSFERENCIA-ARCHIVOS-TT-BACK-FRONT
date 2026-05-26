import { useState } from 'react'
import PrivateHeader from './PrivateHeader'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function PrivateLayout({ children }) {
  // Estado para saber si el menú está abierto (true) o cerrado (false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Funciones para manipular el estado
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <>
      {/* La capa oscura que opaca la pantalla. Si se hace clic, cierra el menú */}
      <div 
        className={`app-overlay ${isSidebarOpen ? 'is-visible' : ''}`} 
        onClick={closeSidebar}
      ></div>

      {/* Le pasamos la función al Header para que el botón de hamburguesa funcione */}
      <PrivateHeader toggleSidebar={toggleSidebar} />

      <div className="dashboard-layout">
        {/* Le pasamos el estado y la función de cerrar al Sidebar */}
        <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
        
        {/* Aquí adentro se inyectará el contenido de Dashboard o Carpetas */}
        <main className="dashboard-main">
          {children}
        </main>
      </div>

      <Footer />
    </>
  )
}