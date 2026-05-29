import React, { useState } from 'react'
import CompartirModal from './CompartirModal';

// Reutilizamos las funciones de seguridad para que el modal también las muestre
const getSecurityBadge = (status) => {
  if (status === 'password') return <span title="Bloqueado con contraseña" style={{ fontSize: '1.2rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'encrypted') return <span title="Cifrado de alto nivel" style={{ fontSize: '1.2rem', marginRight: '6px' }}>🛡️</span>;
  return null;
}

const getSecurityText = (status) => {
  if (status === 'password') return 'Protegido con contraseña';
  if (status === 'encrypted') return 'Cifrado de extremo a extremo';
  return 'Público / Estándar';
}

export default function DetallesModal({ elemento, onClose }) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [accessDuration, setAccessDuration] = useState('indefinido');
  const [allowDownload, setAllowDownload] = useState(true);
  
  // Si no hay elemento seleccionado, no renderizamos nada
  if (!elemento) return null;

  // Función para cerrar el modal si el usuario hace clic afuera de la caja blanca
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  }

  // Normalizamos algunos datos porque dependiendo de la vista a veces se llama "size", "info" o "fileCount"
  const tamanoOContenido = elemento.info || elemento.size || (elemento.fileCount ? `${elemento.fileCount} archivos` : '--');
  const fecha = elemento.date || elemento.lastModified || elemento.createdAt || '--';
  const propietario = elemento.owner || 'Alejandro (Tú)';
  const esCarpeta = elemento.type === 'folder' || !elemento.size; // Inferencia simple de tipo

  // Función para descargar el archivo
  const handleDownload = () => {
    if (elemento.url) {
      const link = document.createElement('a');
      link.href = elemento.url;
      link.download = elemento.name || 'archivo';
      link.click();
    }
  };

  // Verificar si el archivo es público
  const isPublic = !elemento.security || elemento.security === 'public';

  // Función para manejar el click en Compartir
  const handleShareClick = () => {
    if (isPublic) {
      // Si es público, abrir directamente el modal de compartir
      setIsShareModalOpen(true);
    } else {
      // Si no es público, mostrar diálogo de permisos primero
      setShowPermissionsDialog(true);
    }
  };

  // Función para confirmar permisos y abrir modal de compartir
  const handleConfirmPermissions = () => {
    setShowPermissionsDialog(false);
    setIsShareModalOpen(true);
  };

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, // Para que aparezca por encima de TODO
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(3px)' // Efecto visual moderno
      }} 
      onClick={handleOverlayClick}
    >
      <div style={{
        backgroundColor: 'var(--color-white)', borderRadius: '16px',
        width: '90%', maxWidth: '450px', padding: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        position: 'relative'
      }}>
        {/* Botón de cerrar (X) */}
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-medium)' }}
        >
          ×
        </button>

        {/* Cabecera del Modal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #eaeaea', paddingBottom: '16px', marginBottom: '16px' }}>
          <span style={{ fontSize: '3rem' }}>{elemento.icon}</span>
          <div>
            <h3 style={{ margin: 0, color: 'var(--color-dark)', display: 'flex', alignItems: 'center', fontSize: '1.2rem', wordBreak: 'break-word' }}>
              {getSecurityBadge(elemento.security)} {elemento.name}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--color-medium-dark)', fontSize: '0.9rem' }}>
              {esCarpeta ? 'Carpeta' : 'Archivo'}
            </p>
          </div>
        </div>

        {/* Lista de Detalles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', color: 'var(--color-dark)', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Nivel de Seguridad:</strong>
            <span style={{ 
              color: elemento.security && elemento.security !== 'public' ? '#28a745' : 'var(--color-medium-dark)', 
              fontWeight: elemento.security && elemento.security !== 'public' ? 'bold' : 'normal',
              textAlign: 'right'
            }}>
              {getSecurityText(elemento.security || 'public')}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Tamaño / Contenido:</strong> <span>{tamanoOContenido}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Propietario:</strong> <span>{propietario}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Fecha de modificación:</strong> <span>{fecha}</span>
          </div>
        </div>

        {/* Botones de Acción Rápida */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={handleShareClick}>
            Compartir
          </button>
          {!esCarpeta && (
            <button className="btn btn-primary" style={{ padding: '8px 16px' }} onClick={handleDownload}>
              Descargar
            </button>
          )}
        </div>
      </div>

      {/* Diálogo de Permisos (si el archivo no es público) */}
      {showPermissionsDialog && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(3px)'
          }}
        >
          <div style={{
            backgroundColor: 'var(--color-white)', borderRadius: '16px',
            width: '90%', maxWidth: '400px', padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-dark)' }}>
              ⚠️ Configurar acceso para archivo protegido
            </h3>
            <p style={{ color: 'var(--color-medium-dark)', marginBottom: '20px' }}>
              Este archivo tiene protección. Define el tiempo de acceso y permisos de descarga.
            </p>

            {/* Duración del acceso */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--color-dark)' }}>
                Duración del acceso:
              </label>
              <select 
                value={accessDuration}
                onChange={(e) => setAccessDuration(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid #d0d0d0', fontSize: '0.95rem', cursor: 'pointer'
                }}
              >
                <option value="indefinido">Indefinido</option>
                <option value="1h">1 hora</option>
                <option value="1d">1 día</option>
                <option value="7d">7 días</option>
                <option value="30d">30 días</option>
              </select>
            </div>

            {/* Permiso de descarga */}
            <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ color: 'var(--color-dark)' }}>
                  Permitir descarga ({accessDuration === 'indefinido' ? 'indefinido' : `${accessDuration}`})
                </span>
              </label>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowPermissionsDialog(false)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid #d0d0d0',
                  backgroundColor: 'white', cursor: 'pointer', color: 'var(--color-dark)'
                }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmPermissions}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#0066cc', color: 'white', cursor: 'pointer'
                }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compartir */}
      <CompartirModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        item={elemento}
        presetAccessDuration={accessDuration}
        presetAllowDownload={allowDownload}
      />
    </div>
  )
}