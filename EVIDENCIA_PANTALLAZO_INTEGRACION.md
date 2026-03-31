# Evidencia requerida: Pantallazo de pruebas de integracion entre modulos

Fecha: 2026-03-31  
Proyecto: Administracion Conjunta

## Objetivo

Generar evidencia visual (pantallazos) que demuestre interaccion real entre modulos:

- Caso A: pago creado/reflejado en la vista de vivienda/residente.
- Caso B: votacion registrada y visible para usuarios segun rol.

## Precondiciones

- Backend arriba en `http://localhost:8000`.
- Frontend arriba en `http://localhost:5173`.
- Usuarios QA cargados (admin, residente, consejo).
- Datos del mismo `conjuntoId`.

## Caso A: Pagos reflejados en viviendas

1. Iniciar sesion como admin.
2. Ir a `/admin/finanzas`.
3. Crear un pago para una vivienda/residente especifico (guardar valor, concepto y fecha visibles).
4. Tomar pantallazo 1: confirmacion del pago en admin (tabla/listado).
5. Cerrar sesion e iniciar como el residente de esa vivienda.
6. Ir a `/residente/pagos`.
7. Verificar que el pago aparece en la vista del residente.
8. Tomar pantallazo 2: pago visible en residente (mismo concepto/valor/fecha del paso 3).

Resultado esperado:

- El registro creado por admin se ve en residente sin inconsistencias.

## Caso B: Votaciones visibles para usuarios

1. Iniciar sesion como admin.
2. Ir a `/admin/asambleas`.
3. Crear o abrir una asamblea con votacion activa.
4. Tomar pantallazo 3: asamblea abierta y estado de votacion.
5. Cerrar sesion e iniciar como residente habilitado para votar.
6. Ir a `/residente/asambleas`.
7. Registrar voto SI/NO.
8. Tomar pantallazo 4: voto registrado y estado actualizado (quorum/conteo si aplica).
9. Cerrar sesion e iniciar como consejo.
10. Ir a vista de lectura de asambleas/votaciones.
11. Verificar que el resultado sea visible sin permisos de edicion operativa.
12. Tomar pantallazo 5: visualizacion de votacion para consejo.

Resultado esperado:

- El voto del residente impacta el estado visible para otros roles autorizados.

## Criterio de aprobacion del requerimiento

- [ ] Existen minimo 5 pantallazos (2 de pagos, 3 de asambleas/votaciones).
- [ ] Cada pantallazo muestra fecha/hora del sistema o contexto identificable de la prueba.
- [ ] Se identifica claramente usuario/rol y modulo en cada captura.
- [ ] La data coincide entre pantallas (mismo pago, misma votacion).
- [ ] Se evidencia interaccion entre modulos, no solo vistas aisladas.

## Convencion sugerida de nombres de archivo

- `INT-PAGOS-01-admin-finanzas.png`
- `INT-PAGOS-02-residente-pagos.png`
- `INT-ASAM-03-admin-asamblea-abierta.png`
- `INT-ASAM-04-residente-voto-registrado.png`
- `INT-ASAM-05-consejo-visualizacion.png`

## Ubicacion sugerida para almacenar evidencia

- `D:\Projects\Administracion Conjunta\evidencias\integracion\`

