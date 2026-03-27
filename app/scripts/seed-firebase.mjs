#!/usr/bin/env node

/**
 * Seed de Firebase (Auth + Firestore) para ambientes de QA.
 *
 * Requisitos:
 * 1) Variable GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_SERVICE_ACCOUNT_PATH apuntando al JSON de service account.
 * 2) FIREBASE_PROJECT_ID (opcional si viene en el service account).
 *
 * Ejemplo:
 *   set FIREBASE_SERVICE_ACCOUNT_PATH=D:\keys\service-account.json
 *   set FIREBASE_PROJECT_ID=mi-proyecto
 *   npm run seed:firebase
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || 'AdminConjunta#2026';
const CONJUNTO_ID = process.env.SEED_CONJUNTO_ID || 'base-f5700';
const DRY_RUN = process.env.SEED_DRY_RUN === 'true';
const TOTAL_CASAS = 262;
const RESIDENTIAL_TYPES = [
  'residente',
  'propietario_residente',
  'arrendatario',
  'propietario_no_residente',
];

const perfilesBase = [
  {
    key: 'administrador',
    tipo: 'administrador',
    email: 'qa.admin@adminconjunta.local',
    nombres: 'QA',
    apellidos: 'Administrador',
    telefono: '3000000001',
    unidad: 'ADMIN',
    torre: 'Administracion',
    rutaInicial: '/admin/dashboard',
  },
  {
    key: 'consejo',
    tipo: 'consejo',
    email: 'qa.consejo@adminconjunta.local',
    nombres: 'QA',
    apellidos: 'Consejo',
    telefono: '3000000002',
    unidad: 'CJ-01',
    torre: 'Consejo',
    rutaInicial: '/consejo/dashboard',
  },
  {
    key: 'contadora',
    tipo: 'contadora',
    email: 'qa.contadora@adminconjunta.local',
    nombres: 'QA',
    apellidos: 'Contadora',
    telefono: '3000000003',
    unidad: 'CONT',
    torre: 'Administracion',
    rutaInicial: '/contadora/dashboard',
  },
  {
    key: 'seguridad',
    tipo: 'seguridad',
    email: 'qa.seguridad@adminconjunta.local',
    nombres: 'QA',
    apellidos: 'Seguridad',
    telefono: '3000000004',
    unidad: 'PORT',
    torre: 'Porteria',
    rutaInicial: '/seguridad/dashboard',
  },
  {
    key: 'comite',
    tipo: 'comite_convivencia',
    email: 'qa.comite@adminconjunta.local',
    nombres: 'QA',
    apellidos: 'Comite',
    telefono: '3000000005',
    unidad: 'CC-01',
    torre: 'Comite',
    rutaInicial: '/comite/dashboard',
  },
  {
    key: 'servicios',
    tipo: 'servicios_generales',
    email: 'qa.servicios@adminconjunta.local',
    nombres: 'QA',
    apellidos: 'Servicios',
    telefono: '3000000007',
    unidad: 'SG-01',
    torre: 'Operaciones',
    rutaInicial: '/servicios/dashboard',
  },
];

function padCasa(value) {
  return String(value).padStart(3, '0');
}

function getBloqueCasa(numeroCasa) {
  return numeroCasa <= Math.ceil(TOTAL_CASAS / 2) ? 'Bloque A' : 'Bloque B';
}

function getResidentialKey(numeroCasa) {
  return numeroCasa === 101 ? 'residente' : `residencial-${padCasa(numeroCasa)}`;
}

function buildResidentialProfiles() {
  return Array.from({ length: TOTAL_CASAS }, (_, index) => {
    const numeroCasa = index + 1;
    const tipo = RESIDENTIAL_TYPES[index % RESIDENTIAL_TYPES.length];
    const key = getResidentialKey(numeroCasa);
    const email = numeroCasa === 101
      ? 'qa.residente@adminconjunta.local'
      : `qa.casa${padCasa(numeroCasa)}@adminconjunta.local`;

    return {
      key,
      tipo,
      email,
      nombres: 'QA',
      apellidos: `Casa ${padCasa(numeroCasa)}`,
      telefono: `31${String(numeroCasa).padStart(8, '0')}`,
      unidad: String(numeroCasa),
      torre: getBloqueCasa(numeroCasa),
      rutaInicial: '/residente/dashboard',
    };
  });
}

const perfiles = [...perfilesBase, ...buildResidentialProfiles()];

function writeCredentialsArtifacts(perfilesInput) {
  const credentialsPath = path.resolve(process.cwd(), '..', 'QA_CREDENCIALES_262_CASAS.csv');
  const matrixPath = path.resolve(process.cwd(), '..', 'QA_CREDENCIALES_262_CASAS.md');
  const headers = ['key', 'tipo', 'unidad', 'torre', 'email', 'password', 'ruta_inicial'];
  const csvRows = [
    headers.join(','),
    ...perfilesInput.map((perfil) =>
      [
        perfil.key,
        perfil.tipo,
        perfil.unidad,
        perfil.torre,
        perfil.email,
        DEFAULT_PASSWORD,
        perfil.rutaInicial,
      ].join(',')
    ),
  ];

  const markdownRows = perfilesInput
    .map(
      (perfil) =>
        `| ${perfil.key} | ${perfil.tipo} | ${perfil.unidad} | ${perfil.torre} | ${perfil.email} | ${DEFAULT_PASSWORD} | ${perfil.rutaInicial} |`
    )
    .join('\n');

  const markdown = [
    '# Credenciales QA 262 Casas',
    '',
    `Generado automaticamente el ${new Date().toISOString()}.`,
    '',
    'Todas las cuentas usan la misma clave de prueba para QA manual.',
    '',
    '| Key | Tipo | Unidad | Torre | Email | Clave | Ruta esperada |',
    '|---|---|---|---|---|---|---|',
    markdownRows,
    '',
  ].join('\n');

  fs.writeFileSync(credentialsPath, `${csvRows.join('\n')}\n`, 'utf8');
  fs.writeFileSync(matrixPath, markdown, 'utf8');

  return { credentialsPath, matrixPath };
}

function resolveServiceAccount() {
  const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const sourcePath = explicitPath || googleCredsPath;

  if (!sourcePath) return null;

  const absolutePath = path.isAbsolute(sourcePath)
    ? sourcePath
    : path.resolve(process.cwd(), sourcePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`No existe el service account JSON en: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);
  return { parsed, absolutePath };
}

function initFirebase() {
  const resolved = resolveServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID || resolved?.parsed?.project_id || CONJUNTO_ID;

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID es requerido cuando no se puede inferir desde service account.');
  }

  if (getApps().length === 0) {
    const credential = resolved ? cert(resolved.parsed) : applicationDefault();
    initializeApp({ credential, projectId });
  }

  return { db: getFirestore(), auth: getAuth(), projectId };
}

async function ensureAuthUser(auth, perfil) {
  try {
    const existing = await auth.getUserByEmail(perfil.email);
    await auth.updateUser(existing.uid, {
      displayName: `${perfil.nombres} ${perfil.apellidos}`,
      password: DEFAULT_PASSWORD,
      disabled: false,
    });
    return { user: existing, created: false };
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') throw error;

    const created = await auth.createUser({
      email: perfil.email,
      emailVerified: true,
      password: DEFAULT_PASSWORD,
      displayName: `${perfil.nombres} ${perfil.apellidos}`,
      disabled: false,
    });

    return { user: created, created: true };
  }
}

async function upsertUsuarioDoc(db, firebaseUser, perfil) {
  const ref = db.collection('usuarios').doc(firebaseUser.uid);
  const snap = await ref.get();

  const payload = {
    id: firebaseUser.uid,
    email: perfil.email,
    nombres: perfil.nombres,
    apellidos: perfil.apellidos,
    telefono: perfil.telefono,
    tipo: perfil.tipo,
    conjuntoId: CONJUNTO_ID,
    unidad: perfil.unidad,
    torre: perfil.torre,
    fechaRegistro: snap.exists ? snap.data().fechaRegistro || Timestamp.now() : Timestamp.now(),
    activo: true,
    consentimientoDatos: true,
    rutaInicial: perfil.rutaInicial,
    actualizadoEn: FieldValue.serverTimestamp(),
  };

  await ref.set(payload, { merge: true });
}

async function seedFirestoreBase(db, uidByRole) {
  const adminUid = uidByRole.get('administrador') || 'admin-seed';
  const residenteUid = uidByRole.get('residente') || 'residente-seed';

  const now = Timestamp.now();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const batch = db.batch();

  // Conjunto principal de pruebas
  batch.set(
    db.collection('conjuntos').doc(CONJUNTO_ID),
    {
      nombre: 'Administracion Conjunta - Demo QA',
      nombreConjunto: 'Conjunto Demo QA',
      direccion: 'Cra 105B # 65-81 Sur',
      localidad: 'Bosa',
      estrato: 2,
      tipo: 'casas',
      totalUnidades: 262,
      administradorId: adminUid,
      fechaRegistro: now,
      activo: true,
      telefono: '6010000000',
      email: 'demo@adminconjunta.local',
      cantidadCasas: 262,
      cantidadBloques: 8,
      cantidadTorres: 0,
      cantidadApartamentos: 0,
      cantidadConsejeros: 5,
      cuotaAdministracion: {
        valorMensual: 80000,
        diaVencimiento: 15,
        aplicaInteresMora: true,
        tasaInteresMoraMensual: 2.0,
        fechaVigenciaDesde: now,
      },
      accesosRapidosAdmin: ['finanzas', 'asambleas', 'documentos', 'seguridad'],
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Unidades base para dashboard/finanzas/residente
 // --- Dentro de seedFirestoreBase ---

// 1. Generar 262 unidades dinámicamente
const unidades = [];
for (let i = 1; i <= TOTAL_CASAS; i++) {
  const bloque = getBloqueCasa(i);
  unidades.push({
    id: `unidad-${i}`,
    numero: `${i}`,
    torre: bloque,
    tipo: 'casa',
    coeficiente: 1.0,
    estado: 'ocupada',
    residenteId: uidByRole.get(getResidentialKey(i)) || null
  });
}

for (const unidad of unidades) {
  batch.set(db.collection('unidades').doc(unidad.id), {
    conjuntoId: CONJUNTO_ID,
    ...unidad,
    actualizadoEn: FieldValue.serverTimestamp(),
  }, { merge: true });
}

// 2. Generar base de datos de Vehículos Autorizados
const vehiculosEjemplo = [
  { placa: 'KJW542', marca: 'Mazda', color: 'Gris', unidadId: 'unidad-101', tipo: 'Particular' },
  { placa: 'LMN987', marca: 'Toyota', color: 'Blanco', unidadId: 'unidad-102', tipo: 'Particular' },
  { placa: 'GHT432', marca: 'Renault', color: 'Rojo', unidadId: 'unidad-171', tipo: 'Moto' }
];

for (const veh of vehiculosEjemplo) {
  batch.set(db.collection('vehiculos').doc(veh.placa), {
    conjuntoId: CONJUNTO_ID,
    ...veh,
    autorizado: true,
    fechaRegistro: now,
    actualizadoEn: FieldValue.serverTimestamp(),
  }, { merge: true });
}

  // Zonas comunes y reservas
  batch.set(
    db.collection('zonasComunes').doc('zona-salon-comunal-2piso'),
    {
      conjuntoId: CONJUNTO_ID,
      nombre: 'Salon Comunal 2 Piso',
      tipo: 'salon',
      capacidad: 80,
      descripcion: 'Salon habilitado para reuniones y eventos internos.',
      horarioApertura: '08:00',
      horarioCierre: '22:00',
      requiereReserva: true,
      valorReserva: 50000,
      activo: true,
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Conceptos de pago base
  const conceptos = [
    { id: 'concepto-cuota-ordinaria', nombre: 'Cuota de administracion ordinaria', aplicaInteresMora: true },
    { id: 'concepto-cuota-extraordinaria', nombre: 'Cuota extraordinaria', aplicaInteresMora: true },
    { id: 'concepto-multas', nombre: 'Multas y sanciones', aplicaInteresMora: true },
    { id: 'concepto-parqueadero-vehiculo', nombre: 'Parqueadero vehicular', aplicaInteresMora: false },
  ];

  for (const concepto of conceptos) {
    batch.set(
      db.collection('conceptosPago').doc(concepto.id),
      {
        conjuntoId: CONJUNTO_ID,
        nombre: concepto.nombre,
        descripcion: `Concepto base QA: ${concepto.nombre}`,
        aplicaInteresMora: concepto.aplicaInteresMora,
        activo: true,
        creadoPor: adminUid,
        fechaCreacion: now,
        historialActualizaciones: [],
        actualizadoEn: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  // Pagos de ejemplo
  batch.set(
    db.collection('pagos').doc('pago-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      unidadId: 'unidad-101',
      residenteId: residenteUid,
      concepto: 'Cuota de administracion ordinaria',
      valor: 80000,
      fechaVencimiento: Timestamp.fromDate(nextMonth),
      estado: 'pendiente',
      mes: nextMonth.getMonth() + 1,
      anio: nextMonth.getFullYear(),
      consecutivoGeneral: 'PG-0000001',
      consecutivoResidente: 'PR-RESI-00001',
      aplicaInteresMora: true,
      tasaInteresMoraMensual: 2.0,
      fechaCreacion: now,
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    db.collection('pagos').doc('pago-demo-0002'),
    {
      conjuntoId: CONJUNTO_ID,
      unidadId: 'unidad-101',
      residenteId: residenteUid,
      concepto: 'Parqueadero vehicular',
      valor: 90000,
      fechaVencimiento: now,
      fechaPago: now,
      estado: 'pagado',
      metodoPago: 'transferencia',
      comprobante: 'TRX-DEMO-2026-0002',
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      consecutivoGeneral: 'PG-0000002',
      consecutivoResidente: 'PR-RESI-00002',
      aplicaInteresMora: false,
      fechaCreacion: now,
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Caja menor + gasto de ejemplo
  batch.set(
    db.collection('cajasMenores').doc('caja-menor-2026-01'),
    {
      conjuntoId: CONJUNTO_ID,
      montoAprobado: 1200000,
      fechaAprobacion: now,
      aprobadoPor: adminUid,
      estado: 'abierta',
      observaciones: 'Caja menor de pruebas para release 2026-03-06.',
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    db.collection('gastosCajaMenor').doc('gasto-caja-2026-01'),
    {
      cajaMenorId: 'caja-menor-2026-01',
      conjuntoId: CONJUNTO_ID,
      concepto: 'Compra de bombillos para zona comun',
      valor: 85000,
      fechaGasto: now,
      soporteUrl: 'https://example.com/soportes/gasto-caja-2026-01.pdf',
      soporteNombre: 'factura_bombillos.pdf',
      registradoPor: adminUid,
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Asamblea con votacion SI/NO + bitacora
  batch.set(
    db.collection('asambleas').doc('asamblea-demo-2026-01'),
    {
      conjuntoId: CONJUNTO_ID,
      creadoPor: adminUid,
      titulo: 'Asamblea Ordinaria Demo 2026',
      descripcion: 'Asamblea de prueba para validar modulo de votaciones y quorum.',
      fecha: now,
      horaInicio: '19:00',
      horaFin: '21:00',
      lugar: 'Salon Comunal 2 Piso',
      tipo: 'ordinaria',
      estado: 'en_curso',
      quorumRequerido: 131,
      quorumAlcanzado: 1,
      habilitarVotacion: true,
      tiempoVotacionMinutos: 120,
      votaciones: [],
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    db.collection('votaciones').doc('votacion-demo-2026-01'),
    {
      conjuntoId: CONJUNTO_ID,
      asambleaId: 'asamblea-demo-2026-01',
      pregunta: 'Aprueba el presupuesto 2026?',
      opciones: ['SI', 'NO'],
      votos: { SI: 1, NO: 0 },
      votantes: [residenteUid],
      votosRegistrados: [
        {
          usuarioId: residenteUid,
          unidadId: 'unidad-101',
          opcion: 'SI',
          fecha: now,
        },
      ],
      estado: 'activa',
      fechaCierre: Timestamp.fromDate(nextMonth),
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    db.collection('asambleaBitacora').doc('bitacora-asamblea-demo-01'),
    {
      conjuntoId: CONJUNTO_ID,
      asambleaId: 'asamblea-demo-2026-01',
      usuarioId: adminUid,
      evento: 'creacion_asamblea',
      detalle: 'Asamblea de demo creada automaticamente por seed.',
      fecha: now,
      inmodificable: true,
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Comunicados y documentos
  batch.set(
    db.collection('comunicados').doc('comunicado-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      autorId: adminUid,
      titulo: 'Comunicado de prueba',
      contenido: 'Este comunicado fue generado por el seed de QA.',
      fecha: now,
      tipo: 'general',
      destinatarios: 'todos',
      leidoPor: [],
      adjuntos: [],
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    db.collection('documentos').doc('documento-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      nombre: 'Acta Asamblea Demo',
      descripcion: 'Documento de ejemplo para probar descargas y listados.',
      tipo: 'acta_asamblea',
      categoria: 'legal',
      archivoUrl: 'https://example.com/documentos/acta-asamblea-demo.pdf',
      archivoNombre: 'acta-asamblea-demo.pdf',
      archivoTipo: 'application/pdf',
      archivoTamano: 245760,
      fechaSubida: now,
      subidoPor: adminUid,
      version: '1.0',
      esPublico: true,
      requiereAprobacion: false,
      estado: 'activo',
      etiquetas: ['demo', 'asamblea'],
      descargas: 0,
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Incidentes/visitantes para dashboard de seguridad
  batch.set(
    db.collection('incidentes').doc('incidente-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      unidadId: 'unidad-101',
      residenteId: residenteUid,
      tipo: 'seguridad',
      categoria: 'seguridad_robo',
      reportadoPorNombre: 'QA Residente',
      reportadoPorTelefono: '3000000006',
      reportadoPorEmail: 'qa.residente@adminconjunta.local',
      fechaIncidente: now,
      horaIncidente: '21:15',
      ubicacion: 'Porteria principal',
      descripcion: 'Intento de ingreso sin autorizacion (registro de prueba).',
      accionesInmediatas: 'Validacion de identidad y registro en minuta.',
      fecha: now,
      estado: 'reportado',
      prioridad: 'media',
      evidencias: [],
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    db.collection('visitantes').doc('visitante-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      nombre: 'Visitante QA',
      documento: '1010101010',
      telefono: '3001231234',
      unidadDestino: '101',
      residenteAutoriza: residenteUid,
      fechaIngreso: now,
      tipo: 'visitante',
      placaVehiculo: 'QAT123',
      observaciones: 'Registro de prueba para dashboard seguridad.',
      registradoPor: uidByRole.get('seguridad') || adminUid,
      actualizadoEn: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  if (!DRY_RUN) {
    await batch.commit();
  }
}

function buildClientConfig(projectId) {
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBJfYTin19PncHS0-N6HTu_UCpStyP6sKQ',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'base-f5700.firebaseapp.com',
    projectId,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'base-f5700.firebasestorage.app',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '346094727172',
    appId: process.env.VITE_FIREBASE_APP_ID || '1:346094727172:web:662c18350260b405afc551',
  };
}

function shouldFallbackToClientSeed(error) {
  const message = String(error?.message || error || '');
  return (
    message.includes('Could not load the default credentials') ||
    message.includes('FIREBASE_PROJECT_ID es requerido') ||
    message.includes('Credential implementation provided to initializeApp()')
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runWithAuthRetry(task, label) {
  let attempt = 0;

  while (attempt < 5) {
    try {
      return await task();
    } catch (error) {
      const code = error?.code || '';
      if (code !== 'auth/too-many-requests') {
        throw error;
      }

      attempt += 1;
      const waitMs = 5000 * attempt;
      console.warn(`[seed][client] Auth throttled en ${label}. Reintentando en ${waitMs / 1000}s...`);
      await sleep(waitMs);
    }
  }

  throw new Error(`Auth rate limit persistente en ${label}.`);
}

async function ensureClientAuthUser(authApi, firestoreApi, auth, db, perfil) {
  const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = authApi;
  const { doc, setDoc, serverTimestamp } = firestoreApi;
  let created = false;

  try {
    await runWithAuthRetry(
      () => signInWithEmailAndPassword(auth, perfil.email, DEFAULT_PASSWORD),
      `login ${perfil.email}`
    );
  } catch (error) {
    const code = error?.code || '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
      try {
        await runWithAuthRetry(
          () => createUserWithEmailAndPassword(auth, perfil.email, DEFAULT_PASSWORD),
          `creacion ${perfil.email}`
        );
        created = true;
      } catch (createError) {
        if (createError?.code === 'auth/email-already-in-use') {
          throw new Error(`La cuenta ${perfil.email} ya existe pero no acepta la clave de seed actual.`);
        }
        throw createError;
      }
    } else {
      throw error;
    }
  }

  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error(`No fue posible autenticar el perfil ${perfil.email}.`);
  }

  const ref = doc(db, 'usuarios', firebaseUser.uid);
  await setDoc(
    ref,
    {
      id: firebaseUser.uid,
      email: perfil.email,
      nombres: perfil.nombres,
      apellidos: perfil.apellidos,
      telefono: perfil.telefono,
      tipo: perfil.tipo,
      conjuntoId: CONJUNTO_ID,
      unidad: perfil.unidad,
      torre: perfil.torre,
      fechaRegistro: new Date(),
      activo: true,
      consentimientoDatos: true,
      rutaInicial: perfil.rutaInicial,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  await signOut(auth);
  return { uid: firebaseUser.uid, created };
}

async function seedFirestoreBaseClient(firestoreApi, db, uidByRole) {
  const { writeBatch, doc, serverTimestamp } = firestoreApi;
  const adminUid = uidByRole.get('administrador') || 'admin-seed';
  const residenteUid = uidByRole.get('residente') || 'residente-seed';
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const batch = writeBatch(db);

  batch.set(
    doc(db, 'conjuntos', CONJUNTO_ID),
    {
      nombre: 'Administracion Conjunta - Demo QA',
      nombreConjunto: 'Conjunto Demo QA',
      direccion: 'Cra 105B # 65-81 Sur',
      localidad: 'Bosa',
      estrato: 2,
      tipo: 'casas',
      totalUnidades: TOTAL_CASAS,
      administradorId: adminUid,
      fechaRegistro: now,
      activo: true,
      telefono: '6010000000',
      email: 'demo@adminconjunta.local',
      cantidadCasas: TOTAL_CASAS,
      cantidadBloques: 8,
      cantidadTorres: 0,
      cantidadApartamentos: 0,
      cantidadConsejeros: 5,
      cuotaAdministracion: {
        valorMensual: 80000,
        diaVencimiento: 15,
        aplicaInteresMora: true,
        tasaInteresMoraMensual: 2.0,
        fechaVigenciaDesde: now,
      },
      accesosRapidosAdmin: ['finanzas', 'asambleas', 'documentos', 'seguridad'],
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  for (let i = 1; i <= TOTAL_CASAS; i++) {
    batch.set(
      doc(db, 'unidades', `unidad-${i}`),
      {
        conjuntoId: CONJUNTO_ID,
        id: `unidad-${i}`,
        numero: `${i}`,
        torre: getBloqueCasa(i),
        tipo: 'casa',
        coeficiente: 1.0,
        estado: 'ocupada',
        residenteId: uidByRole.get(getResidentialKey(i)) || null,
        actualizadoEn: serverTimestamp(),
      },
      { merge: true }
    );
  }

  const vehiculosEjemplo = [
    { placa: 'KJW542', marca: 'Mazda', color: 'Gris', unidadId: 'unidad-101', tipo: 'Particular' },
    { placa: 'LMN987', marca: 'Toyota', color: 'Blanco', unidadId: 'unidad-102', tipo: 'Particular' },
    { placa: 'GHT432', marca: 'Renault', color: 'Rojo', unidadId: 'unidad-171', tipo: 'Moto' },
  ];

  vehiculosEjemplo.forEach((veh) => {
    batch.set(
      doc(db, 'vehiculos', veh.placa),
      {
        conjuntoId: CONJUNTO_ID,
        ...veh,
        autorizado: true,
        fechaRegistro: now,
        actualizadoEn: serverTimestamp(),
      },
      { merge: true }
    );
  });

  const conceptos = [
    { id: 'concepto-cuota-ordinaria', nombre: 'Cuota de administracion ordinaria', aplicaInteresMora: true },
    { id: 'concepto-cuota-extraordinaria', nombre: 'Cuota extraordinaria', aplicaInteresMora: true },
    { id: 'concepto-multas', nombre: 'Multas y sanciones', aplicaInteresMora: true },
    { id: 'concepto-parqueadero-vehiculo', nombre: 'Parqueadero vehicular', aplicaInteresMora: false },
  ];

  conceptos.forEach((concepto) => {
    batch.set(
      doc(db, 'conceptosPago', concepto.id),
      {
        conjuntoId: CONJUNTO_ID,
        nombre: concepto.nombre,
        descripcion: `Concepto base QA: ${concepto.nombre}`,
        aplicaInteresMora: concepto.aplicaInteresMora,
        activo: true,
        creadoPor: adminUid,
        fechaCreacion: now,
        historialActualizaciones: [],
        actualizadoEn: serverTimestamp(),
      },
      { merge: true }
    );
  });

  batch.set(
    doc(db, 'pagos', 'pago-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      unidadId: 'unidad-101',
      residenteId: residenteUid,
      concepto: 'Cuota de administracion ordinaria',
      valor: 80000,
      fechaVencimiento: nextMonth,
      estado: 'pendiente',
      mes: nextMonth.getMonth() + 1,
      anio: nextMonth.getFullYear(),
      consecutivoGeneral: 'PG-0000001',
      consecutivoResidente: 'PR-RESI-00001',
      aplicaInteresMora: true,
      tasaInteresMoraMensual: 2.0,
      fechaCreacion: now,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'pagos', 'pago-demo-0002'),
    {
      conjuntoId: CONJUNTO_ID,
      unidadId: 'unidad-101',
      residenteId: residenteUid,
      concepto: 'Parqueadero vehicular',
      valor: 90000,
      fechaVencimiento: now,
      fechaPago: now,
      estado: 'pagado',
      metodoPago: 'transferencia',
      comprobante: 'TRX-DEMO-2026-0002',
      mes: now.getMonth() + 1,
      anio: now.getFullYear(),
      consecutivoGeneral: 'PG-0000002',
      consecutivoResidente: 'PR-RESI-00002',
      aplicaInteresMora: false,
      fechaCreacion: now,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'cajasMenores', 'caja-menor-2026-01'),
    {
      conjuntoId: CONJUNTO_ID,
      montoAprobado: 1200000,
      fechaAprobacion: now,
      aprobadoPor: adminUid,
      estado: 'abierta',
      observaciones: 'Caja menor de pruebas para release 2026-03-06.',
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'gastosCajaMenor', 'gasto-caja-2026-01'),
    {
      cajaMenorId: 'caja-menor-2026-01',
      conjuntoId: CONJUNTO_ID,
      concepto: 'Compra de bombillos para zona comun',
      valor: 85000,
      fechaGasto: now,
      soporteUrl: 'https://example.com/soportes/gasto-caja-2026-01.pdf',
      soporteNombre: 'factura_bombillos.pdf',
      registradoPor: adminUid,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'asambleas', 'asamblea-demo-2026-01'),
    {
      conjuntoId: CONJUNTO_ID,
      creadoPor: adminUid,
      titulo: 'Asamblea Ordinaria Demo 2026',
      descripcion: 'Asamblea de prueba para validar modulo de votaciones y quorum.',
      fecha: now,
      horaInicio: '19:00',
      horaFin: '21:00',
      lugar: 'Salon Comunal 2 Piso',
      tipo: 'ordinaria',
      estado: 'en_curso',
      quorumRequerido: 131,
      quorumAlcanzado: 1,
      habilitarVotacion: true,
      tiempoVotacionMinutos: 120,
      votaciones: [],
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'votaciones', 'votacion-demo-2026-01'),
    {
      conjuntoId: CONJUNTO_ID,
      asambleaId: 'asamblea-demo-2026-01',
      pregunta: 'Aprueba el presupuesto 2026?',
      opciones: ['SI', 'NO'],
      votos: { SI: 1, NO: 0 },
      votantes: [residenteUid],
      votosRegistrados: [
        {
          usuarioId: residenteUid,
          unidadId: 'unidad-101',
          opcion: 'SI',
          fecha: now,
        },
      ],
      estado: 'activa',
      fechaCierre: nextMonth,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'asambleaBitacora', 'bitacora-asamblea-demo-01'),
    {
      conjuntoId: CONJUNTO_ID,
      asambleaId: 'asamblea-demo-2026-01',
      usuarioId: adminUid,
      evento: 'creacion_asamblea',
      detalle: 'Asamblea de demo creada automaticamente por seed.',
      fecha: now,
      inmodificable: true,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'comunicados', 'comunicado-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      autorId: adminUid,
      titulo: 'Comunicado de prueba',
      contenido: 'Este comunicado fue generado por el seed de QA.',
      fecha: now,
      tipo: 'general',
      destinatarios: 'todos',
      leidoPor: [],
      adjuntos: [],
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'documentos', 'documento-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      nombre: 'Acta Asamblea Demo',
      descripcion: 'Documento de ejemplo para probar descargas y listados.',
      tipo: 'acta_asamblea',
      categoria: 'legal',
      archivoUrl: 'https://example.com/documentos/acta-asamblea-demo.pdf',
      archivoNombre: 'acta-asamblea-demo.pdf',
      archivoTipo: 'application/pdf',
      archivoTamano: 245760,
      fechaSubida: now,
      subidoPor: adminUid,
      version: '1.0',
      esPublico: true,
      requiereAprobacion: false,
      estado: 'activo',
      etiquetas: ['demo', 'asamblea'],
      descargas: 0,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'incidentes', 'incidente-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      unidadId: 'unidad-101',
      residenteId: residenteUid,
      tipo: 'seguridad',
      categoria: 'seguridad_robo',
      reportadoPorNombre: 'QA Residente',
      reportadoPorTelefono: '3000000006',
      reportadoPorEmail: 'qa.residente@adminconjunta.local',
      fechaIncidente: now,
      horaIncidente: '21:15',
      ubicacion: 'Porteria principal',
      descripcion: 'Intento de ingreso sin autorizacion (registro de prueba).',
      accionesInmediatas: 'Validacion de identidad y registro en minuta.',
      fecha: now,
      estado: 'reportado',
      prioridad: 'media',
      evidencias: [],
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    doc(db, 'visitantes', 'visitante-demo-0001'),
    {
      conjuntoId: CONJUNTO_ID,
      nombre: 'Visitante QA',
      documento: '1010101010',
      telefono: '3001231234',
      unidadDestino: '101',
      residenteAutoriza: residenteUid,
      fechaIngreso: now,
      tipo: 'visitante',
      placaVehiculo: 'QAT123',
      observaciones: 'Registro de prueba para dashboard seguridad.',
      registradoPor: uidByRole.get('seguridad') || adminUid,
      actualizadoEn: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

async function runClientSeedFallback(projectId) {
  const firebaseAppModule = await import('firebase/app');
  const firebaseAuthModule = await import('firebase/auth');
  const firebaseFirestoreModule = await import('firebase/firestore');
  const app = firebaseAppModule.initializeApp(buildClientConfig(projectId), `seed-client-${Date.now()}`);
  const auth = firebaseAuthModule.getAuth(app);
  const db = firebaseFirestoreModule.getFirestore(app);
  const uidByRole = new Map();

  try {
    const adminProfile = perfiles.find((perfil) => perfil.key === 'administrador');
    if (!adminProfile) {
      throw new Error('No se encontró el perfil administrador base para el seed cliente.');
    }

    const adminSeed = await ensureClientAuthUser(firebaseAuthModule, firebaseFirestoreModule, auth, db, adminProfile);
    uidByRole.set(adminProfile.key, adminSeed.uid);
    console.log(`[seed][client] ${adminSeed.created ? 'CREADO' : 'ACTUALIZADO'} usuario ${adminProfile.email} (${adminProfile.tipo})`);

    await runWithAuthRetry(
      () => firebaseAuthModule.signInWithEmailAndPassword(auth, adminProfile.email, DEFAULT_PASSWORD),
      `login ${adminProfile.email}`
    );

    const existingUsersSnapshot = await firebaseFirestoreModule.getDocs(
      firebaseFirestoreModule.query(
        firebaseFirestoreModule.collection(db, 'usuarios'),
        firebaseFirestoreModule.where('conjuntoId', '==', CONJUNTO_ID)
      )
    );
    const existingUsersByEmail = new Map(
      existingUsersSnapshot.docs.map((snapshot) => [snapshot.data().email, snapshot.data().id || snapshot.id])
    );
    await firebaseAuthModule.signOut(auth);

    for (const perfil of perfiles) {
      if (existingUsersByEmail.has(perfil.email)) {
        uidByRole.set(perfil.key, existingUsersByEmail.get(perfil.email));
        console.log(`[seed][client] REUTILIZADO usuario ${perfil.email} (${perfil.tipo})`);
        continue;
      }

      const { uid, created } = await ensureClientAuthUser(firebaseAuthModule, firebaseFirestoreModule, auth, db, perfil);
      uidByRole.set(perfil.key, uid);
      console.log(`[seed][client] ${created ? 'CREADO' : 'ACTUALIZADO'} usuario ${perfil.email} (${perfil.tipo})`);
    }

    await runWithAuthRetry(
      () => firebaseAuthModule.signInWithEmailAndPassword(auth, adminProfile.email, DEFAULT_PASSWORD),
      `login ${adminProfile.email}`
    );
    await seedFirestoreBaseClient(firebaseFirestoreModule, db, uidByRole);
    await firebaseAuthModule.signOut(auth);
  } finally {
    await firebaseAppModule.deleteApp(app);
  }
}

async function main() {
  const start = Date.now();
  let projectId = process.env.FIREBASE_PROJECT_ID || CONJUNTO_ID;
  const { credentialsPath, matrixPath } = writeCredentialsArtifacts(perfiles);

  console.log(`\n[seed] Proyecto Firebase: ${projectId}`);
  console.log(`[seed] Conjunto objetivo: ${CONJUNTO_ID}`);
  console.log(`[seed] Modo: ${DRY_RUN ? 'DRY_RUN (sin escrituras)' : 'APLICAR CAMBIOS'}`);
  console.log(`[seed] Credenciales CSV: ${credentialsPath}`);
  console.log(`[seed] Credenciales MD: ${matrixPath}`);

  if (DRY_RUN) {
    for (const perfil of perfiles) {
      console.log(`[seed][dry-run] ${perfil.tipo} -> ${perfil.email}`);
    }
  } else {
    try {
      const { db, auth, projectId: adminProjectId } = initFirebase();
      projectId = adminProjectId;
      const uidByRole = new Map();

      for (const perfil of perfiles) {
        const { user, created } = await ensureAuthUser(auth, perfil);
        await auth.setCustomUserClaims(user.uid, { tipo: perfil.tipo });
        await upsertUsuarioDoc(db, user, perfil);

        uidByRole.set(perfil.key, user.uid);
        console.log(`[seed] ${created ? 'CREADO' : 'ACTUALIZADO'} usuario ${perfil.email} (${perfil.tipo})`);
      }

      await seedFirestoreBase(db, uidByRole);
    } catch (error) {
      if (!shouldFallbackToClientSeed(error)) {
        throw error;
      }

      console.log('[seed] Sin credenciales admin locales. Ejecutando fallback con Firebase cliente...');
      await runClientSeedFallback(projectId);
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n[seed] Completado en ${elapsed}s`);
  console.log(`[seed] Password por defecto aplicado: ${DEFAULT_PASSWORD}`);
}

main().catch((error) => {
  console.error('\n[seed] ERROR:', error.message);
  process.exitCode = 1;
});
