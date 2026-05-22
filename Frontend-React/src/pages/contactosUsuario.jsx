import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'

// 🌟 BASE DE DATOS LOCAL SIMULADA (Usuarios globales de la plataforma Capara)
const baseUsuariosPlataforma = [
  { id: 'u-1', nombre: 'José Manuel', apellidos: 'Pérez Gómez', email: 'jose.perez@escom.ipn.mx', tel: '5511112222', iniciales: 'JP', alias: 'Jose Pérez' },
  { id: 'u-2', nombre: 'José Antonio', apellidos: 'Rodríguez Silva', email: 'jantonio.silva@escom.ipn.mx', tel: '5533334444', iniciales: 'JR', alias: 'Toño Silva' },
  { id: 'u-3', nombre: 'María José', apellidos: 'López Hernández', email: 'mariajose@gmail.com', tel: '5555556666', iniciales: 'ML', alias: 'Majo López' },
  { id: 'u-4', nombre: 'Héctor Alejandro', apellidos: 'Hernández Aranda', email: 'hector.hernandez@escom.ipn.mx', tel: '5577778888', iniciales: 'HH', alias: 'Héctor' },
  { id: 'u-5', nombre: 'José de Jesús', apellidos: 'Martínez Ruíz', email: 'chuy.martinez@gmail.com', tel: '5599990000', iniciales: 'JJ', alias: 'Chuy' },
];

export default function ContactosUsuario() {
  const navigate = useNavigate();

  // 1. ESTADOS: Tus amigos/contactos ya agregados a tu red personal
  const [misContactos, setMisContactos] = useState([
    { id: 'u-7', nombre: 'Ambar Stephania García Gaspar', email: 'ambar.garcia@ejemplo.com', tel: '5512345678', iniciales: 'AG', alias: 'Ambar' },
    { id: 'u-6', nombre: 'Antonio de Jesús Domínguez Ortega', email: 'antonio.dominguez@ejemplo.com', tel: '5587654321', iniciales: 'AD', alias: 'Toño' },
  ]);

  const [busquedaMisContactos, setBusquedaMisContactos] = useState(''); // Barra exterior (Filtra mis amigos)
  const [inputBusquedaGlobal, setInputBusquedaGlobal] = useState(''); // Input dentro del Modal Flotante
  const [showModalBusqueda, setShowModalBusqueda] = useState(false);

  // 2. LÓGICA DE FILTRADO (Barra principal: filtra los amigos que YA agregué)
  const contactosFiltrados = misContactos.filter(c => 
    c.nombre.toLowerCase().includes(busquedaMisContactos.toLowerCase()) ||
    c.alias.toLowerCase().includes(busquedaMisContactos.toLowerCase())
  );

  // 3. 🌟 FILTRADO EN TIEMPO REAL DENTRO DEL MODAL (Evita el error de useEffect y ESLint)
  const busquedaLimpiaGlobal = inputBusquedaGlobal.trim().toLowerCase();
  
  const resultadosFiltradosGlobal = busquedaLimpiaGlobal.length >= 2
    ? baseUsuariosPlataforma.filter(usuario => 
        (usuario.nombre.toLowerCase().includes(busquedaLimpiaGlobal) ||
        usuario.apellidos.toLowerCase().includes(busquedaLimpiaGlobal) ||
        usuario.email.toLowerCase().includes(busquedaLimpiaGlobal)) &&
        !misContactos.some(existente => existente.id === usuario.id) // Oculta a los que ya son amigos
      )
    : [];

  // 4. FUNCIÓN PARA AGREGAR DESDE EL MODAL FLOTANTE
  const handleAgregarContacto = (usuario) => {
    setMisContactos([...misContactos, usuario]);
    setInputBusquedaGlobal('');
    setShowModalBusqueda(false);
    alert(`@${usuario.alias} se ha enlazado exitosamente a tu red segura.`);
  };

  const eliminarAmigo = (id) => {
    if(window.confirm('¿Eliminar de tu lista de contactos frecuentes?')) {
      setMisContactos(misContactos.filter(c => c.id !== id));
    }
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
          <section className="search-section" style={{ marginTop: '2rem', marginBottom: '3rem' }}>
            <div className="auth-card" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: '#1D263C', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                <input 
                  type="text" 
                  placeholder="Buscar en mis contactos frecuentes..." 
                  value={busquedaMisContactos}
                  onChange={(e) => setBusquedaMisContactos(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--color-dark)', color: 'white', outline: 'none' }}
                />
              </div>
              <button className="btn btn-primary" onClick={() => setShowModalBusqueda(true)}>
                + Directorio Global
              </button>
            </div>
          </section>

          {/* Grid de tarjetas de mis contactos */}
          <div className="contacts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {contactosFiltrados.map((contacto) => (
              <article key={contacto.id} className="benefit-box shadow-sm card-glow-plop" style={{ textAlign: 'left', padding: '1.5rem', border: '1px solid rgba(10, 63, 255, 0.4)', borderRadius: '12px', backgroundColor: '#1D263C', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '52px', height: '52px', backgroundColor: 'var(--color-accent)', 
                      color: 'var(--color-dark)', borderRadius: '50%', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem'
                    }}>
                      {contacto.iniciales}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: '600' }}>{contacto.alias}</h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-medium)' }}>{contacto.nombre}</p>
                    </div>
                  </div>

                  <div className="contact-meta" style={{ marginTop: '1.2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                    <p style={{ margin: '4px 0' }}><strong>Correo:</strong> {contacto.email}</p>
                    <p style={{ margin: '4px 0' }}><strong>Teléfono:</strong> {contacto.tel}</p>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}
                    onClick={() => navigate(`/subir-archivo?to=${contacto.id}`)}
                  >
                    Enviar Archivo
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.6rem', border: '1px solid rgba(255,255,255,0.1)' }}
                    title="Quitar de mi lista"
                    onClick={() => eliminarAmigo(contacto.id)}
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>

          {contactosFiltrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-medium)' }}>
              No se encontraron contactos en tu red personal.
            </div>
          )}
        </div>
      </main>

      {/* =======================================================
          🌟 MODAL FLOTANTE INTERACTIVO CON BÚSQUEDA EN VIVO
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
                  placeholder="Escribe un nombre (ej. jose)..." 
                  required
                  style={{ width: '100%', paddingLeft: '45px', backgroundColor: 'var(--color-dark)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={inputBusquedaGlobal}
                  onChange={(e) => setInputBusquedaGlobal(e.target.value)}
                />
              </div>
            </div>

            {/* CAJA DINÁMICA DE RESULTADOS DENTRO DEL FLOTANTE */}
            <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '20px', textAlign: 'left' }}>
              
              {/* Caso A: Se encontraron usuarios */}
              {resultadosFiltradosGlobal.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resultadosFiltradosGlobal.map(usuario => (
                    <div 
                      key={usuario.id}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--color-dark)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {usuario.iniciales}
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'white', fontWeight: '600' }}>{usuario.nombre}</h4>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-medium)' }}>{usuario.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAgregarContacto(usuario)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-accent)', color: 'var(--color-dark)', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        ＋
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Caso B: El usuario tecleó pero no hay coincidencias */}
              {busquedaLimpiaGlobal.length >= 2 && resultadosFiltradosGlobal.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-medium)', fontSize: '0.9rem' }}>
                  No se encontraron usuarios que coincidan.
                </div>
              )}

              {/* Caso C: Estado inicial del modal */}
              {busquedaLimpiaGlobal.length < 2 && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-medium)', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  Escribe al menos 2 letras para consultar el directorio corporativo.
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