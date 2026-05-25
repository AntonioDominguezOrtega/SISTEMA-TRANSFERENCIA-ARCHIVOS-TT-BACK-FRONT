import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main style={{ 
        minHeight: 'calc(100vh - 160px)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center', 
        padding: '40px 20px' 
      }}>
        <h1 style={{ fontSize: '6rem', color: 'var(--color-primary)', margin: '0', lineHeight: '1' }}>404</h1>
        <h2 style={{ fontSize: '2rem', color: 'var(--color-dark)', marginBottom: '16px' }}>Página no encontrada</h2>
        <p style={{ color: 'var(--color-medium-dark)', marginBottom: '32px', maxWidth: '500px' }}>
          Lo sentimos, la página a la que intentas acceder no existe, ha sido movida o la URL es incorrecta.
        </p>
        <Link to="/" className="btn btn-primary">
          Regresar al Inicio
        </Link>
      </main>
      <Footer />
    </>
  )
}