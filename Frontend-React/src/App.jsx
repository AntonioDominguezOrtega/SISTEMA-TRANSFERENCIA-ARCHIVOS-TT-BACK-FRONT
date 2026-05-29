import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'

// Importamos las páginas
import Home from './pages/home'
import Login from './pages/login'
import Dashboard from './pages/dashboard'
import Carpetas from './pages/carpetas'
import NotFound from './pages/NotFound'
import Notificaciones from './pages/notificaciones'
import Recientes from './pages/recientes'
import CarpetaDetalle from './pages/carpetaDetalle'
import Compartidos from './pages/compartidos'
import SubirArchivo from './pages/subirArchivo'
import ArchivoDetalle from './pages/archivoDetalle'
import Papelera from './pages/papelera'
import ResultadosBusqueda from './pages/resultadosBusqueda'
import AyudaSoporte from './pages/ayudaSoporte'
import Configuracion from './pages/configuracion'
import Contactos from './pages/contactosUsuario'
import Nosotros from './pages/nosotros'
import Perfil from './pages/perfilUsuario'
import Registro from './pages/registroUsuario'
import TerminosCondiciones from './pages/terminosCondiciones'
import RegistroUsuario from './pages/registroUsuario'
import ContactosUsuario from './pages/contactosUsuario'
import RecuperacionContrasena from './pages/recuperacionContrasena'
import Favoritos from './pages/favoritos'
import AnadirAmigo from './pages/anadirAmigos'
import EnviarArchivo from './pages/enviarArchivo'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/registro" element={<RegistroUsuario />} />
          <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
          <Route path="/recuperacion-contrasena" element={<RecuperacionContrasena />} />

          {/* Rutas Privadas */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/carpetas" element={<Carpetas />} />
          <Route path="/notificaciones" element={<Notificaciones />} />
          <Route path="/recientes" element={<Recientes />} />
          <Route path="/carpeta/:id" element={<CarpetaDetalle />} />
          <Route path="/compartidos" element={<Compartidos />} />
          <Route path="/subir-archivo" element={<SubirArchivo />} />
          <Route path="/archivo/:id" element={<ArchivoDetalle />} />
          <Route path="/papelera" element={<Papelera />} />
          <Route path="/busqueda" element={<ResultadosBusqueda />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/contactos" element={<Contactos/>} />
          <Route path="/ayuda-soporte" element={<AyudaSoporte />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/anadir-amigos" element={<anadirAmigos />} />
          <Route path="/enviar-archivo" element={<EnviarArchivo />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App