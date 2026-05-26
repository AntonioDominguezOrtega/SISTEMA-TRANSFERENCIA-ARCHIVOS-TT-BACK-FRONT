import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'

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

      <main style={{ overflowX: 'hidden' }}>
        {/* Sección Hero */}
        <section className="hero section reveal">
          <div className="container hero-grid">
            <div className="hero-text">
              <span className="section-badge">Plataforma segura de archivos</span>
              <h1>Protege, organiza y comparte tus archivos con mayor seguridad</h1>
              <p>
                Gestiona tus documentos en una plataforma diseñada para almacenamiento,
                protección y envíon seguro de archivos desde cualquier lugar.
              </p>

              <div className="hero-actions">
                <Link to="/registro" className="btn btn-primary">Comenzar ahora</Link>
                <Link to="/login" className="btn btn-secondary">Ya tengo cuenta</Link>
              </div>
            </div>

            <div className="hero-visual">
              <img src="/assets2/img/security-main.png" alt="Seguridad digital y protección de archivos" />
            </div>
          </div> 
        </section>

        {/* Sección Características */}
        <section className="features section reveal">
          <div className="container features-grid">
            <div className="features-list">
              
              {/* Contenedor 1 con Luz + Plop */}
              <div className="feature-card feature-title-card card-glow-plop" style={{ 
                padding: '2rem', 
                backgroundColor: '#1D263C', 
                borderRadius: '15px', 
                border: '1px solid #0a3fff', 
                boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)',
                cursor: 'pointer'
              }}>
                <h2>Características Destacadas</h2>
              </div>

              <div className="feature-card">
                <h3> Cifrado de grado militar</h3>
                <p>Tus archivos se almacenan protegidos mediante mecanismos avanzados de seguridad.</p>
              </div>

              <div className="feature-card">
                <h3> Autenticación doble</h3>
                <p>Agrega una capa extra de acceso seguro para proteger tu cuenta.</p>
              </div>

              <div className="feature-card">
                <h3> Contraseñas seguras</h3>
                <p>Controles de acceso robustos para una gestión confiable de la información.</p>
              </div>
            </div>

            <div className="features-image">
              <img src="/assets2/img/security-shield.jpg" alt="Escudo de seguridad digital" />
            </div>
          </div>
        </section>

        {/* Sección Cómo Funciona */}
        <section className="how-it-works section reveal">
          <div className="container">
            <div className="section-heading dark">
              <h2>¿Cómo funciona?</h2>
              <p>Usa la plataforma en tres pasos simples.</p>
            </div>

            {/* Contenedor 2 con Luz + Plop */}
            <div className="steps-grid card-glow-plop" style={{ 
                padding: '2rem', 
                backgroundColor: '#1D263C', 
                borderRadius: '15px', 
                border: '1px solid #ffffff', 
                boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)',
                cursor: 'pointer'
              }}>
              <article className="step-card" style={{ '--delay': '1' }}>
                <div className="step-number">1</div>
                <h3>Sube tu archivo</h3>
                <p>Carga documentos, imágenes o archivos importantes dentro de tu espacio personal.</p>
              </article>

              <article className="step-card" style={{ '--delay': '2' }}>
                <div className="step-number">2</div>
                <h3>Configura la seguridad</h3>
                <p>Define permisos, privacidad, contraseña o restricciones de acceso.</p>
              </article>

              <article className="step-card" style={{ '--delay': '3' }}>
                <div className="step-number">3</div>
                <h3>Compártelo</h3>
                <p>Envía tus archivos a contactos específicos de forma más controlada y segura.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Sección Beneficios */}
        <section className="benefits section reveal">
          <div className="container">
            <div className="section-heading">
              <h2>¿Por qué usar esta plataforma?</h2>
              <p>Diseñada para ofrecer seguridad, simplicidad y control sobre tus archivos.</p>
            </div>

            {/* Contenedor 3 con Luz + Plop */}
            <div className="benefits-grid card-glow-plop" style={{ 
                padding: '2rem', 
                backgroundColor: '#1D263C', 
                borderRadius: '15px', 
                border: '1px solid #0a3fff', 
                boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)',
                cursor: 'pointer'
              }}>
              <article className="benefit-box">
                <h3>Acceso rápido</h3>
                <p>Encuentra archivos recientes, compartidos y carpetas en una sola interfaz.</p>
              </article>

              <article className="benefit-box">
                <h3>Organización eficiente</h3>
                <p>Administra tus carpetas y documentos de forma clara y ordenada.</p>
              </article>

              <article className="benefit-box">
                <h3>Envío seguro </h3>
                <p>Comparte únicamente con las personas correctas y con mejores controles de acceso.</p>
              </article>

              <article className="benefit-box">
                <h3>Diseño amigable</h3>
                <p>Una experiencia simple para que cualquier usuario pueda usarla sin complicaciones.</p>
              </article>
            </div>
          </div>
        </section>

        {/* Sección CTA */}
        <section className="cta section reveal">
          {/* Contenedor 4 con Luz + Plop */}
          <div className="container cta-box card-glow-plop" style={{ 
                padding: '2rem', 
                backgroundColor: '#1D263C', 
                borderRadius: '15px', 
                border: '1px solid #ffffff', 
                boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.4)'
              }}>
            <div>
              <h2>Empieza a proteger tus archivos hoy</h2>
              <p>Crea una cuenta y comienza a usar una plataforma más segura para gestionar tu información.</p>
            </div>
            <div className="cta-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Link to="/registro" className="btn btn-primary">Crear cuenta</Link>
              <Link to="/terminos-condiciones" style={{ fontSize: '0.85rem', color: '#666', textDecoration: 'underline', textAlign: 'center' }}>
                Consultar Términos y Condiciones
                Aviso de Privacidad
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}