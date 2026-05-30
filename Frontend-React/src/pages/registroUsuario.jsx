import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'
import authService from '../services/authService'

export default function RegistroUsuario() {
  const navigate = useNavigate();
  
  // 1. ESTADOS DEL FORMULARIO (Separado en Nombre y Apellidos)
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    nombreUsuario: '', 
    email: '',
    tel: '',
    password: '',
    confirmPassword: ''
  });

  // 2. ESTADOS DE LÓGICA (Token y Carga)
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getErrorMessage = (error, fallback = 'Ocurrió un error.') => {
    if (!error) return fallback;
    const data = error.response?.data;
    if (data) {
      if (typeof data.error === 'string') return data.error;
      if (typeof data.Error === 'string') return data.Error;
      if (typeof data.message === 'string') return data.message;
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.map((item) => item.message || item).join(' - ');
      }
    }
    return error.message || fallback;
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('La contraseña debe tener más de 8 caracteres.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Debe contener al menos un número.');
    }
    return errors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegisterClick = async (e) => {
    e.preventDefault();
    setFormMessage('');
    setIsSuccess(false);

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setFormMessage(passwordErrors.join(' '));
      setIsSuccess(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormMessage('Las contraseñas no coinciden.');
      setIsSuccess(false);
      return;
    }

    if (!aceptaTerminos) {
      setFormMessage('Debes aceptar los Términos y Condiciones para continuar.');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setFormMessage('Creando cuenta...');

    try {
      const userData = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        username: formData.nombreUsuario,
        email: formData.email,
        tel: formData.tel,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      };

      await authService.register(userData);
      setRegisteredEmail(formData.email);
      setShowTokenModal(true);
      setFormMessage('');
      setIsSuccess(true);
    } catch (error) {
      setFormMessage(getErrorMessage(error, 'Error al registrar usuario'));
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setFormMessage('Validando código...');
    setIsLoading(true);

    try {
      await authService.verify(registeredEmail, tokenInput);
      setFormMessage('Verificación exitosa. Usuario registrado correctamente.');
      setIsSuccess(true);
      setShowTokenModal(false);
      navigate('/login');
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'Token incorrecto. Revisa tus medios de contacto.');
      setFormMessage(errorMsg);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setFormMessage('Reenviando código...');

    try {
      await authService.resendCode(registeredEmail || formData.email);
      setFormMessage('Código reenviado. Revisa tu correo.');
      setIsSuccess(true);
    } catch (error) {
      setFormMessage(getErrorMessage(error, 'Error al reenviar el código.'));
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PublicHeader />

      {/* Ajustado el espaciado para que no choque con el header fijo */}
      <main className="auth-page" style={{ paddingTop: '140px', paddingBottom: '60px', backgroundColor: 'var(--color-dark)' }}>
        <section className="section login-section" style={{ padding: '20px 0' }}>
          <div className="container auth-container">
            <div className="auth-card" style={{ backgroundColor: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(16px, 4%, 40px)', borderRadius: '16px', maxWidth: '600px', width: '100%', margin: '0 auto' }}>
              <div className="auth-header" style={{ marginBottom: '25px' }}>
                <span className="section-badge">Registro Seguro Capara</span>
                <h2 style={{ color: 'var(--color-white)', fontSize: '2rem', marginTop: '10px' }}>Crear cuenta</h2>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.95rem' }}>
                  Completa tus datos para el alta en el sistema de transferencia cifrada.
                </p>
              </div>

              <form className="auth-form" onSubmit={handleRegisterClick}>
                
                {/* 🌟 SECCIÓN MODIFICADA: NOMBRE Y APELLIDOS EN GRID DE 2 COLUMNAS */}
                <div className="responsive-grid responsive-grid-2" style={{ marginBottom: '1.5rem' }}>
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
                        value={formData.nombre}
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
                        value={formData.apellidos}
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
                    <input type="text" id="nombreUsuario" className="form-control-modern" placeholder="Ej. antoni_dominguez" required value={formData.nombreUsuario} onChange={handleChange} />
                  </div>
                  <small className="form-help" style={{ color: 'var(--color-text-medium)' }}>Este es el único dato que podrás cambiar en configuración.</small>
                </div>

                {/* Correos */}
                <div className="responsive-grid" style={{ gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Correo Principal</label>
                    <input type="email" id="email" className="form-control-modern" placeholder="usuario@ipn.mx" required value={formData.email} onChange={handleChange} style={{ paddingLeft: '15px' }} />
                  </div>
                </div>

                {/* Teléfono */}
                <div className="form-group">
                  <label className="form-label" htmlFor="tel">Teléfono Celular</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📱</span>
                    <input type="tel" id="tel" className="form-control-modern" placeholder="55 1234 5678" required value={formData.tel} onChange={handleChange} />
                  </div>
                </div>

                {/* Contraseñas en Grid para compactar espacio */}
                <div className="responsive-grid responsive-grid-2">
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label className="form-label" htmlFor="password">Contraseña</label>
                    <input type={showPassword ? 'text' : 'password'} id="password" className="form-control-modern" placeholder="••••••••" required value={formData.password} onChange={handleChange} style={{ paddingLeft: '15px', paddingRight: '46px' }} />
                    <button type="button" onClick={() => setShowPassword(prev => !prev)} style={{ position: 'absolute', right: '12px', top: '45px', border: 'none', background: 'transparent', color: 'var(--color-text-medium)', cursor: 'pointer', padding: 0, fontSize: '1rem' }}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>

                  <div className="form-group" style={{ position: 'relative' }}>
                    <label className="form-label" htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPassword" className="form-control-modern" placeholder="••••••••" required value={formData.confirmPassword} onChange={handleChange} style={{ paddingLeft: '15px', paddingRight: '46px' }} />
                    <button type="button" onClick={() => setShowConfirmPassword(prev => !prev)} style={{ position: 'absolute', right: '12px', top: '45px', border: 'none', background: 'transparent', color: 'var(--color-text-medium)', cursor: 'pointer', padding: 0, fontSize: '1rem' }}>
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
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

                {formMessage && (
                  <p style={{ color: isSuccess ? '#52c41a' : '#ff4d4f', fontWeight: 600, marginBottom: '12px', fontSize: '0.95rem', textAlign: 'center' }}>
                    {formMessage}
                  </p>
                )}

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
              Se ha enviado un código de seguridad a <strong>{formData.email}</strong>.
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

              {formMessage && (
                <p style={{ color: isSuccess ? '#52c41a' : '#ff4d4f', fontWeight: 600, marginBottom: '12px', fontSize: '0.95rem', textAlign: 'center' }}>
                  {formMessage}
                </p>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Validar y Registrar Alta'}
              </button>
              
              <button 
                type="button" 
                className="btn-link" 
                onClick={handleResendCode}
                disabled={isLoading}
                style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Reenviar código
              </button>

              <button 
                type="button" 
                className="btn-link" 
                onClick={() => setShowTokenModal(false)} 
                style={{ marginTop: '10px', background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '0.9rem' }}
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