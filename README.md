# Administracion Conjunta

Plataforma web para administracion de propiedad horizontal en Colombia.

## 1) Resumen funcional

La aplicacion maneja roles con vistas separadas y permisos por negocio:

- `administrador`: operacion completa del conjunto.
- `consejo`: supervision y control (solo lectura operativa).
- `contadora`: control financiero/contable.
- `seguridad`: control de acceso, visitantes e incidentes.
- `comite_convivencia`: gestion conciliatoria de casos (sin rol sancionatorio directo).
- `residente`: pagos, reservas, asambleas, visitantes, incidentes.
- `servicios_generales`: tablero operativo de mantenimiento/servicios.

## 2) Stack tecnico

- Frontend: React + TypeScript + Vite
- UI: Tailwind + componentes UI (`app/src/components/ui`)
- Estado global: Zustand
- Backend: Firebase (Auth + Firestore + Storage)
- Graficas: Recharts

## 3) Estructura real del proyecto

```text
Administracion Conjunta/
├── README.md
├── GUIA_VISUAL_STUDIO.md
└── app/
    ├── package.json
    ├── src/
    │   ├── App.tsx                     # Ruteo central + control de acceso por rol
    │   ├── config/
    │   │   └── firebase.ts             # Inicializacion Firebase
    │   ├── types/
    │   │   └── index.ts                # Tipos de dominio (pagos, asambleas, etc.)
    │   ├── store/                      # Estado global + acceso a Firestore
    │   │   ├── authStore.ts
    │   │   ├── financieroStore.ts
    │   │   ├── comunicacionStore.ts
    │   │   ├── seguridadStore.ts
    │   │   ├── conjuntoStore.ts
    │   │   ├── parqueaderoStore.ts
    │   │   ├── documentoStore.ts
    │   │   ├── dashboardStore.ts
    │   │   ├── convivenciaStore.ts
    │   │   └── serviciosStore.ts
    │   ├── components/
    │   │   └── layout/
    │   │       ├── AdminLayout.tsx
    │   │       ├── ResidenteLayout.tsx
    │   │       ├── ComiteLayout.tsx
    │   │       ├── ServiciosLayout.tsx
    │   │       ├── Sidebar.tsx         # Menus por rol
    │   │       └── Header.tsx          # Encabezado + nombre del conjunto
    │   └── pages/
    │       ├── auth/
    │       ├── admin/
    │       ├── consejo/
    │       ├── contadora/
    │       ├── seguridad/
    │       ├── residente/
    │       ├── comite/
    │       └── servicios/
    └── dist/
```

## 4) Rutas por rol (estado actual)

> Comentario: las rutas se validan en `App.tsx` con `ProtectedRoute`.

### Administrador
- `/admin/dashboard`
- `/admin/conjunto`
- `/admin/finanzas`
- `/admin/comunicados`
- `/admin/asambleas`
- `/admin/seguridad`
- `/admin/parqueaderos`
- `/admin/animales`
- `/admin/documentos`
- `/admin/configuracion`

### Consejo
- `/consejo/dashboard`
- `/consejo/asambleas`
- `/consejo/seguridad`
- `/consejo/residentes`

### Contadora
- `/contadora/dashboard`
- `/contadora/finanzas`
- `/contadora/documentos`

### Seguridad
- `/seguridad/dashboard`
- `/seguridad/visitantes`
- `/seguridad/incidentes`

### Residente
- `/residente/dashboard`
- `/residente/pagos`
- `/residente/visitantes`
- `/residente/reservas`
- `/residente/incidentes`
- `/residente/asambleas`

### Comite de Convivencia
- `/comite/dashboard`
- `/comite/casos`
- `/comite/casos/:id`
- `/comite/audiencias`
- `/comite/repositorio`

## 4.1) Perfiles de prueba (QA)

Se definio una primera matriz de usuarios de prueba por rol en:

- `PERFILES_PRUEBA.md`

Resumen rapido (rol -> ruta inicial):

