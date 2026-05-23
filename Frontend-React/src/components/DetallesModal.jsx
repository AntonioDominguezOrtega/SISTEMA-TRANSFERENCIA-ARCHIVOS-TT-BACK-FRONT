import React from 'react';

// Reutilizamos las funciones de seguridad
const getSecurityBadge = (status) => {
  if (status === 'PASSWORD') return <span title="Protegido con contraseña" style={{ fontSize: '1.2rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'TOKEN_SMS') return <span title="Cifrado con doble factor" style={{ fontSize: '1.2rem', marginRight: '6px' }}>🛡️</span>;
  return null;
};

const getSecurityText = (status) => {
  if (status === 'PASSWORD') return 'Protegido con contraseña';
  if (status === 'TOKEN_SMS') return 'Cifrado y Doble Factor (SMS)';
  return 'Público / Estándar';
};

export default function DetallesModal({ elemento, onClose }) {
  if (!elemento) return null;

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

  // Mapeo de datos reales del DTO FileShareResponse
  const nombre = elemento.fileName || 'Archivo sin nombre';
  const tamano = elemento.fileSize ? `${(elemento.fileSize / 1024 / 1024).toFixed(2)} MB` : '--';
  const fecha = elemento.sharedAt ? new Date(elemento.sharedAt).toLocaleDateString() : '--';
  const propietario = elemento.sharedBy || 'Desconocido';

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)'
      }} 
      onClick={handleOverlayClick}
    >
      <div style={{
        backgroundColor: 'var(--color-white)', borderRadius: '16px',
        width: '90%', maxWidth: '450px', padding: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)', position: 'relative'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-medium)' }}>×</button>

        <div style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '16px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--color-dark)', display: 'flex', alignItems: 'center', fontSize: '1.2rem' }}>
            {getSecurityBadge(elemento.securityLevel)} {nombre}
          </h3>
        </div>

        <div style={{ display: 'grid', gap: '12px', color: 'var(--color-dark)', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Seguridad:</strong> <span>{getSecurityText(elemento.securityLevel)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Tamaño:</strong> <span>{tamano}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Enviado por:</strong> <span>{propietario}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Fecha:</strong> <span>{fecha}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Acceso:</strong> <span>{elemento.accessLevel === 'DOWNLOAD' ? 'Descarga permitida' : 'Solo lectura'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}