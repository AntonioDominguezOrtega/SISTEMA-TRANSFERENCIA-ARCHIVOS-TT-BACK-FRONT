import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import PrivateHeader from '../components/PrivateHeader' 
import Footer from '../components/Footer'
import authService from '../services/authService'
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { getPasswordErrors } from '../utils/passwordUtils';

// 🌟 FUNCIONES DE ENMASCARAMIENTO (MÁSCARA DE SEGURIDAD)
const enmascararEmail = (email) => {
  if (!email || !email.includes('@')) return 'cor***@dominio.com';
  const [usuario, dominio] = email.split('@');
  if (usuario.length <= 2) {
    return `${usuario}***@${dominio}`;
  }
  return `${usuario.substring(0, 2)}***${usuario.substring(usuario.length - 1)}@${dominio}`;
};

const enmascararTelefono = (tel) => {
  if (!tel) return '******78';
  const limpio = tel.replace(/\s+/g, '');
  if (limpio.length < 4) return '****' + limpio;
  return '*'.repeat(limpio.length - 2) + limpio.substring(limpio.length - 2);
};

export default function RecuperacionContrasena() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const vieneDesdeConfiguracion = location.state?.desdeConfiguracion || false;
  
  // ESTADOS
  const [identificador, setIdentificador] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userContact, setUserContact] = useState({ email: '', phone: '' });

  // ============================================================
  // SOLICITAR TOKEN EMAIL (BACKEND REAL)
  // ============================================================
  const handleSendToken = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validar que sea un email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!identificador.trim() || !emailRegex.test(identificador.trim())) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authService.requestPasswordReset(identificador.trim(), 'SMS');
      
      setUserContact(prev => ({ ...prev, email: identificador.trim() }));
      setSuccessMessage(response.message || 'Se ha enviado un código de verificación a tu correo electrónico.');
      setShowResetModal(true);
    } catch (err) {
      console.error('Error al solicitar recuperación:', err);
      setError(err.response?.data?.error || 'Error al enviar el código de recuperación. Verifica tu correo.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // RESTABLECER CONTRASEÑA CON CÓDIGO EMAIL (BACKEND REAL)
  // ============================================================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    const passwordErrors = getPasswordErrors(newPassword);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(' '));
      return;
    }
    
    if (!token || token.length !== 6) {
      setError('Ingresa el código de 6 dígitos que recibiste.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.resetPasswordWithCode(identificador.trim(), token, newPassword, confirmPassword);
      
      setSuccessMessage('¡Contraseña actualizada correctamente! Redirigiendo...');
      
      setToken('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        if (vieneDesdeConfiguracion) {
          navigate('/configuracion');
        } else {
          navigate('/login');
        }
      }, 1500);
      
    } catch (err) {
      console.error('Error al restablecer contraseña:', err);
      setError(err.response?.data?.error || 'Error al restablecer la contraseña. Verifica el código ingresado.');
      setIsLoading(false);
    }
  };

  // ============================================================
  // REENVIAR CÓDIGO EMAIL
  // ============================================================
  const handleResendCode = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try {
      const response = await authService.resendPasswordResetCode(identificador.trim(), 'SMS');
      setSuccessMessage(response.message || 'Se ha reenviado un nuevo código a tu correo.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reenviar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  // Estilos para el modal overlay (sin backdropFilter)
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(19, 25, 36, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000
  };

  return (
    <>
      {vieneDesdeConfiguracion ? <PrivateHeader /> : <PublicHeader />}

      <main className="auth-page" style={{ paddingTop: '140px', paddingBottom: '60px', backgroundColor: 'var(--color-dark)' }}>
        <section className="section login-section" style={{ padding: '20px 0' }}>
          <div className="container auth-container">
            <div className="auth-card" style={{ backgroundColor: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', borderRadius: '16px', maxWidth: '520px', margin: '0 auto' }}>
              
              <div className="auth-header" style={{ marginBottom: '25px' }}>
                <span className="section-badge">
                  {vieneDesdeConfiguracion ? 'Ajustes de Cuenta' : 'Recuperación de Cuenta'}
                </span>
                <h2 style={{ color: 'var(--color-white)', fontSize: '1.8rem', marginTop: '10px' }}>
                  {vieneDesdeConfiguracion ? 'Actualizar Contraseña' : 'Restablecer acceso'}
                </h2>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.95rem', marginTop: '5px' }}>
                  {vieneDesdeConfiguracion 
                    ? 'Por seguridad, ingresa tu correo para confirmar tu identidad antes del cambio.' 
                    : 'Ingresa tu correo registrado para recibir un código de seguridad .'
                  }
                </p>
              </div>

              {error && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(255, 68, 68, 0.1)', 
                  border: '1px solid #ff4444',
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  color: '#ff8888',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {successMessage && !showResetModal && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                  border: '1px solid #4caf50',
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  color: '#4caf50',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}>
                  ✅ {successMessage}
                </div>
              )}

              <form className="auth-form" onSubmit={handleSendToken}>
                <div className="form-group">
                  <label className="form-label" style={{ color: 'white' }}>Correo Electrónico</label>
                  <div className="input-wrapper">
                    <input 
                      type="email" 
                      className="form-control-modern" 
                      placeholder="ejemplo@gmail.com" 
                      required 
                      value={identificador}
                      onChange={(e) => setIdentificador(e.target.value)}
                      disabled={isLoading}
                      style={{ paddingLeft: '15px' }}
                    />
                  </div>
                  <small style={{ color: 'var(--color-text-medium)', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>
                    Recibirás un código de 6 dígitos por correo.
                  </small>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Enviar Código de Verificación'}
                </button>
              </form>

              {!vieneDesdeConfiguracion ? (
                <div className="auth-footer" style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--color-text-medium)' }}>
                    ¿Recordaste tu contraseña? <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: '600' }}>Inicia sesión</Link>
                  </p>
                </div>
              ) : (
                <div className="auth-footer" style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', textAlign: 'center' }}>
                  <Link to="/configuracion" style={{ color: 'var(--color-text-medium)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    ← Cancelar y regresar a Configuración
                  </Link>
                </div>
              )}

            </div>
          </div>
        </section>
      </main>

      {/* MODAL DE VERIFICACIÓN */}
      {showResetModal && (
        <div style={modalOverlayStyle}>
          <div className="auth-card" style={{ width: '450px', padding: '2.5rem', backgroundColor: 'var(--color-primary)', border: '1px solid #0a3fff', borderRadius: '16px', boxShadow: 'var(--shadow-medium)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '3rem' }}>📱</span>
              <h2 style={{ marginTop: '1rem', color: 'white', fontWeight: '700' }}>Verificar Identidad</h2>
              
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-medium)', marginTop: '10px', lineHeight: '1.5' }}>
                Se ha enviado un <strong style={{ color: 'white' }}>código de verificación de 6 dígitos</strong> al correo <strong style={{ color: 'white' }}>{enmascararEmail(userContact.email)}</strong>
              </p>
            </div>

            {error && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: 'rgba(255, 68, 68, 0.1)', 
                borderRadius: '8px', 
                marginBottom: '15px',
                color: '#ff8888',
                fontSize: '0.8rem',
                textAlign: 'center'
              }}>
                ⚠️ {error}
              </div>
            )}

            {successMessage && (
              <div style={{ 
                padding: '10px', 
                backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                borderRadius: '8px', 
                marginBottom: '15px',
                color: '#4caf50',
                fontSize: '0.8rem',
                textAlign: 'center'
              }}>
                ✅ {successMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'white' }}>Código de Verificación (6 dígitos)</label>
                <input 
                  type="text" 
                  className="form-control-modern" 
                  placeholder="000000" 
                  maxLength="6"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{ 
                    textAlign: 'center', 
                    letterSpacing: '8px', 
                    fontSize: '1.4rem', 
                    backgroundColor: 'var(--color-dark)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    color: 'white' 
                  }}
                />
                <small style={{ color: 'var(--color-text-medium)', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>
                  Ingresa el código de 6 dígitos que recibiste
                </small>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ color: 'white' }}>Nueva Contraseña</label>
                <input 
                  type={showNewPassword ? 'text' : 'password'} 
                  className="form-control-modern" 
                  placeholder="••••••••" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '15px', paddingRight: '46px' }}
                />
                <button type="button" onClick={() => setShowNewPassword(p => !p)} style={{ position: 'absolute', right: '12px', top: '38px', border: 'none', background: 'transparent', color: 'var(--color-text-medium)', cursor: 'pointer', padding: 0, fontSize: '1rem' }}>
                  {showNewPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
                <small style={{ color: 'var(--color-text-medium)', fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>
                  Mínimo 8 caracteres, una mayúscula y un número
                </small>
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" style={{ color: 'white' }}>Confirmar Nueva Contraseña</label>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="form-control-modern" 
                  placeholder="••••••••" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '15px', paddingRight: '46px' }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(p => !p)} style={{ position: 'absolute', right: '12px', top: '38px', border: 'none', background: 'transparent', color: 'var(--color-text-medium)', cursor: 'pointer', padding: 0, fontSize: '1rem' }}>
                  {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                </button>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
                {isLoading ? 'Procesando...' : (vieneDesdeConfiguracion ? 'Actualizar Contraseña' : 'Restablecer e Iniciar Sesión')}
              </button>
              
              <button 
                type="button" 
                onClick={handleResendCode}
                style={{ 
                  width: '100%', 
                  marginTop: '12px', 
                  border: 'none', 
                  background: 'none', 
                  color: 'var(--color-accent)', 
                  cursor: 'pointer', 
                  fontSize: '0.85rem' 
                }}
                disabled={isLoading}
              >
                📱 ¿No recibiste el código? Reenviar
              </button>
              
              <button 
                type="button" 
                onClick={() => {
                  setShowResetModal(false);
                  setError('');
                  setSuccessMessage('');
                  setToken('');
                }}
                style={{ 
                  width: '100%', 
                  marginTop: '10px', 
                  border: 'none', 
                  background: 'none', 
                  color: 'var(--color-text-medium)', 
                  cursor: 'pointer', 
                  fontSize: '0.9rem' 
                }}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}