- `administrador` -> `/admin/dashboard`
- `consejo` -> `/consejo/dashboard`
- `contadora` -> `/contadora/dashboard`
- `seguridad` -> `/seguridad/dashboard`
- `comite_convivencia` -> `/comite/dashboard`
- `residente` -> `/residente/dashboard`
- `servicios_generales` -> `/servicios/dashboard`

> Comentario: para que el login funcione, cada cuenta debe existir en Authentication y en `usuarios/{uid}`.
## 5) Modulos relevantes

### Asambleas
- Creacion exclusiva de admin.
- Votacion SI/NO por propietario.
- Bitacora de eventos inmodificable (append-only).
- Control de quorum y cierre de votacion por tiempo o cierre manual.

### Finanzas
- Conceptos de pago configurables (sin borrado, con historial de cambios).
- Consecutivo general y por residente en pagos.
- Caja menor (monto aprobado, gastos, soportes).
- Exportacion real a Excel (`.xls`) y PDF desde la tabla de pagos.

### Documentos
- Subida de PDF por selector y por arrastre (drag & drop).
- Control de estado, aprobacion y descargas.

## 6) Instalacion y ejecucion

Desde la carpeta `app`:

```bash
npm install
npm run dev
```

Build produccion:

```bash
npm run build
```

Chequeo TypeScript:

```bash
npx tsc --noEmit
```

## 6.1) Seed automatico de Firebase (usuarios + base QA)

Desde `app/`:

```bash
npm install
npm run seed:firebase
```

Variables recomendadas en Windows (PowerShell):

```powershell
$env:FIREBASE_SERVICE_ACCOUNT_PATH="D:\keys\service-account.json"
$env:FIREBASE_PROJECT_ID="tu-proyecto-firebase"
$env:SEED_DEFAULT_PASSWORD="AdminConjunta#2026"
npm run seed:firebase
```

Opcional (sin escribir datos):

```powershell
$env:SEED_DRY_RUN="true"
npm run seed:firebase
```

> Comentario: el script crea/actualiza usuarios de prueba en Auth, sincroniza `usuarios/{uid}` y carga datos base en Firestore para QA.
## 7) Configuracion Firebase (minimo requerido)

1. Crear proyecto en Firebase.
2. Activar Authentication (email/password).
3. Activar Firestore.
4. Activar Storage.
5. Copiar config web y pegar en `app/src/config/firebase.ts`.

```ts
// Comentario: usar variables reales del proyecto Firebase.
const firebaseConfig = {
  apiKey: '... ',
  authDomain: '... ',
  projectId: '... ',
  storageBucket: '... ',
  messagingSenderId: '... ',
  appId: '... ',
};
```

## 8) Colecciones Firestore usadas

- `usuarios`
- `conjuntos`
- `unidades`
- `pagos`
- `conceptosPago`
- `cajasMenores`
- `gastosCajaMenor`
- `comunicados`
- `asambleas`
- `votaciones`
- `asambleaBitacora`
- `visitantes`
- `incidentes`
- `zonasComunes`
- `reservas`
- `conflictos`
- `audiencias`
- `parqueaderos`
- `vehiculos`
- `animales`
- `documentos`

## 9) Notas de mantenimiento (recomendado)

- Mantener restricciones por rol en dos capas:
  - UI (botones/menus)
  - Ruteo (`ProtectedRoute`)
- No exponer acciones mutables en vistas de supervision (Consejo/Comite conciliador).
- Validar con `tsc --noEmit` antes de subir cambios.

## 10) Archivos clave para desarrollar rapido

- Rutas: `app/src/App.tsx`
- Menus por rol: `app/src/components/layout/Sidebar.tsx`
- Asambleas: `app/src/pages/admin/Asambleas.tsx`, `app/src/pages/residente/Asambleas.tsx`
- Finanzas: `app/src/pages/admin/Finanzas.tsx`, `app/src/store/financieroStore.ts`
- Documentos: `app/src/pages/admin/Documentos.tsx`
- Seguridad: `app/src/pages/seguridad/*`
- Consejo: `app/src/pages/consejo/*`

