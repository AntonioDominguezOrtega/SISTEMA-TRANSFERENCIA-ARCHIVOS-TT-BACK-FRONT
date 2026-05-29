// src/pages/Papelera.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PrivateLayout from '../components/PrivateLayout';
import dashboardService from '../services/dashboardService';
import storageService from '../services/storageService';

// React Icons
import { 
  FaFolderOpen, FaFileAlt, FaTrash, FaTrashRestore, 
  FaExclamationTriangle, FaClock, FaRegTrashAlt
} from 'react-icons/fa';
import { IoDocumentText, IoImage } from 'react-icons/io5';

// Mapeo de íconos
const getFileIcon = (fileType = '') => {
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf') || type.includes('doc') || type.includes('txt') || type.includes('xls')) 
    return <IoDocumentText />;
  if (type.includes('image')) return <IoImage />;
  return <IoDocumentText />;
};

// Formatear tamaño
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Formatear fecha
const formatDate = (dateStr) => {
  if (!dateStr) return 'Fecha no disponible';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Justo ahora';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Formatear fecha completa
const formatFullDate = (dateStr) => {
  if (!dateStr) return 'No disponible';
  return new Date(dateStr).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Papelera() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trashItems, setTrashItems] = useState([]);
  const [accionEnProceso, setAccionEnProceso] = useState(false);
  const [panelMessage, setPanelMessage] = useState({ type: null, text: null });
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);

  // Limpiar mensajes
  useEffect(() => {
    if (panelMessage.text) {
      const timer = setTimeout(() => setPanelMessage({ type: null, text: null }), 3000);
      return () => clearTimeout(timer);
    }
  }, [panelMessage]);

  // Cargar datos de la papelera
  const loadTrash = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getTrash();
      const items = result.trash || [];
      
      // Ordenar por fecha de eliminación (más reciente primero)
      items.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
      
      setTrashItems(items);
    } catch (err) {
      console.error('Error cargando papelera:', err);
      setError(err.response?.data?.error || 'Error al cargar la papelera');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  // Restaurar elemento
  const handleRestore = async (itemId, itemName) => {
    setAccionEnProceso(true);
    try {
      await dashboardService.restoreItem(itemId);
      setPanelMessage({ type: 'success', text: `✅ "${itemName}" restaurado exitosamente` });
      await loadTrash();
      setItemSeleccionado(null);
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || `Error al restaurar "${itemName}"` });
    } finally {
      setAccionEnProceso(false);
      setShowConfirmModal(false);
    }
  };

  // Eliminar permanentemente
  const handlePermanentDelete = async (itemId, itemName) => {
    setAccionEnProceso(true);
    try {
      await dashboardService.permanentDelete(itemId);
      setPanelMessage({ type: 'success', text: `🗑️ "${itemName}" eliminado permanentemente` });
      await loadTrash();
      setItemSeleccionado(null);
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || `Error al eliminar "${itemName}"` });
    } finally {
      setAccionEnProceso(false);
      setShowConfirmModal(false);
    }
  };

  // Vaciar toda la papelera
  const handleEmptyTrash = async () => {
    setAccionEnProceso(true);
    try {
      await dashboardService.emptyTrash();
      setPanelMessage({ type: 'success', text: '🗑️ Papelera vaciada exitosamente' });
      await loadTrash();
    } catch (err) {
      setPanelMessage({ type: 'error', text: err.response?.data?.error || 'Error al vaciar la papelera' });
    } finally {
      setAccionEnProceso(false);
      setShowConfirmModal(false);
    }
  };

  // Abrir modal de confirmación
  const openConfirmModal = (action, itemId, itemName) => {
    setConfirmAction({ action, itemId, itemName });
    setShowConfirmModal(true);
  };

  const confirmActionHandler = () => {
    if (confirmAction.action === 'restore') {
      handleRestore(confirmAction.itemId, confirmAction.itemName);
    } else if (confirmAction.action === 'delete') {
      handlePermanentDelete(confirmAction.itemId, confirmAction.itemName);
    } else if (confirmAction.action === 'empty') {
      handleEmptyTrash();
    }
  };

  // Calcular días restantes hasta eliminación permanente
  const getDaysLeft = (deletedAt) => {
    const deleted = new Date(deletedAt);
    const expiry = new Date(deleted.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  // Renderizar tarjeta de elemento en papelera
  const renderTrashCard = (item) => {
    const daysLeft = getDaysLeft(item.deletedAt);
    const isExpiringSoon = daysLeft <= 2 && daysLeft > 0;
    
    return (
      <article 
        key={item.id} 
        onClick={() => setItemSeleccionado(item)}
        style={{ 
          cursor: 'pointer', 
          backgroundColor: '#1D263C', 
          borderRadius: '12px', 
          padding: '20px', 
          border: itemSeleccionado?.id === item.id ? '2px solid #0a3fff' : '1px solid rgba(255,255,255,0.05)',
          opacity: 0.85,
          transition: 'all 0.2s',
          position: 'relative'
        }}
      >
        {isExpiringSoon && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: '#faad14',
            color: '#1D263C',
            fontSize: '0.65rem',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            ⚠️ Expira pronto
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span style={{ fontSize: '2rem', color: '#888', filter: 'grayscale(100%)' }}>
            {item.isFolder ? '📁' : getFileIcon(item.fileType)}
          </span>
          <span style={{ 
            fontSize: '0.7rem', 
            backgroundColor: 'rgba(255,255,255,0.06)', 
            padding: '4px 8px', 
            borderRadius: '4px',
            color: '#888'
          }}>
            {item.isFolder ? 'Carpeta' : 'Archivo'}
          </span>
        </div>
        
        <h3 style={{ 
          margin: 0, 
          fontSize: '0.9rem', 
          display: 'flex', 
          alignItems: 'center', 
          color: '#aaa',
          textDecoration: 'line-through'
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
        </h3>
        
        {!item.isFolder && (
          <p style={{ margin: '6px 0 0 0', fontSize: '0.7rem', color: '#666' }}>
            {formatFileSize(item.fileSize)}
          </p>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
          <FaClock style={{ fontSize: '0.7rem', color: '#666' }} />
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#666' }}>
            Eliminado {formatDate(item.deletedAt)}
          </p>
        </div>
        
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          backgroundColor: isExpiringSoon ? 'rgba(250,173,20,0.15)' : 'rgba(255,255,255,0.05)', 
          borderRadius: '6px' 
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '0.7rem', 
            color: isExpiringSoon ? '#faad14' : '#888',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <FaExclamationTriangle style={{ fontSize: '0.7rem' }} />
            {daysLeft > 0 
              ? `Se eliminará permanentemente en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`
              : 'Será eliminado permanentemente pronto'}
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginTop: '15px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirmModal('restore', item.id, item.name);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#52c41a',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(82,196,26,0.1)'
            }}
            title="Restaurar"
            disabled={accionEnProceso}
          >
            <FaTrashRestore /> Restaurar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirmModal('delete', item.id, item.name);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#f5222d',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(245,34,45,0.1)'
            }}
            title="Eliminar permanentemente"
            disabled={accionEnProceso}
          >
            <FaTrash /> Eliminar
          </button>
        </div>
      </article>
    );
  };

  const isLoading = loading;

  return (
    <PrivateLayout>
      <main style={{ 
        paddingTop: '110px', 
        paddingBottom: '60px', 
        maxWidth: '1300px', 
        margin: '0 auto', 
        paddingLeft: '20px', 
        paddingRight: '20px' 
      }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '35px', 
          flexWrap: 'wrap', 
          gap: '15px' 
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', color: '#f5222d', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaRegTrashAlt /> Papelera
            </h1>
            <p style={{ color: '#888' }}>
              Los elementos aquí se eliminarán definitivamente después de 7 días.
            </p>
          </div>
          
          {trashItems.length > 0 && (
            <button 
              onClick={() => openConfirmModal('empty', null, null)}
              disabled={accionEnProceso}
              className="btn"
              style={{ 
                backgroundColor: 'rgba(245, 34, 45, 0.15)', 
                color: '#f5222d', 
                border: '1px solid rgba(245, 34, 45, 0.3)',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: accionEnProceso ? 'not-allowed' : 'pointer',
                opacity: accionEnProceso ? 0.6 : 1
              }}
            >
              <FaTrash /> Vaciar papelera
            </button>
          )}
        </div>

        {/* Mensajes */}
        {error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'rgba(245, 34, 45, 0.15)', 
            color: '#f5222d', 
            border: '1px solid rgba(245, 34, 45, 0.2)', 
            borderRadius: '10px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}
        
        {panelMessage.text && panelMessage.type === 'success' && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'rgba(82,196,26,0.15)', 
            color: '#52c41a', 
            border: '1px solid rgba(82,196,26,0.2)', 
            borderRadius: '10px', 
            marginBottom: '20px' 
          }}>
            {panelMessage.text}
          </div>
        )}
        
        {panelMessage.text && panelMessage.type === 'error' && !error && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'rgba(245, 34, 45, 0.15)', 
            color: '#f5222d', 
            border: '1px solid rgba(245, 34, 45, 0.2)', 
            borderRadius: '10px', 
            marginBottom: '20px' 
          }}>
            {panelMessage.text}
          </div>
        )}

        {/* Contenido principal */}
        <section>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Cargando papelera...</div>
          ) : trashItems.length === 0 ? (
            <div style={{ 
              padding: '60px 20px', 
              textAlign: 'center', 
              border: '1px dashed rgba(255,255,255,0.1)', 
              borderRadius: '16px' 
            }}>
              <FaRegTrashAlt style={{ fontSize: '4rem', marginBottom: '16px', opacity: 0.5, color: '#888' }} />
              <h3 style={{ color: 'white', marginBottom: '8px' }}>Tu papelera está vacía</h3>
              <p style={{ color: '#888' }}>No hay archivos ni carpetas eliminados recientemente.</p>
            </div>
          ) : (
            <>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '20px' 
              }}>
                {trashItems.map(item => renderTrashCard(item))}
              </div>
              
              <div style={{ 
                marginTop: '24px', 
                padding: '16px', 
                backgroundColor: 'rgba(245,34,45,0.08)', 
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#f5222d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FaExclamationTriangle />
                  Los elementos en la papelera se eliminarán permanentemente después de 7 días.
                </p>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'rgba(19,25,36,0.9)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 3000, 
          backdropFilter: 'blur(4px)' 
        }}>
          <div style={{ 
            width: '420px', 
            padding: '2rem', 
            backgroundColor: '#1D263C', 
            borderRadius: '16px', 
            border: confirmAction?.action === 'delete' || confirmAction?.action === 'empty' ? '1px solid #f5222d' : '1px solid #52c41a',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ 
              textAlign: 'center', 
              marginBottom: '15px', 
              color: confirmAction?.action === 'delete' || confirmAction?.action === 'empty' ? '#f5222d' : '#52c41a' 
            }}>
              {confirmAction?.action === 'restore' ? 'Restaurar elemento' : 
               confirmAction?.action === 'delete' ? 'Eliminar permanentemente' : 
               'Vaciar papelera'}
            </h3>
            
            <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '20px' }}>
              {confirmAction?.action === 'restore' ? 
                `¿Estás seguro de que deseas restaurar "${confirmAction?.itemName}"?` :
               confirmAction?.action === 'delete' ? 
                `¿Estás seguro de que deseas eliminar permanentemente "${confirmAction?.itemName}"? Esta acción no se puede deshacer.` :
                `¿Estás seguro de que deseas vaciar toda la papelera? Todos los archivos se perderán permanentemente.`}
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={confirmActionHandler}
                disabled={accionEnProceso}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  backgroundColor: confirmAction?.action === 'restore' ? 'rgba(82,196,26,0.15)' : 'rgba(245,34,45,0.15)',
                  border: confirmAction?.action === 'restore' ? '1px solid rgba(82,196,26,0.3)' : '1px solid rgba(245,34,45,0.3)',
                  borderRadius: '8px', 
                  color: confirmAction?.action === 'restore' ? '#52c41a' : '#f5222d',
                  cursor: accionEnProceso ? 'not-allowed' : 'pointer',
                  opacity: accionEnProceso ? 0.6 : 1
                }}
              >
                {accionEnProceso ? 'Procesando...' : (confirmAction?.action === 'restore' ? '✓ Restaurar' : '🗑️ Eliminar')}
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{ 
                  flex: 1, 
                  padding: '12px', 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  color: 'white', 
                  cursor: 'pointer' 
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </PrivateLayout>
  );
}