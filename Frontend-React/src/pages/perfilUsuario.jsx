import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import profileService from '../services/profileService';

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: "Cargando...",
    email: "Cargando...",
    telefono: "Cargando...",
    almacenamientoUsado: "0 GB",
    almacenamientoTotal: "0 GB",
    porcentaje: 0
  });

  // Cargar datos del perfil
  const cargarPerfil = async () => {
    try {
      const perfilReal = await profileService.getMyProfile();
      console.log('Perfil cargado:', perfilReal);
      
      setDatosUsuario({
        nombre: `${perfilReal.nombre || ''} ${perfilReal.apellido || ''}`.trim() || perfilReal.username || 'Usuario',
        email: perfilReal.email || 'No registrado',
        telefono: perfilReal.phone || 'No registrado',
        almacenamientoUsado: perfilReal.storageUsedFormatted || '0 GB',
        almacenamientoTotal: perfilReal.storageLimitFormatted || '1 GB',
        porcentaje: perfilReal.storageUsedPercent || 0
      });
      
      if (perfilReal.profilePictureUrl) {
        console.log('URL de foto encontrada:', perfilReal.profilePictureUrl);
        setFotoPerfil(perfilReal.profilePictureUrl);
      } else {
        console.log('No hay foto de perfil');
        setFotoPerfil(null);
      }
    } catch (error) {
      console.error("Error al cargar el perfil:", error);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const handleEditFotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona una imagen válida (JPEG, PNG, etc.)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede superar los 5MB');
        return;
      }
      
      setArchivoSeleccionado(file);
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
    }
  };

  const handleGuardarFoto = async () => {
    if (!archivoSeleccionado) return;

    setCargandoFoto(true);
    try {
      const response = await profileService.uploadProfilePhoto(archivoSeleccionado);
      console.log('Respuesta al guardar foto:', response);
      
      let nuevaFotoUrl = null;
      if (typeof response === 'string') {
        nuevaFotoUrl = response;
      } else if (response.profilePictureUrl) {
        nuevaFotoUrl = response.profilePictureUrl;
      } else if (response.url) {
        nuevaFotoUrl = response.url;
      }
      
      console.log('Nueva URL de foto:', nuevaFotoUrl);
      
      if (nuevaFotoUrl) {
        const sesionUsuario = JSON.parse(localStorage.getItem('user'));
        if (sesionUsuario) {
          sesionUsuario.profilePictureUrl = nuevaFotoUrl;
          localStorage.setItem('user', JSON.stringify(sesionUsuario));
        }

        setFotoPerfil(nuevaFotoUrl);
        setPreviewUrl(null);
        setArchivoSeleccionado(null);
        
        alert("¡Foto de perfil actualizada con éxito!");
        await cargarPerfil();
      } else {
        throw new Error('No se recibió la URL de la foto');
      }
      
    } catch (error) {
      console.error("Error al subir la foto de perfil:", error);
      const errorMsg = error.response?.data?.error || error.message || "Error al guardar la foto";
      alert(`Error: ${errorMsg}`);
    } finally {
      setCargandoFoto(false);
    }
  };

  const handleCancelarSeleccion = () => {
    setArchivoSeleccionado(null);
    setPreviewUrl(null);
  };

  const handleEliminarFoto = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) return;
    
    setCargandoFoto(true);
    try {
      await profileService.deleteProfilePhoto();
      
      const sesionUsuario = JSON.parse(localStorage.getItem('user'));
      if (sesionUsuario) {
        sesionUsuario.profilePictureUrl = null;
        localStorage.setItem('user', JSON.stringify(sesionUsuario));
      }
      
      setFotoPerfil(null);
      setPreviewUrl(null);
      setArchivoSeleccionado(null);
      alert("Foto de perfil eliminada");
      await cargarPerfil();
      
    } catch (error) {
      console.error("Error al eliminar foto:", error);
      alert("Error al eliminar la foto de perfil");
    } finally {
      setCargandoFoto(false);
    }
  };

  const imagenMostrar = previewUrl || fotoPerfil;

  return (
    <PrivateLayout>
      <main className="profile-page" style={{ paddingTop: '110px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
        <header className="section-heading" style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>Perfil de Usuario</h1>
          <p style={{ color: 'var(--color-text-medium)' }}>Administra tu identidad y revisa tu estado de almacenamiento.</p>
        </header>

        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '1rem' }}>
          
          {/* Tarjeta de Foto de Perfil */}
          <aside className="benefit-box shadow-sm" style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#1D263C', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
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
                fontSize: '3rem',
                color: 'white',
                overflow: 'hidden',
                border: '3px solid var(--color-accent, #0a3fff)'
              }}
            >
              {imagenMostrar ? (
                <img 
                  src={imagenMostrar} 
                  alt="Perfil" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    console.error('Error cargando imagen:', imagenMostrar);
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent) {
                      parent.innerHTML = datosUsuario.nombre.charAt(0).toUpperCase() || 'U';
                      parent.style.display = 'flex';
                      parent.style.alignItems = 'center';
                      parent.style.justifyContent = 'center';
                      parent.style.fontSize = '3rem';
                    }
                  }}
                />
              ) : (
                <span style={{ fontSize: '3rem' }}>{datosUsuario.nombre.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </div>

            <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>{datosUsuario.nombre}</h3>
            <p style={{ color: 'var(--color-text-medium)', fontSize: '0.85rem' }}>{datosUsuario.email}</p>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/jpeg,image/png,image/jpg,image/gif"
              onChange={handleFileChange}
              disabled={cargandoFoto}
            />
            
            <button 
              className="btn btn-secondary btn-block" 
              style={{ marginTop: '1rem', width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
              onClick={handleEditFotoClick}
              disabled={cargandoFoto}
            >
              {archivoSeleccionado ? 'Cambiar imagen' : 'Editar Foto'}
            </button>

            {fotoPerfil && !archivoSeleccionado && (
              <button 
                className="btn" 
                style={{ marginTop: '0.5rem', width: '100%', backgroundColor: 'rgba(245,34,45,0.2)', border: 'none', padding: '10px', borderRadius: '8px', color: '#f5222d', cursor: 'pointer' }}
                onClick={handleEliminarFoto}
                disabled={cargandoFoto}
              >
                Eliminar Foto
              </button>
            )}

            {archivoSeleccionado && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', backgroundColor: '#0a3fff', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
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
                    backgroundColor: 'rgba(245,34,45,0.2)', 
                    color: '#f5222d', 
                    border: 'none',
                    borderRadius: '8px',
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
            <div className="benefit-box shadow-sm" style={{ marginBottom: '2rem', backgroundColor: '#1D263C', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'white' }}>Información de Contacto</h3>
              </div>
              
              <div className="contact-info-list" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ color: 'var(--color-text-medium)', display: 'block', marginBottom: '5px' }}>Nombre completo</label>
                  <input 
                    className="form-control-modern" 
                    value={datosUsuario.nombre} 
                    readOnly 
                    disabled 
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: 'white' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ color: 'var(--color-text-medium)', display: 'block', marginBottom: '5px' }}>Correo electrónico</label>
                  <input 
                    className="form-control-modern" 
                    value={datosUsuario.email} 
                    readOnly 
                    disabled 
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: 'white' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ color: 'var(--color-text-medium)', display: 'block', marginBottom: '5px' }}>Teléfono</label>
                  <input 
                    className="form-control-modern" 
                    value={datosUsuario.telefono} 
                    readOnly 
                    disabled 
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: 'white' }}
                  />
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', backgroundColor: '#0a3fff', border: 'none', padding: '12px', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                onClick={() => navigate('/configuracion')}
              >
                Actualizar Datos en Configuración
              </button>
            </div>

            {/* Almacenamiento */}
            <div className="benefit-box shadow-sm" style={{ backgroundColor: '#1D263C', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, color: 'white' }}>Estado del Almacenamiento (Azure)</h3>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontWeight: '600', color: 'white' }}>
                <span>Usado: {datosUsuario.almacenamientoUsado}</span>
                <span style={{ color: '#64748b' }}>Capacidad: {datosUsuario.almacenamientoTotal}</span>
              </div>

              <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ width: `${Math.min(datosUsuario.porcentaje, 100)}%`, backgroundColor: '#0a3fff', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                * Los archivos se almacenan con cifrado AES-256
              </p>
            </div>
          </section>
        </div>
      </main>
    </PrivateLayout>
  );
}