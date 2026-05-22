import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import Footer from '../components/Footer';
import fileShareService from '../services/fileShareService';

// React Icons
import { 
  FaUpload, FaLock, FaShieldAlt, FaGlobe, FaChevronLeft, 
  FaFileAlt, FaKey, FaPhoneAlt, FaEye, FaDownload, 
  FaTimes, FaUserPlus, FaClock, FaSpinner
} from 'react-icons/fa';

export default function EnviarArchivo() {
  const navigate = useNavigate();
  
  // ========== ESTADOS DEL FORMULARIO ==========
  const [files, setFiles] = useState([]);
  const [tipoDestinatario, setTipoDestinatario] = useState('EMAIL');
  const [inputDestinatario, setInputDestinatario] = useState('');
  const [destinatarios, setDestinatarios] = useState([]);
  const [enviarCopia, setEnviarCopia] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  // Seguridad
  const [security, setSecurity] = useState('PUBLIC');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [useAccountPhone, setUseAccountPhone] = useState(true);
  const [customPhoneNumber, setCustomPhoneNumber] = useState('');
  
  // Acceso
  const [accessLevel, setAccessLevel] = useState('DOWNLOAD');
  
  // Expiración
  const [expirationTime, setExpirationTime] = useState('HOURS_24');
  
  // Notificaciones
  const [notifyOnView, setNotifyOnView] = useState(false);
  const [notifyOnDownload, setNotifyOnDownload] = useState(false);
  const [selfDestruct, setSelfDestruct] = useState(false);
  
  // Estados de UI
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const expirationOptions = [
    { value: 'HOURS_24', label: '24 horas' },
    { value: 'DAYS_3', label: '3 días' },
    { value: 'DAYS_7', label: '7 días' },
    { value: 'MONTH_1', label: '1 mes' }
  ];

  const handleAgregarDestinatario = (e) => {
    e.preventDefault();
    if (!inputDestinatario.trim()) return;
    if (destinatarios.includes(inputDestinatario.trim())) {
      setError('Este destinatario ya fue agregado');
      return;
    }
    setDestinatarios([...destinatarios, inputDestinatario.trim()]);
    setInputDestinatario('');
    setError(null);
  };

  const handleRemoverDestinatario = (indexToRemove) => {
    setDestinatarios(destinatarios.filter((_, index) => index !== indexToRemove));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const nuevosArchivos = Array.from(e.target.files);
      setFiles([...files, ...nuevosArchivos]);
      setError(null);
    }
  };

  const handleRemoverArchivo = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const validateForm = () => {
    if (files.length === 0) {
      setError('Por favor, selecciona al menos un archivo para enviar.');
      return false;
    }
    if (destinatarios.length === 0) {
      setError('Por favor, agrega al menos un destinatario.');
      return false;
    }
    if (security === 'PASSWORD') {
      if (!password || !confirmPassword) {
        setError('Por favor, ingresa y confirma la contraseña.');
        return false;
      }
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return false;
      }
    }
    if (security === 'TOKEN_SMS' && !useAccountPhone && !customPhoneNumber) {
      setError('Por favor, ingresa un número de teléfono para la verificación SMS.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      
      // Agregar archivos
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      // Crear el objeto request
      const request = {
        recipients: destinatarios.map(identifier => ({
          identifier: identifier,
          type: tipoDestinatario
        })),
        sendCopyToMyself: enviarCopia,
        securityLevel: security,
        accessLevel: accessLevel,
        expirationTime: expirationTime,
        notifyOnview: notifyOnView,
        notifyOnDownload: notifyOnDownload,
        selfDestruct: selfDestruct,
        message: mensaje || null,
        subject: asunto || null
      };
      
      // Agregar campos condicionales
      if (security === 'PASSWORD') {
        request.password = password;
        request.confirmPassword = confirmPassword;
      }
      
      if (security === 'TOKEN_SMS') {
        request.useAccountPhone = useAccountPhone;
        if (!useAccountPhone) {
          request.customPhoneNumber = customPhoneNumber;
        }
      }
      
      // ✅ CORRECCIÓN: Enviar el request como Blob JSON
      formData.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
      
      // Enviar al backend usando fetch directamente (para más control)
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar archivo');
      }
      
      setSuccess(`✅ ¡Éxito! Se han enviado ${files.length} archivo(s) a ${destinatarios.length} destinatario(s).`);
      
      setTimeout(() => {
        navigate('/dashboard?tab=enviados');
      }, 2000);
      
      // Limpiar formulario
      setFiles([]);
      setDestinatarios([]);
      setPassword('');
      setConfirmPassword('');
      setCustomPhoneNumber('');
      setAsunto('');
      setMensaje('');
      
    } catch (err) {
      console.error('Error al enviar archivo:', err);
      setError(err.message || 'Ocurrió un error al enviar el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PrivateLayout>
      <main style={{ 
        paddingTop: '110px', 
        paddingBottom: '80px', 
        color: 'white', 
        maxWidth: '800px', 
        margin: '0 auto', 
        paddingLeft: '20px', 
        paddingRight: '20px' 
      }}>
        
        {/* Encabezado */}
        <section style={{ marginBottom: '30px', textAlign: 'left' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-text-medium)', 
              cursor: 'pointer', 
              fontSize: '0.9rem', 
              marginBottom: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: 0 
            }}
          >
            <FaChevronLeft /> Cancelar y volver
          </button>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: 'white' }}>Enviar Archivo</h1>
          <p style={{ color: 'var(--color-text-medium)', marginTop: '4px' }}>
            Comparte archivos de forma segura con otros usuarios. Configura permisos, seguridad y tiempo de expiración.
          </p>
        </section>

        {error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'rgba(245, 34, 45, 0.15)', 
            color: '#f5222d', 
            border: '1px solid rgba(245, 34, 45, 0.2)', 
            borderRadius: '10px', 
            marginBottom: '25px', 
            textAlign: 'left' 
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'rgba(82, 196, 26, 0.15)', 
            color: '#52c41a', 
            border: '1px solid rgba(82, 196, 26, 0.2)', 
            borderRadius: '10px', 
            marginBottom: '25px', 
            textAlign: 'left' 
          }}>
            <strong>✅ {success}</strong>
          </div>
        )}

        {/* Formulario */}
        <form 
          onSubmit={handleSubmit} 
          style={{ 
            backgroundColor: '#1D263C', 
            padding: '35px', 
            borderRadius: '16px', 
            border: '1px solid #0a3fff', 
            boxShadow: '0 0 20px rgba(10, 63, 255, 0.35)',
            textAlign: 'left'
          }}
        >
          
          {/* 1. SELECCIÓN DE ARCHIVOS */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Archivos a enviar *</label>
            <div style={{ 
              border: files.length > 0 ? '2px dashed #0a3fff' : '2px dashed rgba(255,255,255,0.15)', 
              borderRadius: '12px', 
              padding: '40px 20px', 
              textAlign: 'center', 
              backgroundColor: files.length > 0 ? 'rgba(10, 63, 255, 0.04)' : 'var(--color-dark)', 
              cursor: 'pointer', 
              transition: 'all 0.3s'
            }}>
              <input 
                type="file" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                id="file-upload" 
                multiple 
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: 0 }}>
                <span style={{ fontSize: '2.8rem', color: '#46A2FD' }}>
                  <FaUpload />
                </span>
                <span style={{ color: '#46A2FD', fontWeight: 'bold', fontSize: '1.05rem' }}>
                  Haz clic para seleccionar archivos
                </span>
                <span style={{ color: 'var(--color-text-medium)', fontSize: '0.85rem' }}>
                  Soporta PDF, DOCX, JPG, PNG, ZIP, etc. (Puedes elegir múltiples)
                </span>
              </label>
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-medium)', fontWeight: '500' }}>
                  Archivos seleccionados ({files.length}):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {files.map((item, index) => (
                    <div key={index} style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px 14px', borderRadius: '8px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <FaFileAlt style={{ color: '#faad14', fontSize: '1rem' }} />
                        <span style={{ fontSize: '0.88rem', color: 'white' }}>
                          {item.name} ({(item.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button type="button" onClick={() => handleRemoverArchivo(index)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. DESTINATARIOS */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Destinatarios *</label>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {destinatarios.map((dest, index) => (
                <div key={index} style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  backgroundColor: 'rgba(70, 162, 253, 0.15)', border: '1px solid rgba(70, 162, 253, 0.3)', 
                  padding: '6px 12px', borderRadius: '20px', color: '#46A2FD', fontSize: '0.85rem' 
                }}>
                  <span>{dest}</span>
                  <FaTimes style={{ cursor: 'pointer', color: '#ff4d4f' }} onClick={() => handleRemoverDestinatario(index)} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                value={tipoDestinatario}
                onChange={(e) => setTipoDestinatario(e.target.value)}
                style={{ 
                  padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', 
                  backgroundColor: 'var(--color-dark)', color: 'white', outline: 'none' 
                }}
              >
                <option value="EMAIL">Correo Electrónico</option>
                <option value="USERNAME">Nombre de Usuario</option>
                <option value="PHONE">Teléfono</option>
              </select>
              <input 
                type="text"
                placeholder={tipoDestinatario === 'EMAIL' ? 'correo@ejemplo.com' : tipoDestinatario === 'USERNAME' ? 'nombre_usuario' : '+52 55 1234 5678'}
                value={inputDestinatario}
                onChange={(e) => setInputDestinatario(e.target.value)}
                style={{ flex: 1, backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', outline: 'none' }}
                onKeyPress={(e) => e.key === 'Enter' && handleAgregarDestinatario(e)}
              />
              <button type="button" onClick={handleAgregarDestinatario} className="btn btn-primary" style={{ padding: '0 20px' }}>
                <FaUserPlus /> Agregar
              </button>
            </div>
          </div>

          {/* 3. ENVIAR COPIA */}
          <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="enviarCopia" checked={enviarCopia} onChange={(e) => setEnviarCopia(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0a3fff' }} />
            <label htmlFor="enviarCopia" style={{ fontSize: '0.9rem', color: 'white', cursor: 'pointer' }}>Enviar copia a mí mismo</label>
          </div>

          {/* 4. ASUNTO */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Asunto (opcional)</label>
            <input type="text" placeholder="Ej. Documentos importantes" value={asunto} onChange={(e) => setAsunto(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', outline: 'none' }} />
          </div>

          {/* 5. MENSAJE */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Mensaje (opcional)</label>
            <textarea rows="3" placeholder="Añade notas contextuales..." value={mensaje} onChange={(e) => setMensaje(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', resize: 'none', outline: 'none' }} />
          </div>

          {/* 6. EXPIRACIÓN */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}><FaClock /> Tiempo de expiración *</label>
            <select value={expirationTime} onChange={(e) => setExpirationTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-dark)', color: 'white', outline: 'none' }}>
              {expirationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          {/* 7. SEGURIDAD */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', marginBottom: '12px', display: 'block' }}>Nivel de seguridad *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'PUBLIC' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', backgroundColor: security === 'PUBLIC' ? 'rgba(10, 63, 255, 0.05)' : 'transparent' }}>
                <input type="radio" name="security" value="PUBLIC" checked={security === 'PUBLIC'} onChange={() => setSecurity('PUBLIC')} />
                <div><FaGlobe style={{ color: '#46A2FD' }} /> <strong>Público</strong><br /><small>Cualquier persona con el enlace puede acceder</small></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'PASSWORD' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', backgroundColor: security === 'PASSWORD' ? 'rgba(10, 63, 255, 0.05)' : 'transparent' }}>
                <input type="radio" name="security" value="PASSWORD" checked={security === 'PASSWORD'} onChange={() => setSecurity('PASSWORD')} />
                <div><FaLock style={{ color: '#faad14' }} /> <strong>Protegido con contraseña</strong><br /><small>Requiere contraseña para acceder</small></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'TOKEN_SMS' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', backgroundColor: security === 'TOKEN_SMS' ? 'rgba(10, 63, 255, 0.05)' : 'transparent' }}>
                <input type="radio" name="security" value="TOKEN_SMS" checked={security === 'TOKEN_SMS'} onChange={() => setSecurity('TOKEN_SMS')} />
                <div><FaShieldAlt style={{ color: '#52c41a' }} /> <strong>Verificación por SMS</strong><br /><small>Requiere código enviado por SMS</small></div>
              </label>
            </div>
          </div>

          {/* Contraseña */}
          {security === 'PASSWORD' && (
            <div style={{ marginBottom: '25px', padding: '16px', backgroundColor: 'rgba(250, 173, 20, 0.05)', borderLeft: '4px solid #faad14', borderRadius: '4px' }}>
              <input type="password" placeholder="Contraseña (mínimo 8 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            </div>
          )}

          {/* SMS */}
          {security === 'TOKEN_SMS' && (
            <div style={{ marginBottom: '25px', padding: '16px', backgroundColor: 'rgba(82, 196, 26, 0.05)', borderLeft: '4px solid #52c41a', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <input type="checkbox" checked={useAccountPhone} onChange={(e) => setUseAccountPhone(e.target.checked)} /> Usar mi número registrado
              </label>
              {!useAccountPhone && (
                <input type="tel" placeholder="+52 55 1234 5678" value={customPhoneNumber} onChange={(e) => setCustomPhoneNumber(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              )}
            </div>
          )}

          {/* 8. ACCESO */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Nivel de acceso *</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="button" onClick={() => setAccessLevel('DOWNLOAD')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: accessLevel === 'DOWNLOAD' ? 'rgba(82, 196, 26, 0.15)' : 'var(--color-dark)', color: accessLevel === 'DOWNLOAD' ? '#52c41a' : 'var(--color-text-medium)', border: accessLevel === 'DOWNLOAD' ? '1px solid #52c41a' : '1px solid rgba(255,255,255,0.08)' }}><FaDownload /> Permitir Descarga</button>
              <button type="button" onClick={() => setAccessLevel('READ_ONLY')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: accessLevel === 'READ_ONLY' ? 'rgba(250, 173, 20, 0.15)' : 'var(--color-dark)', color: accessLevel === 'READ_ONLY' ? '#faad14' : 'var(--color-text-medium)', border: accessLevel === 'READ_ONLY' ? '1px solid #faad14' : '1px solid rgba(255,255,255,0.08)' }}><FaEye /> Solo Vista</button>
            </div>
          </div>

          {/* 9. NOTIFICACIONES */}
          <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label><input type="checkbox" checked={notifyOnView} onChange={(e) => setNotifyOnView(e.target.checked)} /> Notificar al ver</label>
            <label><input type="checkbox" checked={notifyOnDownload} onChange={(e) => setNotifyOnDownload(e.target.checked)} /> Notificar al descargar</label>
            <label><input type="checkbox" checked={selfDestruct} onChange={(e) => setSelfDestruct(e.target.checked)} /> Auto-destruir tras primera vista</label>
          </div>

          {/* 10. BOTÓN */}
          <button type="submit" disabled={isUploading} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
            {isUploading ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : '📤 Enviar Archivo(s)'}
          </button>

        </form>
      </main>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Footer />
    </PrivateLayout>
  );
}