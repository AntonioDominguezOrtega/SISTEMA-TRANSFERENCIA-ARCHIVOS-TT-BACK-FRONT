import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'

// 🌟 Importación de React Icons estandarizados para potenciar el look visual
import { 
  FaShieldAlt, FaUserLock, FaKey, FaUpload, FaUserCheck, FaShareAlt, FaLockOpen
} from 'react-icons/fa'

export default function Home() {
  
  // EFECTO ANIMACIÓN SCROLL (Intersection Observer)
  useEffect(() => {
    const elementosARevelar = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px"
    });

    elementosARevelar.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <PublicHeader />

      <main style={{ backgroundColor: 'var(--color-dark, #131924)', color: 'white', overflowX: 'hidden' }}>
        
        {/* =======================================================
            🌟 SECCIÓN HERO REDISEÑADA: IMPACTO VISUAL EN "CAPARA"
           ======================================================= */}
        <section className="hero section reveal" style={{ paddingTop: '160px', paddingBottom: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="container hero-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px', width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '0 20px', alignItems: 'center' }}>
            
            {/* Bloque de Texto: Tipografía Neón Masiva */}
            <div className="hero-text" style={{ textAlign: 'left' }}>              
              <h1 style={{ fontSize: '3.5rem', fontWeight: '900', lineHeight: '1.1', marginTop: '20px', marginBottom: '20px', color: 'white' }}>
                Preserva la confidencialidad en el intercambio de archivos con <br />
                <span style={{ 
                  background: 'linear-gradient(45deg, #0a3fff, #46A2FD, #14d7fa)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  fontSize: '4.5rem',
                  letterSpacing: '2px',
                  display: 'inline-block',
                  margin: '10px 0'
                }}>
                  CAPARA
                </span>
              </h1>
              
              <p style={{ color: 'var(--color-text-medium, #8892b0)', fontSize: '1.15rem', lineHeight: '1.6', marginBottom: '35px', maxWidth: '550px' }}>
                Plataforma web de resguardo documental de alto nivel. Protege, organiza y comparte contratos y archivos confidenciales mediante cifrado avanzado y tokens SMS.
              </p>

              <div className="hero-actions" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <Link to="/registro" className="btn btn-primary" style={{ padding: '14px 28px', fontWeight: 'bold' }}>Comenzar ahora</Link>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '14px 28px', border: '1px solid rgba(255,255,255,0.1)' }}>Ya tengo cuenta</Link>
              </div>
            </div>

            {/* Bloque Visual: Renderizado de la Imagen Hero */}
            <div className="hero-visual" style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(10,63,255,0.15) 0%, transparent 70%)', filter: 'blur(30px)', zIndex: 1 }} />
              <img 
                src="/assets2/img/security-main.png" 
                alt="Seguridad digital y protección de archivos" 
                style={{ width: '100%', maxWidth: '480px', height: 'auto', objectFit: 'contain', position: 'relative', zIndex: 2 }}
              />
            </div>

          </div> 
        </section>

        {/* =======================================================
            SECCIÓN CARACTERÍSTICAS (Grid Limpio Antidesparrame)
           ======================================================= */}
        <section className="features section reveal" style={{ padding: '60px 0', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <div className="container features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '0 20px', alignItems: 'center' }}>
            
            <div className="features-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              
              {/* Contenedor 1 con Luz + Plop */}
              <div className="feature-card feature-title-card card-glow-plop" style={{ 
                padding: '2rem', backgroundColor: '#1D263C', borderRadius: '15px', border: '1px solid #0a3fff', 
                boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)', cursor: 'pointer'
              }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'white', margin: 0 }}>Características Destacadas</h2>
              </div>

              {/* Tarjeta 1 */}
              <div style={{ display: 'flex', gap: '15px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.5rem', color: '#faad14', marginTop: '3px' }}><FaShieldAlt /></div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 6px 0' }}>Cifrado AES-256 local</h3>
                  <p style={{ color: 'var(--color-text-medium, #8892b0)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>Tus archivos se encriptan simétricamente en el cliente antes de ser transferidos.</p>
                </div>
              </div>

              {/* Tarjeta 2 */}
              <div style={{ display: 'flex', gap: '15px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.5rem', color: '#0a3fff', marginTop: '3px' }}><FaUserLock /></div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 6px 0' }}>Autenticación SMS Dual</h3>
                  <p style={{ color: 'var(--color-text-medium, #8892b0)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>Agrega un token de un solo uso.</p>
                </div>
              </div>

              {/* Tarjeta 3 */}
              <div style={{ display: 'flex', gap: '15px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '1.5rem', color: '#52c41a', marginTop: '3px' }}><FaKey /></div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 6px 0' }}>Políticas de Acceso Robustas</h3>
                  <p style={{ color: 'var(--color-text-medium, #8892b0)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>Configura restricciones avanzadas decidiendo entre permisos de descarga completa o solo lectura (vista previa).</p>
                </div>
              </div>

            </div>

            <div className="features-image" style={{ display: 'flex', justifyContent: 'center' }}>
              <img src="/assets2/img/security-shield.jpg" alt="Escudo de seguridad digital" style={{ width: '100%', maxWidth: '420px', borderRadius: '16px', boxShadow: 'var(--shadow-medium)' }} />
            </div>
          </div>
        </section>

        {/* =======================================================
            SECCIÓN CÓMO FUNCIONA (Conectores Elásticos)
           ======================================================= */}
        <section className="how-it-works section reveal" style={{ padding: '60px 0' }}>
          <div className="container" style={{ width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '0 20px' }}>
            <div className="section-heading dark" style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>¿Cómo funciona?</h2>
              <p style={{ color: 'var(--color-text-medium)' }}>Usa el ecosistema de resguardo en tres pasos simples.</p>
            </div>

            {/* Contenedor 2 con Luz + Plop */}
            <div className="steps-grid card-glow-plop" style={{ 
              padding: '35px 25px', backgroundColor: '#1D263C', borderRadius: '15px', border: '1px solid #ffffff', 
              boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)', cursor: 'pointer',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px'
            }}>
              <article className="step-card" style={{ textAlign: 'center' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--color-dark)', border: '2px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyBox: 'center', justifyContent: 'center', margin: '0 auto 15px', fontWeight: '700', fontSize: '1.2rem', color: 'var(--color-accent)' }}>
                  <FaUpload style={{ fontSize: '0.95rem' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>1. Carga Documentos</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', margin: 0, lineHeight: '1.4' }}>Sube múltiples contratos o archivos confidenciales dentro de tu raíz o carpetas.</p>
              </article>

              <article className="step-card" style={{ textAlign: 'center' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--color-dark)', border: '2px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyBox: 'center', justifyContent: 'center', margin: '0 auto 15px', fontWeight: '700', fontSize: '1.2rem', color: 'var(--color-accent)' }}>
                  <FaUserCheck style={{ fontSize: '0.95rem' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>2. Configura Políticas</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', margin: 0, lineHeight: '1.4' }}>Define el nivel de privacidad asimétrica, tiempo de vida y el teléfono destino.</p>
              </article>

              <article className="step-card" style={{ textAlign: 'center' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--color-dark)', border: '2px solid var(--color-accent)', display: 'flex', alignItems: 'center', justifyBox: 'center', justifyContent: 'center', margin: '0 auto 15px', fontWeight: '700', fontSize: '1.2rem', color: 'var(--color-accent)' }}>
                  <FaShareAlt style={{ fontSize: '0.95rem' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>3. Envío Cifrado</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', margin: 0, lineHeight: '1.4' }}>Comparte de forma controlada a distintos miembros.</p>
              </article>
            </div>
          </div>
        </section>

        {/* =======================================================
            SECCIÓN BENEFICIOS (Distribución Balanceada)
           ======================================================= */}
        <section className="benefits section reveal" style={{ padding: '60px 0' }}>
          <div className="container" style={{ width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '0 20px' }}>
            <div className="section-heading" style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>¿Por qué usar CAPARA?</h2>
              <p style={{ color: 'var(--color-text-medium)' }}>Diseñada con altos estándares académicos.</p>
            </div>

            {/* Contenedor 3 con Luz + Plop */}
            <div className="benefits-grid card-glow-plop" style={{ 
              padding: '35px', backgroundColor: '#1D263C', borderRadius: '15px', border: '1px solid #0a3fff', 
              boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)', cursor: 'pointer',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px'
            }}>
              <article className="benefit-box" style={{ textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--color-accent)' }}>Auditoría e Historial</h4>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', margin: 0, lineHeight: '1.4' }}>Monitorea el estatus de tus transferencias mediante el panel dinámico de logs vencidos.</p>
              </article>

              <article className="benefit-box" style={{ textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--color-accent)' }}>Clasificación por Nivel</h4>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', margin: 0, lineHeight: '1.4' }}>Organiza tus expedientes usando carpetas personalizadas según su nivel de criticidad.</p>
              </article>

              <article className="benefit-box" style={{ textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--color-accent)' }}>Control Inbound / Outbound</h4>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', margin: 0, lineHeight: '1.4' }}>Separa claramente los flujos de archivos recibidos mediante notificaciones push en tiempo real.</p>
              </article>

            </div>
          </div>
        </section>

        {/* =======================================================
            SECCIÓN CALL TO ACTION (Fijo Centralizado)
           ======================================================= */}
        <section className="cta section reveal" style={{ padding: '40px 0 80px 0' }}>
          <div className="container" style={{ width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '0 20px' }}>
            
            {/* Contenedor 4 con Luz + Plop */}
            <div className="cta-box card-glow-plop" style={{ 
              padding: '40px', backgroundColor: '#1D263C', borderRadius: '16px', border: '1px solid #ffffff', 
              boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px', textAlign: 'left'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700' }}>Empieza a proteger tus archivos hoy</h2>
                <p style={{ margin: '8px 0 0 0', color: 'var(--color-text-medium)', fontSize: '0.95rem' }}>Crea una cuenta y comienza a usar una plataforma confiable para gestionar tu información.</p>
              </div>
              <div className="cta-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Link to="/registro" className="btn btn-primary" style={{ padding: '12px 30px', fontWeight: 'bold' }}>Crear cuenta</Link>
                <Link to="/terminos-condiciones" style={{ fontSize: '0.8rem', color: 'var(--color-text-medium)', textDecoration: 'underline', textAlign: 'center' }}>
                  Aviso de Privacidad y Términos
                </Link>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}