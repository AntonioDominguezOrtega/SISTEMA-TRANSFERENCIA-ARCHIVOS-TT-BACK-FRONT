import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DetallesModal from '../components/DetallesModal';
import CompartirModal from '../components/CompartirModal'; // Nuevo

const ArchivoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null);

  const archivo = {
    id,
    nombre: "Documento_Final_Proyecto.pdf",
    tipo: "pdf",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fecha: "20/05/2026",
    tamano: "2.4 MB"
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = archivo.url;
    link.download = archivo.nombre;
    link.click();
  };

  return (
    <div className="file-viewer-container">
      
      <div className="viewer-toolbar">
        <div className="toolbar-left">
          <span className="viewer-filename">{archivo.nombre}</span>
        </div>

        <div className="toolbar-center">
          <button onClick={handleZoomOut} title="Alejar" className="toolbar-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
          <span className="zoom-indicator">{zoom}%</span>
          <button onClick={handleZoomIn} title="Acercar" className="toolbar-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </button>
        </div>

        <div className="toolbar-right">
          <button className="toolbar-btn" title="Descargar" onClick={handleDownload}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>
          <button className="toolbar-btn" title="Compartir" onClick={() => setIsShareModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          </button>
          <button className="card-menu-btn" onClick={(e) => {
                      e.stopPropagation();
                      setElementoSeleccionado(archivo);
                    }}>⋮</button>
          <div className="toolbar-divider"></div>
          <button className="toolbar-btn btn-close" onClick={() => navigate(-1)} title="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div className="document-viewport">
        <div className="document-canvas" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
          <iframe src={`${archivo.url}#toolbar=0`} title={archivo.nombre} className="viewer-iframe" />
        </div>
      </div>

      {/* Modal Global */}
      <DetallesModal 
        elemento={elementoSeleccionado} 
        onClose={() => setElementoSeleccionado(null)} 
      />
      
      {/* Uso del nuevo componente global */}
      <CompartirModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        item={archivo} 
      />
    </div>
  );
};

export default ArchivoDetalle;