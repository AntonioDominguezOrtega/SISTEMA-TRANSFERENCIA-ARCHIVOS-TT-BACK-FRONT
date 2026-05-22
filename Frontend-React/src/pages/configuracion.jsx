import React from 'react'
import PrivateLayout from '../components/PrivateLayout'
import { Link } from 'react-router-dom';

export default function Configuracion() {

  return (
    <PrivateLayout>
      <main className="settings-page">
        <header className="section-heading">
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <h1>Configuración de Cuenta</h1>
          <p>Gestiona tu información personal y los parámetros de seguridad de tu cuenta.</p>
        </header>

        <div className="settings-grid" style={{ display: 'grid', gap: '2rem', marginTop: '3rem' }}>
          {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
          <section className="benefit-box shadow-sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* <span style={{ fontSize: '1.5rem' }}>👤</span> */}
              <h3 style={{ margin: 0 }}>Información Personal</h3>
            </div>
            
            <form className="auth-form" style={{ maxWidth: '100%' }}>

              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    className="form-control-modern" 
                    placeholder="Hector Alejandro Hernandez Aranda" 
                    disabled 
                    style={{ cursor: 'not-allowed', backgroundColor: '#f0f0f0' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre de Usuario</label>
                <div className="input-wrapper">
                  {/* <span className="input-icon">👤</span> */}
                  <input 
                    type="text" 
                    className="form-control-modern" 
                    placeholder="Introducir Nombre de Usuario" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <div className="input-wrapper">
                  {/* <span className="input-icon">📧</span> */}
                  <input 
                    type="email" 
                    className="form-control-modern" 
                    placeholder="ambar.garcia@ejemplo.com" 
                    disabled 
                    style={{ cursor: 'not-allowed', backgroundColor: '#f0f0f0' }}
                  />
                </div>
              </div>

              <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
                Actualizar Perfil
              </button>
            </form>
          </section>

          {/* SECCIÓN 2: SEGURIDAD Y MFA (SMS) */}
          <section className="benefit-box shadow-sm" style={{ borderLeft: '4px solid var(--accent-color, #0A3FFF)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* <span style={{ fontSize: '1.5rem' }}>🔐</span> */}
              <h3 style={{ margin: 0 }}>Seguridad y Autenticación</h3>
            </div>
            
            <div className="form-group">
              <label className="form-label">Número Celular para SMS</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  {/* <span className="input-icon">📱</span> */}
                  <input 
                    type="tel" 
                    className="form-control-modern" 
                    placeholder="+52 55 1122 3344" 
                    disabled
                    style={{ cursor: 'not-allowed', backgroundColor: '#f0f0f0' }}
                  />
                </div>
                {/* <button type="button" className="btn btn-primary">Cambiar</button> */}
              </div>
              <small className="form-help">Utilizado para el envío de tokens de cifrado vía Azure.</small>
            </div>
          </section>

          {/* SECCIÓN 3: CAMBIO DE CONTRASEÑA (Integrada) */}
          <section className="benefit-box shadow-sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* <span style={{ fontSize: '1.5rem' }}>📩</span> */}
              <h3 style={{ margin: 0 }}>Cambio de Contraseña</h3>
              
              {/* CORRECCIÓN: 'Link' con mayúscula y asegurando que la ruta exista */}
              <Link to="/recuperacion-contrasena" 
                state={{ desdeConfiguracion: true }}
                className="btn btn-secondary" 
                style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                Cambiar Contraseña
              </Link>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Para cambiar tu contraseña, haz clic en el botón "Cambiar Contraseña" y sigue las instrucciones para verificar tu identidad mediante el token dual.
            </p>
          </section>

        </div>
      </main>
    </PrivateLayout>
  )
}