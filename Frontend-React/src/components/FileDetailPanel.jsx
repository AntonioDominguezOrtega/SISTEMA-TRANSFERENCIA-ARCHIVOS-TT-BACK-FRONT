// src/components/FileDetailPanel.jsx
import { useState, useEffect } from 'react';
import { 
  FaFileAlt, FaShieldAlt, FaLock, FaUnlock, 
  FaEnvelope, FaDownload, FaEye, FaEyeSlash, FaTrash, 
  FaStar, FaRegStar
} from 'react-icons/fa';
import { 
  getFileIcon, 
  formatFileSize, 
  formatFullDate, 
  renderSecurityBadge 
} from '../utils/fileUtils';
import storageService from '../services/storageService';

const FileDetailPanel = ({ 
  file,           
  onClose,        
  onRefresh,      
  onDownload,     
  onView,         
  onMoveToTrash,  
  onToggleFavorite, 
  isFavorite = false,
  showTrashButton = true,
  isInTrash = false
}) => {
  const [solicitandoToken, setSolicitandoToken] = useState(false);
  const [desbloqueando, setDesbloqueando] = useState(false);
  const [localTokenSms, setLocalTokenSms] = useState('');
  const [localPassword, setLocalPassword] = useState('');
  const [showLocalPassword, setShowLocalPassword] = useState(false);
  const [panelMessage, setPanelMessage] = useState({ type: null, text: null });
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    if (panelMessage.text) {
      const timer = setTimeout(() => setPanelMessage({ type: null, text: null }), 3500);
      return () => clearTimeout(timer);
    }
  }, [panelMessage]);

  if (!file) return null;

  const isExpired = file.expiresAt && new Date(file.expiresAt) < new Date();

  if (isExpired) {
    return (
      <aside style={{ 
        backgroundColor: '#1D263C', 
        borderRadius: '16px', 
        border: '2px solid #f5222d', 
        padding: '24px', 
        position: 'sticky', 
        top: '130px',
        maxHeight: 'calc(100vh - 150px)',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFileAlt style={{ color: '#f5222d', fontSize: '1rem' }} />
            <h3 style={{ margin: 0, color: '#f5222d', fontSize: '1rem', fontWeight: '600' }}>Archivo Expirado</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
        </div>
        
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <FaFileAlt style={{ fontSize: '4rem', color: '#f5222d', marginBottom: '16px', opacity: 0.5 }} />
          <h4 style={{ color: 'white', marginBottom: '12px' }}>{file.name || file.fileName}</h4>
          <p style={{ color: '#f5222d', fontSize: '0.9rem', marginBottom: '8px' }}>
            ⚠️ Este archivo ha expirado
          </p>
          <p style={{ color: '#888', fontSize: '0.8rem' }}>
            Expiró el {formatFullDate(file.expiresAt)}
          </p>
          <button 
            onClick={onClose}
            style={{ 
              marginTop: '20px',
              padding: '10px 24px',
              backgroundColor: 'rgba(245,34,45,0.15)',
              border: '1px solid rgba(245,34,45,0.3)',
              borderRadius: '8px',
              color: '#f5222d',
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      </aside>
    );
  }

  const isUnlocked = file.isUnlocked === true || file.inUnlocked === true;
  const isPersonal = file.isPersonal === true || file.tipo === 'personal';
  const isOwner = file.tipo === 'enviado' || file.sharedBy === 'Tú' || file.isOwner === true;
  const needsUnlock = !isOwner && (file.securityLevel === 'PASSWORD' || file.securityLevel === 'TOKEN_SMS') && !isUnlocked;

  const recargarArchivo = async () => {
    try {
      let refreshedFile;
      if (isPersonal) {
        refreshedFile = await storageService.getPersonalFileInfo(file.itemId || file.id);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        refreshedFile = await fileShareService.getFileDetails(file.itemId || file.shareId);
      }
      
      if (onRefresh) {
        onRefresh(refreshedFile);
      }
    } catch (err) {
      console.error('Error recargando archivo:', err);
    }
  };

  const handleSolicitarToken = async () => {
    setSolicitandoToken(true);
    setPanelMessage({ type: null, text: null });
    try {
      if (isPersonal) {
        await storageService.requestPersonalFileToken(file.itemId || file.id);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        await fileShareService.requestSmsToken(file.itemId || file.shareId);
      }
      setPanelMessage({ type: 'success', text: 'Código enviado. Revisa tu teléfono y correo.' });
      setIsBlocked(false); 
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.message || err.response?.data?.error || err.message });
    } finally {
      setSolicitandoToken(false);
    }
  };

  const handleVerificarToken = async () => {
    if (!localTokenSms.trim()) {
      setPanelMessage({ type: 'error', text: 'Ingresa el código de 6 dígitos' });
      return;
    }
    setDesbloqueando(true);
    setPanelMessage({ type: null, text: null });
    try {
      if (isPersonal) {
        await storageService.verifyPersonalFileToken(file.itemId || file.id, localTokenSms);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        await fileShareService.verifySmsToken(file.itemId || file.shareId, localTokenSms);
      }
      setPanelMessage({ type: 'success', text: 'Archivo desbloqueado correctamente' });
      setLocalTokenSms('');
      setIsBlocked(false);
      
      await recargarArchivo();
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setPanelMessage({ type: 'error', text: errorMsg });
      
      if (errorMsg && (errorMsg.toLowerCase().includes('demasiados intentos') || errorMsg.includes('restantes: 0'))) {
        setIsBlocked(true);
      }
    } finally {
      setDesbloqueando(false);
    }
  };

  const handleVerificarPassword = async () => {
    if (!localPassword.trim()) {
      setPanelMessage({ type: 'error', text: 'Ingresa la contraseña' });
      return;
    }
    setDesbloqueando(true);
    setPanelMessage({ type: null, text: null });
    try {
      if (isPersonal) {
        await storageService.verifyPersonalFilePassword(file.itemId || file.id, localPassword);
      } else {
        const { default: fileShareService } = await import('../services/fileShareService');
        await fileShareService.verifyPassword(file.itemId || file.shareId, localPassword);
      }
      setPanelMessage({ type: 'success', text: 'Archivo desbloqueado correctamente' });
      setLocalPassword('');
      setIsBlocked(false);
      
      await recargarArchivo();
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setPanelMessage({ type: 'error', text: errorMsg });

      if (errorMsg && (errorMsg.toLowerCase().includes('demasiados intentos') || errorMsg.includes('restantes: 0'))) {
        setIsBlocked(true);
      }
    } finally {
      setDesbloqueando(false);
    }
  };

  return (
    <aside style={{ 
      backgroundColor: '#1D263C', 
      borderRadius: '16px', 
      border: '1px solid #0a3fff', 
      padding: '24px', 
      position: 'sticky', 
      top: '130px',
      maxHeight: 'calc(100vh - 150px)',
      overflowY: 'auto'

    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaFileAlt style={{ color: '#46A2FD', fontSize: '1rem' }} />
          <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: '600' }}>Información del archivo</h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
      </div>

      {file.subject && (
        <div style={{ 
          backgroundColor: 'rgba(10,63,255,0.15)', 
          borderRadius: '12px', 
          padding: '14px', 
          marginBottom: '16px', 
          borderLeft: '4px solid #0a3fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <FaEnvelope style={{ color: '#46A2FD', fontSize: '0.75rem' }} />
            <span style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ASUNTO</span>
          </div>
          <p style={{ margin: 0, color: 'white', fontSize: '0.85rem', fontWeight: '500', lineHeight: '1.4' }}>
            {file.subject}
          </p>
        </div>
      )}

      {file.message && (
        <div style={{ 
          backgroundColor: 'rgba(255,255,255,0.04)', 
          borderRadius: '12px', 
          padding: '14px', 
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <FaEnvelope style={{ color: '#46A2FD', fontSize: '0.75rem' }} />
            <span style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MENSAJE</span>
          </div>
          <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
            {file.message}
          </p>
        </div>
      )}

      {panelMessage.text && (
        <div style={{ 
          padding: '12px', 
          marginBottom: '16px',
          backgroundColor: panelMessage.type === 'success' ? 'rgba(82,196,26,0.15)' : 'rgba(245,34,45,0.15)',
          border: `1px solid ${panelMessage.type === 'success' ? 'rgba(82,196,26,0.2)' : 'rgba(245,34,45,0.2)'}`,
          borderRadius: '8px',
          color: panelMessage.type === 'success' ? '#52c41a' : '#f5222d',
          fontSize: '0.8rem'
        }}>
          {panelMessage.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', color: '#46A2FD', marginBottom: '12px' }}>
            {getFileIcon(file.fileType)}
          </div>
          <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: '500', wordBreak: 'break-all' }}>
            {file.name || file.fileName}
          </h4>
        </div>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaShieldAlt style={{ color: '#46A2FD', fontSize: '0.9rem' }} />
              <span style={{ color: '#888', fontSize: '0.8rem' }}>Seguridad</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {renderSecurityBadge(file.securityLevel, isUnlocked, file.hasPassword)}
              
              {/* AQUÍ ESTÁ EL CAMBIO PARA MOSTRAR "Token" EN LUGAR DE "TOKEN_SMS" */}
              <span style={{ color: 'white', fontSize: '0.85rem' }}>
                {file.securityLevel === 'TOKEN_SMS' ? 'Token' : 
                 file.securityLevel === 'PASSWORD' ? 'Contraseña' : 
                 (file.securityLevel || 'Público')}
              </span>
            </div>
          </div>
          
          {isUnlocked && file.unlockedUntil && (
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: 'rgba(82,196,26,0.1)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#52c41a' }}>
                Acceso garantizado hasta {formatFullDate(file.unlockedUntil)}
              </span>
            </div>
          )}
          
          {needsUnlock && (
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: 'rgba(250,173,20,0.1)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#faad14' }}>Archivo protegido - requiere autenticación</span>
            </div>
          )}
          
          {isOwner && (file.securityLevel === 'PASSWORD' || file.securityLevel === 'TOKEN_SMS') && (
            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: 'rgba(10,63,255,0.1)', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.7rem', color: '#0a3fff' }}>
                Eres el propietario - acceso directo sin necesidad de desbloquear
              </span>
            </div>
          )}
        </div>

        {needsUnlock && !isOwner && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <FaLock style={{ color: '#faad14', fontSize: '0.8rem' }} />
              <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '500' }}>
                {file.securityLevel === 'PASSWORD' ? 'Desbloquear con contraseña' : 'Desbloquear con verificación'}
              </span>
            </div>
            
            {file.securityLevel === 'TOKEN_SMS' && (
              <>
                <button 
                  onClick={handleSolicitarToken}
                  disabled={solicitandoToken}
                  style={{ 
                    width: '100%', 
                    padding: '10px', 
                    marginBottom: '12px',
                    backgroundColor: 'rgba(10,63,255,0.15)', 
                    border: '1px solid rgba(10,63,255,0.3)',
                    borderRadius: '8px', 
                    color: '#46A2FD', 
                    cursor: solicitandoToken ? 'default' : 'pointer',
                    fontSize: '0.85rem',
                    opacity: solicitandoToken ? 0.6 : 1
                  }}
                >
                  {solicitandoToken ? 'Enviando...' : 'Solicitar código de verificación'}
                </button>
                
                {isBlocked && (
                  <div style={{ padding: '10px', backgroundColor: 'rgba(245,34,45,0.15)', border: '1px solid #f5222d', borderRadius: '8px', color: '#f5222d', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center' }}>
                    🔒 Acceso bloqueado. Solicita un nuevo código para intentarlo de nuevo.
                  </div>
                )}
                
                <input 
                  type="text"
                  placeholder="Código de 6 dígitos"
                  value={localTokenSms}
                  onChange={(e) => setLocalTokenSms(e.target.value)}
                  disabled={isBlocked}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '12px',
                    backgroundColor: '#0D1425',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    opacity: isBlocked ? 0.5 : 1
                  }}
                  maxLength="6"
                />
                
                <button 
                  onClick={handleVerificarToken}
                  disabled={desbloqueando || !localTokenSms.trim() || isBlocked}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0a3fff',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: (desbloqueando || !localTokenSms.trim() || isBlocked) ? 'default' : 'pointer',
                    fontSize: '0.85rem',
                    opacity: (!localTokenSms.trim() || desbloqueando || isBlocked) ? 0.6 : 1
                  }}
                >
                  {desbloqueando ? 'Verificando...' : 'Verificar y desbloquear'}
                </button>
              </>
            )}
            
            {file.securityLevel === 'PASSWORD' && (
              <>
                {isBlocked && (
                  <div style={{ padding: '10px', backgroundColor: 'rgba(245,34,45,0.15)', border: '1px solid #f5222d', borderRadius: '8px', color: '#f5222d', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center' }}>
                    🔒 Archivo bloqueado por demasiados intentos fallidos.
                  </div>
                )}
                
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showLocalPassword ? 'text' : 'password'}
                    placeholder="Contraseña del archivo"
                    value={localPassword}
                    onChange={(e) => setLocalPassword(e.target.value)}
                    disabled={isBlocked}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '12px',
                      backgroundColor: '#0D1425',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      paddingRight: '46px',
                      opacity: isBlocked ? 0.5 : 1
                    }}
                  />
                  <button type="button" onClick={() => setShowLocalPassword(p => !p)} disabled={isBlocked} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--color-text-medium)', cursor: isBlocked ? 'default' : 'pointer', padding: 0, fontSize: '1rem', opacity: isBlocked ? 0.5 : 1 }}>
                    {showLocalPassword ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                
                <button 
                  onClick={handleVerificarPassword}
                  disabled={desbloqueando || !localPassword.trim() || isBlocked}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0a3fff',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: (desbloqueando || !localPassword.trim() || isBlocked) ? 'default' : 'pointer',
                    fontSize: '0.85rem',
                    opacity: (!localPassword.trim() || desbloqueando || isBlocked) ? 0.6 : 1
                  }}
                >
                  {desbloqueando ? 'Verificando...' : 'Desbloquear archivo'}
                </button>
              </>
            )}
          </div>
        )}

        {(!needsUnlock || isUnlocked || file.securityLevel === 'PUBLIC' || isOwner) && (
          <>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>Remitente</span>
                  <span style={{ color: 'white', fontSize: '0.85rem' }}>{file.sharedBy || file.remitente || 'Tú'}</span>
                </div>
                {file.sharedWith && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>Destinatario</span>
                    <span style={{ color: 'white', fontSize: '0.85rem' }}>{file.sharedWith}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>Tamaño</span>
                  <span style={{ color: 'white', fontSize: '0.85rem' }}>{formatFileSize(file.fileSize)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>Fecha</span>
                  <span style={{ color: 'white', fontSize: '0.85rem' }}>
                    {file.tipo === 'recibido' ? formatFullDate(file.sharedAt) : 
                     file.tipo === 'enviado' ? formatFullDate(file.sharedAt) :
                     formatFullDate(file.uploadedAt)}
                  </span>
                </div>
                {file.expiresAt && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>Expiración</span>
                    <span style={{ color: '#ff4d4f', fontSize: '0.85rem', fontWeight: '500' }}>{formatFullDate(file.expiresAt)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#888', fontSize: '0.8rem' }}>Permiso</span>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontSize: '0.7rem', 
                    fontWeight: '500',
                    backgroundColor: file.accessLevel === 'DOWNLOAD' ? 'rgba(82,196,26,0.15)' : 'rgba(255,197,61,0.15)',
                    color: file.accessLevel === 'DOWNLOAD' ? '#52c41a' : '#faad14'
                  }}>
                    {file.accessLevel === 'DOWNLOAD' ? 'Descarga permitida' : 'Solo lectura'}
                  </span>
                </div>
              </div>
            </div>

            {!isInTrash && onToggleFavorite && (
              <button
                onClick={() => onToggleFavorite()}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: isFavorite ? 'rgba(250,173,20,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isFavorite ? 'rgba(250,173,20,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px',
                  color: isFavorite ? '#faad14' : '#888',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.85rem'
                }}
              >
                {isFavorite ? <FaStar /> : <FaRegStar />}
                {isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              </button>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              {file.accessLevel !== 'READ_ONLY' && onDownload && (
                <button 
                  onClick={() => onDownload()}
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(10,63,255,0.15)', 
                    border: '1px solid rgba(10,63,255,0.3)', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    color: '#46A2FD', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    fontSize: '0.85rem' 
                  }}
                >
                  <FaDownload /> Descargar
                </button>
              )}
              {onView && (
                <button 
                  onClick={() => onView()}
                  style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(82,196,26,0.1)', 
                    border: '1px solid rgba(82,196,26,0.2)', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    color: '#52c41a', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px', 
                    fontSize: '0.85rem' 
                  }}
                >
                  <FaEye /> Visualizar
                </button>
              )}
            </div>

            {showTrashButton && !isInTrash && onMoveToTrash && (
              <button 
                onClick={() => onMoveToTrash()}
                style={{ 
                  width: '100%', 
                  backgroundColor: 'rgba(245,34,45,0.1)', 
                  border: '1px solid rgba(245,34,45,0.2)', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  color: '#f5222d', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  fontSize: '0.85rem', 
                  marginTop: '4px' 
                }}
              >
                <FaTrash /> Mover a papelera
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default FileDetailPanel;