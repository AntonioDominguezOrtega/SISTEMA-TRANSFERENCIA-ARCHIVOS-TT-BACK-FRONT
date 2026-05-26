import React from 'react'
import PublicHeader from '../components/PublicHeader'
import Footer from '../components/Footer'

export default function TerminosCondiciones() {
  return (
    <>
      <PublicHeader />

      <main className="terms-page section">
        <div className="container">
          <header className="section-heading">
            <br></br>
            <br></br>
            <br></br>
            <h1>Términos y Condiciones de Uso/Aviso de Privacidad</h1>
            <p>Última actualización: 30 de abril de 2026</p>
          </header>

          <section className="benefit-box shadow-sm" style={{ textAlign: 'left', padding: '2rem', marginTop: '3rem' }}>
            <div className="terms-content" style={{ color: '#444', lineHeight: '1.6' }}>
              <h3>Aviso de Privacidad</h3>

              <h3>1. Idenitdad y Domiciolio del Responsable</h3>
              <p>
                El equipo desarrollador del presente sistema, constituido como un proyecto académico
                bajo el protocolo de Trabajo Terminal de la Escuela Superior de Cómputo (ESCOM-IPN),
                es el responsable del uso, tratamiento y protección de sus datos personales.
              </p>

              <h3>2. Datos Personales que se Recaban</h3>
              <p>
                Para garantizar la correcta ejecución del servicio de transferencia de documentos,
                la plataforma recopilará las siguientes categorías de datos:
                <ul style={{ marginLeft: '1.5rem', listStyleType: 'disc' }}>
                  <li><strong>Datos de Conectividad y Validación:</strong> Número de teléfono celular, requerido exclusivamente para el proceso de autenticación multifactor (MFA).</li>
                  <li><strong>Metadatos de los Archivos:</strong> Información técnica no sensible (tamaño de archivo, extensión y marcas de tiempo) necesaria para el enrutamiento, la gestión de expiración y el control de descargas.</li>
                </ul>
              </p>

              <h3>3. Finalidades del Tratamiento de los Datos</h3>
              <p>
                Los datos personales descritos serán utilizados de manera estricta para cumplir con las siguientes finalidades primarias (esenciales para la prestación del servicio):
                <ul style={{ marginLeft: '1.5rem', listStyleType: 'disc' }}>
                  <li>Generar, procesar y enviar tokens de seguridad vía mensaje de texto (SMS) para validar la identidad del usuario durante los procesos de recuperación de cuenta o descarga de archivos.</li>
                  <li>Alojar temporalmente los paquetes de datos cifrados en la infraestructura del sistema para viabilizar la transferencia entre el remitente y el destinatario legítimo.</li>
                  <li>Administrar y ejecutar los tiempos de expiración y autodestrucción de los archivos conforme a la configuración establecida por el usuario remitente.</li>
                </ul>
              </p>

              <h3>4. Seguridad, Tecnologías de Cifrado y Limitación de Acceso</h3>
              <p>
                Con el fin de salvaguardar la confidencialidad de la información, la plataforma implementa un esquema de seguridad
                avanzado basado en el algoritmo de cifrado simétrico AES-256 ejecutado de manera estrictamente local en el dispositivo del usuario.
                La plataforma no recopila, no transmite y no almacena las llaves de descifrado del sistema carecen de la capacidad técnica para acceder, visualizar o recuperar el 
                contenido de los documentos tranferidos.
              </p>

              <h3>5. Transferencias de Datos a Terceros y Retención</h3>
              <p>
                Para la operación de la arquitectura en la nube, los datos previamente cifrados por el usuario se alojan de manera transitoria en la infraestructura de Microsoft Azure. Esta transferencia técnica se realiza bajo estrictas condiciones de seguridad
                y con el único propósito de proveer almacenamiento temporal. El sistema purgará y eliminará de forma definitiva e irreversible cualquier archivo de los servidores de Azure una vez superado el tiempo de expiración configurado.
                El número telefónico podrá ser procesado de forma temporal por proveedores externos homologados de servicios de mensajería exclusivamente para la entrega física del SMS con el token MFA.
              </p>

              <h3>6. Derechos de ARCO y Renovación del Consentimiento</h3>
              <p>
                Usted tiene derecho a conocer qué datos personales mantenemos, para qué los utilizamos y las condiciones del uso que les damos (Acceso); a solicitar la corrección de su información en caso de ser inexacta o incompleta (Rectificación); a que la eliminemos de nuestros registros cuando considere
                que no está siendo utilizada adecuadamente (Cancelación); así como a oponerse al uso de datos para fines específicos (Oposición). Para ejercer cualquiera de estos derechos ARCO, deberá dirigir una solicitud formal por escrito detallando su petición al correo electrónico oficial del proecto.
              </p>

              <h3>7. Modificaciones al Aviso de Privacidad</h3>
              <p>
                Este aviso de privacidad podrá sufrir modificaciones, cambios o actualizaciones derivadas de las fases de
                desarrollo del Trabajo Terminal o por adecuaciones técnicas del sistema. Cualquier modificación será
                publicada directamente en la interfaz principal de acceso de la plataforma.
              </p>

              <br></br>

              <h3>Términos Y Condiciones De Uso</h3>

              <h3>1. Aceptación de los Términos</h3>
              <p>
                Al acceder y utilizar esta plataforma de transferencia de archivos, usted acepta cumplir con estos términos. 
                Este sistema ha sido desarrollado como un proyecto académico bajo el protocolo de Trabajo Terminal de la ESCOM.
              </p>

              <h3>2. Uso de la Tecnología de Cifrado</h3>
              <p>
                El usuario reconoce que los archivos son cifrados localmente mediante el algoritmo <strong>AES-256</strong>. 
                La plataforma no almacena las llaves de descifrado de forma persistente en texto plano, garantizando la confidencialidad.
              </p>

              <h3>3. Autenticación por SMS (MFA)</h3>
              <p>
                Para la recuperación y descarga de archivos, el sistema requiere un número telefónico válido para el envío de 
                tokens de seguridad. Usted es responsable de la exactitud de los datos proporcionados para este fin.
              </p>

              <h3>4. Almacenamiento en la Nube (Azure)</h3>
              <p>
                Los datos cifrados se alojan en la infraestructura de <strong>Microsoft Azure</strong>. El sistema se reserva 
                el derecho de eliminar archivos que hayan superado su tiempo de expiración configurado por el remitente.
              </p>

              <h3>5. Responsabilidad</h3>
              <p>
                Dada la naturaleza del proyecto, el equipo de desarrollo no se hace responsable por la pérdida de contraseñas 
                locales generadas durante el proceso de cifrado, ya que estas son necesarias para el acceso final al documento.
              </p>

              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  <strong>Aviso:</strong> Este documento cumple con los lineamientos de privacidad y protección de datos 
                  personales estipulados en el marco teórico de este Trabajo Terminal.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}