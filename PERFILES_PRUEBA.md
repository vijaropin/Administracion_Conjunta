# Perfiles de Prueba

Fecha de actualizacion: 2026-03-09

Este documento define perfiles de prueba para QA manual por rol.

## 1) Matriz de perfiles

| Perfil | `tipo` (Firestore) | Email de prueba | Clave sugerida | Ruta inicial esperada |
|---|---|---|---|---|
| Administrador | `administrador` | `qa.admin@adminconjunta.local` | `AdminConjunta#2026` | `/admin/dashboard` |
| Consejo | `consejo` | `qa.consejo@adminconjunta.local` | `AdminConjunta#2026` | `/consejo/dashboard` |
| Contadora | `contadora` | `qa.contadora@adminconjunta.local` | `AdminConjunta#2026` | `/contadora/dashboard` |
| Seguridad | `seguridad` | `qa.seguridad@adminconjunta.local` | `AdminConjunta#2026` | `/seguridad/dashboard` |
| Comite de Convivencia | `comite_convivencia` | `qa.comite@adminconjunta.local` | `AdminConjunta#2026` | `/comite/dashboard` |
| Residente | `residente` | `qa.residente@adminconjunta.local` | `AdminConjunta#2026` | `/residente/dashboard` |
| Servicios Generales | `servicios_generales` | `qa.servicios@adminconjunta.local` | `AdminConjunta#2026` | `/servicios/dashboard` |

## 2) Datos base esperados en Firebase

Coleccion: `usuarios/{uid}`

Campos minimos esperados:

```json
{
  "id": "UID_DE_FIREBASE_AUTH",
  "email": "qa.rol@adminconjunta.local",
  "nombres": "QA",
  "apellidos": "Rol",
  "telefono": "3000000000",
  "tipo": "residente",
  "conjuntoId": "base-f5700",
  "unidad": "101",
  "torre": "Bloque A",
  "activo": true,
  "consentimientoDatos": true
}
```

## 3) Flujo rapido de validacion por perfil

1. Iniciar sesion con el correo del rol.
2. Confirmar redireccion al dashboard correcto.
3. Confirmar que no se ven modulos no autorizados.
4. Ejecutar el flujo principal del rol.

## 4) Flujos clave por rol

- Administrador: `/admin/finanzas`, `/admin/asambleas`, `/admin/documentos`, `/admin/solicitudes`.
- Consejo: `/consejo/dashboard`, `/consejo/seguridad`, `/consejo/residentes`, `/consejo/solicitudes`.
- Contadora: `/contadora/dashboard`, `/contadora/finanzas`, `/contadora/documentos`.
- Seguridad: `/seguridad/dashboard`, `/seguridad/visitantes`, `/seguridad/incidentes`.
- Residente: `/residente/pagos`, `/residente/reservas`, `/residente/incidentes`, `/residente/asambleas`.
- Comite: `/comite/dashboard`, `/comite/casos`, `/comite/audiencias`, `/comite/solicitudes`.
- Servicios: `/servicios/dashboard`, `/servicios/novedades`, `/servicios/solicitudes`.

## 5) Automatizacion

Desde `app/` puedes crear o refrescar estos perfiles automaticamente:

```bash
npm run seed:firebase
```

El seed masivo tambien genera estos artefactos para QA manual usuario por usuario:

- `QA_CREDENCIALES_262_CASAS.csv`
- `QA_CREDENCIALES_262_CASAS.md`

Ambos incluyen correo, clave de prueba, casa y ruta esperada para las 262 viviendas y los perfiles base del sistema.

## 6) Referencias utiles

- Arquitectura objetivo: `ARQUITECTURA_PYTHON_PRODUCCION.md`
- Smoke test general: `SMOKE_TEST_TECNICO_2026-03-09.md`
- Guia de entorno: `GUIA_VISUAL_STUDIO.md`
