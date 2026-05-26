import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'
import authService from '../services/authService'  // ← AGREGAR

const isValidIdentifier = (val) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const userRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return emailRegex.test(val.trim()) || userRegex.test(val.trim());
};
const isValidPassword = (password) => password.trim().length >= 6;

export default function Login() {
  const navigate = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Estados Login
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [errorIdentificador, setErrorIdentificador] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Estados Registro
  const [regNombre, setRegNombre] = useState('');
  const [regApellidos, setRegApellidos] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regEmailRecuperacion, setRegEmailRecuperacion] = useState('');
  const [regTel, setRegTel] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState(''); // ← AGREGAR

  const [formMessage, setFormMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================
  // LOGIN CON BACKEND REAL
  // ============================================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorIdentificador('');
    setPasswordError('');
    setFormMessage('');
    setIsSuccess(false);

    let isFormValid = true;
    if (!isValidIdentifier(identificador)) {
      setErrorIdentificador("Ingresa un correo o nombre de usuario válido.");
      isFormValid = false;
    }
    if (!isValidPassword(password)) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres.");
      isFormValid = false;
    }

    if (!isFormValid) return;
    
    setFormMessage("Validando credenciales...");
    setIsLoading(true);

    try {
      const response = await authService.login(identificador, password);
      setFormMessage(`¡Bienvenido, ${response.nombre}! Redirigiendo...`);
      setIsSuccess(true);

      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Credenciales incorrectas";
      setFormMessage(errorMsg);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // REGISTRO CON BACKEND REAL
  // ============================================================
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    
    if (regPassword !== regConfirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    if (!aceptaTerminos) {
      alert("Debes aceptar los Términos y Condiciones.");
      return;
    }

    setFormMessage("Creando cuenta...");
    setIsLoading(true);

    try {
      const userData = {
        nombre: regNombre,
        apellidos: regApellidos,
        username: regUsername,
        email: regEmail,
        tel: regTel,
        password: regPassword,
        confirmPassword: regConfirmPassword
      };
      
      const response = await authService.register(userData);
      setRegisteredEmail(regEmail);
      setFormMessage('');
      setShowTokenModal(true);
      
    } catch (error) {
      const errorMsg = error.response?.data?.Error || error.response?.data?.error || "Error al registrar usuario";
      setFormMessage(errorMsg);
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // VERIFICAR TOKEN
  // ============================================================
  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await authService.verify(registeredEmail, tokenInput);
      alert("¡Verificación exitosa! Usuario registrado correctamente.");
      setShowTokenModal(false);
      setIsRegistering(false);
      setRegNombre('');
      setRegApellidos('');
      setRegUsername('');
      setRegEmail('');
      setRegTel('');
      setRegPassword('');
      setRegConfirmPassword('');
      setTokenInput('');
    } catch (error) {
      alert(error.response?.data?.error || "Token incorrecto. Revisa tu correo o teléfono.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // REENVIAR CÓDIGO
  // ============================================================
  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await authService.resendCode(registeredEmail);
      alert("Se ha reenviado un nuevo código a tu correo y teléfono.");
    } catch (error) {
      alert(error.response?.data?.error || "Error al reenviar el código.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PublicHeader />

      <main className="login-sliding-main" style={{ paddingTop: '140px', paddingBottom: '80px' }}>
        <div className="container">
          <div className={`contenedor__todo ${isRegistering ? 'active-register' : ''}`} style={{ minHeight: '620px' }}>           
            
            {/* CAJA TRASERA */}
            <div className="caja__trasera" style={{ height: '540px' }}>
              <div className="caja__trasera-login">
                <h3>¿Ya tienes una cuenta?</h3>
                <p>Inicia sesión para entrar a la plataforma</p>
                <button onClick={() => { setIsRegistering(false); setFormMessage(''); }}>Iniciar Sesión</button>
              </div>
              <div className="caja__trasera-register">
                <h3>¿Aún no tienes una cuenta?</h3>
                <p>Regístrate para proteger tus archivos con Capara</p>
                <button onClick={() => { setIsRegistering(true); setFormMessage(''); }}>Registrarse</button>
              </div>
            </div>

            {/* CONTENEDOR DESLIZANTE */}
            <div className="contenedor__login-register" style={{ height: '620px' }}>
              
              {/* FORMULARIO LOGIN */}
              <form 
                className="formulario__login" 
                onSubmit={handleLoginSubmit} 
                style={{ 
                  top: '60px',
                  border: '1px solid #0a3fff',
                  boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)' 
                }}
              >
                <h2>Iniciar Sesión</h2>
                
                <div className="form-group-slide">
                  <input 
                    type="text" 
                    placeholder="Correo o Usuario" 
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  {errorIdentificador && <p className="error-text-slide">{errorIdentificador}</p>}
                </div>

                <div className="form-group-slide">
                  <input 
                    type="password" 
                    placeholder="Contraseña" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  {passwordError && <p className="error-text-slide">{passwordError}</p>}
                </div>

                <div style={{ textAlign: 'right', width: '100%', marginBottom: '20px' }}>
                  <Link to="/recuperacion-contrasena" style={{ fontSize: '0.85rem', color: 'var(--color-accent)', textDecoration: 'none' }}>
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {formMessage && !isRegistering && (
                  <p style={{ color: isSuccess ? '#52c41a' : '#ff4d4f', fontWeight: '600', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
                    {formMessage}
                  </p>
                )}

                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Ingresando...' : 'Entrar'}
                </button>
              </form>

              {/* FORMULARIO REGISTRO */}
              <form 
                className="formulario__register" 
                onSubmit={handleRegisterSubmit} 
                style={{ 
                  padding: '30px 25px',
                  border: '1px solid #0a3fff',
                  boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)'
                }}
              >
                <h2 style={{ marginBottom: '15px' }}>Registrarse</h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" placeholder="Nombre(s)" value={regNombre} onChange={(e) => setRegNombre(e.target.value)} required />
                  <input type="text" placeholder="Apellidos" value={regApellidos} onChange={(e) => setRegApellidos(e.target.value)} required />
                </div>

                <input type="text" placeholder="Nombre de Usuario" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="email" placeholder="Correo Principal" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                  <input type="email" placeholder="Correo Extra" value={regEmailRecuperacion} onChange={(e) => setRegEmailRecuperacion(e.target.value)} required />
                </div>

                <input type="tel" placeholder="Teléfono Celular" value={regTel} onChange={(e) => setRegTel(e.target.value)} required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="password" placeholder="Contraseña" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                  <input type="password" placeholder="Confirmar" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '5px 0 15px', textAlign: 'left' }}>
                  <input type="checkbox" id="terms" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-accent)' }} required />
                  <label htmlFor="terms" style={{ fontSize: '0.78rem', color: 'var(--color-text-medium)', lineHeight: '1.4', cursor: 'pointer' }}>
                    Acepto los <Link to="/terminos-condiciones" style={{ color: 'var(--color-accent)', fontWeight: 'bold', textDecoration: 'underline' }}>Términos y Condiciones</Link> de Capara.
                  </label>
                </div>

                {formMessage && isRegistering && (
                  <p style={{ color: isSuccess ? '#52c41a' : '#ff4d4f', fontWeight: '600', marginBottom: '10px', fontSize: '0.85rem', textAlign: 'center' }}>
                    {formMessage}
                  </p>
                )}

                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Registrando...' : 'Registrarse'}
                </button>
              </form>

            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE TOKEN */}
      {showTokenModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(19, 25, 36, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
          <div className="auth-card" style={{ width: '420px', padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--color-primary)', border: '1px solid #0A3FFF', borderRadius: '16px', boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)' }}>
            <span style={{ fontSize: '3rem' }}>🛡️</span>
            <h2 style={{ margin: '1rem 0', color: 'var(--color-white)', fontWeight: '700' }}>Verificación Dual</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-medium)', marginBottom: '1.5rem' }}>
              Se ha enviado un código de verificación a <strong>{registeredEmail}</strong> y vía SMS a tu celular.
            </p>

            <form onSubmit={handleVerifyToken}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <input 
                  type="text" 
                  maxLength="6" 
                  className="form-control-modern" 
                  placeholder="000000" 
                  required 
                  style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '10px', height: '60px', backgroundColor: 'var(--color-dark)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} 
                  value={tokenInput} 
                  onChange={(e) => setTokenInput(e.target.value)} 
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Validar y Registrar Alta'}
              </button>
              
              <button 
                type="button" 
                onClick={handleResendCode}
                style={{ marginTop: '15px', background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Reenviar código
              </button>
              
              <button 
                type="button" 
                onClick={() => setShowTokenModal(false)} 
                style={{ marginTop: '10px', background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                ← Regresar
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}