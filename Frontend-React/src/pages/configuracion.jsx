import React, { useState, useEffect } from 'react';
import PrivateLayout from '../components/PrivateLayout';
import { Link } from 'react-router-dom';
import profileService from '../services/configService';

export default function Configuracion() {
  // Estado para los datos del formulario (los que el usuario edita)
  const [formData, setFormData] = useState({
    nombreCompleto: "Cargando...",
    username: "",
    email: ""
  });

  // Guardamos los datos originales (nombre, apellido, phone) porque el backend los requiere 
  // completos en la petición, aunque no los editemos directamente aquí.
  const [datosOriginales, setDatosOriginales] = useState(null);
  
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados exclusivos para el flujo del Teléfono y SMS
  // pasoTelefono -> 0: Mostrar teléfono actual, 1: Pedir nuevo teléfono, 2: Pedir Token SMS
  const [pasoTelefono, setPasoTelefono] = useState(0); 
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [codigoSms, setCodigoSms] = useState("");
  const [procesandoSms, setProcesandoSms] = useState(false);

  // 1. Cargar los datos reales al entrar a la pantalla
  useEffect(() => {
    profileService.getMyProfile()
      .then(response => {
        const perfilReal = response.data;
        setDatosOriginales(perfilReal);
        setFormData({
          nombreCompleto: `${perfilReal.nombre} ${perfilReal.apellido || ''}`.trim(),
          username: perfilReal.username || "",
          email: perfilReal.email || ""
        });
        setCargando(false);
      })
      .catch(error => {
        console.error("Error al cargar configuración:", error);
        setCargando(false);
      });
  }, []);

  // 2. Manejar cambios en los inputs de Usuario y Correo
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 3. Enviar actualización del perfil básico (Usuario y Correo)
  const handleActualizarPerfil = async () => {
    if (!datosOriginales) return;
    setGuardando(true);

    // Armamos el objeto tal como lo pide tu UpdateProfileRequest en Java
    const requestData = {
      nombre: datosOriginales.nombre, // Intacto
      apellido: datosOriginales.apellido, // Intacto
      phone: datosOriginales.phone, // Intacto (se cambia por la otra vía)
      username: formData.username, // Actualizado
      email: formData.email // Actualizado
    };

    try {
      await profileService.updateProfile(requestData);
      alert("¡Perfil actualizado con éxito!");
      
      // Actualizamos el localStorage por si cambió el username
      const session = JSON.parse(localStorage.getItem('user'));
      if (session) {
        session.username = formData.username;
        session.email = formData.email;
        localStorage.setItem('user', JSON.stringify(session));
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Error al actualizar el perfil.");
    } finally {
      setGuardando(false);
    }
  };

  // 4. FLUJO SMS: Enviar código al nuevo teléfono
  const handleEnviarSms = async () => {
    if (!nuevoTelefono || nuevoTelefono.length < 10) {
      alert("Por favor, ingresa un número de teléfono válido (incluye código de país).");
      return;
    }
    setProcesandoSms(true);
    try {
      await profileService.solicitarCambioTelefono(nuevoTelefono);
      setPasoTelefono(2); // Pasamos al paso de pedir el código
    } catch (error) {
      alert("Error al enviar el SMS.");
    } finally {
      setProcesandoSms(false);
    }
  };

  // 5. FLUJO SMS: Verificar el token y guardar el nuevo teléfono
  const handleVerificarSms = async () => {
    if (!codigoSms || codigoSms.length < 4) {
      alert("Ingresa un código válido.");
      return;
    }
    setProcesandoSms(true);
    try {
      await profileService.verificarYGuardarTelefono(nuevoTelefono, codigoSms);
      
      // Actualizamos el estado visual con el nuevo teléfono
      setDatosOriginales(prev => ({ ...prev, phone: nuevoTelefono }));
      alert("¡Número de teléfono verificado y actualizado exitosamente!");
      
      // Reiniciamos la vista del teléfono
      setPasoTelefono(0);
      setNuevoTelefono("");
      setCodigoSms("");
    } catch (error) {
      alert("Código incorrecto o expirado.");
    } finally {
      setProcesandoSms(false);
    }
  };

  return (
    <PrivateLayout>
      <main className="settings-page">
        <header className="section-heading">
          <br/><br/><br/><br/><br/>
          <h1>Configuración de Cuenta</h1>
          <p>Gestiona tu información personal y los parámetros de seguridad de tu cuenta.</p>
        </header>

        {cargando ? (
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>Cargando datos...</div>
        ) : (
          <div className="settings-grid" style={{ display: 'grid', gap: '2rem', marginTop: '3rem' }}>
            
            {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
            <section className="benefit-box shadow-sm">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Información Personal</h3>
              </div>
              
              <form className="auth-form" style={{ maxWidth: '100%' }}>
                {/* Nombre - Deshabilitado (No se puede cambiar) */}
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      className="form-control-modern" 
                      value={formData.nombreCompleto} 
                      disabled 
                      style={{ cursor: 'not-allowed', backgroundColor: '#f0f0f0', color: '#666' }}
                    />
                  </div>
                </div>

                {/* Username - Editable */}
                <div className="form-group">
                  <label className="form-label">Nombre de Usuario</label>
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      name="username"
                      className="form-control-modern" 
                      value={formData.username}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Correo - Editable */}
                <div className="form-group">
                  <label className="form-label">Correo electrónico</label>
                  <div className="input-wrapper">
                    <input 
                      type="email" 
                      name="email"
                      className="form-control-modern" 
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '1rem' }}
                  onClick={handleActualizarPerfil}
                  disabled={guardando}
                >
                  {guardando ? 'Actualizando...' : 'Actualizar Perfil'}
                </button>
              </form>
            </section>

            {/* SECCIÓN 2: SEGURIDAD Y MFA (SMS) */}
            <section className="benefit-box shadow-sm" style={{ borderLeft: '4px solid var(--accent-color, #0A3FFF)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Seguridad y Autenticación</h3>
              </div>
              
              <div className="form-group">
                <label className="form-label">Número Celular para SMS</label>
                
                {/* RENDERIZADO CONDICIONAL DEL FLUJO DE TELÉFONO */}
                
                {pasoTelefono === 0 && (
                  // PASO 0: Muestra el teléfono actual y botón Cambiar
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-wrapper" style={{ flex: 1 }}>
                      <input 
                        type="tel" 
                        className="form-control-modern" 
                        value={datosOriginales?.phone || "No registrado"} 
                        disabled
                        style={{ cursor: 'not-allowed', backgroundColor: '#f0f0f0', color: '#666' }}
                      />
                    </div>
                    <button type="button" className="btn btn-primary" onClick={() => setPasoTelefono(1)}>
                      Cambiar
                    </button>
                  </div>
                )}

                {pasoTelefono === 1 && (
                  // PASO 1: Pide el nuevo número y envía el SMS
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
                      <input 
                        type="tel" 
                        className="form-control-modern" 
                        placeholder="Ej. 5511223344" 
                        value={nuevoTelefono}
                        onChange={(e) => setNuevoTelefono(e.target.value)}
                        disabled={procesandoSms}
                      />
                    </div>
                    <button type="button" className="btn btn-primary" onClick={handleEnviarSms} disabled={procesandoSms}>
                      {procesandoSms ? 'Enviando...' : 'Enviar Código'}
                    </button>
                    <button type="button" className="btn" style={{ backgroundColor: '#e2e8f0' }} onClick={() => setPasoTelefono(0)} disabled={procesandoSms}>
                      Cancelar
                    </button>
                  </div>
                )}

                {pasoTelefono === 2 && (
                  // PASO 2: Pide el token SMS que llegó al celular
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#2563eb', marginBottom: '0.5rem' }}>
                      Se ha enviado un SMS a <strong>{nuevoTelefono}</strong>
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div className="input-wrapper" style={{ flex: 1, minWidth: '150px' }}>
                        <input 
                          type="text" 
                          className="form-control-modern" 
                          placeholder="Ingresa el Token" 
                          value={codigoSms}
                          onChange={(e) => setCodigoSms(e.target.value)}
                          disabled={procesandoSms}
                        />
                      </div>
                      <button type="button" className="btn btn-secondary" onClick={handleVerificarSms} disabled={procesandoSms}>
                        {procesandoSms ? 'Verificando...' : 'Verificar y Guardar'}
                      </button>
                      <button type="button" className="btn" style={{ backgroundColor: '#e2e8f0' }} onClick={() => setPasoTelefono(0)} disabled={procesandoSms}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <small className="form-help" style={{ display: 'block', marginTop: '0.8rem' }}>
                  Utilizado para el envío de tokens de cifrado vía Azure.
                </small>
              </div>
            </section>

            {/* SECCIÓN 3: CAMBIO DE CONTRASEÑA (Integrada) */}
            <section className="benefit-box shadow-sm">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>Cambio de Contraseña</h3>
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
        )}
      </main>
    </PrivateLayout>
  );
}