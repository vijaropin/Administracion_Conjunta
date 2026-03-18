#!/usr/bin/env node
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const cfg = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBJfYTin19PncHS0-N6HTu_UCpStyP6sKQ',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'base-f5700.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'base-f5700',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'base-f5700.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '346094727172',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:346094727172:web:662c18350260b405afc551',
};

const password = process.env.SEED_DEFAULT_PASSWORD || 'AdminConjunta#2026';
const conjuntoId = process.env.SEED_CONJUNTO_ID || 'base-f5700';
const runId = Date.now();

const roles = [
  { key: 'admin', email: 'qa.admin@adminconjunta.local' },
  { key: 'consejo', email: 'qa.consejo@adminconjunta.local' },
  { key: 'contadora', email: 'qa.contadora@adminconjunta.local' },
  { key: 'seguridad', email: 'qa.seguridad@adminconjunta.local' },
  { key: 'comite', email: 'qa.comite@adminconjunta.local' },
  { key: 'residente', email: 'qa.residente@adminconjunta.local' },
  { key: 'servicios', email: 'qa.servicios@adminconjunta.local' },
];

function denied(err) {
  const code = err?.code || '';
  return code.includes('permission-denied') || code.includes('PERMISSION_DENIED');
}

async function canRead(db, path) {
  try {
    await getDoc(doc(db, path));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

async function canWrite(db, path, data) {
  try {
    await setDoc(doc(db, path), data, { merge: true });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

const tests = {
  admin: async (db, uid) => ({
    readConjunto: await canRead(db, `conjuntos/${conjuntoId}`),
    writeConcepto: await canWrite(db, `conceptosPago/rbac_admin_${runId}`, {
      conjuntoId, nombre: 'RBAC admin', activo: true, aplicaInteresMora: false, creadoPor: uid, fechaCreacion: serverTimestamp(), historialActualizaciones: []
    }),
  }),
  consejo: async (db) => ({
    readConjunto: await canRead(db, `conjuntos/${conjuntoId}`),
    writeConcepto: await canWrite(db, `conceptosPago/rbac_consejo_${runId}`, {
      conjuntoId, nombre: 'RBAC consejo', activo: true, aplicaInteresMora: false, creadoPor: 'qa', fechaCreacion: serverTimestamp(), historialActualizaciones: []
    }),
  }),
  contadora: async (db, uid) => ({
    readConjunto: await canRead(db, `conjuntos/${conjuntoId}`),
    writeConcepto: await canWrite(db, `conceptosPago/rbac_contadora_${runId}`, {
      conjuntoId, nombre: 'RBAC contadora', activo: true, aplicaInteresMora: false, creadoPor: uid, fechaCreacion: serverTimestamp(), historialActualizaciones: []
    }),
  }),
  seguridad: async (db, uid) => ({
    readConjunto: await canRead(db, `conjuntos/${conjuntoId}`),
    writeIncidente: await canWrite(db, `incidentes/rbac_seguridad_${runId}`, {
      conjuntoId, tipo: 'seguridad', categoria: 'seguridad_robo', descripcion: 'Prueba RBAC seguridad', fecha: serverTimestamp(), estado: 'reportado', reportadoPor: uid
    }),
  }),
  comite: async (db, uid) => ({
    readConjunto: await canRead(db, `conjuntos/${conjuntoId}`),
    writeSolicitud: await canWrite(db, `solicitudesGestion/rbac_comite_${runId}`, {
      conjuntoId, tipo: 'multa_convivencia', estado: 'pendiente_consejo', titulo: 'RBAC comité', descripcion: 'Prueba', solicitadaPor: uid, solicitadaPorRol: 'comite_convivencia', fechaSolicitud: serverTimestamp()
    }),
  }),
  residente: async (db, uid) => ({
    readConjunto: await canRead(db, `conjuntos/${conjuntoId}`),
    writeIncidente: await canWrite(db, `incidentes/rbac_residente_${runId}`, {
      conjuntoId, tipo: 'ruido', categoria: 'ruido_convivencia', descripcion: 'Prueba RBAC residente', fecha: serverTimestamp(), estado: 'reportado', residenteId: uid
    }),
    writeConcepto: await canWrite(db, `conceptosPago/rbac_residente_${runId}`, {
      conjuntoId, nombre: 'NO debe permitir', activo: true, aplicaInteresMora: false, creadoPor: uid, fechaCreacion: serverTimestamp(), historialActualizaciones: []
    }),
  }),
  servicios: async (db, uid) => ({
    readConjunto: await canRead(db, `conjuntos/${conjuntoId}`),
    writeNovedad: await canWrite(db, `novedadesServicios/rbac_servicios_${runId}`, {
      conjuntoId, reportadoPor: uid, tipo: 'mantenimiento', prioridad: 'media', descripcion: 'Prueba RBAC servicios', ubicacion: 'Bloque A', fechaReporte: serverTimestamp(), estado: 'reportada'
    }),
  }),
};

async function run() {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const results = [];
  for (const role of roles) {
    try {
      const cred = await signInWithEmailAndPassword(auth, role.email, password);
      const uid = cred.user.uid;
      const ownUserRead = await canRead(db, `usuarios/${uid}`);
      const r = await tests[role.key](db, uid);
      results.push({ role: role.key, email: role.email, ownUserRead, ...r });
      await signOut(auth);
    } catch (e) {
      results.push({ role: role.key, email: role.email, authError: e?.code || e?.message || String(e) });
      try { await signOut(auth); } catch {}
    }
  }

  console.log('=== RESULTADOS RBAC (Firestore real) ===');
  for (const item of results) {
    console.log(`\n[${item.role}] ${item.email}`);
    if (item.authError) {
      console.log(`  AUTH: ERROR -> ${item.authError}`);
      continue;
    }
    for (const [k, v] of Object.entries(item)) {
      if (['role', 'email'].includes(k)) continue;
      if (v && typeof v === 'object' && 'ok' in v) {
        const tag = v.ok ? 'OK' : denied(v.error) ? 'DENY(expected?)' : 'ERROR';
        const code = v.error?.code ? ` (${v.error.code})` : '';
        console.log(`  ${k}: ${tag}${code}`);
      }
    }
  }
}

run().catch((e) => {
  console.error('Fallo ejecutando prueba RBAC:', e);
  process.exit(1);
});
