// src/components/FileViewerModal.jsx

import { useState, useEffect, useRef } from 'react';
import { 
  FaTimes, FaDownload, FaSpinner, FaFileAlt, FaImage, FaFilePdf, 
  FaExclamationTriangle, FaVideo, FaFileCode, FaSearchPlus, 
  FaSearchMinus, FaArrowLeft, FaArrowRight, FaChevronLeft, 
  FaChevronRight, FaSyncAlt, FaExpand, FaCompress 
} from 'react-icons/fa';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar PDF.js worker - USANDO MÓDULO LOCAL
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export default function FileViewerModal({ isOpen, onClose, file, onDownload }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [downloadAvailable, setDownloadAvailable] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState(null);
  
  // Estados para PDF personalizado
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && file) {
      setLoadStartTime(Date.now());
      
      console.log("🎬 FileViewerModal ABRIENDO - file:", file);
      console.log("📋 file.previewBlob:", file.previewBlob);
      console.log("📋 file.previewUrl:", file.previewUrl);
      console.log("📋 file.fileType:", file.fileType);
      
      setLoading(true);
      setError(null);
      setTextContent(null);
      setCurrentPage(1);
      setTotalPages(0);
      setSidebarCollapsed(false);
      
      // Caso 1: Es un blob (PDF o imagen desde blob)
      if (file.previewBlob) {
        console.log("✅ Usando previewBlob");
        
        // Si es PDF, procesar con PDF.js
        if (file.fileType === 'application/pdf') {
          renderPdfFromBlob(file.previewBlob);
        } else {
          setPreviewUrl(file.previewBlob);
          setTimeout(() => setLoading(false), 500);
        }
      } 
      // Caso 2: Es una URL
      else if (file.previewUrl) {
        console.log("✅ Usando previewUrl");
        
        let decodedUrl = file.previewUrl;
        try {
          decodedUrl = decodeURIComponent(file.previewUrl);
        } catch (e) {
          console.warn("No se pudo decodificar la URL:", e);
        }
        
        if (file.fileType?.startsWith('text/')) {
          fetchTextContent(decodedUrl);
        } else if (file.fileType === 'application/pdf') {
          renderPdfFromUrl(decodedUrl);
        } else {
          setPreviewUrl(decodedUrl);
        }
      }
      // Caso 3: Es contenido de texto directo
      else if (file.textContent) {
        console.log("✅ Usando textContent");
        setTextContent(file.textContent);
        setLoading(false);
      }
      else {
        console.log("❌ No hay previewBlob, previewUrl ni textContent");
        setError('No se puede previsualizar este tipo de archivo');
        setLoading(false);
      }
      
      setDownloadAvailable(!!file.downloadUrl);
    }
    
    return () => {
      if (file?.previewBlob && file?.previewBlob.startsWith('blob:')) {
        URL.revokeObjectURL(file.previewBlob);
      }
      pdfDocRef.current = null;
    };
  }, [isOpen, file]);

  // Renderizar PDF desde Blob
  const renderPdfFromBlob = async (blobUrl) => {
    setPdfLoading(true);
    try {
      console.log("📄 Cargando PDF desde blob:", blobUrl);
      const loadingTask = pdfjsLib.getDocument(blobUrl);
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      // Esperar un poco para que el canvas esté listo
      setTimeout(() => renderPage(1, pdf), 100);
      setLoading(false);
      setPdfLoading(false);
    } catch (err) {
      console.error("Error cargando PDF:", err);
      setError('Error al cargar el PDF: ' + err.message);
      setLoading(false);
      setPdfLoading(false);
    }
  };

  // Renderizar PDF desde URL
  const renderPdfFromUrl = async (url) => {
    setPdfLoading(true);
    try {
      console.log("📄 Cargando PDF desde URL:", url);
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setTimeout(() => renderPage(1, pdf), 100);
      setLoading(false);
      setPdfLoading(false);
    } catch (err) {
      console.error("Error cargando PDF desde URL:", err);
      setError('Error al cargar el PDF: ' + err.message);
      setLoading(false);
      setPdfLoading(false);
    }
  };

  // Renderizar una página específica
  const renderPage = async (pageNum, pdfDoc = null) => {
    const doc = pdfDoc || pdfDocRef.current;
    if (!doc || !canvasRef.current) return;
    
    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: scale });
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      
      await page.render(renderContext).promise;
      console.log(`✅ Página ${pageNum} renderizada correctamente`);
    } catch (err) {
      console.error("Error renderizando página:", err);
    }
  };

  // Cambiar de página
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      renderPage(newPage);
    }
  };

  // Zoom in/out
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  // Reset zoom
  const resetZoom = () => {
    setScale(1.2);
  };

  // Fullscreen (alternativa)
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Cuando cambia la escala, re-renderizar
  useEffect(() => {
    if (pdfDocRef.current && currentPage) {
      renderPage(currentPage);
    }
  }, [scale]);

  const fetchTextContent = async (url) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      setTextContent(text);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching text:", err);
      setError('Error al cargar el contenido del texto');
      setLoading(false);
    }
  };

  const handleMediaLoad = () => {
    const loadTime = Date.now() - (loadStartTime || Date.now());
    console.log(`✅ Media cargada exitosamente en ${loadTime}ms`);
    setLoading(false);
  };

  const handleMediaError = (e) => {
    console.error("❌ Error al cargar media:", e);
    setLoading(false);
    setError('Error al cargar el archivo. La URL puede haber expirado.');
  };

  if (!isOpen) return null;

  const fileType = file?.fileType || '';
  const fileName = file?.name || file?.fileName || 'Archivo';
  const isImage = fileType.startsWith('image/');
  const isPdf = fileType === 'application/pdf';
  const isVideo = fileType.startsWith('video/');
  const isText = fileType.startsWith('text/') || fileType === 'application/json';

  const getFileIcon = () => {
    if (isImage) return <FaImage style={{ fontSize: '3rem', color: '#46A2FD' }} />;
    if (isPdf) return <FaFilePdf style={{ fontSize: '3rem', color: '#f5222d' }} />;
    if (isVideo) return <FaVideo style={{ fontSize: '3rem', color: '#52c41a' }} />;
    if (isText) return <FaFileCode style={{ fontSize: '3rem', color: '#faad14' }} />;
    return <FaFileAlt style={{ fontSize: '3rem', color: '#faad14' }} />;
  };

  const renderContent = () => {
    if (loading && !previewUrl && !textContent && !pdfDocRef.current) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '20px' }}>
          <FaSpinner style={{ animation: 'spin 1s linear infinite', fontSize: '3rem', color: '#46A2FD' }} />
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Cargando archivo seguro...</p>
          <p style={{ color: '#666', fontSize: '0.75rem' }}>Descifrando contenido protegido con AES-256</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <FaExclamationTriangle style={{ fontSize: '3rem', color: '#faad14', marginBottom: '16px' }} />
          <p style={{ color: '#888', marginBottom: '16px' }}>{error}</p>
          {downloadAvailable && (
            <button 
              onClick={() => onDownload && onDownload()}
              style={{ padding: '10px 24px', backgroundColor: '#0a3fff', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <FaDownload /> Descargar archivo
            </button>
          )}
        </div>
      );
    }

    // IMÁGENES
    if (isImage && previewUrl) {
      return (
        <div style={{ textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <FaSpinner style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: '#46A2FD' }} />
            </div>
          )}
          <img 
            src={previewUrl} 
            alt={fileName} 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain',
              display: loading ? 'none' : 'block'
            }}
            onLoad={handleMediaLoad}
            onError={handleMediaError}
          />
        </div>
      );
    }
    
    // PDFs - VISOR PERSONALIZADO CON BARRA LATERAL IZQUIERDA
