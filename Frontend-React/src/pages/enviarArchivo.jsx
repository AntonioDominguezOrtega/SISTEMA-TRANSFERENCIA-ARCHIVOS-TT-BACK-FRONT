import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import Footer from '../components/Footer';
import FileSelectorModal from '../components/FileSelectorModal';

// Servicios Reales
import profileService from '../services/profileService';
import searchService from '../services/searchService';

// React Icons
import { 
  FaUpload, FaLock, FaShieldAlt, FaGlobe, FaChevronLeft, 
  FaFileAlt, FaUserPlus, FaClock, FaSpinner, FaCloud, 
  FaEye, FaDownload, FaTimes, FaSearch, FaKey, FaEnvelope, FaUser
} from 'react-icons/fa';

// Helper para obtener iniciales
const getInitials = (nombre, apellido) => {
  if (!nombre) return 'U';
  const primera = nombre.charAt(0).toUpperCase();
  const segunda = apellido ? apellido.charAt(0).toUpperCase() : '';
  return `${primera}${segunda}`;
};

export default function EnviarArchivo() {
  const navigate = useNavigate();
  
  // ========== ESTADOS DE ARCHIVOS ==========
  const [origenArchivo, setOrigenArchivo] = useState('NUEVO'); // 'NUEVO' o 'EXISTENTE'
  const [files, setFiles] = useState([]); // Archivos nuevos subidos
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [archivosExistentesSeleccionados, setArchivosExistentesSeleccionados] = useState([]);
  
  // ========== ESTADOS DE DESTINATARIOS ==========
  const [misContactos, setMisContactos] = useState([]);
  const [busquedaContactos, setBusquedaContactos] = useState('');
  const [destinatarios, setDestinatarios] = useState([]);
  
  // Modal de Directorio Global
  const [showModalBusquedaGlobal, setShowModalBusquedaGlobal] = useState(false);
  const [inputBusquedaGlobal, setInputBusquedaGlobal] = useState(''); 
  const [resultadosFiltradosGlobal, setResultadosFiltradosGlobal] = useState([]);
  const [buscandoGlobal, setBuscandoGlobal] = useState(false);

  // ========== METADATA ==========
  const [enviarCopia, setEnviarCopia] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  // ========== CONFIGURACIONES DE SEGURIDAD ==========
  const [security, setSecurity] = useState('PUBLIC');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [useAccountPhone, setUseAccountPhone] = useState(true);
  const [customPhoneNumber, setCustomPhoneNumber] = useState('');
  
  // ========== ACCESO Y EXPIRACIÓN ==========
  const [accessLevel, setAccessLevel] = useState('DOWNLOAD');
  const [expirationTime, setExpirationTime] = useState('HOURS_24');
  
  // ========== NOTIFICACIONES ==========
  const [notifyOnView, setNotifyOnView] = useState(false);
  const [notifyOnDownload, setNotifyOnDownload] = useState(false);
  const [selfDestruct, setSelfDestruct] = useState(false);
  
  // ========== ESTADOS DE UI ==========
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const expirationOptions = [
    { value: 'HOURS_24', label: '24 horas' },
    { value: 'DAYS_3', label: '3 días' },
    { value: 'DAYS_7', label: '7 días' },
    { value: 'MONTH_1', label: '1 mes' }
  ];

  // ============================================================
  // 1. CARGAR MIS CONTACTOS
  // ============================================================
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await profileService.getMyContacts();
        setMisContactos(response.contacts || []);
      } catch (err) {
        console.error("Error al cargar mis contactos", err);
      }
    };
    loadContacts();
  }, []);

  // ============================================================
  // 2. BÚSQUEDA GLOBAL DE USUARIOS
  // ============================================================
  useEffect(() => {
    const query = inputBusquedaGlobal.trim();
    if (query.length >= 2) {
      setBuscandoGlobal(true);
      const delay = setTimeout(async () => {
        try {
          const response = await profileService.searchUsersByAny(query);
          setResultadosFiltradosGlobal(response.results || []);
        } catch (err) {
          console.error(err);
        } finally {
          setBuscandoGlobal(false);
        }
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setResultadosFiltradosGlobal([]);
    }
  }, [inputBusquedaGlobal]);

  // ============================================================
  // MANEJADORES DE DESTINATARIOS
  // ============================================================
  const agregarDestinatario = (usuario) => {
    const identifier = usuario.username || usuario.email;
    const type = usuario.username ? 'USERNAME' : 'EMAIL';
    const label = `${usuario.nombre} ${usuario.apellido || ''}`.trim();

    if (destinatarios.some(d => d.identifier === identifier)) {
      setError(`${label} ya está en la lista.`);
      return;
    }

    setDestinatarios([...destinatarios, { 
      id: usuario.id,
      identifier, 
      type, 
      label,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      username: usuario.username,
      email: usuario.email,
      profilePictureUrl: usuario.profilePictureUrl
    }]);
    setBusquedaContactos('');
    setError(null);
  };

  const agregarDestinatarioManual = (identifier) => {
    if (!identifier.trim()) return;
    
    let type = 'USERNAME';
    if (identifier.includes('@') && identifier.includes('.')) {
      type = 'EMAIL';
    } else if (/^[\+\d\s\-\(\)]{8,}$/.test(identifier) && /\d/.test(identifier)) {
      type = 'PHONE';
    }
    
    if (destinatarios.some(d => d.identifier === identifier)) {
      setError('Este destinatario ya fue agregado');
      return;
    }
    
    setDestinatarios([...destinatarios, { 
      id: null,
      identifier, 
      type, 
      label: identifier,
      nombre: identifier,
      profilePictureUrl: null
    }]);
    setBusquedaContactos('');
    setError(null);
  };

  const agregarDestinatarioDesdeGlobal = (usuario) => {
    agregarDestinatario(usuario);
    setShowModalBusquedaGlobal(false);
    setInputBusquedaGlobal('');
  };

  const removerDestinatario = (index) => {
    setDestinatarios(destinatarios.filter((_, i) => i !== index));
  };

  // Contactos filtrados localmente
  const contactosFiltrados = misContactos.filter(c => {
    if (!busquedaContactos) return false;
    const nombreCompleto = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
    const alias = (c.username || '').toLowerCase();
    const query = busquedaContactos.toLowerCase();
    return nombreCompleto.includes(query) || alias.includes(query);
  });

  // ============================================================
  // MANEJADORES DE ARCHIVOS
  // ============================================================
  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
      setError(null);
    }
  };

  const removerArchivoNuevo = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const removerArchivoExistente = (id) => {
    setArchivosExistentesSeleccionados(archivosExistentesSeleccionados.filter(a => a.id !== id));
  };

  // ============================================================
  // VALIDACIÓN Y ENVÍO
  // ============================================================
  const validateForm = () => {
    if (origenArchivo === 'NUEVO' && files.length === 0) {
      setError('Selecciona al menos un archivo para enviar.');
      return false;
    }
    if (origenArchivo === 'EXISTENTE' && archivosExistentesSeleccionados.length === 0) {
      setError('Selecciona al menos un archivo de tu nube.');
      return false;
    }
    if (destinatarios.length === 0) {
      setError('Agrega al menos un destinatario.');
      return false;
    }
    if (security === 'PASSWORD') {
      if (!password) {
        setError('Ingresa una contraseña.');
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
      setError('Ingresa un número de teléfono para la verificación SMS.');
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
      const token = localStorage.getItem('token');
      
      if (origenArchivo === 'NUEVO') {
        // Caso: Subir archivos nuevos
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        
        const requestData = {
          recipients: destinatarios.map(d => ({ identifier: d.identifier, type: d.type })),
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
        
        if (security === 'PASSWORD') {
          requestData.password = password;
          requestData.confirmPassword = confirmPassword;
        }
        
        if (security === 'TOKEN_SMS') {
          requestData.useAccountPhone = useAccountPhone;
          if (!useAccountPhone) requestData.customPhoneNumber = customPhoneNumber;
        }
        
        formData.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
        
        const response = await fetch('http://localhost:8080/api/files/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al enviar');
        
      } else {
        // Caso: Compartir archivos existentes
        const peticiones = archivosExistentesSeleccionados.map(async (archivo) => {
          const requestData = {
            fileId: archivo.id,
            recipients: destinatarios.map(d => ({ identifier: d.identifier, type: d.type })),
            securityLevel: security,
            accessLevel: accessLevel,
            expirationTime: expirationTime,
            notifyOnView: notifyOnView,
            notifyOnDownload: notifyOnDownload,
            selfDestruct: selfDestruct,
            message: mensaje || null,
            subject: asunto || null,
            sendCopyToMyself: false
          };
          
          if (security === 'PASSWORD') {
            requestData.password = password;
            requestData.confirmPassword = confirmPassword;
          }
          
          if (security === 'TOKEN_SMS') {
            requestData.useAccountPhone = useAccountPhone;
            if (!useAccountPhone) requestData.customPhoneNumber = customPhoneNumber;
          }
          
          const res = await fetch('http://localhost:8080/api/storage/share', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Error al compartir ${archivo.name}`);
          return data;
        });
        
        await Promise.all(peticiones);
      }
      
      setSuccess(`✅ ¡Éxito! Archivo(s) compartidos con ${destinatarios.length} destinatario(s).`);
      setTimeout(() => navigate('/dashboard?tab=enviados'), 2000);
      
      // Limpiar formulario
      setFiles([]);
      setArchivosExistentesSeleccionados([]);
      setDestinatarios([]);
      setPassword('');
      setConfirmPassword('');
      setCustomPhoneNumber('');
      setAsunto('');
      setMensaje('');
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Ocurrió un error al enviar.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PrivateLayout>
      <main style={{ paddingTop: '110px', paddingBottom: '80px', color: 'white', maxWidth: '800px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
        
        <section className="section-top" style={{ marginBottom: '30px', textAlign: 'left' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
          >
            <FaChevronLeft /> Cancelar y volver al espacio
          </button>
        </section>

        <section>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: '#3C60E2' }}>Enviar Archivo</h1>
          <p style={{ color: 'var(--color-text-medium)', marginTop: '4px' }}>Comparte archivos de forma segura con otros usuarios. Configura permisos, seguridad y tiempo de expiración.</p>
          <br />
        </section>

        {error && (
          <div style={{ padding: '16px', backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', border: '1px solid rgba(245, 34, 45, 0.2)', borderRadius: '10px', marginBottom: '25px', textAlign: 'left' }}>
            <strong>Error de Políticas:</strong> {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '16px', backgroundColor: 'rgba(82, 196, 26, 0.15)', color: '#52c41a', border: '1px solid rgba(82, 196, 26, 0.2)', borderRadius: '10px', marginBottom: '25px', textAlign: 'left' }}>
            <strong>{success}</strong>
          </div>
        )}

        <form 
          onSubmit={handleSubmit} 
          style={{ 
            backgroundColor: '#1D263C', 
            padding: '35px', 
            borderRadius: '16px', 
            border: '1px solid #0a3fff', 
            boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.35)',
            textAlign: 'left'
          }}
        >
          
          {/* ======================================= */}
          {/* 1. SELECCIÓN DE ORIGEN Y ARCHIVOS */}
          {/* ======================================= */}
          <div style={{ marginBottom: '25px' }}>
            <label className="form-label" style={{ color: 'white', fontWeight: '600' }}>Archivos a enviar *</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '10px' }}>
              <button type="button" onClick={() => setOrigenArchivo('NUEVO')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: origenArchivo === 'NUEVO' ? '#0a3fff' : 'transparent', color: 'white', fontWeight: origenArchivo === 'NUEVO' ? 'bold' : 'normal', cursor: 'pointer' }}>
                <FaUpload style={{ marginRight: '8px' }} /> Subir Nuevo Archivo
              </button>
              <button type="button" onClick={() => setOrigenArchivo('EXISTENTE')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: origenArchivo === 'EXISTENTE' ? '#0a3fff' : 'transparent', color: 'white', fontWeight: origenArchivo === 'EXISTENTE' ? 'bold' : 'normal', cursor: 'pointer' }}>
                <FaCloud style={{ marginRight: '8px' }} /> Elegir de mi Nube
              </button>
            </div>

            {origenArchivo === 'NUEVO' ? (
              <div>
                <div style={{ border: files.length > 0 ? '2px dashed #0a3fff' : '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', backgroundColor: files.length > 0 ? 'rgba(10, 63, 255, 0.04)' : 'var(--color-dark)', cursor: 'pointer' }}>
                  <input type="file" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" multiple />
                  <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '2.8rem', color: '#46A2FD' }}><FaUpload /></span>
                    <span style={{ color: '#46A2FD', fontWeight: 'bold' }}>Selecciona archivos de tu computadora</span>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>Puedes seleccionar múltiples archivos</span>
                  </label>
                </div>
                {files.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '8px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FaFileAlt color="#faad14" /><span>{item.name} ({(item.size / 1024 / 1024).toFixed(2)} MB)</span></div>
                    <button type="button" onClick={() => removerArchivoNuevo(index)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}><FaTimes /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {/* Botón tipo Drive para abrir el selector visual */}
                <button
                  type="button"
                  onClick={() => setShowFileSelector(true)}
                  style={{
                    width: '100%',
                    padding: '30px 20px',
                    borderRadius: '12px',
                    border: '2px dashed rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    color: '#46A2FD',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0a3fff'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                >
                  <FaCloud style={{ fontSize: '2.5rem' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Explorar mi unidad</span>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>Navega por tus carpetas y selecciona archivos</span>
                </button>

                {/* Archivos seleccionados */}
                {archivosExistentesSeleccionados.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px' }}>
                      Archivos seleccionados ({archivosExistentesSeleccionados.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {archivosExistentesSeleccionados.map((archivo) => (
                        <div key={archivo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaFileAlt color="#faad14" />
                            <span>{archivo.name}</span>
                          </div>
                          <button type="button" onClick={() => removerArchivoExistente(archivo.id)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======================================= */}
          {/* 2. DESTINATARIOS */}
          {/* ======================================= */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Destinatarios *</label>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {destinatarios.map((dest, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(70, 162, 253, 0.15)', border: '1px solid rgba(70, 162, 253, 0.3)', padding: '6px 12px', borderRadius: '20px', color: '#46A2FD', fontSize: '0.85rem' }}>
                  {dest.profilePictureUrl ? (
                    <img src={dest.profilePictureUrl} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span>{dest.type === 'EMAIL' ? '📧' : dest.type === 'PHONE' ? '📱' : '👤'}</span>
                  )}
                  <span>{dest.label}</span>
                  <FaTimes style={{ cursor: 'pointer', color: '#ff4d4f' }} onClick={() => removerDestinatario(index)} />
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><FaUserPlus color="var(--color-text-medium)" /></span>
                <input 
                  type="text"
                  placeholder="Busca en tus contactos o escribe un email..."
                  value={busquedaContactos}
                  onChange={(e) => setBusquedaContactos(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarDestinatarioManual(busquedaContactos)}
                  style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 12px 12px 40px', outline: 'none' }}
                />
                
                {busquedaContactos && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1D263C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    {contactosFiltrados.length === 0 ? (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#888' }}>
                        No está en tus contactos. Presiona Enter para agregarlo manualmente.
                      </div>
                    ) : (
                      contactosFiltrados.map(contacto => (
                        <div 
                          key={contacto.contactId} 
                          onClick={() => agregarDestinatario(contacto)}
                          style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0a3fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {contacto.profilePictureUrl ? (
                              <img src={contacto.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>{getInitials(contacto.nombre, contacto.apellido)}</span>
                            )}
                          </div>
                          <div>
                            <div style={{ color: 'white' }}>{contacto.nombre} {contacto.apellido || ''}</div>
                            <div style={{ fontSize: '0.7rem', color: '#46A2FD' }}>@{contacto.username}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <button type="button" className="btn btn-secondary" onClick={() => setShowModalBusquedaGlobal(true)} style={{ padding: '0 20px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
                <FaGlobe /> Global
              </button>
            </div>
          </div>

          {/* 3. ENVIAR COPIA (solo para archivos nuevos) */}
          {origenArchivo === 'NUEVO' && (
            <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="enviarCopia" checked={enviarCopia} onChange={(e) => setEnviarCopia(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0a3fff' }} />
              <label htmlFor="enviarCopia" style={{ fontSize: '0.9rem', color: 'white', cursor: 'pointer' }}>Guardar copia en Mis Archivos</label>
            </div>
          )}

          {/* 4. ASUNTO Y EXPIRACIÓN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            <div>
              <label style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Asunto (opcional)</label>
              <input type="text" placeholder="Ej. Documentos importantes" value={asunto} onChange={(e) => setAsunto(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}><FaClock /> Expiración *</label>
              <select value={expirationTime} onChange={(e) => setExpirationTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-dark)', color: 'white', outline: 'none' }}>
                {expirationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          
          {/* 5. MENSAJE */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Mensaje (opcional)</label>
            <textarea rows="3" placeholder="Añade notas contextuales..." value={mensaje} onChange={(e) => setMensaje(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', resize: 'none', outline: 'none' }} />
          </div>

          {/* 6. NIVEL DE ACCESO */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Nivel de acceso *</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="button" onClick={() => setAccessLevel('READ_ONLY')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: accessLevel === 'READ_ONLY' ? 'rgba(250, 173, 20, 0.15)' : 'var(--color-dark)', color: accessLevel === 'READ_ONLY' ? '#faad14' : 'var(--color-text-medium)', border: accessLevel === 'READ_ONLY' ? '1px solid #faad14' : '1px solid rgba(255,255,255,0.08)' }}>
                <FaEye /> Solo Lectura
              </button>
              <button type="button" onClick={() => setAccessLevel('DOWNLOAD')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: accessLevel === 'DOWNLOAD' ? 'rgba(82, 196, 26, 0.15)' : 'var(--color-dark)', color: accessLevel === 'DOWNLOAD' ? '#52c41a' : 'var(--color-text-medium)', border: accessLevel === 'DOWNLOAD' ? '1px solid #52c41a' : '1px solid rgba(255,255,255,0.08)' }}>
                <FaDownload /> Permitir Descarga
              </button>
            </div>
          </div>

          {/* 7. SEGURIDAD */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', marginBottom: '12px', display: 'block' }}>Seguridad *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'PUBLIC' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer' }}>
                <input type="radio" name="security" value="PUBLIC" checked={security === 'PUBLIC'} onChange={() => setSecurity('PUBLIC')} />
                <div><FaGlobe style={{ color: '#46A2FD' }} /> <strong>Público</strong><br /><small>Solo necesita el enlace para abrirlo</small></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'PASSWORD' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer' }}>
                <input type="radio" name="security" value="PASSWORD" checked={security === 'PASSWORD'} onChange={() => setSecurity('PASSWORD')} />
                <div><FaLock style={{ color: '#faad14' }} /> <strong>Protegido con contraseña</strong><br /><small>Se pedirá esta contraseña para abrirlo</small></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'TOKEN_SMS' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer' }}>
                <input type="radio" name="security" value="TOKEN_SMS" checked={security === 'TOKEN_SMS'} onChange={() => setSecurity('TOKEN_SMS')} />
                <div><FaShieldAlt style={{ color: '#52c41a' }} /> <strong>Verificación por SMS</strong><br /><small>Recibirá un código para desbloquearlo</small></div>
              </label>
            </div>
          </div>

          {/* Contraseña */}
          {security === 'PASSWORD' && (
            <div style={{ marginBottom: '25px', padding: '16px', backgroundColor: 'rgba(250, 173, 20, 0.05)', borderLeft: '4px solid #faad14', borderRadius: '4px' }}>
              <input type="password" placeholder="Contraseña (mínimo 8 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--color-dark)', color: 'white', border: confirmPassword && password !== confirmPassword ? '1px solid #ff4d4f' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              {confirmPassword && password !== confirmPassword && <span style={{ color: '#ff4d4f', fontSize: '0.75rem', marginTop: '5px' }}>❌ Las contraseñas no coinciden</span>}
              {confirmPassword && password === confirmPassword && password.length >= 8 && <span style={{ color: '#52c41a', fontSize: '0.75rem', marginTop: '5px' }}>✅ Coinciden</span>}
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

          {/* 8. NOTIFICACIONES */}
          <div style={{ marginBottom: '30px', padding: '15px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '12px' }}>Notificaciones</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--color-text-medium)' }}>
                <input type="checkbox" checked={notifyOnView} onChange={(e) => setNotifyOnView(e.target.checked)} /> Notificar cuando abran el archivo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--color-text-medium)' }}>
                <input type="checkbox" checked={notifyOnDownload} onChange={(e) => setNotifyOnDownload(e.target.checked)} /> Notificar cuando descarguen
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--color-text-medium)' }}>
                <input type="checkbox" checked={selfDestruct} onChange={(e) => setSelfDestruct(e.target.checked)} /> Auto-destruir después de la primera vista
              </label>
            </div>
          </div>

          {/* 9. BOTÓN */}
          <button type="submit" disabled={isUploading} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', backgroundColor: '#0a3fff', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
            {isUploading ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Cifrando y enviando...</> : '📤 Enviar de forma segura'}
          </button>

        </form>
      </main>

      {/* MODAL DIRECTORIO GLOBAL */}
      {showModalBusquedaGlobal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(19, 25, 36, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '500px', padding: '2rem', backgroundColor: '#1D263C', borderRadius: '16px', border: '1px solid #0a3fff', boxShadow: '0 0 20px rgba(10, 63, 255, 0.5)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '10px', color: 'white' }}>Directorio Global</h2>
            <p style={{ textAlign: 'center', color: '#888', marginBottom: '20px' }}>Busca y agrega usuarios de la plataforma</p>
            
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><FaSearch color="#888" /></span>
              <input type="text" placeholder="Nombre, email o usuario..." value={inputBusquedaGlobal} onChange={(e) => setInputBusquedaGlobal(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', outline: 'none' }} autoFocus />
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              {buscandoGlobal ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Buscando...</div>
              ) : inputBusquedaGlobal.trim().length >= 2 && resultadosFiltradosGlobal.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No se encontraron usuarios</div>
              ) : (
                resultadosFiltradosGlobal.map(usuario => (
                  <div key={usuario.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0a3fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {usuario.profilePictureUrl ? (
                          <img src={usuario.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: 'white', fontWeight: 'bold' }}>{getInitials(usuario.nombre, usuario.apellido)}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ color: 'white' }}>{usuario.nombre} {usuario.apellido || ''}</div>
                        <div style={{ fontSize: '0.7rem', color: '#46A2FD' }}>@{usuario.username}</div>
                        <div style={{ fontSize: '0.65rem', color: '#888' }}>{usuario.email}</div>
                      </div>
                    </div>
                    <button onClick={() => agregarDestinatarioDesdeGlobal(usuario)} style={{ padding: '6px 14px', borderRadius: '6px', backgroundColor: '#0a3fff', border: 'none', color: 'white', cursor: 'pointer' }}>Agregar</button>
                  </div>
                ))
              )}
              {inputBusquedaGlobal.trim().length < 2 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>Escribe al menos 2 caracteres</div>
              )}
            </div>

            <button onClick={() => { setShowModalBusquedaGlobal(false); setInputBusquedaGlobal(''); }} style={{ width: '100%', padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL SELECTOR DE ARCHIVOS (Google Drive Style) */}
      <FileSelectorModal
        isOpen={showFileSelector}
        onClose={() => setShowFileSelector(false)}
        onSelect={(selected) => {
          setArchivosExistentesSeleccionados(selected);
          setShowFileSelector(false);
        }}
        selectedIds={archivosExistentesSeleccionados}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Footer />
    </PrivateLayout>
  );
}