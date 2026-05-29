// src/components/PdfViewerCustom.jsx
import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FaMinus, FaPlus, FaSpinner } from 'react-icons/fa';

// ✅ Configuración del worker con la versión instalada
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfViewerCustom({ url, fileName }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPageNumber(1);
    setScale(1.0);
  }, [url]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF cargado correctamente, páginas:', numPages);
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (err) => {
    console.error('Error cargando PDF:', err);
    setError('No se pudo cargar el PDF. El archivo podría estar dañado.');
    setLoading(false);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);
  const nextPage = () => pageNumber < numPages && setPageNumber(pageNumber + 1);
  const prevPage = () => pageNumber > 1 && setPageNumber(pageNumber - 1);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de herramientas personalizada */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '12px 16px',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexWrap: 'wrap'
      }}>
        {/* Controles de página */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              color: 'white',
              cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer',
              opacity: pageNumber <= 1 ? 0.5 : 1
            }}
          >
            ◀
          </button>
          <span style={{ color: 'white', fontSize: '0.85rem' }}>
            Página {pageNumber} de {numPages || '?'}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              color: 'white',
              cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer',
              opacity: pageNumber >= numPages ? 0.5 : 1
            }}
          >
            ▶
          </button>
        </div>

        {/* Separador */}
        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

        {/* Controles de zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              color: 'white',
              cursor: scale <= 0.5 ? 'not-allowed' : 'pointer',
              opacity: scale <= 0.5 ? 0.5 : 1
            }}
            title="Disminuir zoom"
          >
            <FaMinus />
          </button>
          <button
            onClick={resetZoom}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.5}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              color: 'white',
              cursor: scale >= 2.5 ? 'not-allowed' : 'pointer',
              opacity: scale >= 2.5 ? 0.5 : 1
            }}
            title="Aumentar zoom"
          >
            <FaPlus />
          </button>
        </div>
      </div>

      {/* Visor del PDF */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '20px',
        backgroundColor: '#0D1425'
      }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#888' }}>
            <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
            <span>Cargando PDF...</span>
          </div>
        )}
        
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={null}
          />
        </Document>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .react-pdf__Page__canvas {
          margin: 0 auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}