// PDFs - VISOR PERSONALIZADO CON BARRA LATERAL IZQUIERDA Y SCROLL
    if (isPdf && !error) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', backgroundColor: '#0D1425' }}>
          
          {/* BARRA LATERAL IZQUIERDA */}
          <div style={{
            width: sidebarCollapsed ? '60px' : '280px',
            backgroundColor: '#1A2238',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            flexShrink: 0,
            zIndex: 10
          }}>
            {/* Botón colapsar/expandir */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                padding: '16px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                color: '#46A2FD',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '1rem'
              }}
              title={sidebarCollapsed ? "Expandir" : "Colapsar"}
            >
              {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              {!sidebarCollapsed && <span style={{ fontSize: '0.85rem' }}>Controles</span>}
            </button>

            {/* Controles de navegación */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {!sidebarCollapsed && (
                <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  NAVEGACIÓN
                </p>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: sidebarCollapsed ? 'center' : 'stretch' }}>
                {/* Ir a página */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
                  {!sidebarCollapsed && <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Página:</span>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      style={{
                        padding: '8px',
                        backgroundColor: currentPage <= 1 ? 'rgba(255,255,255,0.1)' : '#0a3fff',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage <= 1 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Página anterior"
                    >
                      <FaArrowLeft />
                    </button>
                    
                    {!sidebarCollapsed ? (
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                        style={{
                          width: '60px',
                          padding: '6px',
                          backgroundColor: '#0D1425',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '6px',
                          color: 'white',
                          textAlign: 'center',
                          fontSize: '0.85rem'
                        }}
                      />
                    ) : (
                      <span style={{ color: 'white', fontSize: '0.8rem', minWidth: '40px', textAlign: 'center' }}>
                        {currentPage}
                      </span>
                    )}
                    
                    {!sidebarCollapsed && (
                      <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
                        / {totalPages}
                      </span>
                    )}
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      style={{
                        padding: '8px',
                        backgroundColor: currentPage >= totalPages ? 'rgba(255,255,255,0.1)' : '#0a3fff',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage >= totalPages ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Página siguiente"
                    >
                      <FaArrowRight />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles de zoom */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {!sidebarCollapsed && (
                <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  ZOOM
                </p>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: sidebarCollapsed ? 'center' : 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
                  <button
                    onClick={zoomOut}
                    style={{
                      padding: '8px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Alejar"
                  >
                    <FaSearchMinus />
                  </button>
                  
                  {!sidebarCollapsed && (
                    <span style={{ color: 'white', fontSize: '0.85rem', minWidth: '60px', textAlign: 'center' }}>
                      {Math.round(scale * 100)}%
                    </span>
                  )}
                  
                  <button
                    onClick={zoomIn}
                    style={{
                      padding: '8px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Acercar"
                  >
                    <FaSearchPlus />
                  </button>
                  
                  {!sidebarCollapsed && (
                    <button
                      onClick={resetZoom}
                      style={{
                        padding: '8px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#46A2FD',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Restablecer zoom (120%)"
                    >
                      <FaSyncAlt />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Información del PDF */}
            {!sidebarCollapsed && (
              <div style={{ padding: '20px 16px' }}>
                <p style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  INFORMACIÓN
                </p>
                <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                  <p style={{ margin: '4px 0', wordBreak: 'break-word' }}>
                    <strong>Archivo:</strong> {fileName.length > 35 ? fileName.substring(0, 32) + '...' : fileName}
                  </p>
                  <p style={{ margin: '4px 0' }}><strong>Páginas:</strong> {totalPages}</p>
                  {file?.fileSize && (
                    <p style={{ margin: '4px 0' }}><strong>Tamaño:</strong> {formatFileSize(file.fileSize)}</p>
                  )}
                  <p style={{ margin: '4px 0', fontSize: '0.7rem', color: '#666' }}>
                    <strong>Zoom actual:</strong> {Math.round(scale * 100)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ÁREA PRINCIPAL DEL PDF CON SCROLL MEJORADO */}
          <div 
            ref={containerRef}
            style={{
              flex: 1,
              overflow: 'auto',  // ← SCROLL: permite moverte cuando el canvas es grande
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',  // ← Alinear arriba para que el scroll funcione mejor
              padding: '20px',
              backgroundColor: '#0D1425',
              position: 'relative'
            }}
          >
            {/* Botón de pantalla completa */}
            <button
              onClick={toggleFullscreen}
              style={{
                position: 'sticky',
                top: '10px',
                left: 'calc(100% - 100px)',
                padding: '8px 12px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                marginBottom: '10px'
              }}
              title="Pantalla completa"
            >
              <FaExpand /> <span>Completa</span>
            </button>

            {pdfLoading ? (
              <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: '#46A2FD' }} />
                <p style={{ color: '#888', marginTop: '12px' }}>Cargando PDF...</p>
              </div>
            ) : (
              <div style={{ minWidth: '100%', display: 'flex', justifyContent: 'center' }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    display: 'block',
                    maxWidth: 'none',  // ← Permite que el canvas sea más ancho que el contenedor
                    width: 'auto',
                    height: 'auto'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }
        
    // VIDEOS
    if (isVideo && previewUrl) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading && (
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <FaSpinner style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: '#46A2FD' }} />
              <p style={{ color: '#888', marginTop: '12px' }}>Cargando video...</p>
            </div>
          )}
          <video 
            controls 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              display: loading ? 'none' : 'block'
            }}
            onLoadedData={handleMediaLoad}
            onError={handleMediaError}
          >
            <source src={previewUrl} type={fileType} />
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
      );
    }
    
    // TEXTOS
    if (isText && (textContent || previewUrl)) {
      const content = textContent || "Contenido del archivo de texto";
      return (
        <div style={{ 
          backgroundColor: '#0D1425', 
          borderRadius: '8px', 
          padding: '16px',
          overflow: 'auto',
          height: '100%'
        }}>
          <pre style={{ 
            margin: 0, 
            color: '#e0e0e0', 
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}>
            {content}
          </pre>
        </div>
      );
    }
    
    // ARCHIVOS NO SOPORTADOS
    return (
      <div style={{ textAlign: 'center', padding: '60px 40px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>{getFileIcon()}</div>
        <h3 style={{ color: 'white', marginBottom: '12px' }}>Vista previa no disponible</h3>
        <p style={{ color: '#888', marginBottom: '24px', maxWidth: '400px', margin: '0 auto' }}>
          Este tipo de archivo ({fileType || 'desconocido'}) no se puede previsualizar en el navegador.
        </p>
        {downloadAvailable && (
          <button 
            onClick={() => onDownload && onDownload()}
            style={{ padding: '12px 32px', backgroundColor: '#0a3fff', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}
          >
            <FaDownload /> Descargar para ver
          </button>
        )}
      </div>
    );
  };

  // Estilo para la animación del spinner
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(19, 25, 36, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 4000,
        backdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '1300px',
          height: '85vh',
          backgroundColor: '#1D263C',
          borderRadius: '20px',
          border: '1px solid #0a3fff',
          boxShadow: '0 0 40px rgba(10, 63, 255, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getFileIcon()}
              <span>{fileName}</span>
            </h3>
            {file?.fileSize && (
              <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#888' }}>
                {formatFileSize(file.fileSize)}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', padding: '8px', borderRadius: '50%' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {renderContent()}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#666' }}>
            {isPdf && "🔒 Visualización segura con cifrado AES-256"}
            {isImage && "🖼️ Vista previa de imagen"}
            {isVideo && "🎬 Reproducción de video"}
            {isText && "📝 Vista previa de texto"}
          </div>
          <button 
            onClick={onClose}
            style={{ padding: '8px 20px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}