## 11) Checklist de despliegue a produccion

### Pre-release (obligatorio)
- [ ] Ejecutar en `app`:
  - [ ] `npm install`
  - [ ] `npx tsc --noEmit`
  - [ ] `npm run build`
- [ ] Probar login por rol: administrador, consejo, contadora, seguridad, comite, residente.
- [ ] Validar rutas criticas:
  - [ ] `/admin/asambleas`
  - [ ] `/residente/asambleas`
  - [ ] `/admin/finanzas` y exportacion PDF/Excel
  - [ ] `/admin/documentos` (drag & drop PDF)
  - [ ] `/consejo/*` y `/seguridad/*`
- [ ] Revisar que no existan credenciales hardcodeadas fuera de `firebase.ts`.

### Seguridad Firebase
- [ ] Authentication habilitado solo con proveedores necesarios.
- [ ] Reglas Firestore por rol (lectura/escritura minima necesaria).
- [ ] Reglas Storage restringidas por coleccion/ruta.
- [ ] Indices compuestos creados para queries activas.
- [ ] Backups/export de Firestore configurados (si aplica).

### Publicacion
- [ ] Generar build final (`app/dist`).
- [ ] Publicar en hosting objetivo (Firebase Hosting, Vercel o Netlify).
- [ ] Confirmar variables y proyecto Firebase correctos en entorno productivo.

### Post-release (validacion en caliente)
- [ ] Smoke test funcional en produccion:
  - [ ] Login/logout
  - [ ] Crear pago
  - [ ] Votar en asamblea
  - [ ] Subir documento PDF
- [ ] Revisar consola del navegador sin errores criticos.
- [ ] Revisar logs/errores de Firebase.

### Rollback
- [ ] Mantener build estable anterior para reversa rapida.
- [ ] Documentar timestamp y version desplegada.
- [ ] Si falla feature critica, revertir despliegue y reabrir incidencia.





## 7.1) Paso a paso: conectar Firebase y visualizar registros por usuario

Este proyecto ya usa Firebase en `app/src/config/firebase.ts` y carga datos por `user.conjuntoId` + `user.id`.

1. Crear/validar proyecto Firebase
- Activar `Authentication > Email/Password`.
- Activar `Firestore Database` en modo producción.
- Activar `Storage`.

2. Configurar credenciales en el frontend
- En `app/`, crear archivo `.env.local` (puede copiar desde `.env.example`).
- Pegar los valores del SDK Web:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

3. Instalar y ejecutar
```bash
cd app
npm install
npm run dev
```

4. Cargar usuarios de prueba y datos base (recomendado)
```bash
npm run seed:firebase
```
- Esto crea usuarios en Auth y documento `usuarios/{uid}` con `tipo`, `conjuntoId`, etc.

5. Estructura mínima para que cada usuario vea datos
- `usuarios/{uid}`: debe tener `id`, `tipo`, `conjuntoId`, `activo`.
- Colecciones de negocio deben guardar `conjuntoId` (y cuando aplique `residenteId`/`solicitadoPor`/`reportadoPor`).

6. Cómo filtra la app por usuario (actual)
- `authStore.login` lee `usuarios/{uid}` y lo guarda en sesión.
- Vistas cargan por `user.conjuntoId` para datos del conjunto.
- Vistas personales cargan por `user.id` (ej.: pagos del residente, novedades del todero).
- Rutas se restringen por `user.tipo` en `app/src/App.tsx` (`ProtectedRoute`).

7. Validación rápida por rol
- Admin: ve y crea datos del `conjuntoId` asignado.
- Residente: solo sus pagos (`residenteId == user.id`) + datos del conjunto.
- Seguridad: incidentes/vehículos del conjunto.
- Consejo/Comité/Contadora: datos del conjunto según módulo.

