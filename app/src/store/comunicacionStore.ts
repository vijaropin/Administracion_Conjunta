import { create } from 'zustand';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Asamblea, AsambleaBitacora, Comunicado, Notificacion, Votacion, VotoRegistrado } from '@/types';

interface ComunicacionState {
  comunicados: Comunicado[];
  asambleas: Asamblea[];
  votaciones: Votacion[];
  bitacoraAsamblea: AsambleaBitacora[];
  notificaciones: Notificacion[];
  loading: boolean;
  error: string | null;

  fetchComunicados: (conjuntoId: string) => Promise<void>;
  createComunicado: (comunicado: Omit<Comunicado, 'id'>) => Promise<string>;
  marcarLeido: (comunicadoId: string, usuarioId: string) => Promise<void>;

  fetchAsambleas: (conjuntoId: string) => Promise<void>;
  createAsamblea: (asamblea: Omit<Asamblea, 'id'>) => Promise<string>;
  updateAsamblea: (id: string, data: Partial<Asamblea>) => Promise<void>;

  fetchVotaciones: (asambleaId: string) => Promise<void>;
  createVotacion: (votacion: Omit<Votacion, 'id'>) => Promise<string>;
  cerrarVotacion: (votacionId: string, usuarioId: string) => Promise<void>;
  votar: (votacionId: string, opcion: 'SI' | 'NO', usuarioId: string, unidadId?: string) => Promise<void>;

  fetchBitacoraAsamblea: (asambleaId: string) => Promise<void>;
  registrarEventoAsamblea: (evento: Omit<AsambleaBitacora, 'id' | 'fecha'>) => Promise<string>;

  fetchNotificaciones: (usuarioId: string) => Promise<void>;
  marcarNotificacionLeida: (notificacionId: string) => Promise<void>;
  createNotificacion: (notificacion: Omit<Notificacion, 'id'>) => Promise<string>;
}

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string);
};

