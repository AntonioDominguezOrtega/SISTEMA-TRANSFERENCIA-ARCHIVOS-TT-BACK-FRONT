import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import PrivateLayout from '../components/PrivateLayout'

// 🌟 Importación de React Icons estandarizados de Capara
import { 
  FaShieldAlt, FaSms, FaFolderOpen, FaUserCog, 
  FaQuestionCircle, FaEnvelope, FaChevronDown, FaChevronUp 
} from 'react-icons/fa'

export default function AyudaSoporte() {
  // Estado dinámico para el acordeón interactivo de preguntas frecuentes
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Base de datos local de FAQs para el mapeo reactivo
  const listaFaqs = [
    {
      pregunta: "¿Es seguro subir mis contratos a la plataforma?",
      respuesta: "Sí, absolutamente. Cada archivo es procesado mediante algoritmos de cifrado simétrico AES-256 de manera local antes de ser transferido y resguardado en los contenedores seguros (Blob Storage) de Microsoft Azure."
    },
    {
      pregunta: "¿Qué pasa si pierdo el dispositivo asociado a mi número celular?",
      respuesta: "No te preocupes. Puedes realizar un proceso de revocación de credenciales y validación asimétrica mediante tu correo secundario de recuperación para reasociar un nuevo número telefónico a la red dual."
    },
    {
      pregunta: "¿Cuánto tiempo duran los enlaces de acceso de los archivos?",
      respuesta: "Tú tienes el control total. Al momento de cargar un archivo mediante el formulario, puedes definir una política de Tiempo de Vida (TTL). Una vez cumplido ese plazo, las llaves de descifrado se revocan automáticamente en la nube."
    }
  ];

  return (
    <PrivateLayout>
      {/* Contenedor central limitado con max-width para evitar desparrames a pantalla completa 100% */}
      <main style={{ 
        paddingTop: '110px', paddingBottom: '60px', color: 'white',
        width: '100%', maxWidth: '1300px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px'
      }}>
        
        {/* Sección Encabezado Hero */}
        <section style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(10, 63, 255, 0.15)', color: '#46A2FD', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Centro de soporte técnico
          </span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '15px', color: 'white' }}>
            ¿Cómo podemos ayudarte hoy?
          </h1>
          <p style={{ color: 'var(--color-text-medium)', maxWidth: '600px', margin: '10px auto 0', fontSize: '1.05rem' }}>
            Encuentra documentación criptográfica, guías del directorio corporativo y canales de soporte directo.
          </p>
        </section>

        {/* Sección de Tarjetas de Categorías con Efecto Plop y Luz de Neón */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px' }}>
            
            {/* Categoría 1 */}
            <article className="card-glow-plop" style={{ backgroundColor: '#1D263C', border: '1px solid rgba(10, 63, 255, 0.4)', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(10, 63, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#46A2FD', marginBottom: '15px' }}>
                  <FaShieldAlt />
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'white', fontWeight: '600', marginBottom: '10px' }}>Seguridad y Cifrado</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                  Aprende cómo protegemos tus documentos confidenciales con algoritmos avanzados de infraestructura local.
                </p>
              </div>
              
            </article>

            {/* Categoría 2 */}
            <article className="card-glow-plop" style={{ backgroundColor: '#1D263C', border: '1px solid rgba(10, 63, 255, 0.4)', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(82, 196, 26, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#52c41a', marginBottom: '15px' }}>
                  <FaSms />
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'white', fontWeight: '600', marginBottom: '10px' }}>Autenticación SMS</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                  Configuración del servicio OTP dual de Azure para solicitudes de validación de identidad asíncronas.
                </p>
              </div>
              
            </article>

            {/* Categoría 3 */}
            <article className="card-glow-plop" style={{ backgroundColor: '#1D263C', border: '1px solid rgba(10, 63, 255, 0.4)', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(250, 173, 20, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#faad14', marginBottom: '15px' }}>
                  <FaFolderOpen />
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'white', fontWeight: '600', marginBottom: '10px' }}>Gestión de Archivos</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                  Aprende a estructurar carpetas raíz por criticidad, vaciar la papelera y configurar accesos de solo vista.
                </p>
              </div>
              </article>

            {/* Categoría 4 */}
            <article className="card-glow-plop" style={{ backgroundColor: '#1D263C', border: '1px solid rgba(10, 63, 255, 0.4)', padding: '30px 20px', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'white', marginBottom: '15px' }}>
                  <FaUserCog />
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'white', fontWeight: '600', marginBottom: '10px' }}>Cuenta y Perfil</h3>
                <p style={{ color: 'var(--color-text-medium)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0 }}>
                  Administración de tokens JWT locales, cambio de llaves públicas y control de tus datos de usuario.
                </p>
              </div>
              
            </article>

          </div>
        </section>

        {/* =======================================================
            🌟 SECCIÓN DE PREGUNTAS FRECUENTES INTERACTIVAS (ACORDEÓN)
           ======================================================= */}
        <section style={{ marginBottom: '60px', textAlign: 'left' }}>
          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaQuestionCircle style={{ color: 'var(--color-accent)', fontSize: '1.3rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', margin: 0 }}>Preguntas Frecuentes (FAQ)</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '850px', margin: '0 auto' }}>
            {listaFaqs.map((faq, index) => (
              <div 
                key={index} 
                style={{ 
                  backgroundColor: '#1D263C', 
                  borderRadius: '12px', 
                  border: activeFaq === index ? '1px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Botón de la pregunta */}
                <button
                  onClick={() => toggleFaq(index)}
                  style={{
                    width: '100%', padding: '20px 24px', background: 'none', border: 'none', color: 'white', textAlign: 'left', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px'
                  }}
                >
                  <span>{faq.pregunta}</span>
                  <span style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}>
                    {activeFaq === index ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                </button>
                
                {/* Contenido desplegable de la respuesta */}
                {activeFaq === index && (
                  <div style={{ padding: '0 24px 20px 24px', color: 'var(--color-text-light)', fontSize: '0.92rem', lineHeight: '1.6', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    {faq.respuesta}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Sección de Contacto con Soporte */}
        <section style={{ marginTop: '40px' }}>
          <div style={{ 
            backgroundColor: '#1D263C', border: '1px solid #0a3fff', padding: '40px', borderRadius: '16px',
            boxShadow: 'var(--shadow-medium), 0 0 25px rgba(10, 63, 255, 0.3)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px', textAlign: 'left'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '700', color: 'white' }}>¿No encontraste lo que buscabas?</h2>
              <p style={{ margin: '8px 0 0 0', color: 'var(--color-text-medium)', fontSize: '0.95rem' }}>
                El equipo de Ingeniería en Sistemas Computacionales de ESCOM está listo para ayudarte con incidencias criptográficas.
              </p>
            </div>
            <a 
              href="mailto:soporte@capara.com" 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: 'bold' }}
            >
              <FaEnvelope /> Contactar Soporte Técnico
            </a>
          </div>
        </section>

      </main>
      {/* 🌟 CORRECCIÓN EXCELENTE: El footer manual ya no está aquí, eliminando el doble pie de página */}
    </PrivateLayout>
  )
}