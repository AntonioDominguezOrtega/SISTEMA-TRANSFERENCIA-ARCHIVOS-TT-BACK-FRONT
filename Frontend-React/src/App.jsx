import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

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
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/carpetas" element={<ProtectedRoute><Carpetas /></ProtectedRoute>} />
          <Route path="/notificaciones" element={<ProtectedRoute><Notificaciones /></ProtectedRoute>} />
          <Route path="/recientes" element={<ProtectedRoute><Recientes /></ProtectedRoute>} />
          <Route path="/carpeta/:id" element={<ProtectedRoute><CarpetaDetalle /></ProtectedRoute>} />
          <Route path="/compartidos" element={<ProtectedRoute><Compartidos /></ProtectedRoute>} />
          <Route path="/subir-archivo" element={<ProtectedRoute><SubirArchivo /></ProtectedRoute>} />
          <Route path="/archivo/:id" element={<ProtectedRoute><ArchivoDetalle /></ProtectedRoute>} />
          <Route path="/papelera" element={<ProtectedRoute><Papelera /></ProtectedRoute>} />
          <Route path="/busqueda" element={<ProtectedRoute><ResultadosBusqueda /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
          <Route path="/contactos" element={<ProtectedRoute><Contactos/></ProtectedRoute>} />
          <Route path="/ayuda-soporte" element={<ProtectedRoute><AyudaSoporte /></ProtectedRoute>} />
          <Route path="/favoritos" element={<ProtectedRoute><Favoritos /></ProtectedRoute>} />
          <Route path="/anadir-amigos" element={<ProtectedRoute><AnadirAmigo /></ProtectedRoute>} />
          <Route path="/enviar-archivo" element={<ProtectedRoute><EnviarArchivo /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App