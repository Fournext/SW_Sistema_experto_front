# Sistema Experto — Software Educativo Interactivo de Apoyo Docente

Frontend desarrollado con **React**, **TypeScript**, **Tailwind CSS v4** y **React Flow**, diseñado como herramienta docente interactiva para la enseñanza y experimentación de **Sistemas Expertos** basados en reglas y encadenamiento hacia adelante (*Forward Chaining*).

---

## 🎯 Alcance del Sistema

Este software está enfocado en el rol **Docente** para la creación, edición, diagramación visual y simulación de sistemas expertos. 

### Módulos Principales:

1. **Sistemas Expertos (`/sistemas`)**:
   - Listado y búsqueda de sistemas expertos.
   - Creación y edición con validación estricta de nombres y descripción pedagógica.
   - Eliminación con diálogo de confirmación y accesos directos a submódulos.

2. **Base de Conocimiento (`/sistemas/:id/base-conocimiento`)**:
   - **Hechos**: Gestión de proposiciones y memoria de trabajo inicial/deducida (`texto`, `numero`, `booleano`).
   - **Variables**: Definición de atributos de dominio, tipos de datos y valores por defecto.
   - **Reglas**: Gestión de reglas de producción con factores de certeza (0.00 a 1.00), prioridades de ejecución y estado activo/inactivo.
   - **Cláusulas IF-THEN**: Creación y eliminación de condiciones de comparación (`==`, `!=`, `>`, `<`, `>=`, `<=`) y conclusiones resultantes.

3. **Editor Visual (`/sistemas/:id/editor`)**:
   - Lienzo visual basado en **React Flow** (`@xyflow/react`).
   - Nodos especializados y diferenciados visualmente:
     - 🟢 **HECHO**: Nombre, valor, tipo de dato y badge de inicial.
     - 🔵 **VARIABLE**: Nombre, tipo, valor por defecto y descripción.
     - 🟡 **CONDICION (IF)**: Referencia, operador, valor esperado y orden.
     - 🟣 **REGLA**: Código, prioridad, factor de certeza y estado.
     - 🟣 **CONCLUSION (THEN)**: Destino y valor resultante.
   - Panel lateral de propiedades con **React Hook Form** y validaciones **Zod**.
   - Conexión interactiva entre nodos con curvas animadas, zoom, pan y guardado de coordenadas.

4. **Motor de Inferencia (`/sistemas/:id/inferencia`)**:
   - Ejecución del motor hacia adelante con resolución de conflictos.
   - Pipeline de trazabilidad en tiempo real:
     $$\text{Hechos Iniciales} \longrightarrow \text{Reglas Evaluadas} \longrightarrow \text{Reglas Activadas} \longrightarrow \text{Conclusión Final}$$
   - Badges visuales de estado para cada regla:
     - `EVALUADA`
     - `RECHAZADA`
     - `ACTIVADA`
     - `EJECUTADA`
   - Resumen de condiciones cumplidas o fallidas y cálculo de factor de certeza final.

---

## 🛠️ Stack Tecnológico

| Capa / Herramienta | Tecnología |
|---|---|
| Framework Principal | React 19 + TypeScript (Strict) |
| Bundler & Dev Server | Vite 8 |
| Estilos y Diseño | Tailwind CSS v4 (@tailwindcss/vite) |
| Enrutamiento | React Router DOM v7 |
| Diagramas de Flujo | React Flow (@xyflow/react v12) |
| Estado del Servidor & Caché | TanStack Query v5 |
| Estado Global Ligero | Zustand v5 |
| Formularios & Validaciones | React Hook Form + Zod |
| Iconografía | Lucide React |
| Cliente HTTP | Axios con interceptores |
| Testing | Vitest + React Testing Library + jsdom |

---

## 📂 Estructura del Proyecto

