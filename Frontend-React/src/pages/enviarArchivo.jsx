import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import Footer from '../components/Footer';

// Servicios Reales
import profileService from '../services/profileService';
import searchService from '../services/searchService';

// React Icons
import { 
  FaUpload, FaLock, FaShieldAlt, FaGlobe, FaChevronLeft, 
  FaFileAlt, FaUserPlus, FaClock, FaSpinner, FaCloud, 
  FaEye, FaDownload, FaTimes, FaSearch
} from 'react-icons/fa';

export default function EnviarArchivo() {
  const navigate = useNavigate();
  
  // ========== ESTADOS DE ARCHIVOS ==========
  const [origenArchivo, setOrigenArchivo] = useState('NUEVO'); 
  const [files, setFiles] = useState([]); 
  
  // Buscador de archivos en la nube
  const [busquedaArchivos, setBusquedaArchivos] = useState('');
  const [resultadosArchivos, setResultadosArchivos] = useState([]);
  const [buscandoArchivos, setBuscandoArchivos] = useState(false);
  const [archivosExistentesSeleccionados, setArchivosExistentesSeleccionados] = useState([]); // [{id, name}]
  
  // ========== ESTADOS DE DESTINATARIOS ==========
  const [misContactos, setMisContactos] = useState([]);
  const [busquedaContactos, setBusquedaContactos] = useState('');
  const [destinatarios, setDestinatarios] = useState([]); // [{ identifier, type, label }]
  
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

  // 1. CARGAR MIS CONTACTOS AL INICIAR
  useEffect(() => {
    profileService.getMyContacts()
      .then(response => setMisContactos(response.data.contacts || []))
      .catch(err => console.error("Error al cargar mis contactos", err));
  }, []);

  // 2. BÚSQUEDA DE ARCHIVOS EN LA NUBE (Tiempo real)
  useEffect(() => {
    const query = busquedaArchivos.trim();
    if (query.length >= 2) {
      setBuscandoArchivos(true);
      const delay = setTimeout(() => {
        // Buscamos solo en archivos personales
        searchService.searchFiles(query, 'personal', 0, 10)
          .then(response => {
            // Filtramos carpetas, solo queremos archivos
            const soloArchivos = (response.data.results || []).filter(item => !item.isFolder);
            setResultadosArchivos(soloArchivos);
            setBuscandoArchivos(false);
          })
          .catch(err => {
            console.error(err);
            setBuscandoArchivos(false);
          });
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setResultadosArchivos([]);
    }
  }, [busquedaArchivos]);

  // 3. BÚSQUEDA GLOBAL DE USUARIOS (Tiempo real)
  useEffect(() => {
    const query = inputBusquedaGlobal.trim();
    if (query.length >= 2) {
      setBuscandoGlobal(true);
      const delay = setTimeout(() => {
        profileService.searchGlobalUsers(query)
          .then(response => {
            setResultadosFiltradosGlobal(response.data.results || []);
            setBuscandoGlobal(false);
          })
          .catch(err => {
            console.error(err);
            setBuscandoGlobal(false);
          });
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setResultadosFiltradosGlobal([]);
    }
  }, [inputBusquedaGlobal]);

  // Manejo de Destinatarios
  const agregarDestinatario = (usuario) => {
    // Usamos el username como identificador principal si lo tiene, si no el email
    const identifier = usuario.username || usuario.email;
    const type = usuario.username ? 'USERNAME' : 'EMAIL';
    const label = `${usuario.nombre} ${usuario.apellido || ''}`.trim();

    // Validar si ya está agregado
    if (destinatarios.some(d => d.identifier === identifier)) {
      setError(`${label} ya está en la lista de destinatarios.`);
      return;
    }

    setDestinatarios([...destinatarios, { identifier, type, label }]);
    setBusquedaContactos(''); // Limpia la barra de búsqueda local
    setError(null);
  };

  const agregarDestinatarioDesdeGlobal = (usuario) => {
    agregarDestinatario(usuario);
    setShowModalBusquedaGlobal(false);
    setInputBusquedaGlobal('');
  };

  // Filtrado local de contactos
  const contactosFiltrados = misContactos.filter(c => {
    if (!busquedaContactos) return false; // Solo muestra si hay texto
    const nombreCompleto = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
    const alias = (c.username || '').toLowerCase();
    const query = busquedaContactos.toLowerCase();
    return nombreCompleto.includes(query) || alias.includes(query);
  });

  // Funciones de limpieza
  const removerDestinatario = (index) => setDestinatarios(destinatarios.filter((_, i) => i !== index));
  const removerArchivoNuevo = (index) => setFiles(files.filter((_, i) => i !== index));
  const removerArchivoExistente = (id) => setArchivosExistentesSeleccionados(archivosExistentesSeleccionados.filter(a => a.id !== id));

  // Manejo de Archivos Físicos
  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
      setError(null);
    }
  };

  // Enviar Formulario
  // Enviar Formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (origenArchivo === 'NUEVO' && files.length === 0) return setError('Selecciona al menos un archivo para enviar.');
    if (origenArchivo === 'EXISTENTE' && archivosExistentesSeleccionados.length === 0) return setError('Selecciona al menos un archivo de tu nube.');
    if (destinatarios.length === 0) return setError('Agrega al menos un destinatario.');
    if (security === 'PASSWORD') {
      if (!password) return setError('Ingresa la contraseña para proteger el archivo.');
      if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
      if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');
    }

    setIsUploading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // ==========================================
      // CASO A: SUBIR ARCHIVOS NUEVOS
      // ==========================================
      if (origenArchivo === 'NUEVO') {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        
        // Objeto exacto que espera tu FileUploadRequest.java
        const requestData = {
          recipients: destinatarios.map(d => ({ identifier: d.identifier, type: d.type })),
          securityLevel: security,
          accessLevel: accessLevel,
          expirationTime: expirationTime,
          notifyOnview: notifyOnView, // ⚠️ IMPORTANTE: Con 'v' minúscula como en tu DTO
          notifyOnDownload: notifyOnDownload,
          selfDestruct: selfDestruct,
          message: mensaje || null,
          subject: asunto || null,
          sendCopyToMyself: enviarCopia
        };
        
        if (security === 'PASSWORD') {
          requestData.password = password; 
          requestData.confirmPassword = confirmPassword;
        }

        formData.append('request', new Blob([JSON.stringify(requestData)], { type: 'application/json' }));
        
        const response = await fetch('http://localhost:8080/api/files/upload', {
          method: 'POST',
          headers: headers,
          body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error al subir el archivo nuevo');
      } 
      // ==========================================
      // CASO B: COMPARTIR ARCHIVOS EXISTENTES
      // ==========================================
      else {
        headers['Content-Type'] = 'application/json';
        
        // Como ShareExistingFileRequest solo acepta un "String fileId", 
        // enviamos las peticiones en paralelo (Promise.all) por cada archivo seleccionado.
        const peticiones = archivosExistentesSeleccionados.map(async (archivo) => {
          const requestData = {
            fileId: archivo.id, // ⚠️ IMPORTANTE: Singular, como en tu DTO
            recipients: destinatarios.map(d => ({ identifier: d.identifier, type: d.type })),
            securityLevel: security,
            accessLevel: accessLevel,
            expirationTime: expirationTime,
            notifyOnView: notifyOnView, // ⚠️ IMPORTANTE: Con 'V' mayúscula como en tu DTO
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

          const res = await fetch('http://localhost:8080/api/files/share-existing', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData)
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Error al compartir ${archivo.name}`);
          return data;
        });

        // Esperar a que se compartan todos los que eligió de la nube
        await Promise.all(peticiones);
      }
      
      setSuccess(`✅ ¡Éxito! Archivo(s) compartidos correctamente con ${destinatarios.length} destinatario(s).`);
      setTimeout(() => navigate('/dashboard?tab=enviados'), 2000);
      
    } catch (err) {
      console.error('Error al enviar:', err);
      setError(err.message || 'Ocurrió un error al enviar el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const obtenerIniciales = (nombre) => nombre ? nombre.substring(0, 2).toUpperCase() : "U";

  return (
    <PrivateLayout>
      <main style={{ paddingTop: '110px', paddingBottom: '80px', color: 'white', maxWidth: '800px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
        
        <section style={{ marginBottom: '30px', textAlign: 'left' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--color-text-medium)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
            <FaChevronLeft /> Cancelar y volver
          </button>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: 'white' }}>Enviar Archivos</h1>
          <p style={{ color: 'var(--color-text-medium)', marginTop: '4px' }}>
            Comparte de forma segura. Configura permisos de vista/descarga, cifrado AES-256 y expiración automática.
          </p>
        </section>

        {error && <div style={{ padding: '16px', backgroundColor: 'rgba(245, 34, 45, 0.15)', color: '#f5222d', border: '1px solid rgba(245, 34, 45, 0.2)', borderRadius: '10px', marginBottom: '25px', textAlign: 'left' }}><strong>Error:</strong> {error}</div>}
        {success && <div style={{ padding: '16px', backgroundColor: 'rgba(82, 196, 26, 0.15)', color: '#52c41a', border: '1px solid rgba(82, 196, 26, 0.2)', borderRadius: '10px', marginBottom: '25px', textAlign: 'left' }}><strong>{success}</strong></div>}

        <form onSubmit={handleSubmit} style={{ backgroundColor: '#1D263C', padding: '35px', borderRadius: '16px', border: '1px solid #0a3fff', boxShadow: '0 0 20px rgba(10, 63, 255, 0.35)', textAlign: 'left' }}>
          
          {/* =======================================
              1. SELECCIÓN DE ORIGEN Y ARCHIVOS 
              ======================================= */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '10px' }}>
              <button type="button" onClick={() => setOrigenArchivo('NUEVO')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: origenArchivo === 'NUEVO' ? '#0a3fff' : 'transparent', color: 'white', fontWeight: origenArchivo === 'NUEVO' ? 'bold' : 'normal', cursor: 'pointer', transition: '0.3s' }}>
                <FaUpload style={{ marginRight: '8px' }} /> Subir Nuevo Archivo
              </button>
              <button type="button" onClick={() => setOrigenArchivo('EXISTENTE')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: origenArchivo === 'EXISTENTE' ? '#0a3fff' : 'transparent', color: 'white', fontWeight: origenArchivo === 'EXISTENTE' ? 'bold' : 'normal', cursor: 'pointer', transition: '0.3s' }}>
                <FaCloud style={{ marginRight: '8px' }} /> Elegir de mi Nube
              </button>
            </div>

            {origenArchivo === 'NUEVO' ? (
              <div>
                <div style={{ border: files.length > 0 ? '2px dashed #0a3fff' : '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', backgroundColor: files.length > 0 ? 'rgba(10, 63, 255, 0.04)' : 'var(--color-dark)', cursor: 'pointer', transition: 'all 0.3s' }}>
                  <input type="file" onChange={handleFileChange} style={{ display: 'none' }} id="file-upload" multiple />
                  <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: 0 }}>
                    <span style={{ fontSize: '2.8rem', color: '#46A2FD' }}><FaUpload /></span>
                    <span style={{ color: '#46A2FD', fontWeight: 'bold', fontSize: '1.05rem' }}>Selecciona archivos de tu computadora</span>
                  </label>
                </div>
                {files.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px 14px', borderRadius: '8px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FaFileAlt color="#faad14" /><span style={{ fontSize: '0.88rem' }}>{item.name}</span></div>
                    <button type="button" onClick={() => removerArchivoNuevo(index)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}><FaTimes /></button>
                  </div>
                ))}
              </div>
            ) : (
              // BÚSQUEDA REAL DE ARCHIVOS EN LA NUBE
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><FaSearch color="var(--color-text-medium)" /></span>
                  <input 
                    type="text" 
                    placeholder="Busca el nombre de un archivo que ya subiste..." 
                    value={busquedaArchivos}
                    onChange={(e) => setBusquedaArchivos(e.target.value)}
                    style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-dark)', color: 'white', outline: 'none' }}
                  />
                </div>
                
                {/* Dropdown de resultados de archivos */}
                {busquedaArchivos.trim().length >= 2 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--color-dark)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    {buscandoArchivos ? (
                      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-medium)' }}>Buscando archivos...</div>
                    ) : resultadosArchivos.length === 0 ? (
                      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-medium)' }}>No se encontraron archivos cifrados.</div>
                    ) : (
                      resultadosArchivos.map(archivo => (
                        <div 
                          key={archivo.id} 
                          onClick={() => {
                            if (!archivosExistentesSeleccionados.some(a => a.id === archivo.id)) {
                              setArchivosExistentesSeleccionados([...archivosExistentesSeleccionados, { id: archivo.id, name: archivo.name }]);
                            }
                            setBusquedaArchivos('');
                          }}
                          style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <FaFileAlt color="#faad14" />
                          <span style={{ fontSize: '0.9rem' }}>{archivo.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {/* Archivos de la nube seleccionados */}
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {archivosExistentesSeleccionados.map((archivo) => (
                    <div key={archivo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '8px 14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FaFileAlt color="#faad14" /><span style={{ fontSize: '0.88rem' }}>{archivo.name}</span></div>
                      <button type="button" onClick={() => removerArchivoExistente(archivo.id)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}><FaTimes /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* =======================================
              2. DESTINATARIOS (Contactos y Global)
              ======================================= */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Destinatarios *</label>
            
            {/* Chips de Destinatarios */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {destinatarios.map((dest, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(70, 162, 253, 0.15)', border: '1px solid rgba(70, 162, 253, 0.3)', padding: '6px 12px', borderRadius: '20px', color: '#46A2FD', fontSize: '0.85rem' }}>
                  <span>{dest.label}</span><FaTimes style={{ cursor: 'pointer', color: '#ff4d4f' }} onClick={() => removerDestinatario(index)} />
                </div>
              ))}
            </div>
            
            {/* Buscador de Contactos y Botón Global */}
            <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><FaUserPlus color="var(--color-text-medium)" /></span>
                <input 
                  type="text"
                  placeholder="Busca en tus contactos..."
                  value={busquedaContactos}
                  onChange={(e) => setBusquedaContactos(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 12px 12px 40px', outline: 'none' }}
                />
                
                {/* Dropdown Local (Mis Contactos) */}
                {busquedaContactos && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--color-dark)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                    {contactosFiltrados.length === 0 ? (
                      <div style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-medium)', fontSize: '0.85rem' }}>
                        No está en tus contactos. Intenta buscarlo en el Directorio Global.
                      </div>
                    ) : (
                      contactosFiltrados.map(contacto => (
                        <div 
                          key={contacto.contactId} 
                          onClick={() => agregarDestinatario(contacto)}
                          style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem', overflow: 'hidden' }}>
                            {contacto.profilePictureUrl ? <img src={contacto.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : obtenerIniciales(contacto.nombre)}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', color: 'white' }}>{contacto.nombre} {contacto.apellido}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-medium)' }}>{contacto.username || contacto.email}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <button type="button" className="btn btn-secondary" onClick={() => setShowModalBusquedaGlobal(true)}>
                <FaGlobe /> Directorio Global
              </button>
            </div>
          </div>

          {/* 3. ENVIAR COPIA (Solo para archivos nuevos) */}
          {origenArchivo === 'NUEVO' && (
            <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="enviarCopia" checked={enviarCopia} onChange={(e) => setEnviarCopia(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#0a3fff' }} />
              <label htmlFor="enviarCopia" style={{ fontSize: '0.9rem', color: 'white', cursor: 'pointer' }}>Guardar copia en Mis Archivos</label>
            </div>
          )}

          {/* 4. ASUNTO Y MENSAJE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            <div>
              <label style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Asunto (opcional)</label>
              <input type="text" placeholder="Ej. Documentos importantes" value={asunto} onChange={(e) => setAsunto(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}><FaClock style={{color: 'var(--color-accent)'}}/> Expiración del enlace *</label>
              <select value={expirationTime} onChange={(e) => setExpirationTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-dark)', color: 'white', outline: 'none' }}>
                {expirationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Mensaje para el destinatario (opcional)</label>
            <textarea rows="3" placeholder="Añade notas contextuales..." value={mensaje} onChange={(e) => setMensaje(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', resize: 'none', outline: 'none' }} />
          </div>

          {/* 5. PERMISOS DE ACCESO */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Nivel de acceso del destinatario *</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="button" onClick={() => setAccessLevel('READ_ONLY')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: accessLevel === 'READ_ONLY' ? 'rgba(250, 173, 20, 0.15)' : 'var(--color-dark)', color: accessLevel === 'READ_ONLY' ? '#faad14' : 'var(--color-text-medium)', border: accessLevel === 'READ_ONLY' ? '1px solid #faad14' : '1px solid rgba(255,255,255,0.08)' }}><FaEye /> Solo Lectura (Sin descarga)</button>
              <button type="button" onClick={() => setAccessLevel('DOWNLOAD')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: accessLevel === 'DOWNLOAD' ? 'rgba(82, 196, 26, 0.15)' : 'var(--color-dark)', color: accessLevel === 'DOWNLOAD' ? '#52c41a' : 'var(--color-text-medium)', border: accessLevel === 'DOWNLOAD' ? '1px solid #52c41a' : '1px solid rgba(255,255,255,0.08)' }}><FaDownload /> Permitir Descarga</button>
            </div>
          </div>

          {/* 6. SEGURIDAD DE APERTURA */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', marginBottom: '12px', display: 'block' }}>Seguridad del Enlace *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'PUBLIC' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', backgroundColor: security === 'PUBLIC' ? 'rgba(10, 63, 255, 0.05)' : 'transparent' }}>
                <input type="radio" name="security" value="PUBLIC" checked={security === 'PUBLIC'} onChange={() => setSecurity('PUBLIC')} />
                <div><FaGlobe style={{ color: '#46A2FD' }} /> <strong>Público</strong><br /><small>El destinatario solo necesita el enlace para abrirlo</small></div>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'PASSWORD' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', backgroundColor: security === 'PASSWORD' ? 'rgba(10, 63, 255, 0.05)' : 'transparent' }}>
                <input type="radio" name="security" value="PASSWORD" checked={security === 'PASSWORD'} onChange={() => setSecurity('PASSWORD')} />
                <div><FaLock style={{ color: '#faad14' }} /> <strong>Protegido con contraseña</strong><br /><small>Se le pedirá esta contraseña al destinatario cada vez que lo abra</small></div>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'TOKEN_SMS' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', backgroundColor: security === 'TOKEN_SMS' ? 'rgba(10, 63, 255, 0.05)' : 'transparent' }}>
                <input type="radio" name="security" value="TOKEN_SMS" checked={security === 'TOKEN_SMS'} onChange={() => setSecurity('TOKEN_SMS')} />
                <div><FaShieldAlt style={{ color: '#52c41a' }} /> <strong>Archivo Encriptado (Doble Factor)</strong><br /><small>El destinatario recibirá un código a su celular/correo para desbloquearlo</small></div>
              </label>
            </div>
          </div>

          {/* Sub-configuración: Contraseña */}
          {security === 'PASSWORD' && (
            <div style={{ marginBottom: '25px', padding: '16px', backgroundColor: 'rgba(250, 173, 20, 0.05)', borderLeft: '4px solid #faad14', borderRadius: '4px' }}>
              <input 
                type="password" 
                placeholder="Establecer contraseña (mínimo 8 caracteres)" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
              />
              <input 
                type="password" 
                placeholder="Confirmar contraseña" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  backgroundColor: 'var(--color-dark)', 
                  color: 'white', 
                  // 🌟 Borde rojo si no coinciden
                  border: confirmPassword && password !== confirmPassword ? '1px solid #ff4d4f' : '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px' 
                }} 
              />
              
              {/* 🌟 VERIFICADOR VISUAL */}
              {confirmPassword && password !== confirmPassword && (
                <span style={{ color: '#ff4d4f', fontSize: '0.85rem', marginTop: '6px', display: 'block' }}>
                  ❌ Las contraseñas no coinciden
                </span>
              )}
              {confirmPassword && password === confirmPassword && password.length >= 8 && (
                <span style={{ color: '#52c41a', fontSize: '0.85rem', marginTop: '6px', display: 'block' }}>
                  ✅ Las contraseñas coinciden
                </span>
              )}
            </div>
          )}

          {/* 7. COMPORTAMIENTOS Y NOTIFICACIONES */}
          <div style={{ marginBottom: '30px', padding: '15px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '12px' }}>Comportamiento post-envío</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--color-text-medium)' }}>
                <input type="checkbox" checked={notifyOnView} onChange={(e) => setNotifyOnView(e.target.checked)} style={{ width: '16px', height: '16px' }}/> 
                Notificarme por correo cuando el destinatario <strong>abra</strong> el archivo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--color-text-medium)' }}>
                <input type="checkbox" checked={notifyOnDownload} onChange={(e) => setNotifyOnDownload(e.target.checked)} style={{ width: '16px', height: '16px' }}/> 
                Notificarme cuando el destinatario <strong>descargue</strong> el archivo
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--color-text-medium)' }}>
                <input type="checkbox" checked={selfDestruct} onChange={(e) => setSelfDestruct(e.target.checked)} style={{ width: '16px', height: '16px' }}/> 
                <strong>Autodestruir</strong> enlace después de la primera vista
              </label>
            </div>
          </div>

          {/* 8. BOTÓN DE ENVÍO */}
          <button type="submit" disabled={isUploading} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
            {isUploading ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Cifrando y Enviando...</> : '📤 Enviar de Forma Segura'}
          </button>
        </form>
      </main>

      {/* =======================================================
          🌟 MODAL DE DIRECTORIO GLOBAL (Único Modal de la Vista)
          ======================================================= */}
      {showModalBusquedaGlobal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(19, 25, 36, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)'
        }}>
          <div className="auth-card" style={{ width: '480px', padding: '2.5rem 2rem', backgroundColor: '#1D263C', borderRadius: '15px', border: '1px solid #0a3fff', boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.5)', color: 'white' }}>
            <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontWeight: '700' }}>Directorio Global</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-medium)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Busca y añade a cualquier usuario de la plataforma a tu envío.
            </p>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}><FaSearch /></span>
                <input 
                  type="text" className="form-control-modern" placeholder="Escribe un nombre o correo..." 
                  style={{ width: '100%', paddingLeft: '45px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={inputBusquedaGlobal} onChange={(e) => setInputBusquedaGlobal(e.target.value)}
                />
              </div>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '20px', textAlign: 'left' }}>
              {buscandoGlobal && <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--color-text-medium)' }}>Buscando en el servidor...</div>}
              
              {!buscandoGlobal && resultadosFiltradosGlobal.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resultadosFiltradosGlobal.map(usuario => (
                    <div key={usuario.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--color-dark)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', overflow: 'hidden' }}>
                          {usuario.profilePictureUrl ? <img src={usuario.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : obtenerIniciales(usuario.nombre)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${usuario.nombre} ${usuario.apellido || ''}`}</h4>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-medium)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario.email}</p>
                        </div>
                      </div>
                      <button onClick={() => agregarDestinatarioDesdeGlobal(usuario)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}>＋</button>
                    </div>
                  ))}
                </div>
              )}

              {!buscandoGlobal && inputBusquedaGlobal.trim().length >= 2 && resultadosFiltradosGlobal.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-medium)', fontSize: '0.9rem' }}>No se encontraron usuarios que coincidan.</div>
              )}
              {inputBusquedaGlobal.trim().length < 2 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-medium)', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>Escribe al menos 2 letras para consultar el directorio corporativo.</div>
              )}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowModalBusquedaGlobal(false); setInputBusquedaGlobal(''); }} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>Cerrar Directorio</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <Footer />
    </PrivateLayout>
  );
}