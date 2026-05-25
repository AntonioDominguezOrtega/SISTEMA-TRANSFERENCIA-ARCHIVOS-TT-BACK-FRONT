import React from 'react'
import PublicHeader from './PublicHeader'
import Footer from './Footer'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  // Este método se llama cuando un componente hijo lanza un error
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  // Este método captura los detalles del error
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo })
    // Aquí podrías enviar el error a tu backend en el futuro
    console.error("Error capturado por ErrorBoundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Interfaz de error (usando tus variables CSS existentes)
      return (
        <>
          <PublicHeader />
          <main style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', width: '100%', backgroundColor: 'var(--color-white)', padding: '32px', borderRadius: '20px', boxShadow: 'var(--shadow-soft)', borderTop: '6px solid #ff4d4f' }}>
              
              <h1 style={{ color: '#ff4d4f', marginBottom: '16px', fontSize: '2rem' }}>
                ¡Ups! Algo salió mal.
              </h1>
              
              <p style={{ color: 'var(--color-dark)', marginBottom: '24px', fontSize: '1.1rem' }}>
                Ocurrió una excepción inesperada en la aplicación. Aquí están los detalles para depuración:
              </p>
              
              {/* Caja de detalles técnicos */}
              <div style={{ backgroundColor: '#f1f1f1', padding: '20px', borderRadius: '12px', overflowX: 'auto', marginBottom: '30px', border: '1px solid #e2e2e2' }}>
                
                <h3 style={{ fontSize: '1.1rem', color: '#d93025', marginBottom: '8px' }}>
                  Mensaje de error:
                </h3>
                <pre style={{ color: '#d93025', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.95rem', fontFamily: 'var(--font-main)' }}>
                  {this.state.error && this.state.error.toString()}
                </pre>
                
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-medium-dark)', marginTop: '20px', marginBottom: '8px' }}>
                  Stack Trace (Origen):
                </h3>
                <pre style={{ color: 'var(--color-medium-dark)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem', fontFamily: 'var(--font-main)' }}>
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>

              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button onClick={() => window.location.href = '/'} className="btn btn-primary">
                  Volver al Inicio
                </button>
                <button onClick={() => window.location.reload()} className="btn btn-secondary">
                  Recargar Página
                </button>
              </div>

            </div>
          </main>
          <Footer />
        </>
      )
    }

    // Si no hay error, renderiza la aplicación normalmente
    return this.props.children
  }
}

export default ErrorBoundary