```
src/
├── app/
│   ├── providers/
│   │   └── AppProviders.tsx       # QueryClient + BrowserRouter
│   └── router/
│       └── AppRouter.tsx          # Definición de rutas y vistas protegidas
│
├── features/                      # Arquitectura modular por funcionalidades
│   ├── sistemas-expertos/
│   │   ├── components/            # Tarjetas, formularios y detalles
│   │   ├── pages/                 # Listado, Crear y Detalle
│   │   ├── services/              # Consumo de API REST (/sistemas-expertos/)
│   │   ├── hooks/                 # React Query hooks (useSistemasExpertos, etc.)
│   │   ├── schemas/               # Validaciones Zod
│   │   ├── types/                 # Modelos TypeScript
│   │   └── __tests__/             # Pruebas unitarias
│   │
│   ├── base-conocimiento/
│   │   ├── components/            # HechosTab, VariablesTab, ReglasTab, ReglaDetalle
│   │   ├── pages/                 # BaseConocimientoPage (sistema de pestañas)
│   │   ├── services/              # Consumo de hechos, variables, reglas y cláusulas
│   │   ├── hooks/                 # useBaseConocimiento, useHechos, useReglas
│   │   ├── schemas/               # Esquemas Zod para Hecho, Variable, Regla, Condición
│   │   └── types/                 # Tipos tipados de Base de Conocimiento
│   │
│   ├── editor-visual/
│   │   ├── components/            # EditorToolbar, PanelPropiedades (por tipo de nodo)
│   │   ├── nodes/                 # HechoNode, VariableNode, CondicionNode, ReglaNode, ConclusionNode
│   │   ├── pages/                 # EditorVisualPage con ReactFlow
│   │   ├── services/              # Persistencia de nodos y conexiones visuales
│   │   ├── store/                 # Zustand editorStore (nodo seleccionado, modo edición)
│   │   └── types/                 # Tipos FlowNode, FlowEdge, DTOs
│   │
│   └── inferencia/
│       ├── components/            # Paneles de Hechos, Reglas Evaluadas, Activadas y Conclusión
│       ├── pages/                 # InferenciaPage
│       ├── services/              # Endpoint de disparo de inferencia y detalles
│       ├── hooks/                 # useInferencia, useEjecutarInferencia
│       └── utils/                 # Helpers visuales de estados de regla
│
├── components/
│   ├── ui/                        # Button, Input, Select, Textarea, Modal, ConfirmDialog, Card, Badge, Table, Spinner
│   ├── layout/                    # MainLayout, Sidebar, Header
│   └── feedback/                  # EmptyState, ErrorMessage
│
├── services/
│   ├── httpClient.ts              # Instancia configurada de Axios con base URL y manejo de errores
│   └── api.ts                     # Re-export unificado
│
├── hooks/
│   └── useConfirmDialog.ts        # Hook para modales de confirmación accesibles
│
├── types/
│   └── common.ts                  # Respuestas paginadas y errores comunes
│
├── App.tsx                        # Punto de entrada de la aplicación
└── main.tsx                       # Render inicial en el DOM
```

---

## ⚙️ Instalación y Configuración

### 1. Prerrequisitos
- **Node.js**: Versión 18 o superior.
- **npm**: Versión 9 o superior.
- **Backend Django**: En ejecución local (por defecto en `http://localhost:8000`).

### 2. Clonar e Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```
Contenido por defecto en `.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🚀 Comandos Disponibles

### Iniciar en Desarrollo
```bash
npm run dev
```
Abre tu navegador en `http://localhost:5173`.

### Ejecutar Pruebas Unitarias
```bash
npm run test
```
Ejecuta la suite con **Vitest** (pruebas de renderizado, validaciones Zod y estados de inferencia).

### Modo Observador de Pruebas
```bash
npm run test:watch
```

### Compilar para Producción
```bash
npm run build
```
Valida tipos de TypeScript con `tsc -b` y compila los assets optimizados en la carpeta `dist/`.

---

## 🔗 Integración con Backend Django REST

El frontend se conecta a los siguientes endpoints REST:

| Recurso | Método | Endpoint |
|---|---|---|
| **Sistemas Expertos** | `GET, POST` | `/api/v1/sistemas-expertos/` |
| | `GET, PUT, PATCH, DELETE` | `/api/v1/sistemas-expertos/{id}/` |
| **Base de Conocimiento** | `GET` | `/api/v1/sistemas-expertos/{id}/base-conocimiento/` |
| **Hechos** | `GET, POST` | `/api/v1/bases-conocimiento/{id}/hechos/` |
| | `PATCH, DELETE` | `/api/v1/hechos/{id}/` |
| **Variables** | `GET, POST` | `/api/v1/bases-conocimiento/{id}/variables/` |
| | `PATCH, DELETE` | `/api/v1/variables/{id}/` |
| **Reglas** | `GET, POST` | `/api/v1/bases-conocimiento/{id}/reglas/` |
| | `PATCH, DELETE` | `/api/v1/reglas/{id}/` |
| **Condiciones** | `POST` | `/api/v1/reglas/{id}/condiciones/` |
| | `DELETE` | `/api/v1/condiciones/{id}/` |
| **Conclusiones** | `POST` | `/api/v1/reglas/{id}/conclusiones/` |
| | `DELETE` | `/api/v1/conclusiones/{id}/` |
| **Editor Visual** | `GET` | `/api/v1/sistemas-expertos/{id}/editor/` |
| | `POST` | `/api/v1/sistemas-expertos/{id}/nodos/` |
| | `PATCH, DELETE` | `/api/v1/nodos/{id}/` |
| | `POST` | `/api/v1/sistemas-expertos/{id}/conexiones/` |
| | `DELETE` | `/api/v1/conexiones/{id}/` |
| **Motor de Inferencia** | `POST` | `/api/v1/sistemas-expertos/{id}/inferencias/` |
| | `GET` | `/api/v1/inferencias/{id}/` |
| | `GET` | `/api/v1/inferencias/{id}/detalles/` |