export const useComunicacionStore = create<ComunicacionState>((set, get) => ({
  comunicados: [],
  asambleas: [],
  votaciones: [],
  bitacoraAsamblea: [],
  notificaciones: [],
  loading: false,
  error: null,

  fetchComunicados: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'comunicados'), where('conjuntoId', '==', conjuntoId), orderBy('fecha', 'desc'));
      const snapshot = await getDocs(q);
      const comunicados = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Comunicado));
      set({ comunicados, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createComunicado: async (comunicado) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'comunicados'), comunicado);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  marcarLeido: async (comunicadoId: string, usuarioId: string) => {
    try {
      await updateDoc(doc(db, 'comunicados', comunicadoId), {
        leidoPor: arrayUnion(usuarioId),
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchAsambleas: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'asambleas'), where('conjuntoId', '==', conjuntoId), orderBy('fecha', 'desc'));
      const snapshot = await getDocs(q);
      const asambleas = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Asamblea));
      set({ asambleas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createAsamblea: async (asamblea) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'asambleas'), asamblea);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateAsamblea: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'asambleas', id), data as Record<string, unknown>);
      set({ asambleas: get().asambleas.map((a) => (a.id === id ? { ...a, ...data } : a)), loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchVotaciones: async (asambleaId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'votaciones'), where('asambleaId', '==', asambleaId));
      const snapshot = await getDocs(q);
      const votaciones = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Votacion));
      set({ votaciones, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createVotacion: async (votacion) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'votaciones'), votacion);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  cerrarVotacion: async (votacionId, usuarioId) => {
    set({ loading: true, error: null });
    try {
      const votacionRef = doc(db, 'votaciones', votacionId);
      const votacionDoc = await getDoc(votacionRef);
      if (!votacionDoc.exists()) throw new Error('Votación no encontrada');
      const votacion = votacionDoc.data() as Votacion;

      await updateDoc(votacionRef, { estado: 'cerrada', fechaCierre: new Date() });
      set({
        votaciones: get().votaciones.map((v) => (v.id === votacionId ? { ...v, estado: 'cerrada', fechaCierre: new Date() } : v)),
      });

      await get().registrarEventoAsamblea({
        asambleaId: votacion.asambleaId,
        usuarioId,
        evento: 'cierre_votacion',
        detalle: `Cierre manual de votación: ${votacion.pregunta}`,
      });

      const asambleaRef = doc(db, 'asambleas', votacion.asambleaId);
      const asambleaDoc = await getDoc(asambleaRef);
      if (asambleaDoc.exists()) {
        await updateDoc(asambleaRef, { estado: 'finalizada' });
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  votar: async (votacionId, opcion, usuarioId, unidadId) => {
    set({ loading: true, error: null });
    try {
      const votacionRef = doc(db, 'votaciones', votacionId);
      const votacionDoc = await getDoc(votacionRef);

      if (!votacionDoc.exists()) throw new Error('Votación no encontrada');

      const votacion = votacionDoc.data() as Votacion;
      const fechaCierre = toDate(votacion.fechaCierre);

      if (votacion.estado !== 'activa') throw new Error('La votación ya se encuentra cerrada');
      if (fechaCierre && new Date() > fechaCierre) throw new Error('La ventana de votación ya finalizó');
      if (votacion.votantes?.includes(usuarioId)) throw new Error('Ya registraste tu voto en esta votación');

      const nuevosVotos = { ...votacion.votos, [opcion]: (votacion.votos?.[opcion] || 0) + 1 };
      const nuevoRegistro: VotoRegistrado = {
        usuarioId,
        unidadId,
        opcion,
        fecha: new Date(),
      };

      await updateDoc(votacionRef, {
        votos: nuevosVotos,
        votantes: arrayUnion(usuarioId),
        votosRegistrados: arrayUnion(nuevoRegistro),
      });

      const localVotaciones = get().votaciones.map((v) =>
        v.id === votacionId
          ? {
              ...v,
              votos: nuevosVotos,
              votantes: [...(v.votantes || []), usuarioId],
              votosRegistrados: [...(v.votosRegistrados || []), nuevoRegistro],
            }
          : v
      );
      set({ votaciones: localVotaciones });

      await get().registrarEventoAsamblea({
        asambleaId: votacion.asambleaId,
        usuarioId,
        evento: 'voto_registrado',
        detalle: `Voto ${opcion} registrado por unidad ${unidadId || 'sin unidad'}`,
      });

      const votacionesAsambleaQuery = query(collection(db, 'votaciones'), where('asambleaId', '==', votacion.asambleaId));
      const votacionesAsambleaSnap = await getDocs(votacionesAsambleaQuery);
      const votantesUnicos = new Set<string>();
      votacionesAsambleaSnap.forEach((d) => {
        const data = d.data() as Votacion;
        (data.votantes || []).forEach((id) => votantesUnicos.add(id));
      });

      await updateDoc(doc(db, 'asambleas', votacion.asambleaId), {
        quorumAlcanzado: votantesUnicos.size,
      });

      set({
        asambleas: get().asambleas.map((a) =>
          a.id === votacion.asambleaId ? { ...a, quorumAlcanzado: votantesUnicos.size } : a
        ),
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchBitacoraAsamblea: async (asambleaId) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'asambleaBitacora'), where('asambleaId', '==', asambleaId), orderBy('fecha', 'desc'));
      const snapshot = await getDocs(q);
      const bitacoraAsamblea = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AsambleaBitacora));
      set({ bitacoraAsamblea, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  registrarEventoAsamblea: async (evento) => {
    try {
      const docRef = await addDoc(collection(db, 'asambleaBitacora'), {
        ...evento,
        fecha: new Date(),
      });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchNotificaciones: async (usuarioId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'notificaciones'), where('usuarioId', '==', usuarioId), orderBy('fecha', 'desc'));
      const snapshot = await getDocs(q);
      const notificaciones = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Notificacion));
      set({ notificaciones, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  marcarNotificacionLeida: async (notificacionId: string) => {
    try {
      await updateDoc(doc(db, 'notificaciones', notificacionId), { leida: true });
      set({ notificaciones: get().notificaciones.map((n) => (n.id === notificacionId ? { ...n, leida: true } : n)) });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createNotificacion: async (notificacion) => {
    try {
      const docRef = await addDoc(collection(db, 'notificaciones'), notificacion);
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
