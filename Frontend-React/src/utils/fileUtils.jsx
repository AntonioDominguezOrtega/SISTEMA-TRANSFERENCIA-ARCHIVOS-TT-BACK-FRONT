// src/utils/fileUtils.jsx
import { IoDocumentText, IoImage } from 'react-icons/io5';
import { FaUnlock, FaLock, FaShieldAlt } from 'react-icons/fa';

export const getFileIcon = (fileType = '') => {
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf') || type.includes('doc') || type.includes('txt') || type.includes('xls')) 
    return <IoDocumentText />;
  if (type.includes('image')) return <IoImage />;
  return <IoDocumentText />;
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const formatDate = (dateStr) => {
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

export const formatFullDate = (dateStr) => {
  if (!dateStr) return 'No disponible';
  return new Date(dateStr).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const renderSecurityBadge = (securityLevel, isUnlocked, hasPassword) => {
  if (!securityLevel || securityLevel === 'PUBLIC') {
    return <FaUnlock title="Público - Acceso sin restricciones" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
  }
  if (securityLevel === 'PASSWORD') {
    if (isUnlocked) return <FaUnlock title="Desbloqueado con contraseña (válido por 24h)" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
    return <FaLock title="Protegido con contraseña - Requiere autenticación" style={{ color: '#faad14', marginRight: '8px', minWidth: '16px' }} />;
  }
  if (securityLevel === 'TOKEN_SMS') {
    if (isUnlocked) return <FaUnlock title="Desbloqueado vía correo electrónico (válido por 24h)" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
    return <FaShieldAlt title="Requiere verificación por correo - Máxima seguridad" style={{ color: '#0a3fff', marginRight: '8px', minWidth: '16px' }} />;
  }
  return <FaUnlock title="Público" style={{ color: '#52c41a', marginRight: '8px', minWidth: '16px' }} />;
};