8. Si no ves registros nuevos de Firebase
- Verificar que el documento `usuarios/{uid}` existe y tiene `conjuntoId` correcto.
- Confirmar que el registro creado también guarda ese mismo `conjuntoId`.
- Cerrar sesión y volver a iniciar para refrescar `authStore`.
- Revisar reglas de Firestore/Storage y consola del navegador.

9. Reglas base recomendadas (ejemplo mínimo)
- Firestore: permitir lectura/escritura solo si hay sesión y el documento pertenece al mismo `conjuntoId` del usuario.
- Storage: permitir subida/lectura solo autenticados y rutas bajo su conjunto.

> Nota: este ejemplo debe ajustarse por colección/rol para cumplir negocio y Ley 675.

## 7.2) Reglas Firebase listas y deploy

Se agregaron en la raiz del proyecto:
- `firebase.json`
- `firestore.rules`
- `storage.rules`

### Deploy de reglas (desde `app/`)

Opcion 1 (usa proyecto activo de Firebase CLI):
```bash
npm run firebase:deploy:rules
```

Opcion 2 (forzado al proyecto actual):
```bash
npm run firebase:deploy:rules:base
```

Opcion 3 (manual con project id variable):
```powershell
$env:FIREBASE_PROJECT_ID="base-f5700"
npx firebase-tools deploy --config ..\firebase.json --project $env:FIREBASE_PROJECT_ID --only firestore:rules,storage
```

### Primer uso en un equipo nuevo
```powershell
npm i -g firebase-tools
firebase login
firebase use base-f5700
cd app
npm run firebase:deploy:rules
```

> Comentario: estas son reglas base por `conjuntoId` y `rol`; si un modulo nuevo requiere mas permisos, se ajusta la coleccion puntual en `firestore.rules`.

### Nota operativa (si Storage no está inicializado)

Si al desplegar aparece:
`Firebase Storage has not been set up on project 'base-f5700'`

1. Entra a [Firebase Console](https://console.firebase.google.com/project/base-f5700/storage).
2. Click en **Get Started** y finaliza la creación del bucket.
3. Mientras tanto, despliega solo Firestore:

```bash
cd app
npm run firebase:deploy:rules
```

4. Cuando Storage ya exista:

```bash
npm run firebase:deploy:storage
# o todo junto
npm run firebase:deploy:rules:all
```

### Indices Firestore para evitar vistas vacias

Se agrego `firestore.indexes.json` con los indices compuestos de las consultas actuales (`where + orderBy`).

Deploy de indices:

```bash
cd app
npm run firebase:deploy:indexes
```

Deploy completo de Firestore (reglas + indices):

```bash
npm run firebase:deploy:firestore
```

> Nota: la creacion de indices puede tardar varios minutos. Mientras el indice este en estado `building`, algunas vistas pueden seguir vacias o mostrar error `FAILED_PRECONDITION`.

## 12) Python y produccion

Se evaluo la migracion completa a Python y la conclusion tecnica es esta:

- No conviene reescribir el frontend actual en esta fase.
- La ruta correcta es mantener `app/` como frontend React y mover la logica sensible a `backend/` en Python.
- Ya se dejo creada una base inicial en `backend/` con FastAPI.

Archivos nuevos relevantes:

- `backend/pyproject.toml`
- `backend/app/main.py`
- `backend/app/core/config.py`
- `backend/app/core/firebase_admin.py`
- `backend/README.md`
- `ARQUITECTURA_PYTHON_PRODUCCION.md`
- `docker-compose.backend.yml`

### Ejecucion backend local

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload
```

### Ejecucion backend con Docker

```bash
docker compose -f docker-compose.backend.yml up --build
```

### Siguiente orden de migracion recomendado

1. Verificacion de token Firebase desde Python.
2. API financiera (`pagos`, `conceptosPago`, `cajasMenores`, `gastosCajaMenor`).
3. API documental y cargas validadas desde backend.
4. API legal para asambleas, votaciones y bitacoras.
