import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DetallesModal from '../components/DetallesModal';
import CompartirModal from '../components/CompartirModal';
import fileShareService from '../services/fileShareService'; // 🌟 Servicio real

const ArchivoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null);
  const [archivo, setArchivo] = useState(null); // 🌟 Estado para datos reales
  const [cargando, setCargando] = useState(true);

  // 1. Cargar metadatos y permisos del archivo
  useEffect(() => {
    fileShareService.viewFile(id) // Este endpoint incrementa el contador y valida acceso
      .then(response => {
        setArchivo(response.data.file); // Guardamos la respuesta del backend
        setCargando(false);
      })
      .catch(err => {
        console.error("Error al cargar archivo:", err);
        alert("No tienes permiso para ver este archivo o ha expirado.");
        navigate('/dashboard');
      });
  }, [id, navigate]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  // 2. Lógica real de descarga (pide URL al backend)
  const handleDownload = () => {
    fileShareService.downloadFile(id)
      .then(response => {
        const url = response.data.downloadUrl;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', archivo.fileName); // Nombre real
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(err => alert("Error al generar enlace de descarga"));
  };

  if (cargando) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Cargando archivo...</div>;

  return (
    <div className="file-viewer-container">
      <div className="viewer-toolbar">
        <div className="toolbar-left">
          <span className="viewer-filename">{archivo.fileName}</span>
        </div>

        <div className="toolbar-center">
          <button onClick={handleZoomOut} title="Alejar" className="toolbar-btn">➖</button>
          <span className="zoom-indicator">{zoom}%</span>
          <button onClick={handleZoomIn} title="Acercar" className="toolbar-btn">➕</button>
        </div>

        <div className="toolbar-right">
          {/* 🌟 BOTÓN DESCARGA: Solo visible si tiene permiso DOWNLOAD */}
          {archivo.accessLevel === 'DOWNLOAD' && (
            <button className="toolbar-btn" title="Descargar" onClick={handleDownload}>
              📥
            </button>
          )}

          {/* 🌟 BOTÓN COMPARTIR: Solo visible si tiene permiso DOWNLOAD (o lógica que decidas) */}
          {archivo.accessLevel === 'DOWNLOAD' && (
            <button className="toolbar-btn" title="Compartir" onClick={() => setIsShareModalOpen(true)}>
              🔗
            </button>
          )}

          <button className="card-menu-btn" onClick={(e) => {
            e.stopPropagation();
            setElementoSeleccionado(archivo);
          }}>⋮</button>
          
          <button className="toolbar-btn btn-close" onClick={() => navigate(-1)} title="Cerrar">✖</button>
        </div>
      </div>

      <div className="document-viewport">
        <div className="document-canvas" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
          {/* Usamos un visor que soporte la URL firmada por Azure */}
          <iframe src={archivo.fileUrl} title={archivo.fileName} className="viewer-iframe" />
        </div>
      </div>

      <DetallesModal 
        elemento={elementoSeleccionado} 
        onClose={() => setElementoSeleccionado(null)} 
      />
      
      <CompartirModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        item={archivo} 
      />
    </div>
  );
};

export default ArchivoDetalle;