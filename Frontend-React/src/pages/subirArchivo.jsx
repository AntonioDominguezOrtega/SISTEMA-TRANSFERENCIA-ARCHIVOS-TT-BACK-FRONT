import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import Footer from '../components/Footer';
import storageService from '../services/storageService';

// React Icons
import { 
  FaUpload, FaLock, FaShieldAlt, FaGlobe, FaChevronLeft, 
  FaFileAlt, FaKey, FaPhoneAlt, FaEye, FaDownload,
  FaFolderOpen, FaSpinner
} from 'react-icons/fa';

export default function SubirArchivo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const carpetaInicial = searchParams.get('carpeta') || null;

  // ========== ESTADOS DEL FORMULARIO ==========
  const [file, setFile] = useState(null);
  const [folderId, setFolderId] = useState(carpetaInicial); // Puede ser null o string
  const [security, setSecurity] = useState('PUBLIC');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [useAccountPhone, setUseAccountPhone] = useState(true);
  const [customPhoneNumber, setCustomPhoneNumber] = useState('');
  const [accessLevel, setAccessLevel] = useState('DOWNLOAD');
  
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  const [folders, setFolders] = useState([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Cargar carpetas del usuario
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setIsLoadingFolders(true);
        const result = await storageService.getFolderContents(null);
        const contents = result.contents || [];
        
        // Filtrar solo carpetas y excluir "Mi unidad"
        const carpetas = contents.filter(item => 
          item.isFolder === true && 
          item.name !== 'Mi unidad' && 
          item.name !== 'Mi Unidad'
        );
        
        setFolders([
          { id: null, name: '📁 Mi unidad (Raíz)' },
          ...carpetas.map(f => ({ id: f.id, name: `📁 ${f.name}` }))
        ]);
      } catch (err) {
        console.error('Error cargando carpetas:', err);
        setError('No se pudo cargar la lista de carpetas.');
      } finally {
        setIsLoadingFolders(false);
      }
    };
    loadFolders();
  }, []);

  const validateForm = () => {
    if (!file) {
      setError('Por favor, selecciona un archivo para subir.');
      return false;
    }
    
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('El archivo no puede superar los 50MB.');
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
      console.log('📁 Subiendo a carpeta ID:', folderId); // Debug
      
      const result = await storageService.uploadPersonalFile(file, {
        parentFolderId: folderId, // Puede ser null (raíz) o el ID de la carpeta
        securityLevel: security,
        password: password,
        confirmPassword: confirmPassword,
        useAccountPhone: useAccountPhone,
        customPhoneNumber: customPhoneNumber
      });

      console.log('✅ Respuesta del backend:', result);
      
      setSuccess(`✅ ¡Éxito! El archivo "${file.name}" se ha subido correctamente.`);
      
      setTimeout(() => {
        if (folderId) {
          navigate(`/dashboard?carpeta=${folderId}`);
        } else {
          navigate('/dashboard?tab=miunidad');
        }
      }, 2000);
      
      setFile(null);
      setPassword('');
      setConfirmPassword('');
      setCustomPhoneNumber('');
      setAsunto('');
      setMensaje('');
      
    } catch (err) {
      console.error('❌ Error al subir archivo:', err);
      setError(err.response?.data?.error || err.message || 'Ocurrió un error al subir el archivo.');
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
          <h1 style={{ fontSize: '2.2rem', fontWeight: '700', color: 'white' }}>Subir Archivo</h1>
          <p style={{ color: 'var(--color-text-medium)', marginTop: '4px' }}>
            Carga tus documentos en la nube de Azure configurando las políticas criptográficas de acceso.
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
          
          {/* 1. SELECCIÓN DE ARCHIVO */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Archivo a subir *</label>
            <div style={{ 
              border: file ? '2px dashed #0a3fff' : '2px dashed rgba(255,255,255,0.15)', 
              borderRadius: '12px', 
              padding: '40px 20px', 
              textAlign: 'center', 
              backgroundColor: file ? 'rgba(10, 63, 255, 0.04)' : 'var(--color-dark)', 
              cursor: 'pointer', 
              transition: 'all 0.3s'
            }}>
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])} 
                style={{ display: 'none' }} 
                id="file-upload" 
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', margin: 0 }}>
                <span style={{ fontSize: '2.8rem', color: file ? '#46A2FD' : 'var(--color-text-medium)' }}>
                  {file ? <FaFileAlt /> : <FaUpload />}
                </span>
                <span style={{ color: '#46A2FD', fontWeight: 'bold', fontSize: '1.05rem' }}>
                  {file ? file.name : 'Haz clic para seleccionar archivo'}
                </span>
                <span style={{ color: 'var(--color-text-medium)', fontSize: '0.85rem' }}>
                  {file ? `Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Soporta PDF, DOCX, JPG, PNG, ZIP, etc. (Máx 50MB)'}
                </span>
              </label>
            </div>
          </div>

          {/* 2. DESTINO DEL ARCHIVO (CARPETA) - CORREGIDO */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
              <FaFolderOpen style={{ marginRight: '8px' }} /> Carpeta destino
            </label>
            <select 
              value={folderId === null ? '' : folderId}
              onChange={(e) => {
                const value = e.target.value;
                setFolderId(value === '' ? null : value);
              }}
              disabled={isLoadingFolders}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)', 
                backgroundColor: 'var(--color-dark)', 
                color: 'white', 
                fontSize: '1rem', 
                outline: 'none' 
              }}
            >
              {isLoadingFolders ? (
                <option>Cargando carpetas...</option>
              ) : (
                folders.map(f => (
                  <option key={f.id === null ? 'root' : f.id} value={f.id === null ? '' : f.id}>
                    {f.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Resto del formulario igual... */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Asunto (opcional)</label>
            <input type="text" placeholder="Ej. Evidencia de Cifrado" value={asunto} onChange={(e) => setAsunto(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '500', display: 'block', marginBottom: '8px' }}>Mensaje descriptivo (opcional)</label>
            <textarea rows="3" placeholder="Añade notas contextuales sobre este documento..." value={mensaje} onChange={(e) => setMensaje(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', fontSize: '1rem', resize: 'none', outline: 'none' }} />
          </div>

          {/* NIVEL DE SEGURIDAD */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ color: 'white', fontWeight: '600', marginBottom: '12px', display: 'block' }}>Nivel de seguridad *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'PUBLIC' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', backgroundColor: security === 'PUBLIC' ? 'rgba(10, 63, 255, 0.05)' : 'transparent' }}>
                <input type="radio" name="security" value="PUBLIC" checked={security === 'PUBLIC'} onChange={() => setSecurity('PUBLIC')} style={{ width: '18px', height: '18px', accentColor: '#0a3fff' }} />
                <div><FaGlobe style={{ color: '#46A2FD' }} /> <strong>Público</strong><br /><small>Cualquier persona autorizada con el enlace puede acceder</small></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'PASSWORD' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', backgroundColor: security === 'PASSWORD' ? 'rgba(10, 63, 255, 0.05)' : 'transparent' }}>
                <input type="radio" name="security" value="PASSWORD" checked={security === 'PASSWORD'} onChange={() => setSecurity('PASSWORD')} style={{ width: '18px', height: '18px', accentColor: '#0a3fff' }} />
                <div><FaLock style={{ color: '#faad14' }} /> <strong>Protegido con contraseña</strong><br /><small>Requiere contraseña para acceder</small></div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', border: security === 'TOKEN_SMS' ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'pointer', backgroundColor: security === 'TOKEN_SMS' ? 'rgba(10, 63, 255, 0.05)' : 'transparent' }}>
                <input type="radio" name="security" value="TOKEN_SMS" checked={security === 'TOKEN_SMS'} onChange={() => setSecurity('TOKEN_SMS')} style={{ width: '18px', height: '18px', accentColor: '#0a3fff' }} />
                <div><FaShieldAlt style={{ color: '#52c41a' }} /> <strong>Verificación por Correo</strong><br /></div>
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

          {/* NIVEL DE ACCESO */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ color: 'white', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Nivel de acceso *</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button type="button" onClick={() => setAccessLevel('DOWNLOAD')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: accessLevel === 'DOWNLOAD' ? 'rgba(82, 196, 26, 0.15)' : 'var(--color-dark)', color: accessLevel === 'DOWNLOAD' ? '#52c41a' : 'var(--color-text-medium)', border: accessLevel === 'DOWNLOAD' ? '1px solid #52c41a' : '1px solid rgba(255,255,255,0.08)' }}>
                <FaDownload /> Permitir Descarga
              </button>
              <button type="button" onClick={() => setAccessLevel('READ_ONLY')} style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: accessLevel === 'READ_ONLY' ? 'rgba(250, 173, 20, 0.15)' : 'var(--color-dark)', color: accessLevel === 'READ_ONLY' ? '#faad14' : 'var(--color-text-medium)', border: accessLevel === 'READ_ONLY' ? '1px solid #faad14' : '1px solid rgba(255,255,255,0.08)' }}>
                <FaEye /> Solo Vista
              </button>
            </div>
          </div>

          {/* BOTÓN */}
          <button type="submit" disabled={isUploading || !file} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.05rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '700', opacity: (isUploading || !file) ? 0.7 : 1, cursor: (isUploading || !file) ? 'not-allowed' : 'pointer' }}>
            {isUploading ? <><FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> Subiendo y cifrando archivo...</> : <><FaUpload /> Subir y Aplicar Cifrado</>}
          </button>

        </form>
      </main>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </PrivateLayout>
  );
}