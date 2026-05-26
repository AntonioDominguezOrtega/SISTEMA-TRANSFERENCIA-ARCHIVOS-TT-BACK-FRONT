import { useState, useEffect } from 'react'
import PrivateLayout from '../components/PrivateLayout'
import storageService from '../services/storageService'

// Funciones de Seguridad (Reutilizadas)
const getSecurityBadge = (status) => {
  if (status === 'password') return <span title="Bloqueado con contraseña" style={{ fontSize: '1rem', marginRight: '6px' }}>🔒</span>;
  if (status === 'encrypted') return <span title="Cifrado de alto nivel" style={{ fontSize: '1rem', marginRight: '6px' }}>🛡️</span>;
  return null;
}

// Servicio API (Simulado)
const fetchTrashData = async () => {
  const result = await storageService.getTrash();
  return result.trash || result || [];
}

// Componente Principal
export default function Papelera() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchTrashData();
        setItems(result);
      } catch (err) {
        console.error("Error local al cargar elementos de la papelera:", err);
        setError('No se pudieron cargar los elementos de la papelera.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [])

  // Funciones de acción simuladas
  const handleRestore = async (itemId) => {
    try {
      await storageService.restoreItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      alert('Elemento restaurado correctamente');
    } catch (err) {
      alert('Error al restaurar: ' + (err.response?.data?.error || err.message));
    }
  }

  const handlePermanentDelete = async (itemId, itemName) => {
    const confirm = window.confirm(`¿Estás seguro de eliminar "${itemName}" definitivamente? Esta acción no se puede deshacer.`);
    if (!confirm) return;
    try {
      await storageService.permanentDelete(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      alert(`"${itemName}" eliminado para siempre.`);
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  }

  const handleEmptyTrash = () => {
    const confirm = window.confirm('¿Estás seguro de vaciar toda la papelera? Todos los archivos se perderán permanentemente.');
    if (confirm) {
      (async () => {
        try {
          await storageService.emptyTrash();
          setItems([]);
          alert('Papelera vaciada correctamente');
        } catch (err) {
          alert('Error al vaciar la papelera: ' + (err.response?.data?.error || err.message));
        }
      })();
    }
  }

  // Comportamiento al hacer clic en la tarjeta (No deja previsualizar)
  const handleCardClick = (item) => {
    alert(`El elemento "${item.name}" está en la papelera.\n\nDebes restaurarlo primero para poder visualizarlo, descargarlo o compartirlo.`);
  }

  return (
    <PrivateLayout>
      <section className="section-top" style={{ marginBottom: '24px' }}>
        <div>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <h1 style={{ fontSize: '2rem', color: '#d93025' /* Rojo para indicar peligro/borrado */ }}>Papelera</h1>
          <p style={{ color: 'var(--color-medium-dark)' }}>
            Los elementos aquí se eliminarán definitivamente después de 30 días.
          </p>
        </div>
        <div>
          <button 
            className="btn btn-secondary" 
            onClick={handleEmptyTrash}
            disabled={items.length === 0 || isLoading}
            style={{ color: '#d93025', borderColor: '#d93025' }}
          >
            Vaciar papelera
          </button>
        </div>
      </section>

      {isLoading && <div style={{ padding: '40px', textAlign: 'center' }}>Cargando papelera...</div>}
      {error && <div style={{ padding: '20px', backgroundColor: '#ffe5e5', color: '#d93025', borderRadius: '12px' }}>{error}</div>}

      {!isLoading && !error && (
        <section>
          {items.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--color-white)', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
              <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>🗑️</span>
              <h3 style={{ color: 'var(--color-dark)', marginBottom: '8px' }}>Tu papelera está vacía</h3>
              <p style={{ color: 'var(--color-medium-dark)' }}>No hay archivos ni carpetas eliminadas recientemente.</p>
            </div>
          ) : (
            <div className="cards-grid">
              {items.map(item => (
                <article 
                  key={item.id} 
                  className={item.type === 'folder' ? 'folder-card' : 'file-card'} 
                  onClick={() => handleCardClick(item)} 
                  style={{ cursor: 'not-allowed', opacity: 0.85 }} // Efecto visual de "deshabilitado/borrado"
                >
                  <div className={item.type === 'folder' ? 'folder-card-top' : 'file-card-top'}>
                    <span className={item.type === 'folder' ? 'folder-icon' : 'file-type'} style={{ filter: 'grayscale(100%)' }}>
                      {item.icon}
                    </span>
                    <button 
                      className="card-menu-btn" 
                      title="Opciones"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const action = window.prompt(`Opciones para ${item.name}:\n1. Restaurar\n2. Eliminar definitivamente\n\nEscribe 1 o 2:`);
                        if (action === '1') handleRestore(item.id);
                        if (action === '2') handlePermanentDelete(item.id, item.name);
                      }}
                    >⋮</button>
                  </div>
                  <div className={item.type === 'folder' ? 'folder-card-body' : 'file-card-body'}>
                    <h3 title={item.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', textDecoration: 'line-through', color: 'var(--color-medium-dark)' }}>
                      {getSecurityBadge(item.security)}
                      {item.name}
                    </h3>
                    <p>{item.info}</p>
                    {/* Nota que aquí dice "Eliminado" en lugar de "Modificado" o "Abierto" */}
                    <small style={{ color: '#d93025' }}>Eliminado: {item.deletedAt}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </PrivateLayout>
  )
}