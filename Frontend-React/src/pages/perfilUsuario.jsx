import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null); // Referencia para el input de archivo oculto
  const [fotoPerfil, setFotoPerfil] = useState(null);

  // Datos de prueba (RF-005, RF-020)
  const datosUsuario = {
    nombre: "Héctor Alejandro Aranda ",
    email: "ambar.garcia@ejemplo.com",
    telefono: "+52 55 1122 3344",
    almacenamientoUsado: "1.2 GB",
    almacenamientoTotal: "5 GB",
    porcentaje: 24
  };

  // Función para activar el selector de archivos
  const handleEditFotoClick = () => {
    fileInputRef.current.click();
  };

  // Función para manejar la carga de la imagen
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFotoPerfil(imageUrl);
      // Aquí podrías añadir la lógica para subir a Azure en el futuro
    }
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
            
            {/* Input de archivo oculto */}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
            
            <button 
              className="btn btn-secondary btn-block" 
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={handleEditFotoClick}
            >
              Editar Foto
            </button>
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