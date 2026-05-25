import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
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
  
  // Resultados del Directorio Global
  const [resultadosFiltradosGlobal, setResultadosFiltradosGlobal] = useState([]);
  const [buscandoGlobal, setBuscandoGlobal] = useState(false);

  // 2. CARGAR MIS CONTACTOS AL INICIAR
  const cargarMisContactos = async () => {
    setCargando(true);
    try {
      const response = await profileService.getMyContacts();
      // El backend devuelve { contacts: [...] }
      setMisContactos(response.contacts || []);
    } catch (error) {
      console.error("Error al cargar contactos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMisContactos();
  }, []);

  // 3. FILTRADO LOCAL (mis contactos)
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
      
      const delayBusqueda = setTimeout(async () => {
        try {
          const response = await profileService.searchGlobalUsers(query);
          // El backend devuelve { results: [...] }
          const usuariosEncontrados = (response.results || []).filter(u => !u.isContact);
          setResultadosFiltradosGlobal(usuariosEncontrados);
        } catch (error) {
          console.error("Error en búsqueda global:", error);
        } finally {
          setBuscandoGlobal(false);
        }
      }, 500);

      return () => clearTimeout(delayBusqueda);
    } else {
      setResultadosFiltradosGlobal([]);
    }
  }, [inputBusquedaGlobal]);

  // 5. AGREGAR UN CONTACTO
  const handleAgregarContacto = async (usuario) => {
    try {
      await profileService.addContact(usuario.id);
      alert(`@${usuario.username || usuario.nombre} se ha agregado a tu red.`);
      setInputBusquedaGlobal('');
      setShowModalBusqueda(false);
      cargarMisContactos(); // Recargar lista
    } catch (error) {
      alert(error.response?.data?.error || "Error al agregar el contacto.");
    }
  };

  // 6. ELIMINAR UN CONTACTO
  const eliminarAmigo = async (contacto) => {
    if (window.confirm(`¿Eliminar a ${contacto.nombre} de tus contactos?`)) {
      try {
        await profileService.removeContact(contacto.contactId);
        setMisContactos(misContactos.filter(c => c.contactId !== contacto.contactId));
      } catch (error) {
        alert("Error al eliminar el contacto.");
      }
    }
  };

  // Función para obtener iniciales
  const obtenerIniciales = (nombre, apellido) => {
    if (!nombre) return "U";
    const primera = nombre.charAt(0).toUpperCase();
    const segunda = apellido ? apellido.charAt(0).toUpperCase() : '';
    return `${primera}${segunda}`;
  };

  // Función para obtener la URL de la foto (con manejo de error)
  const getFotoUrl = (contacto) => {
    if (contacto.profilePictureUrl) {
      return contacto.profilePictureUrl;
    }
    return null;
  };

  return (
    <PrivateLayout>
      <main className="contacts-page section" style={{ paddingTop: '110px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
        
        <header className="section-heading" style={{ marginBottom: '30px' }}>
          <h1 style={{ color: 'white', fontWeight: '700', fontSize: '2rem' }}>Contactos y Amigos</h1>
          <p style={{ color: 'var(--color-text-medium)' }}>Busca usuarios registrados en la plataforma para realizar envíos cifrados directos.</p>
        </header>

        {/* Barra de Búsqueda de mis contactos */}
        <section className="search-section" style={{ marginTop: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#1D263C', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Buscar en mis contactos..." 
                value={busquedaMisContactos}
                onChange={(e) => setBusquedaMisContactos(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-dark)', color: 'white', outline: 'none' }}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowModalBusqueda(true)} style={{ padding: '10px 20px', backgroundColor: '#0a3fff', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
              + Directorio Global
            </button>
          </div>
        </section>

        {/* Grid de mis contactos */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-medium)' }}>Cargando contactos...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {contactosFiltrados.map((contacto) => {
                const fotoUrl = getFotoUrl(contacto);
                return (
                  <article key={contacto.contactId} style={{ 
                    textAlign: 'left', padding: '1.5rem', 
                    border: '1px solid rgba(10, 63, 255, 0.4)', 
                    borderRadius: '12px', backgroundColor: '#1D263C',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        
                        {/* Avatar con foto de perfil */}
                        <div style={{ 
                          width: '52px', height: '52px', 
                          backgroundColor: fotoUrl ? 'transparent' : '#0a3fff', 
                          borderRadius: '50%', display: 'flex', 
                          alignItems: 'center', justifyContent: 'center', 
                          fontWeight: 'bold', fontSize: '1.1rem', color: 'white',
                          overflow: 'hidden'
                        }}>
                          {fotoUrl ? (
                            <img 
                              src={fotoUrl} 
                              alt="Perfil" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerText = obtenerIniciales(contacto.nombre, contacto.apellido);
                                e.target.parentElement.style.backgroundColor = '#0a3fff';
                              }}
                            />
                          ) : (
                            obtenerIniciales(contacto.nombre, contacto.apellido)
                          )}
                        </div>

                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {contacto.username || 'Sin alias'}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-medium)' }}>
                            {`${contacto.nombre} ${contacto.apellido || ''}`}
                          </p>
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
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
                        style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', color: '#ff4d4f', cursor: 'pointer' }}
                        title="Quitar de mi lista"
                        onClick={() => eliminarAmigo(contacto)}
                      >
                        🗑️
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {contactosFiltrados.length === 0 && !cargando && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-medium)' }}>
                No se encontraron contactos en tu red personal.
              </div>
            )}
          </>
        )}
      </main>

      {/* =======================================================
          MODAL DE BÚSQUEDA GLOBAL CON FOTOS DE PERFIL
          ======================================================= */}
      {showModalBusqueda && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(19, 25, 36, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            width: '500px', 
            padding: '2rem', 
            backgroundColor: '#1D263C', 
            borderRadius: '16px', 
            border: '1px solid #0a3fff', 
            boxShadow: '0 0 20px rgba(10, 63, 255, 0.5)',
            color: 'white'
          }}>
            <h2 style={{ marginBottom: '0.5rem', textAlign: 'center', fontWeight: '700' }}>Directorio Global</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-medium)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Busca usuarios por nombre, correo o usuario
            </p>
            
            {/* Input de Búsqueda */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Escribe un nombre o correo..." 
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 40px', 
                    backgroundColor: 'var(--color-dark)', 
                    color: 'white', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '10px',
                    outline: 'none'
                  }}
                  value={inputBusquedaGlobal}
                  onChange={(e) => setInputBusquedaGlobal(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* Resultados de búsqueda */}
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', textAlign: 'left' }}>
              
              {buscandoGlobal && (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-medium)' }}>
                  Buscando...
                </div>
              )}

              {!buscandoGlobal && resultadosFiltradosGlobal.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resultadosFiltradosGlobal.map(usuario => {
                    const fotoUrl = usuario.profilePictureUrl;
                    return (
                      <div 
                        key={usuario.id}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '12px', 
                          backgroundColor: 'var(--color-dark)', 
                          borderRadius: '10px', 
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                          {/* Avatar con foto de perfil */}
                          <div style={{ 
                            width: '44px', height: '44px', 
                            backgroundColor: fotoUrl ? 'transparent' : '#0a3fff', 
                            borderRadius: '50%', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', 
                            fontWeight: 'bold', fontSize: '0.9rem', color: 'white',
                            overflow: 'hidden', flexShrink: 0
                          }}>
                            {fotoUrl ? (
                              <img 
                                src={fotoUrl} 
                                alt="Perfil" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerText = obtenerIniciales(usuario.nombre, usuario.apellido);
                                  e.target.parentElement.style.backgroundColor = '#0a3fff';
                                }}
                              />
                            ) : (
                              obtenerIniciales(usuario.nombre, usuario.apellido)
                            )}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {`${usuario.nombre} ${usuario.apellido || ''}`}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-medium)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {usuario.email}
                            </p>
                            {usuario.username && (
                              <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#46A2FD' }}>
                                @{usuario.username}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAgregarContacto(usuario)}
                          style={{ 
                            padding: '6px 14px', 
                            borderRadius: '6px', 
                            border: 'none', 
                            backgroundColor: '#0a3fff', 
                            color: 'white', 
                            fontSize: '0.8rem', 
                            fontWeight: 'bold', 
                            cursor: 'pointer', 
                            flexShrink: 0 
                          }}
                        >
                          ＋ Agregar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {!buscandoGlobal && inputBusquedaGlobal.trim().length >= 2 && resultadosFiltradosGlobal.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-medium)', fontSize: '0.9rem' }}>
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
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => { 
                setShowModalBusqueda(false); 
                setInputBusquedaGlobal(''); 
              }} 
              style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                border: 'none', 
                borderRadius: '8px', 
                color: 'white', 
                cursor: 'pointer' 
              }}
            >
              Cerrar Directorio
            </button>
          </div>
        </div>
      )}
    </PrivateLayout>
  );
}