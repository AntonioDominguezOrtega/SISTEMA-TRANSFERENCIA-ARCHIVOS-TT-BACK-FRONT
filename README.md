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
Este proyecto es una plataforma web orientada a la **transferencia y almacenamiento seguro de archivos**. Utiliza cifrado de extremo a extremo, verificación en dos pasos (2FA) vía SMS y almacenamiento en la nube (Azure Blob Storage) para garantizar la integridad y confidencialidad de la información. El sistema está compuesto por una arquitectura Cliente-Servidor (React + Spring Boot).

## ✨ Funciones y Secciones Principales

- **🔐 Autenticación y Seguridad:** - Inicio de sesión seguro con Json Web Tokens (JWT).
  - Verificación Multi-Factor (MFA) vía mensajes de texto (Twilio).
  - Recuperación de contraseñas.
- **🗂️ Gestión de Archivos y Carpetas:** - Subida, descarga y organización de archivos en carpetas.
  - Cifrado automático de archivos antes de almacenarlos en la nube.
- **🌐 Directorio Global y Red de Contactos:** - Búsqueda en tiempo real de usuarios registrados en la plataforma.
  - Gestión de una lista de "Contactos Frecuentes" para envíos rápidos y seguros.
- **👤 Perfil de Usuario:** - Personalización de datos y subida de fotografía de perfil (con Tokens SAS para privacidad).
  - Monitoreo en tiempo real del almacenamiento utilizado en la nube.
- **🔍 Motor de Búsqueda Inteligente:** - Búsqueda global con sugerencias en vivo de archivos propios, carpetas y elementos compartidos.

---

## 🛠️ Tecnologías Utilizadas

**Frontend:**
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- React Router DOM (Navegación)
- Axios (Cliente HTTP)
- CSS Puro (Diseño y animaciones)

**Backend:**
- [Java 17+](https://www.java.com/) + [Spring Boot](https://spring.io/projects/spring-boot)
- Spring Security (Autenticación JWT)
- Maven (Gestor de dependencias)

**Infraestructura y Servicios Cloud:**
- [Azure Blob Storage](https://azure.microsoft.com/es-es/services/storage/blobs/) (Almacenamiento de archivos y fotos)
- Base de Datos Relacional (MySQL / PostgreSQL)
- [Twilio](https://www.twilio.com/) (Envío de tokens por SMS)

---

## 🚀 Cómo Ejecutar el Proyecto en Local

Para probar el proyecto en tu entorno de desarrollo, asegúrate de tener instalados **Node.js**, **Java 17+**, y **Maven**.

### 1. Clonar el repositorio

git clone [[https://github.com/tu-usuario/sistema-transferencia-archivos-tt-back-front.git](https://github.com/AntonioDominguezOrtega/SISTEMA-TRANSFERENCIA-ARCHIVOS-TT-BACK-FRONT.git)]([https://github.com/tu-usuario/sistema-transferencia-archivos-tt-back-front.git](https://github.com/AntonioDominguezOrtega/SISTEMA-TRANSFERENCIA-ARCHIVOS-TT-BACK-FRONT.git))

### 2. Configurar y levantar el Backend (Spring Boot)
Navega a la carpeta del backend:
```bash
cd demo
mvnw spring-boot:run
```
El servidor backend estará escuchando en http://localhost:8080.

### 3. Configurar y levantar el Frontend (React)
Abre una nueva terminal y navega a la carpeta del frontend:
```bash
cd Frontend-React
npm install
npm run dev
```

### 📂 Estructura del Repositorio
```bash
📁 sistema-transferencia-archivos-tt-back-front
├── 📁 demo/                  # Código fuente del Backend (Spring Boot)
│   ├── src/main/java/...     # Controladores, Servicios, Modelos, DTOs, Seguridad
│   └── src/main/resources/   # Propiedades y Plantillas de Correo
└── 📁 Frontend-React/        # Código fuente del Frontend (React + Vite)
    ├── src/components/       # Componentes reutilizables (Headers, Modales, Sidebar)
    ├── src/pages/            # Vistas principales (Dashboard, Perfil, Contactos)
    ├── src/services/         # Conexión con los endpoints del API (Axios)
    └── public/               # Imágenes, Íconos y Recursos estáticos
```
