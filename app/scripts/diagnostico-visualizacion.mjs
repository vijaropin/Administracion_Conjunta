#!/usr/bin/env node
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, getCountFromServer, query, where, getDoc, doc } from 'firebase/firestore';

const cfg = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyBJfYTin19PncHS0-N6HTu_UCpStyP6sKQ',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'base-f5700.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'base-f5700',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'base-f5700.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '346094727172',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:346094727172:web:662c18350260b405afc551',
};

const users = [
  'qa.admin@adminconjunta.local',
  'qa.consejo@adminconjunta.local',
  'qa.contadora@adminconjunta.local',
  'qa.seguridad@adminconjunta.local',
  'qa.comite@adminconjunta.local',
  'qa.residente@adminconjunta.local',
  'qa.servicios@adminconjunta.local',
];

const password = process.env.SEED_DEFAULT_PASSWORD || 'AdminConjunta#2026';

const collections = [
  'conjuntos',
  'unidades',
  'pagos',
  'conceptosPago',
  'cajasMenores',
  'gastosCajaMenor',
  'comunicados',
  'asambleas',
  'documentos',
  'vehiculos',
  'parqueaderos',
  'incidentes',
  'reservas',
  'conflictos',
  'audiencias',
  'novedadesServicios',
  'solicitudesImplementos',
  'tareasServicios',
  'solicitudesGestion',
];

async function countByConjunto(db, col, conjuntoId) {
  try {
    if (col === 'conjuntos') {
      const q = query(collection(db, col), where('__name__', '==', conjuntoId));
      const snap = await getCountFromServer(q);
      return { ok: true, count: snap.data().count };
    }
    const q = query(collection(db, col), where('conjuntoId', '==', conjuntoId));
    const snap = await getCountFromServer(q);
    return { ok: true, count: snap.data().count };
  } catch (e) {
    return { ok: false, error: e?.code || e?.message || String(e) };
  }
}

async function run() {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);

  for (const email of users) {
    console.log(`\n=== ${email} ===`);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdTokenResult();
      console.log(`uid: ${cred.user.uid}`);

      // Obtener conjuntoId desde custom claims no aplica; lo consultamos desde doc usuarios con query por uid no permitido
      // Usamos el patrón del proyecto: conjunto fijo de seed por defecto.
      const conjuntoId = process.env.SEED_CONJUNTO_ID || 'base-f5700';
      console.log(`conjunto evaluado: ${conjuntoId}`);

      for (const col of collections) {
        const r = await countByConjunto(db, col, conjuntoId);
        if (!r.ok) {
          console.log(`  ${col}: ERROR ${r.error}`);
        } else {
          console.log(`  ${col}: ${r.count}`);
        }
      }

      console.log(`token exp: ${new Date(token.expirationTime).toISOString()}`);
      await signOut(auth);
    } catch (e) {
      console.log(`AUTH ERROR: ${e?.code || e?.message || String(e)}`);
      try { await signOut(auth); } catch {}
    }
  }
}

run().catch((e) => {
  console.error('Fallo diagnóstico:', e);
  process.exit(1);
});

