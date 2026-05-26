// src/components/FileSelectorModal.jsx
import { useState, useEffect } from 'react';
import { FaFolder, FaFileAlt, FaChevronRight, FaChevronDown, FaTimes, FaCheck } from 'react-icons/fa';
import storageService from '../services/storageService';

export default function FileSelectorModal({ isOpen, onClose, onSelect, selectedIds = [] }) {
  const [estructura, setEstructura] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFiles, setSelectedFiles] = useState(selectedIds);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentContents, setCurrentContents] = useState([]);

  // Cargar contenido de la carpeta actual
  const loadFolderContents = async (folderId = null) => {
    setCargando(true);
    try {
      const result = await storageService.getFolderContents(folderId);
      const contents = result.contents || [];
      
      // Separar carpetas y archivos
      const carpetas = contents.filter(item => item.isFolder === true);
      const archivos = contents.filter(item => item.isFolder !== true);
      
      setCurrentContents([...carpetas, ...archivos]);
    } catch (error) {
      console.error('Error cargando contenido:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cargar estructura inicial
  useEffect(() => {
    if (isOpen) {
      loadFolderContents(currentFolderId);
    }
  }, [isOpen, currentFolderId]);

  // Navegar a una carpeta
  const navigateToFolder = (folderId, folderName) => {
    setBreadcrumb([...breadcrumb, { id: folderId, name: folderName }]);
    setCurrentFolderId(folderId);
  };

  // Volver a la carpeta anterior
  const goBack = () => {
    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.pop();
    setBreadcrumb(newBreadcrumb);
    setCurrentFolderId(newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].id : null);
  };

  // Ir a la raíz
  const goToRoot = () => {
    setBreadcrumb([]);
    setCurrentFolderId(null);
  };

  // Toggle selección de archivo
  const toggleFileSelection = (file) => {
    if (selectedFiles.some(f => f.id === file.id)) {
      setSelectedFiles(selectedFiles.filter(f => f.id !== file.id));
    } else {
      setSelectedFiles([...selectedFiles, { id: file.id, name: file.name }]);
    }
  };

  // Confirmar selección
  const handleConfirm = () => {
    onSelect(selectedFiles);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(19, 25, 36, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 3000, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '650px', maxWidth: '90vw', height: '550px', maxHeight: '80vh',
        backgroundColor: '#1D263C', borderRadius: '16px', border: '1px solid #0a3fff',
        boxShadow: '0 0 30px rgba(10, 63, 255, 0.4)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          <div>
            <h3 style={{ margin: 0, color: 'white' }}>Seleccionar archivos de mi nube</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#888' }}>
              Selecciona los archivos que quieres compartir
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>
            <FaTimes />
          </button>
        </div>

        {/* Breadcrumb */}
        <div style={{
          padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.85rem'
        }}>
          <button onClick={goToRoot} style={{ background: 'none', border: 'none', color: currentFolderId === null ? '#0a3fff' : '#888', cursor: 'pointer' }}>
            Mi unidad
          </button>
          {breadcrumb.map((item, index) => (
            <span key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaChevronRight style={{ color: '#555', fontSize: '0.7rem' }} />
              <button
                onClick={() => {
                  const newBreadcrumb = breadcrumb.slice(0, index + 1);
                  setBreadcrumb(newBreadcrumb);
                  setCurrentFolderId(item.id);
                }}
                style={{ background: 'none', border: 'none', color: index === breadcrumb.length - 1 ? '#0a3fff' : '#888', cursor: 'pointer' }}
              >
                {item.name}
              </button>
            </span>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Cargando...</div>
          ) : currentContents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <FaFolder style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.5 }} />
              <p>Esta carpeta está vacía</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {currentContents.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: '8px',
                    backgroundColor: selectedFiles.some(f => f.id === item.id) ? 'rgba(10, 63, 255, 0.15)' : 'transparent',
                    border: selectedFiles.some(f => f.id === item.id) ? '1px solid rgba(10, 63, 255, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                    cursor: item.isFolder ? 'pointer' : 'default',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (item.isFolder) {
                      navigateToFolder(item.id, item.name);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!item.isFolder) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!item.isFolder && !selectedFiles.some(f => f.id === item.id)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {item.isFolder ? (
                      <FaFolder style={{ color: '#faad14', fontSize: '1.2rem' }} />
                    ) : (
                      <FaFileAlt style={{ color: '#46A2FD', fontSize: '1.1rem' }} />
                    )}
                    <div>
                      <div style={{ color: 'white', fontSize: '0.9rem' }}>{item.name}</div>
                      {!item.isFolder && (
                        <div style={{ fontSize: '0.7rem', color: '#888' }}>
                          {formatFileSize(item.fileSize)} • Subido {new Date(item.uploadedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!item.isFolder && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFileSelection(item);
                      }}
                      style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        backgroundColor: selectedFiles.some(f => f.id === item.id) ? '#0a3fff' : 'rgba(255,255,255,0.1)',
                        border: 'none', color: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <FaCheck style={{ fontSize: '0.8rem', opacity: selectedFiles.some(f => f.id === item.id) ? 1 : 0.5 }} />
                    </button>
                  )}
                  
                  {item.isFolder && (
                    <FaChevronRight style={{ color: '#555', fontSize: '0.8rem' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ color: '#888', fontSize: '0.85rem' }}>
            {selectedFiles.length} archivo(s) seleccionado(s)
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{ padding: '8px 20px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              style={{ padding: '8px 20px', backgroundColor: '#0a3fff', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
              disabled={selectedFiles.length === 0}
            >
              Seleccionar ({selectedFiles.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper para formatear tamaño
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}