# 🛡️ Capara - Sistema de Transferencia de Archivos Seguro

<div align="center">
  <h3>Instituto Politécnico Nacional</h3>
  <h4>Escuela Superior de Cómputo</h4>
  <p><strong>Trabajo Terminal 2026-A202</strong></p>
</div>

---

## 👥 Equipo de Trabajo

**Presentan:**
- Domínguez Ortega Antonio de Jesús
- García Gaspar Ambar Stephania
- Hernández Aranda Héctor Alejandro

**Directores:**
- López Rojas Ariel
- Rodríguez Sarabia Tania

**Sinodales:**
- Sandra Ivette Bautista Rosales
- Chadwick Carreto Arellano
- Ricardo Felipe Díaz Santiago

---

## 📝 Descripción del Proyecto
Capara es una plataforma web orientada a la **transferencia y almacenamiento seguro de archivos**. Diseñada bajo una arquitectura Cliente-Servidor, la plataforma utiliza estándares de grado militar como **cifrado AES-256** para asegurar los datos, verificación en dos pasos (2FA) y almacenamiento escalable respaldado íntegramente por la nube de Microsoft Azure. Su objetivo principal es garantizar la integridad, disponibilidad y confidencialidad absoluta de la información de los usuarios.

---

## 🌐 Enlaces del Proyecto Desplegado

El proyecto se encuentra totalmente desplegado y funcional en la infraestructura de Azure:

- **Plataforma Web (Frontend):** [https://yellow-cliff-06ded060f.7.azurestaticapps.net](https://yellow-cliff-06ded060f.7.azurestaticapps.net)
- **API (Backend):** `https://capara-ebf3cygrguhfaefv.mexicocentral-01.azurewebsites.net`
- **Base de Datos:** Azure Database for MySQL Flexible Server (`capara-bd.mysql.database.azure.com`)
- **Almacenamiento:** Azure Blob Storage

---

## ✨ Características Principales

- **🔐 Autenticación y Seguridad Avanzada:** 
  - Inicio de sesión seguro gestionado con JSON Web Tokens (JWT).
  - Autenticación Multi-Factor (MFA) a través de correo electrónico.
  - Bloqueo de seguridad automatizado tras exceder el límite de intentos fallidos de contraseñas o tokens.
- **🗂️ Gestión de Archivos y Almacenamiento:** 
  - Subida, descarga y organización jerárquica de archivos.
  - Cifrado automático (AES-256) de extremo a extremo antes del almacenamiento en Azure Blob Storage.
- **🌐 Directorio y Red de Contactos:** 
  - Búsqueda de usuarios registrados en la plataforma.
  - Libreta de "Contactos Frecuentes" para agilizar transferencias seguras.
- **👤 Perfil y Monitoreo:** 
  - Personalización de la cuenta y gestión segura de fotografía de perfil utilizando Tokens SAS.
  - Monitoreo del almacenamiento en la nube y administración de planes de uso.
- **🔍 Motor de Búsqueda Inteligente:** 
  - Búsqueda global al vuelo con sugerencias en vivo para archivos propios, carpetas y elementos compartidos, recuperando la metadata completa de forma instantánea.

---

## 🛠️ Tecnologías e Infraestructura

**Frontend (Azure Static Web Apps):**
- ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) 
- React Router DOM
- Axios
- CSS puro para diseño fluido y animaciones

**Backend (Azure App Service):**
- ![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white) ![Spring Boot](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
- Java 17+ (Compatible con JDK 21)
- Spring Security
- Maven

**Base de Datos y Almacenamiento (Azure):**
- ![Azure](https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white) ![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white) 
- Azure Blob Storage
- Azure Database for MySQL (`auth_sms_db`)
---
```bash📂 Estructura del Repositorio
Plaintext
📁 sistema-transferencia-archivos-tt-back-front
├── 📁 demo/                  # Código fuente del Backend (Spring Boot)
│   ├── src/main/java/...     # Controladores, Servicios, Modelos, DTOs, Seguridad
│   └── src/main/resources/   # Propiedades y Plantillas HTML para correos
└── 📁 Frontend-React/        # Código fuente del Frontend (React + Vite)
    ├── src/components/       # Componentes reutilizables (Headers, Modales, Sidebar)
    ├── src/pages/            # Vistas principales (Dashboard, Perfil, Contactos)
    ├── src/services/         # Conexión con los endpoints del API (Axios)
    └── public/               # Imágenes, Íconos y configuración de enrutamiento (Azure)

```
