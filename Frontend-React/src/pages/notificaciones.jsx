import { useState, useEffect } from 'react'
import PrivateLayout from '../components/PrivateLayout'

// Servicio API (Listo para conectar con tu backend)
const fetchNotificationsData = async () => {
  try {
    // 🔗 CUANDO EL BACKEND ESTÉ LISTO, DESCOMENTA ESTO Y BORRA EL RETURN DE ABAJO:
    /*
    const response = await fetch('http://tu-api.com/api/notificaciones', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!response.ok) throw new Error('Error al obtener notificaciones');
    return await response.json();
    */

    return [
      { id: 'n1', title: 'Carpeta compartida', message: 'María compartió la carpeta "Diseños" contigo.', date: 'Hace 10 minutos', read: false, icon: '📁' },
      { id: 'n2', title: 'Carga exitosa', message: 'El archivo "Reporte_TT2_Avance.pdf" se subió correctamente.', date: 'Hace 2 horas', read: false, icon: '✅' },
      { id: 'n3', title: 'Alerta de seguridad', message: 'Nuevo inicio de sesión desde un dispositivo en la Ciudad de México.', date: 'Ayer', read: true, icon: '⚠️' },
      { id: 'n4', title: 'Permisos actualizados', message: 'Se te han otorgado permisos de edición en "Proyecto Terminal".', date: 'Hace 3 días', read: true, icon: '🔑' }
    ];
  } catch (error) {
    throw error;
  }
}

// Componente Principal
export default function Notificaciones() {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchNotificationsData();
        setNotifications(result);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar las notificaciones.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [])

  const markAllAsRead = () => {
    // Aquí iría una llamada al backend (ej. PUT /api/notificaciones/leidas)
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
  }

  return (
    <PrivateLayout>
      <section className="section-top" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>Notificaciones</h1>
          <p style={{ color: 'var(--color-medium-dark)' }}>
            Mantente al tanto de la actividad reciente en tu cuenta.
          </p>
        </div>
        <div>
          <button onClick={markAllAsRead} className="btn btn-secondary">
            Marcar todas como leídas
          </button>
        </div>
      </section>

      {/* Estados de Carga y Error */}
      {isLoading && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-medium)' }}>
          <h2>Cargando notificaciones...</h2>
        </div>
      )}

      {error && (
        <div style={{ padding: '20px', backgroundColor: '#ffe5e5', color: '#d93025', borderRadius: '12px' }}>
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      {/* Lista de Notificaciones */}
      {!isLoading && !error && (
        <section style={{ backgroundColor: 'var(--color-white)', borderRadius: '12px', boxShadow: 'var(--shadow-soft)', overflow: 'hidden' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-medium-dark)' }}>
              No tienes notificaciones en este momento.
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                style={{ 
                  padding: '20px 24px', 
                  borderBottom: '1px solid #eaeaea',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  backgroundColor: notif.read ? 'transparent' : '#f4f8ff' // Fondo ligero si no está leída
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>{notif.icon}</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--color-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {notif.title}
                    {!notif.read && (
                      <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', display: 'inline-block' }}></span>
                    )}
                  </h3>
                  <p style={{ margin: '0 0 8px 0', color: 'var(--color-medium-dark)' }}>{notif.message}</p>
                  <small style={{ color: 'var(--color-medium)', fontWeight: '500' }}>{notif.date}</small>
                </div>
                <button className="card-menu-btn" title="Opciones de notificación">⋮</button>
              </div>
            ))
          )}
        </section>
      )}
    </PrivateLayout>
  )
}