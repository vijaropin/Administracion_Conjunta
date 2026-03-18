# GUIA_VISUAL_STUDIO.md

Guia practica para abrir, ejecutar y probar el proyecto en Visual Studio Code o Cursor.

## 1) Abrir proyecto

1. Abrir VS Code o Cursor.
2. `Archivo > Abrir carpeta`.
3. Seleccionar `D:\Projects\Administracion Conjunta`.

## 2) Estructura actual del proyecto

```text
Administracion Conjunta/
├── app/                         # Frontend React + Vite
├── backend/                     # Backend Python + FastAPI
├── README.md                    # Documento principal del proyecto
├── GUIA_VISUAL_STUDIO.md        # Esta guia operativa
├── PERFILES_PRUEBA.md           # Usuarios QA y rutas por rol
├── SMOKE_TEST_TECNICO_2026-03-09.md
└── ARQUITECTURA_PYTHON_PRODUCCION.md
```

## 3) Levantar frontend

```bash
cd app
npm install
npm run dev
```

URL esperada: `http://localhost:5173`.

## 4) Levantar backend Python

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload
```

URL esperada: `http://localhost:8000`.

## 5) Variables recomendadas

### Frontend (`app/.env.local`)

```env
VITE_BACKEND_URL=http://localhost:8000
```

### Backend (`backend/.env`)

```env
APP_NAME=Administracion Conjunta API
APP_ENV=development
APP_DEBUG=true
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=http://localhost:5173
FIREBASE_PROJECT_ID=base-f5700
FIREBASE_SERVICE_ACCOUNT_PATH=D:\keys\service-account.json
```

## 6) Validaciones tecnicas rapidas

### Frontend

```bash
cd app
node --max-old-space-size=4096 .\node_modules\typescript\bin\tsc --noEmit -p tsconfig.app.json
npm run build
```

### Backend

```bash
cd backend
python -m compileall app
```

## 7) Firebase

Desde `app/`:

```bash
npm run firebase:deploy:firestore
npm run firebase:verify:rbac
npm run firebase:diagnostico:datos
```

## 8) Usuarios de prueba

Consultar matriz completa en `PERFILES_PRUEBA.md`.

Principales:

- `qa.admin@adminconjunta.local`
- `qa.consejo@adminconjunta.local`
- `qa.contadora@adminconjunta.local`
- `qa.seguridad@adminconjunta.local`
- `qa.comite@adminconjunta.local`
- `qa.residente@adminconjunta.local`
- `qa.servicios@adminconjunta.local`

Clave sugerida:

- `AdminConjunta#2026`

## 9) Documento principal para pruebas

Usar como referencia operativa:

- `SMOKE_TEST_TECNICO_2026-03-09.md`

## 10) Nota de produccion

La ruta aprobada del proyecto es:

- mantener `app/` como frontend,
- mover logica sensible a `backend/` en Python,
- dejar Firebase como base de autenticacion y persistencia durante la migracion.

## 11) Limpieza documental actual

Los documentos vigentes del proyecto quedan concentrados en:

- `README.md`
- `GUIA_VISUAL_STUDIO.md`
- `PERFILES_PRUEBA.md`
- `SMOKE_TEST_TECNICO_2026-03-09.md`
- `RELEASE_CHECKLIST.md`
- `backend/README.md`
- `ARQUITECTURA_PYTHON_PRODUCCION.md`

Documento general no relevante ya retirado:

- `app/README.md`
