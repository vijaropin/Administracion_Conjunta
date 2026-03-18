# Smoke Test Tecnico 2026-03-09

Estado de preparacion para pruebas generales del proyecto `Administracion Conjunta`.

## 1) Resultado consolidado

### Validacion automatizada completada hoy

- [x] Frontend TypeScript compila sin errores con `tsc --noEmit`.
- [x] Backend Python compila sin errores con `python -m compileall app`.
- [x] Reglas de Firestore publicadas en `base-f5700`.
- [x] Verificacion RBAC real por rol ejecutada en Firebase.
- [x] Diagnostico de visualizacion confirma registros visibles por rol en Firebase.

### Pendiente de validacion manual

- [ ] Navegacion visual completa por rol.
- [ ] Flujos CRUD principales por modulo.
- [ ] Cargas reales en Storage (documentos/soportes) con bucket inicializado.
- [ ] Build final del frontend en una terminal local sin restriccion de `esbuild`.

## 2) Observaciones de entorno

- En esta sesion automatizada, `npm run build` no fue concluyente por restriccion local de `spawn/esbuild` (`EPERM`).
- En esta sesion automatizada, `npm` tambien mostro una resolucion rota del CLI en el perfil local del sistema; no es un error del codigo fuente.
- En la maquina del proyecto ya se habia confirmado `npm run dev`, por lo que el siguiente cierre debe hacerse en tu terminal local.

## 3) Precondiciones para pruebas generales

### Frontend

```bash
cd app
npm install
npm run dev
```

Variable recomendada en `app/.env.local`:

```env
VITE_BACKEND_URL=http://localhost:8000
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload
```

Variables recomendadas en `backend/.env`:

```env
APP_NAME=Administracion Conjunta API
APP_ENV=development
APP_DEBUG=true
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=http://localhost:5173
FIREBASE_PROJECT_ID=base-f5700
FIREBASE_SERVICE_ACCOUNT_PATH=D:\keys\service-account.json
```

## 4) Checklist corregido por modulo

### Login

- [x] `ProtectedRoute` redirige por rol segun `user.tipo`.
- [ ] La pantalla `/login` carga sin errores visuales.
- [ ] `qa.admin@adminconjunta.local` entra a `/admin/dashboard`.
- [ ] `qa.residente@adminconjunta.local` entra a `/residente/dashboard`.
- [ ] `qa.consejo@adminconjunta.local` entra a `/consejo/dashboard`.

### Pagos

- [x] `GET /api/v1/auth/me` y `GET /api/v1/pagos` quedaron implementados en backend Python.
- [x] El store financiero intenta backend Python primero y hace fallback a Firebase.
- [ ] `/admin/finanzas` lista pagos y permite exportacion PDF/Excel.
- [ ] `/residente/pagos` muestra solo pagos del usuario logueado.
- [ ] `/contadora/finanzas` valida consulta financiera sin permisos operativos indebidos.

### Documentos

- [x] Existe carga PDF por selector y por arrastre en `/admin/documentos`.
- [ ] El bucket de Storage esta inicializado y acepta carga real.
- [ ] La descarga/apertura del archivo funciona con URL valida.
- [ ] Contadora y administrador validan acceso segun el destino del documento.

### Asambleas

- [x] Solo el admin tiene ruta de creacion operativa.
- [x] Residente tiene voto SI/NO y bloqueo de doble voto desde la vista.
- [ ] `/admin/asambleas` crea y cierra asambleas en datos reales.
- [ ] `/residente/asambleas` registra voto y refleja quorum/conteo esperado.
- [ ] Consejo valida lectura historica sin modificar votaciones.

### Seguridad

- [x] Existen rutas separadas para seguridad y consejo.
- [ ] `/seguridad/dashboard` carga vehiculos e incidentes visibles del conjunto.
- [ ] `/seguridad/incidentes` registra novedad operativa real.
- [ ] `/consejo/seguridad` refleja seguimiento sin permisos de edicion operativa.

### Comite

- [x] Existen vistas separadas de casos, audiencias, repositorio y solicitudes.
- [x] Flujo Comite -> Consejo -> Administrador existe en solicitudes formales.
- [ ] `/comite/casos` lista casos reales cargados en Firebase.
- [ ] `/comite/audiencias` programa audiencia ligada a un caso.
- [ ] `/consejo/solicitudes` permite voto valido con reglas de quorom y miembros activos.

## 5) Comandos recomendados de validacion

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

### Firebase

```bash
cd app
npm run firebase:deploy:firestore
npm run firebase:verify:rbac
npm run firebase:diagnostico:datos
```

## 6) Criterio para iniciar QA general

El proyecto queda listo para pruebas generales cuando:

- frontend local abre y navega por rol,
- backend Python responde `health`, `auth/me` y `pagos`,
- Firebase rules/indexes ya estan publicados,
- login y pagos no presentan bloqueos funcionales,
- documentos, asambleas, seguridad y comite pasan una ronda manual basica.
