
  # Taller Carpenter

Aplicación frontend para la gestión de servicios, equipo técnico y reportes de un taller de carpintería.

## Contenido

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Ejecución](#ejecución)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Diseño](#diseño)
- [Rutas principales](#rutas-principales)

## Descripción

Es una interfaz de administración para gestionar solicitudes de servicio, equipo, técnicos y reportes. El frontend está construido con React y Vite, con rutas protegidas y almacenamiento local para datos mock.

## Tecnologías

- Vite
- React
- TypeScript
- Tailwind CSS
- React Router
- Radix UI
- Sonner
- MUI Icons
- LocalStorage para persistencia local

## Requisitos

- Node.js instalado
- npm o pnpm

## Instalación

to install the dependencies
```bash
npm install
```

## Ejecución
to start the development server
```bash
npm run dev
```

Luego abre la URL que indique Vite (normalmente `http://localhost:5173`).

## Estructura del proyecto

- `src/main.tsx`: punto de entrada de la app.
- `src/app/App.tsx`: componente raíz que monta el router y el toaster.
- `src/app/routes.tsx`: definición de rutas y protección de rutas.
- `src/app/components/`: componentes reutilizables y layout.
- `src/app/pages/`: páginas de la aplicación.
- `src/app/lib/`: tipos, almacenamiento local y utilidades.
- `src/styles/`: estilos globales y configuración de temas.

## Diseño

- Las variables de tema se definen en `src/styles/theme.css`.
- Tipografía base: `--font-size: 16px`, peso normal `400`, peso medio `500`.
- Colores principales:
  - Primario: `--primary = #2563eb`
  - Secundario: `--secondary = oklch(0.95 0.0058 264.53)`
  - Fondo: `--background = #f9fafb`
  - Tarjetas: `--card = #ffffff`
  - Texto: `--foreground = oklch(0.145 0 0)`
  - Destructivo/alerta: `--destructive = #dc2626`
  - Acento: `--accent = #e9ebef`
- El proyecto también soporta tema oscuro usando la clase `.dark`.
- Hay utilidades de diseño para tarjetas interactivas (`interactive-card` y `interactive-card-overlay`) y estilos globales base.

## Rutas principales

- `/` - Inicio de sesión
- `/dashboard` - Panel principal
- `/services` - Lista de servicios
- `/services/new` - Crear nuevo servicio
- `/services/:id` - Detalle de servicio
- `/equipment` - Gestión de equipo
- `/reports` - Reportes
- `/profile` - Perfil del usuario
- `/technicians` - Técnicos
