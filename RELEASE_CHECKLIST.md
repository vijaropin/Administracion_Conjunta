# RELEASE_CHECKLIST.md

Checklist operativo del release actual.

Fecha de corte: 2026-03-09
Proyecto: `Administracion Conjunta`

## 1) Completado

- [x] Frontend TypeScript validado con `tsc --noEmit`.
- [x] Backend Python validado con `python -m compileall app`.
- [x] Reglas de Firestore publicadas en `base-f5700`.
- [x] Verificacion RBAC por rol ejecutada con usuarios QA.
- [x] Diagnostico de visualizacion confirma datos por `conjuntoId` para todos los roles QA.
- [x] Rutas por rol corregidas en el frontend.
- [x] Integracion inicial frontend -> backend Python para pagos.
- [x] Documentacion operativa consolidada (`README`, guia de entorno, perfiles, smoke test).

## 2) Pendiente antes de produccion

- [ ] Ejecutar `npm run build` en una terminal local estable.
- [ ] Confirmar Storage inicializado y probar subida real de PDF.
- [ ] Validar login manual por todos los perfiles QA.
- [ ] Ejecutar smoke test funcional de pagos, documentos, asambleas, seguridad y comite.
- [ ] Validar backend Python levantado con variables reales del entorno.

## 3) Referencias vigentes

- `README.md`
- `GUIA_VISUAL_STUDIO.md`
- `PERFILES_PRUEBA.md`
- `SMOKE_TEST_TECNICO_2026-03-09.md`
- `backend/README.md`
