import React, { useEffect } from 'react'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'

export default function Nosotros() {

  // 🌟 EFECTO DE ANIMACIÓN SCROLL (Intersection Observer)
  useEffect(() => {
    const observerOptions = {
      root: null, 
      rootMargin: '0px',
      threshold: 0.15 
    };

    const handleIntersect = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          // Mantiene la animación infinita al subir y volver a bajar
          entry.target.classList.remove('is-visible');
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);
    
    const elementsToReveal = document.querySelectorAll('.reveal-on-scroll');
    elementsToReveal.forEach(el => observer.observe(el));

    return () => {
      elementsToReveal.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <>
      <PublicHeader />

      <main className="about-page" style={{ backgroundColor: 'var(--color-dark)', color: 'var(--color-white)', overflowX: 'hidden' }}>
        
        {/* Sección Hero: Misión del Proyecto */}
        <section className="hero section about-hero" style={{ paddingTop: '140px', paddingBottom: '40px' }}>
          <div className="container">
            <div className="hero-text text-center reveal-on-scroll" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <span className="section-badge">Sobre el Proyecto</span>
              <h1 style={{ color: 'var(--color-white)', fontSize: '2.8rem', marginTop: '10px' }}>
                Seguridad Documental al Alcance de Todos
              </h1>
              <p className="lead-text" style={{ color: 'var(--color-text-medium)', fontSize: '1.1rem', marginTop: '15px' }}>
                Somos un equipo de la <strong>Escuela Superior de Cómputo (ESCOM)</strong> dedicados al 
                desarrollo de soluciones tecnológicas que garantizan la confidencialidad 
                en el intercambio de información sensible.
              </p>
            </div>
          </div>
        </section>

        {/* Sección: Nuestra Misión y Visión */}
        <section className="features section" style={{ padding: '40px 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
              
              {/* Misión con Animación de Scroll */}
              <div className="feature-card reveal-on-scroll delay-1" style={{ backgroundColor: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.05)', padding: '30px', borderRadius: '16px' }}>
                <h2 style={{ color: 'var(--color-accent)', marginBottom: '15px', fontSize: '1.8rem' }}>Nuestra Misión</h2>
                <p style={{ color: 'var(--color-text-light)', fontSize: '1rem', lineHeight: '1.6' }}>
                  Proveer una plataforma robusta que combine el poder de la nube de Azure 
                  con cifrado local avanzado, eliminando el riesgo de filtraciones en la 
                  transferencia de contratos y documentos legales.
                </p>
              </div>

              {/* Visión con Animación de Scroll */}
              <div className="feature-card reveal-on-scroll delay-2" style={{ backgroundColor: 'var(--color-primary)', border: '1px solid rgba(255,255,255,0.05)', padding: '30px', borderRadius: '16px' }}>
                <h2 style={{ color: 'var(--color-accent)', marginBottom: '15px', fontSize: '1.8rem' }}>Nuestra Visión</h2>
                <p style={{ color: 'var(--color-text-light)', fontSize: '1rem', lineHeight: '1.6' }}>
                  Convertirnos en el referente académico de transferencias seguras dentro 
                  del Instituto Politécnico Nacional, promoviendo estándares de 
                  ciberseguridad de alto nivel.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Sección: El Equipo (Capara Team Centrado) */}
        <section className="benefits section" style={{ padding: '60px 0' }}>
          <div className="container">
            <div className="section-heading reveal-on-scroll" style={{ textAlign: 'center', marginBottom: '45px' }}>
              <h2 style={{ color: 'var(--color-white)', fontSize: '2.2rem' }}>Equipo de Desarrollo</h2>
              <p style={{ color: 'var(--color-text-medium)' }}>Estudiantes de Ingeniería en Sistemas Computacionales.</p>
            </div>
            
            {/* CONTENEDOR DE INTEGRANTES */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 320px))', 
              gap: '30px', 
              justifyContent: 'center' 
            }}>
              
              {/* 🌟 INTEGRANTE 1: Antonio (Luz + Plop) */}
              <article className="benefit-box team-card reveal-on-scroll delay-1 card-glow-plop" style={{ 
                backgroundColor: '#1D263C', 
                border: '1px solid rgba(10, 63, 255, 0.5)', 
                padding: '30px 20px', 
                borderRadius: '16px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.3)'
              }}>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-accent)', marginBottom: '18px', backgroundColor: 'var(--color-dark)' }}>
                  <img 
                    src="/assets2/img/Antonio.png" 
                    alt="Antonio" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C2A478'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'%3E%3C/path%3E%3C/svg%3E" }} 
                  />
                </div>
                <h3 style={{ color: 'var(--color-white)', fontSize: '1.15rem', marginBottom: '6px', fontWeight: '700' }}>Antonio de Jesús Domínguez Ortega</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.95rem', marginBottom: '14px' }}>Desarrollador</p>
                <span style={{ backgroundColor: 'rgba(194, 164, 120, 0.12)', color: 'var(--color-accent)', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(194, 164, 120, 0.2)' }}>
                  ESCOM - IPN
                </span>
              </article>

              {/* 🌟 INTEGRANTE 2: Ámbar (Luz + Plop) */}
              <article className="benefit-box team-card reveal-on-scroll delay-2 card-glow-plop" style={{ 
                backgroundColor: '#1D263C', 
                border: '1px solid rgba(10, 63, 255, 0.5)', 
                padding: '30px 20px', 
                borderRadius: '16px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.3)'
              }}>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-accent)', marginBottom: '18px', backgroundColor: 'var(--color-dark)' }}>
                  <img 
                    src="/assets2/img/Ambar.png" 
                    alt="Ambar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C2A478'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'%3E%3C/path%3E%3C/svg%3E" }}
                  />
                </div>
                <h3 style={{ color: 'var(--color-white)', fontSize: '1.15rem', marginBottom: '6px', fontWeight: '700' }}>Ambar Stephania García Gaspar</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.95rem', marginBottom: '14px' }}>Desarrolladora</p>
                <span style={{ backgroundColor: 'rgba(194, 164, 120, 0.12)', color: 'var(--color-accent)', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(194, 164, 120, 0.2)' }}>
                  ESCOM - IPN
                </span>
              </article>

              {/* 🌟 INTEGRANTE 3: Héctor (Luz + Plop) */}
              <article className="benefit-box team-card reveal-on-scroll delay-3 card-glow-plop" style={{ 
                backgroundColor: '#1D263C', 
                border: '1px solid rgba(10, 63, 255, 0.5)', 
                padding: '30px 20px', 
                borderRadius: '16px', 
                textAlign: 'center', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-medium), 0 0 20px rgba(10, 63, 255, 0.3)'
              }}>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--color-accent)', marginBottom: '18px', backgroundColor: 'var(--color-dark)' }}>
                  <img 
                    src="/assets2/img/Hector.png" 
                    alt="Héctor" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C2A478'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'%3E%3C/path%3E%3C/svg%3E" }}
                  />
                </div>
                <h3 style={{ color: 'var(--color-white)', fontSize: '1.15rem', marginBottom: '6px', fontWeight: '700' }}>Héctor Alejandro Hernández Aranda</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.95rem', marginBottom: '14px' }}>Desarrollador</p>
                <span style={{ backgroundColor: 'rgba(194, 164, 120, 0.12)', color: 'var(--color-accent)', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid rgba(194, 164, 120, 0.2)' }}>
                  ESCOM - IPN
                </span>
              </article>

            </div>
          </div>
        </section>

        {/* Sección Institucional */}
        <section className="cta section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="container cta-box text-center reveal-on-scroll" style={{ backgroundColor: 'var(--color-primary)', padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ color: 'var(--color-white)', fontSize: '1.8rem' }}>Desarrollado bajo el protocolo de Trabajo Terminal II</h2>
            <p style={{ color: 'var(--color-text-medium)', margin: '10px 0 20px' }}>Proyecto oficial del Instituto Politécnico Nacional - 2026</p>
            <div className="logo-placeholder" style={{ fontWeight: 'bold', color: 'var(--color-accent)', letterSpacing: '2px' }}>ESCOM | IPN</div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}