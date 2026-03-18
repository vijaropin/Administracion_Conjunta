# Arquitectura Python para Produccion

## Decision tecnica

El proyecto no debe reescribirse completo a Python en esta fase.

La razon es simple:

- El frontend actual ya esta construido en React + Vite.
- Python no reemplaza ese frontend sin una reescritura total de vistas.
- La mayor ganancia para produccion esta en mover la logica critica del cliente a un backend Python.

## Arquitectura objetivo

```text
Frontend web
React + Vite
        |
        v
Backend API
FastAPI + Firebase Admin + servicios de dominio
        |
        v
Persistencia
Firebase Auth + Firestore + Storage
```

## Que mover primero a Python

1. Validacion de roles y permisos de alto riesgo.
2. Finanzas: pagos, conceptos, caja menor, cierres y exportaciones.
3. Flujos legales: asambleas, votaciones, bitacoras, solicitudes formales.
4. Documentos y cargas con validacion server-side.
5. Integraciones futuras: correo, PDF, reportes, auditoria.

## Estructura recomendada

```text
Administracion Conjunta/
├── app/                         # Frontend actual
├── backend/                     # Nuevo backend Python
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── storage.rules
```

## Paso a paso de migracion

### Fase 1

- Mantener frontend actual.
- Agregar backend Python con `healthcheck`, configuracion y Firebase Admin.
- Preparar variables de entorno y despliegue.

### Fase 2

- Crear API para autenticacion backend y verificacion de token.
- Sacar del frontend las escrituras sensibles de Firestore.
- Centralizar auditoria y validaciones.

### Fase 3

- Mover modulos financieros completos a endpoints Python.
- Generar PDF y Excel desde backend.
- Crear trazabilidad legal centralizada.

### Fase 4

- Evaluar migracion de persistencia desde Firestore a PostgreSQL si el volumen y auditoria lo requieren.
- Mantener Firebase solo para Auth/Storage si sigue siendo util.

## Criterios de puesta en produccion

- Variables de entorno separadas por ambiente.
- Backend desacoplado del frontend.
- Healthcheck operativo.
- Reglas Firebase publicadas.
- Indices Firestore creados.
- Seed QA y pruebas RBAC validadas.
- Documentacion de despliegue y rollback.
