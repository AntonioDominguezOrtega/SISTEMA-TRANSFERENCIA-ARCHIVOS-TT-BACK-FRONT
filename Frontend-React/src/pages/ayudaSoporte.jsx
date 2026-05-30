import React from 'react'
import { Link } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'

export default function AyudaSoporte() {
  return (
    <PrivateLayout>

      <main className="support-page">
        {/* Sección Hero de Soporte */}
        <section className="hero section support-hero">
          <div className="container">
            <div className="section-heading">
              <span className="section-badge">Centro de ayuda</span>
              <h1>¿Cómo podemos ayudarte hoy?</h1>
              <p>Encuentra guías rápidas, preguntas frecuentes y canales de contacto para resolver tus dudas.</p>
            </div>
          </div>
        </section>

        {/* Sección de Categorías de Ayuda */}
        <section className="benefits section">
          <div className="container">
            <div className="benefits-grid">
              <article className="benefit-box">
                <div className="icon-placeholder">🛡️</div>
                <h3>Seguridad y Cifrado</h3>
                <p>Aprende cómo protegemos tus contratos con cifrado AES-256 y autenticación SMS.</p>
                <Link to="#" className="link-text">Leer más →</Link>
              </article>

              <article className="benefit-box">
                <div className="icon-placeholder">📱</div>
                <h3>Autenticación SMS</h3>
                <p>Configura tu número telefónico y soluciona problemas con la recepción de códigos.</p>
                <Link to="#" className="link-text">Leer más →</Link>
              </article>

              <article className="benefit-box">
                <div className="icon-placeholder">📂</div>
                <h3>Gestión de Archivos</h3>
                <p>Guía sobre cómo subir, organizar en carpetas y compartir documentos de forma segura.</p>
                <Link to="#" className="link-text">Leer más →</Link>
              </article>

              <article className="benefit-box">
                <div className="icon-placeholder">👤</div>
                <h3>Cuenta y Perfil</h3>
                <p>Administra tus datos personales, cambia tu contraseña o gestiona tus dispositivos.</p>
                <Link to="#" className="link-text">Leer más →</Link>
              </article>
            </div>
          </div>
        </section>

        {/* Sección de Preguntas Frecuentes (FAQ) */}
        <section className="how-it-works section">
          <div className="container">
            <div className="section-heading dark">
              <h2>Preguntas Frecuentes</h2>
              <p>Respuestas rápidas a las dudas más comunes.</p>
            </div>

            <div className="steps-grid faq-list">
              <div className="step-card">
                <h3>¿Es seguro subir mis contratos?</h3>
                <p>Sí, cada archivo se cifra localmente antes de subirlo a la infraestructura de Azure.</p>
              </div>

              <div className="step-card">
                <h3>¿Qué pasa si pierdo mi celular?</h3>
                <p>Puedes recuperar el acceso mediante tu correo electrónico y un proceso de validación extra.</p>
              </div>

              <div className="step-card">
                <h3>¿Cuánto tiempo duran los enlaces?</h3>
                <p>Tú decides el tiempo de expiración al momento de configurar la seguridad del envío.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Contacto Directo (CTA) */}
        <section className="cta section">
          <div className="container cta-box">
            <div>
              <h2>¿No encontraste lo que buscabas?</h2>
              <p>Nuestro equipo técnico está listo para ayudarte con cualquier problema específico.</p>
            </div>
            <a href="mailto:soporte@tu-dominio.com" className="btn btn-primary">Contactar soporte</a>
          </div>
        </section>
      </main>

      
    </PrivateLayout>
  )
}