import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'
import profileService from '../services/profileService';

export default function ContactosUsuario() {
  const navigate = useNavigate();

  // 1. ESTADOS
  const [misContactos, setMisContactos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados de Búsqueda
  const [busquedaMisContactos, setBusquedaMisContactos] = useState(''); 
  const [inputBusquedaGlobal, setInputBusquedaGlobal] = useState(''); 
  const [showModalBusqueda, setShowModalBusqueda] = useState(false);
  
  // Resultados del Directorio Global traídos del Backend
  const [resultadosFiltradosGlobal, setResultadosFiltradosGlobal] = useState([]);
  const [buscandoGlobal, setBuscandoGlobal] = useState(false);

  // 2. CARGAR MIS CONTACTOS AL INICIAR
  const cargarMisContactos = () => {
    setCargando(true);
    profileService.getMyContacts()
      .then(response => {
        const payload = response?.contacts ?? response?.data ?? response;
        const contacts = Array.isArray(payload)
          ? payload
          : payload?.contacts || [];
        setMisContactos(contacts);
        setCargando(false);
      })
      .catch(error => {
        console.error("Error al cargar contactos:", error);
        setCargando(false);
      });
  };

  useEffect(() => {
    cargarMisContactos();
  }, []);

  // 3. FILTRADO LOCAL (Barra principal: filtra los amigos que YA agregué)
  const contactosFiltrados = misContactos.filter(c => {
    const nombreCompleto = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
    const alias = (c.username || '').toLowerCase();
    const query = busquedaMisContactos.toLowerCase();
    return nombreCompleto.includes(query) || alias.includes(query);
  });

  // 4. BÚSQUEDA EN TIEMPO REAL EN EL BACKEND (Modal Global)
  useEffect(() => {
    const query = inputBusquedaGlobal.trim();
    
    if (query.length >= 2) {
      setBuscandoGlobal(true);
      
      // Usamos un "Timeout" (Debounce) de 500ms para no saturar el backend con cada tecla pulsada
      const delayBusqueda = setTimeout(() => {
        profileService.searchGlobalUsers(query)
          .then(response => {
            const data = response?.data ?? response;
            const usuarios = Array.isArray(data?.results)
              ? data.results
              : Array.isArray(data)
                ? data
                : [];
            const usuariosEncontrados = usuarios.filter(u => !u.isContact);
            setResultadosFiltradosGlobal(usuariosEncontrados);
            setBuscandoGlobal(false);
          })
          .catch(error => {
            console.error("Error en búsqueda global:", error);
            setBuscandoGlobal(false);
          });
      }, 500);

      return () => clearTimeout(delayBusqueda); // Limpiamos el timeout si el usuario sigue escribiendo
    } else {
      setResultadosFiltradosGlobal([]);
    }
  }, [inputBusquedaGlobal]);

  // 5. AGREGAR UN CONTACTO
  const handleAgregarContacto = (usuario) => {
    profileService.addContact(usuario.id)
      .then(response => {
        alert(`@${usuario.username || usuario.nombre} se ha enlazado exitosamente a tu red segura.`);
        setInputBusquedaGlobal('');
        setShowModalBusqueda(false);
        cargarMisContactos(); // Recargamos la lista para que aparezca
      })
      .catch(error => {
        alert(error.response?.data?.error || "Ocurrió un error al agregar el contacto.");
      });
  };

  // 6. ELIMINAR UN CONTACTO
  const eliminarAmigo = (contacto) => {
    if(window.confirm(`¿Estás seguro de eliminar a ${contacto.nombre} de tu lista de contactos?`)) {
      // Usamos el contactId que nos manda el backend
      profileService.removeContact(contacto.contactId)
        .then(() => {
          // Lo quitamos de la vista inmediatamente
          setMisContactos(misContactos.filter(c => c.contactId !== contacto.contactId));
        })
        .catch(error => {
          alert("Error al intentar eliminar el contacto.");
        });
    }
  };

  // Función auxiliar para extraer iniciales de forma segura
  const obtenerIniciales = (nombre) => {
    if (!nombre) return "U";
    return nombre.substring(0, 2).toUpperCase();
  };

  return (
    <PrivateLayout>
      <main className="contacts-page section" style={{ paddingBottom: '60px' }}>
        <div className="container">
          <br />
          <header className="section-heading">
            <h1 style={{ color: 'white', fontWeight: '700' }}>Contactos y Amigos</h1>
            <p style={{ color: 'var(--color-text-medium)' }}>Busca usuarios registrados en la plataforma para realizar envíos cifrados directos.</p>
          </header>

          {/* Barra de Búsqueda de mis contactos agregados */}
          <section className="search-section" style={{ marginTop: '2rem', marginBottom: '3rem', width: '100%' }}>
            <div className="auth-card" style={{ width: '100%', padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#1D263C', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ flex: '1 1 82%', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Buscar en mis contactos frecuentes..." 
                  value={busquedaMisContactos}
                  onChange={(e) => setBusquedaMisContactos(e.target.value)}
                  style={{ display: 'block', width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-dark)', color: 'white', outline: 'none' }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowModalBusqueda(true)}
                style={{ flex: '0 0 18%', minWidth: '90px', padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                + Directorio Global
              </button>
            </div>
          </section>

          {/* Grid de tarjetas de mis contactos */}
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-medium)' }}>Cargando contactos...</div>
          ) : (
            <>
              <div className="contacts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {contactosFiltrados.map((contacto) => (
                  <article key={contacto.contactId} className="benefit-box shadow-sm card-glow-plop" style={{ textAlign: 'left', padding: '1.5rem', border: '1px solid rgba(10, 63, 255, 0.4)', borderRadius: '12px', backgroundColor: '#1D263C', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        
                        <div style={{ 
                          width: '52px', height: '52px', backgroundColor: 'var(--color-accent)', 
                          color: 'var(--color-dark)', borderRadius: '50%', display: 'flex', 
                          alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem',
                          overflow: 'hidden'
                        }}>
                          {contacto.profilePictureUrl ? (
                            <img src={contacto.profilePictureUrl} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            obtenerIniciales(contacto.nombre)
                          )}
                        </div>

                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {contacto.username || 'Sin alias'}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-medium)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {`${contacto.nombre} ${contacto.apellido || ''}`}
                          </p>
                        </div>
                      </div>

                      <div className="contact-meta" style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                        <p style={{ margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <strong>Correo:</strong> {contacto.email}
                        </p>
                        <p style={{ margin: '4px 0' }}>
                          <strong>Teléfono:</strong> {contacto.phone || 'No registrado'}
                        </p>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem', backgroundColor: '#0a3fff', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
                        onClick={() => navigate(`/enviar-archivo?to=${contacto.userId}`)}
                      >
                        Enviar Archivo
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.6rem', border: '1px solid rgba(255,255,255,0.1)' }}
                        title="Quitar de mi lista"
                        onClick={() => eliminarAmigo(contacto)}
                      >
                        🗑️
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {contactosFiltrados.length === 0 && !cargando && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-medium)' }}>
                  No se encontraron contactos en tu red personal.
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* =======================================================
          MODAL DE BÚSQUEDA GLOBAL CON FOTOS DE PERFIL
          ======================================================= */}
      {showModalBusqueda && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(19, 25, 36, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="auth-card" 
            style={{ 
              width: '480px', 
              padding: '2.5rem 2rem', 
              backgroundColor: '#1D263C', 
              borderRadius: '15px', 
              border: '1px solid #0a3fff', 
              boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.5)',
              color: 'white'
            }}
          >
            <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontWeight: '700' }}>Directorio Global</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-medium)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Busca en tiempo real a cualquier miembro por su nombre o correo.
            </p>
            
            {/* Input de Búsqueda Interactiva */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                <input 
                  type="text" 
                  className="form-control-modern" 
                  placeholder="Escribe un nombre o correo..." 
                  required
                  style={{ width: '100%', paddingLeft: '45px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={inputBusquedaGlobal}
                  onChange={(e) => setInputBusquedaGlobal(e.target.value)}
                />
              </div>
            </div>

            {/* CAJA DINÁMICA DE RESULTADOS */}
            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '20px', textAlign: 'left' }}>
              
              {buscandoGlobal && (
                <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--color-text-medium)' }}>
                  Buscando en el servidor...
                </div>
              )}

              {/* Caso A: Se encontraron usuarios */}
              {!buscandoGlobal && resultadosFiltradosGlobal.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resultadosFiltradosGlobal.map(usuario => (
                    <div 
                      key={usuario.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--color-dark)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', overflow: 'hidden' }}>
                          {usuario.profilePictureUrl ? (
                            <img src={usuario.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            obtenerIniciales(usuario.nombre)
                          )}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {`${usuario.nombre} ${usuario.apellido || ''}`}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-medium)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {usuario.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAgregarContacto(usuario)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}
                      >
                        ＋
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Caso B: El usuario tecleó pero no hay coincidencias */}
              {!buscandoGlobal && inputBusquedaGlobal.trim().length >= 2 && resultadosFiltradosGlobal.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-medium)', fontSize: '0.9rem' }}>
                  No se encontraron usuarios que coincidan.
                </div>
              )}

              {inputBusquedaGlobal.trim().length < 2 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-medium)', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  Escribe al menos 2 letras para buscar
                </div>
              )}
            </div>

            {/* Botón de salida */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => { setShowModalBusqueda(false); setInputBusquedaGlobal(''); }} 
                style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Cerrar Directorio
              </button>
            </div>
            
          </div>
        </div>
      )}
    </PrivateLayout>
  )
}