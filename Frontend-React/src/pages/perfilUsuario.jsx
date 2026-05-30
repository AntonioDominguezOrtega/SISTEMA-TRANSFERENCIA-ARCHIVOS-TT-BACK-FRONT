import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import profileService from '../services/profileService'

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 
  const [fotoPerfil, setFotoPerfil] = useState(null);

  // --- NUEVOS ESTADOS ---
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null); // Guarda el binario del archivo
  const [cargandoFoto, setCargandoFoto] = useState(false); // Controla el estado de carga (loading)

  const [datosUsuario, setDatosUsuario] = useState({
    nombre: "Cargando...",
    email: "Cargando...",
    telefono: "Cargando...",
    almacenamientoUsado: "0 GB",
    almacenamientoTotal: "0 GB",
    porcentaje: 0
  });

  // Cargar datos del perfil (Se mantiene intacto)
  useEffect(() => {
    profileService.getMyProfile()
      .then(response => {
        const perfilReal = response.data;
        setDatosUsuario({
          nombre: `${perfilReal.nombre} ${perfilReal.apellido || ''}`.trim(),
          email: perfilReal.email,
          telefono: perfilReal.phone || 'No registrado',
          almacenamientoUsado: perfilReal.storageUsedFormatted || '0 GB',
          almacenamientoTotal: perfilReal.storageLimitFormatted || '5 GB',
          porcentaje: perfilReal.storageUsedPercent || 0
        });
        if (perfilReal.profilePictureUrl) {
          setFotoPerfil(perfilReal.profilePictureUrl);
        }
      })
      .catch(error => console.error("Error al cargar el perfil:", error));
  }, []);

  // Función para activar el selector de archivos (Se mantiene intacto)
  const handleEditFotoClick = () => {
    fileInputRef.current.click();
  };

  // --- MODIFICACIÓN: Guardar tanto la vista previa como el archivo real ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setArchivoSeleccionado(file); // <-- Guardamos el archivo real para enviarlo al backend
      const imageUrl = URL.createObjectURL(file);
      setFotoPerfil(imageUrl); // <-- Genera la vista previa temporal en pantalla
    }
  };

  // --- NUEVA FUNCIÓN MEJORADA: Envía el archivo y actualiza toda la app ---
  const handleGuardarFoto = () => {
    if (!archivoSeleccionado) return;

    setCargandoFoto(true);
    profileService.uploadProfilePhoto(archivoSeleccionado)
      .then(response => {
        // 1. Obtenemos la URL real de la imagen que nos devuelve Spring Boot / Azure
        const nuevaFotoUrl = response.data.profilePictureUrl;

        // 2. Actualizamos el localStorage para que el Sidebar y otras páginas se enteren
        const sesionUsuario = JSON.parse(localStorage.getItem('user'));
        if (sesionUsuario) {
          sesionUsuario.profilePictureUrl = nuevaFotoUrl; // Guardamos la nueva URL en la sesión
          localStorage.setItem('user', JSON.stringify(sesionUsuario));
        }

        // 3. Fijamos la foto real en la vista
        setFotoPerfil(nuevaFotoUrl);
        setArchivoSeleccionado(null);
        setCargandoFoto(false);
        
        alert("¡Foto de perfil actualizada con éxito!");

        // 4. (Opcional pero recomendado) Forzar una pequeña recarga para que el 
        // Sidebar o Header se actualicen instantáneamente con la nueva foto.
        window.location.reload(); 
      })
      .catch(error => {
        console.error("Error al subir la foto de perfil:", error);
        alert("Hubo un error al guardar la foto en el servidor.");
        setCargandoFoto(false);
      });
  };

  // --- NUEVA FUNCIÓN: Cancela la selección y restaura la foto actual ---
  const handleCancelarSeleccion = () => {
    setArchivoSeleccionado(null);
    // Volvemos a pedir el perfil para restaurar la foto que está en la BD
    profileService.getMyProfile().then(response => {
      setFotoPerfil(response.data.profilePictureUrl || null);
    });
  };

  return (
    <PrivateLayout>
      <main className="profile-page">
        <header className="section-heading">
          <h1>Perfil de Usuario</h1>
          <p>Administra tu identidad y revisa tu estado de almacenamiento.</p>
        </header>

        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '3rem' }}>
          
          {/* Tarjeta de Información General */}
          {/* Tarjeta de Información General */}
          <aside className="benefit-box shadow-sm" style={{ textAlign: 'center', padding: '2rem' }}>
            <div 
              className="avatar-container"
              style={{ 
                width: '140px', 
                height: '140px', 
                backgroundColor: 'var(--primary-color, #0A3FFF)', 
                borderRadius: '50%', 
                margin: '0 auto 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3.5rem',
                color: 'white',
                overflow: 'hidden',
                border: '4px solid #f8fafc'
              }}
            >
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                datosUsuario.nombre.charAt(0)
              )}
            </div>

            <h3 style={{ marginBottom: '0.5rem' }}>{datosUsuario.nombre}</h3>
            
            {/* Input de archivo oculto (Intacto) */}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
              disabled={cargandoFoto}
            />
            
            {/* Botón principal de Editar Foto */}
            <button 
              className="btn btn-secondary btn-block" 
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={handleEditFotoClick}
              disabled={cargandoFoto}
            >
              {archivoSeleccionado ? 'Cambiar imagen' : 'Editar Foto'}
            </button>

            {/* INTERACTIVIDAD NUEVA: Aparece sólo si seleccionaste un archivo nuevo */}
            {archivoSeleccionado && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem' }}
                  onClick={handleGuardarFoto}
                  disabled={cargandoFoto}
                >
                  {cargandoFoto ? 'Guardando...' : 'Confirmar'}
                </button>
                <button 
                  className="btn" 
                  style={{ 
                    flex: 1, 
                    padding: '0.6rem', 
                    fontSize: '0.9rem', 
                    backgroundColor: '#ef4444', 
                    color: 'white', 
                    border: 'none',
                    borderRadius: 'var(--border-radius, 6px)',
                    cursor: 'pointer'
                  }}
                  onClick={handleCancelarSeleccion}
                  disabled={cargandoFoto}
                >
                  Cancelar
                </button>
              </div>
            )}
          </aside>

          {/* Detalles y Estadísticas */}
          <section className="profile-details">
            <div className="benefit-box shadow-sm" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Información de Contacto</h3>
              </div>
              
              <div className="contact-info-list" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Nombre de Usuario</label>
                  <div className="input-wrapper">
                    {/* <span className="input-icon"></span> */}
                    <input className="form-control-modern" value={datosUsuario.nombre} readOnly disabled />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Correo electrónico</label>
                  <div className="input-wrapper">
                    {/* <span className="input-icon">📧</span> */}
                    <input className="form-control-modern" value={datosUsuario.email} readOnly disabled />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <div className="input-wrapper">
                    {/* <span className="input-icon">📱</span> */}
                    <input className="form-control-modern" value={datosUsuario.telefono} readOnly disabled />
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                onClick={() => navigate('/configuracion')}
              >
                Actualizar Datos en Configuración
              </button>
            </div>

            {/* Almacenamiento Azure */}
            <div className="benefit-box shadow-sm" style={{ borderLeft: '4px solid var(--accent-color, #0A3FFF)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                {/* <span style={{ fontSize: '1.5rem' }}>☁️</span> */}
                <h3 style={{ margin: 0 }}>Estado del Almacenamiento (Azure)</h3>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontWeight: '600' }}>
                <span>Usado: {datosUsuario.almacenamientoUsado}</span>
                <span style={{ color: '#64748b' }}>Capacidad: {datosUsuario.almacenamientoTotal}</span>
              </div>

              <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '14px', borderRadius: '7px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ width: `${datosUsuario.porcentaje}%`, backgroundColor: 'var(--accent-color, #0A3FFF)', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                * Los archivos se almacenan con cifrado AES-256 (extensión .seg).
              </p>
            </div>
          </section>
        </div>
      
    </main>
    </PrivateLayout>
  )
}