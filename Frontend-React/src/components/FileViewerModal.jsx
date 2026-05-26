// src/components/FileViewerModal.jsx
import { useState, useEffect } from 'react';
import { FaTimes, FaDownload, FaSpinner, FaFileAlt, FaImage, FaFilePdf, FaExclamationTriangle, FaVideo } from 'react-icons/fa';

export default function FileViewerModal({ isOpen, onClose, file, onDownload }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadAvailable, setDownloadAvailable] = useState(false);

  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setError(null);
      
      if (file.previewUrl) {
        setPreviewUrl(file.previewUrl);
        setTimeout(() => setLoading(false), 500);
      } else {
        setError('No se puede previsualizar este tipo de archivo');
        setLoading(false);
      }
      
      setDownloadAvailable(!!file.downloadUrl);
    }
  }, [isOpen, file]);

  if (!isOpen) return null;

  const fileType = file?.fileType || '';
  const fileName = file?.name || file?.fileName || 'Archivo';
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  const isImage = fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
  const isPdf = fileType === 'application/pdf' || fileExtension === 'pdf';
  const isVideo = fileType.startsWith('video/') || ['mp4', 'webm', 'ogg'].includes(fileExtension);
  const isAudio = fileType.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(fileExtension);
  const isWord = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-word.document.macroEnabled.12',
    'doc',
    'docx'
  ].includes(fileType) || ['doc', 'docx'].includes(fileExtension);
  const isExcel = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls',
    'xlsx'
  ].includes(fileType) || ['xls', 'xlsx'].includes(fileExtension);
  const isPowerPoint = [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt',
    'pptx'
  ].includes(fileType) || ['ppt', 'pptx'].includes(fileExtension);
  const isText = fileType.startsWith('text/') || ['txt', 'csv', 'json', 'md'].includes(fileExtension);

  const getFileIcon = () => {
    if (isImage) return <FaImage style={{ fontSize: '3rem', color: '#46A2FD' }} />;
    if (isPdf) return <FaFilePdf style={{ fontSize: '3rem', color: '#f5222d' }} />;
    if (isVideo) return <FaVideo style={{ fontSize: '3rem', color: '#52c41a' }} />;
    if (isWord || isExcel || isPowerPoint) return <FaFileAlt style={{ fontSize: '3rem', color: '#faad14' }} />;
    if (isAudio) return <FaFileAlt style={{ fontSize: '3rem', color: '#13c2c2' }} />;
    return <FaFileAlt style={{ fontSize: '3rem', color: '#faad14' }} />;
  };

  const canPreview = !!previewUrl && (isImage || isPdf || isVideo || isAudio || isText);
  const canOpenInNewTab = !!previewUrl || !!file.downloadUrl;

  const renderActionButtons = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
      {downloadAvailable && (
        <button
          onClick={() => onDownload && onDownload()}
          style={{ padding: '10px 24px', backgroundColor: '#0a3fff', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <FaDownload /> Descargar
        </button>
      )}
      {canOpenInNewTab && (
        <button
          onClick={() => {
            const url = previewUrl || file.downloadUrl;
            window.open(url, '_blank', 'noopener');
          }}
          style={{ padding: '10px 24px', backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
        >
          Abrir en nueva pestaña
        </button>
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', flexDirection: 'column', gap: '16px' }}>
          <FaSpinner style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', color: '#46A2FD' }} />
          <p style={{ color: '#888' }}>Cargando vista previa...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <FaExclamationTriangle style={{ fontSize: '3rem', color: '#faad14', marginBottom: '16px' }} />
          <p style={{ color: '#888', marginBottom: '16px' }}>{error}</p>
          {renderActionButtons()}
        </div>
      );
    }

    if (previewUrl) {
      if (isImage) {
        return (
          <div style={{ textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', flexDirection: 'column' }}>
            <img 
              src={previewUrl} 
              alt={fileName} 
              style={{ maxWidth: '100%', maxHeight: 'calc(100% - 80px)', objectFit: 'contain' }}
              onError={() => setError('Error al cargar la imagen')}
            />
            {renderActionButtons()}
          </div>
        );
      }
      
      if (isPdf) {
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <iframe
              src={`${previewUrl}#toolbar=0&navpanes=0`}  // ← toolbar=0 oculta botones de descarga
              title={fileName}
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
              onError={() => setError('Error al cargar el PDF')}
            />
            {renderActionButtons()}
          </div>
        );
      }
      
      if (isVideo) {
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <video 
              controls 
              style={{ maxWidth: '100%', maxHeight: '100%' }}
              onError={() => setError('Error al cargar el video')}
            >
              <source src={previewUrl} type={fileType} />
            </video>
            {renderActionButtons()}
          </div>
        );
      }
      
      if (isAudio) {
        return (
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
            <audio controls style={{ width: '100%' }}>
              <source src={previewUrl} type={fileType} />
            </audio>
            {renderActionButtons()}
          </div>
        );
      }

      if (isText) {
        return (
          <div style={{ width: '100%', height: '100%', overflow: 'auto', backgroundColor: '#111827', borderRadius: '12px', padding: '20px' }}>
            <iframe
              src={previewUrl}
              title={fileName}
              style={{ width: '100%', minHeight: 'calc(100% - 80px)', border: 'none' }}
            />
            {renderActionButtons()}
          </div>
        );
      }

      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{getFileIcon()}</div>
          <p style={{ color: 'white', marginBottom: '8px' }}>{fileName}</p>
          <p style={{ color: '#bbb', marginBottom: '16px' }}>
            Este tipo de archivo no tiene vista previa disponible en el navegador.
          </p>
          {renderActionButtons()}
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{getFileIcon()}</div>
        <p style={{ color: 'white', marginBottom: '8px' }}>{fileName}</p>
        <p style={{ color: '#bbb', marginBottom: '16px' }}>
          No hay vista previa disponible para este archivo.
        </p>
        {renderActionButtons()}
      </div>
    );
  };

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
          maxWidth: '1100px',
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
            <h3 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: '600' }}>{fileName}</h3>
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
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', minHeight: 0 }}>
          {renderContent()}
        </div>

        {/* Footer - Solo botón de cerrar, descarga condicional */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
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