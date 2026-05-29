import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'

export default function RegistroUsuario() {
  const navigate = useNavigate();
  
  // 1. ESTADOS DEL FORMULARIO (Separado en Nombre y Apellidos)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    nombreUsuario: '', 
    email: '',
    emailRecuperacion: '', 
    tel: '',
    password: '',
    confirmPassword: ''
  });

  // 2. ESTADOS DE LÓGICA (Token y Carga)
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    
    // Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    // Doble verificación por si se salta el atributo html required
    if (!aceptaTerminos) {
      alert("Debes aceptar los Términos y Condiciones para continuar.");
      return;
    }

    // Simulación de envío de tokens (Backend disparando servicios de Azure)
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowTokenModal(true);
    }, 1500);
  };

  const handleVerifyToken = (e) => {
    e.preventDefault();
    // Simulación de validación (Token de prueba: 123456)
    if (tokenInput === "123456") {
      alert("Verificación exitosa. Usuario registrado correctamente.");
      navigate('/login');
    } else {
      alert("Token incorrecto. Revisa tus medios de contacto.");
    }
  };

  return (
    <>
      <PublicHeader />

      {/* Ajustado el espaciado para que no choque con el header fijo */}
      <main className="auth-page" style={{ paddingTop: '140px', paddingBottom: '60px', backgroundColor: 'var(--color-dark)' }}>
        <section className="section login-section" style={{ padding: '20px 0' }}>
          <div className="container auth-container">
            <div className="auth-card" style={{ backgroundColor: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '16px', maxWidth: '600px', margin: '0 auto' }}>
              
              <div className="auth-header" style={{ marginBottom: '25px' }}>
                <span className="section-badge">Registro Seguro Capara</span>
                <h2 style={{ color: 'var(--color-white)', fontSize: '2rem', marginTop: '10px' }}>Crear cuenta</h2>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.95rem' }}>
                  Completa tus datos para el alta en el sistema de transferencia cifrada.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleRegisterClick}>
                
                {/* 🌟 SECCIÓN MODIFICADA: NOMBRE Y APELLIDOS EN GRID DE 2 COLUMNAS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="nombre">Nombre(s)</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input 
                        type="text" 
                        id="nombre" 
                        className="form-control-modern" 
                        placeholder="Ej. Antonio" 
                        required 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="apellidos">Apellidos</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input 
                        type="text" 
                        id="apellidos" 
                        className="form-control-modern" 
                        placeholder="Ej. Domínguez Ortega" 
                        required 
                        onChange={handleChange} 
                      />
                    </div>
                  </div>
                </div>

                {/* Nombre de Usuario */}
                <div className="form-group">
                  <label className="form-label" htmlFor="nombreUsuario">Nombre de Usuario</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🆔</span>
                    <input type="text" id="nombreUsuario" className="form-control-modern" placeholder="Ej. antoni_dominguez" required onChange={handleChange} />
                  </div>
                  <small className="form-help" style={{ color: 'var(--color-text-medium)' }}>Este es el único dato que podrás cambiar en configuración.</small>
                </div>

                {/* Correos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Correo Principal</label>
                    <input type="email" id="email" className="form-control-modern" placeholder="usuario@ipn.mx" required onChange={handleChange} style={{ paddingLeft: '15px' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emailRecuperacion">Correo Extra</label>
                    <input type="email" id="emailRecuperacion" className="form-control-modern" placeholder="personal@gmail.com" required onChange={handleChange} style={{ paddingLeft: '15px' }} />
                  </div>
                </div>

                {/* Teléfono */}
                <div className="form-group">
                  <label className="form-label" htmlFor="tel">Teléfono Celular</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📱</span>
                    <input type="tel" id="tel" className="form-control-modern" placeholder="55 1234 5678" required onChange={handleChange} />
                  </div>
                </div>

                {/* Contraseñas en Grid para compactar espacio */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="password">Contraseña</label>
                    <input type="password" id="password" className="form-control-modern" placeholder="••••••••" required onChange={handleChange} style={{ paddingLeft: '15px' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <input type="password" id="confirmPassword" className="form-control-modern" placeholder="••••••••" required onChange={handleChange} style={{ paddingLeft: '15px' }} />
                  </div>
                </div>

                {/* 🌟 SECCIÓN TRASLADADA: TÉRMINOS Y CONDICIONES (Ahora antes de enviar datos) */}
                <div className="form-terms" style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px', 
                  marginTop: '1.5rem', 
                  marginBottom: '1.5rem',
                  textAlign: 'left' 
                }}>
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={aceptaTerminos}
                    onChange={(e) => setAceptaTerminos(e.target.checked)}
                    style={{ 
                      marginTop: '4px', 
                      width: '18px', 
                      height: '18px', 
                      cursor: 'pointer',
                      accentColor: 'var(--color-accent)' 
                    }} 
                    required 
                  />
                  <label htmlFor="terms" style={{ fontSize: '0.85rem', color: 'var(--color-text-medium)', lineHeight: '1.5', cursor: 'pointer' }}>
                    He leído y acepto los <Link to="/terminos-condiciones" style={{ color: 'var(--color-accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Términos y Condiciones</Link>, así como el Aviso de Privacidad para el manejo seguro de mis datos y archivos.
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {isLoading ? 'Generando Tokens...' : 'Registrarse'}
                </button>
              </form>

              <div className="auth-footer" style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.95rem' }}>
                  ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: '600', textDecoration: 'underline' }}>Inicia sesión</Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* --- MODAL DE TOKEN DUAL EN TEMA OSCURO --- */}
      {showTokenModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(19, 25, 36, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="auth-card" style={{ width: '420px', padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: 'var(--shadow-medium)' }}>
            <span style={{ fontSize: '3rem' }}>🛡️</span>
            <h2 style={{ margin: '1rem 0', color: 'var(--color-white)', fontWeight: '700' }}>Verificación Dual</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-medium)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Se ha enviado un código de seguridad a <strong>{formData.email}</strong> y vía <strong>SMS</strong> al número registrado.
            </p>

            <form onSubmit={handleVerifyToken}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <input 
                  type="text" 
                  maxLength="6"
                  className="form-control-modern"
                  placeholder="000000"
                  required
                  style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '10px', height: '60px', backgroundColor: 'var(--color-dark)', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Validar y Registrar Alta
              </button>
              
              <button 
                type="button" 
                className="btn-link" 
                onClick={() => setShowTokenModal(false)} 
                style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                ← Regresar a corregir datos
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}