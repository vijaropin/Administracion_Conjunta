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
import { auth, db } from '@/config/firebase';
import { duracionMs, iniciarMedicion, registrarLogTiempoRespuesta } from '@/lib/responseTimeLogger';
import type { Asamblea, AsambleaBitacora, Comunicado, Notificacion, Votacion, VotoRegistrado, Sugerencia } from '@/types';

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

  sugerencias: Sugerencia[];
  fetchSugerencias: (conjuntoId: string) => Promise<void>;
  createSugerencia: (sugerencia: Omit<Sugerencia, 'id'>) => Promise<string>;
}

const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string);
};

const normalizeSugerencia = (id: string, data: Record<string, unknown>): Sugerencia => ({
  id,
  conjuntoId: String(data.conjuntoId || ''),
  usuarioId: String(data.usuarioId || ''),
  contenido: String(data.contenido || ''),
  fecha: toDate(data.fecha) || new Date(),
  usuarioNombre: typeof data.usuarioNombre === 'string' ? data.usuarioNombre : undefined,
  usuarioUnidad: typeof data.usuarioUnidad === 'string' ? data.usuarioUnidad : undefined,
  usuarioTorre: typeof data.usuarioTorre === 'string' ? data.usuarioTorre : undefined,
});

const isFirestoreIndexError = (error: unknown) => {
  const firebaseError = error as { code?: string; message?: string } | undefined;
  return firebaseError?.code === 'failed-precondition' || /index/i.test(String(firebaseError?.message || ''));
};

const getAsambleaConjuntoId = async (asambleaId: string): Promise<string> => {
  const asambleaDoc = await getDoc(doc(db, 'asambleas', asambleaId));
  if (!asambleaDoc.exists()) {
    throw new Error('Asamblea no encontrada');
  }

  return String(asambleaDoc.data().conjuntoId || '');
};

const normalizeVotacion = (id: string, data: Record<string, unknown>): Votacion => ({
  id,
  conjuntoId: String(data.conjuntoId || ''),
  asambleaId: String(data.asambleaId || ''),
  pregunta: String(data.pregunta || ''),
  opciones: Array.isArray(data.opciones) ? (data.opciones as ('SI' | 'NO')[]) : ['SI', 'NO'],
  votos: (data.votos as Record<string, number>) || { SI: 0, NO: 0 },
  votantes: Array.isArray(data.votantes) ? (data.votantes as string[]) : [],
  votosRegistrados: Array.isArray(data.votosRegistrados)
    ? (data.votosRegistrados as VotoRegistrado[]).map((registro) => ({
      ...registro,
      fecha: toDate(registro.fecha) || new Date(),
    }))
    : [],
  estado: data.estado === 'cerrada' ? 'cerrada' : 'activa',
  fechaCierre: toDate(data.fechaCierre),
});

const normalizeAsamblea = (id: string, data: Record<string, unknown>): Asamblea => ({
  id,
  conjuntoId: String(data.conjuntoId || ''),
  creadoPor: String(data.creadoPor || ''),
  titulo: String(data.titulo || ''),
  descripcion: String(data.descripcion || ''),
  fecha: toDate(data.fecha) || new Date(),
  horaInicio: String(data.horaInicio || ''),
  horaFin: String(data.horaFin || ''),
  lugar: String(data.lugar || ''),
  tipo: data.tipo === 'extraordinaria' ? 'extraordinaria' : 'ordinaria',
  estado:
    data.estado === 'en_curso' || data.estado === 'finalizada' || data.estado === 'cancelada'
      ? data.estado
      : 'programada',
  quorumRequerido: Number(data.quorumRequerido || 0),
  quorumAlcanzado: Number(data.quorumAlcanzado || 0),
  habilitarVotacion: Boolean(data.habilitarVotacion),
  tiempoVotacionMinutos: Number(data.tiempoVotacionMinutos || 0),
  votaciones: Array.isArray(data.votaciones)
    ? (data.votaciones as Votacion[]).map((votacion, index) =>
      normalizeVotacion(votacion.id || `votacion-${index}`, votacion as unknown as Record<string, unknown>)
    )
    : [],
});

const normalizeBitacora = (id: string, data: Record<string, unknown>): AsambleaBitacora => ({
  id,
  conjuntoId: String(data.conjuntoId || ''),
  asambleaId: String(data.asambleaId || ''),
  usuarioId: String(data.usuarioId || ''),
  evento:
    data.evento === 'apertura_votacion' || data.evento === 'cierre_votacion' || data.evento === 'voto_registrado'
      ? data.evento
      : 'creacion_asamblea',
  detalle: String(data.detalle || ''),
  fecha: toDate(data.fecha) || new Date(),
});

const normalizeComunicado = (id: string, data: Record<string, unknown>): Comunicado => ({
  id,
  conjuntoId: String(data.conjuntoId || ''),
  autorId: String(data.autorId || ''),
  titulo: String(data.titulo || ''),
  contenido: String(data.contenido || ''),
  fecha: toDate(data.fecha) || new Date(),
  tipo:
    data.tipo === 'urgente' || data.tipo === 'asamblea' || data.tipo === 'mantenimiento'
      ? data.tipo
      : 'general',
  destinatarios:
    data.destinatarios === 'torre' ||
      data.destinatarios === 'unidad' ||
      data.destinatarios === 'seguridad' ||
      data.destinatarios === 'comite_convivencia' ||
      data.destinatarios === 'consejo_administracion'
      ? data.destinatarios
      : 'todos',
  torreDestino: typeof data.torreDestino === 'string' ? data.torreDestino : undefined,
  unidadDestino: typeof data.unidadDestino === 'string' ? data.unidadDestino : undefined,
  leidoPor: Array.isArray(data.leidoPor) ? (data.leidoPor as string[]) : [],
  adjuntos: Array.isArray(data.adjuntos) ? (data.adjuntos as string[]) : undefined,
});

const normalizeText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const getAsambleaSignature = (asamblea: Asamblea) => {
  const fecha = toDate(asamblea.fecha);
  const fechaKey = fecha ? fecha.toISOString().slice(0, 10) : 'sin-fecha';
  return [
    asamblea.conjuntoId,
    normalizeText(asamblea.titulo),
    fechaKey,
    asamblea.horaInicio,
    asamblea.horaFin,
    asamblea.tipo,
  ].join('|');
};

const getAsambleaScore = (asamblea: Asamblea) => {
  const estadoScore = {
    en_curso: 40,
    programada: 30,
    finalizada: 20,
    cancelada: 10,
  }[asamblea.estado];

  return estadoScore + (asamblea.habilitarVotacion ? 5 : 0) + asamblea.quorumAlcanzado;
};

const dedupeAsambleas = (asambleas: Asamblea[]) => {
  const unique = new Map<string, Asamblea>();

  asambleas.forEach((asamblea) => {
    const signature = getAsambleaSignature(asamblea);
    const existing = unique.get(signature);

    if (!existing || getAsambleaScore(asamblea) > getAsambleaScore(existing)) {
      unique.set(signature, asamblea);
    }
  });

  return Array.from(unique.values()).sort((left, right) => {
    const rightTime = toDate(right.fecha)?.getTime() || 0;
    const leftTime = toDate(left.fecha)?.getTime() || 0;
    return rightTime - leftTime;
  });
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
      const comunicados = snapshot.docs.map((d) => normalizeComunicado(d.id, d.data() as Record<string, unknown>));
      set({ comunicados, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createComunicado: async (comunicado) => {
    const inicio = iniciarMedicion();
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'comunicados'), comunicado);
      const comunicadoCreado = normalizeComunicado(docRef.id, comunicado as unknown as Record<string, unknown>);
      set({
        comunicados: [comunicadoCreado, ...get().comunicados],
        loading: false,
      });
      await registrarLogTiempoRespuesta({
        conjuntoId: comunicado.conjuntoId,
        usuarioId: comunicado.autorId,
        modulo: 'avisos',
        accion: 'crear_comunicado',
        duracionMs: duracionMs(inicio),
        estado: 'ok',
        detalle: `Comunicado ${docRef.id} publicado`,
      });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      await registrarLogTiempoRespuesta({
        conjuntoId: comunicado.conjuntoId,
        usuarioId: comunicado.autorId,
        modulo: 'avisos',
        accion: 'crear_comunicado',
        duracionMs: duracionMs(inicio),
        estado: 'error',
        detalle: error?.message || 'Error no controlado al publicar comunicado',
      });
      throw error;
    }
  },

  marcarLeido: async (comunicadoId: string, usuarioId: string) => {
    try {
      await updateDoc(doc(db, 'comunicados', comunicadoId), {
        leidoPor: arrayUnion(usuarioId),
      });
      set({
        comunicados: get().comunicados.map((comunicado) =>
          comunicado.id === comunicadoId && !(comunicado.leidoPor || []).includes(usuarioId)
            ? { ...comunicado, leidoPor: [...(comunicado.leidoPor || []), usuarioId] }
            : comunicado
        ),
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
      const asambleas = dedupeAsambleas(
        snapshot.docs.map((d) => normalizeAsamblea(d.id, d.data() as Record<string, unknown>))
      );
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
      set({
        asambleas: dedupeAsambleas(get().asambleas.map((a) => (a.id === id ? { ...a, ...data } : a))),
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchVotaciones: async (asambleaId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'votaciones'), where('asambleaId', '==', asambleaId));
      const snapshot = await getDocs(q);
      const votaciones = snapshot.docs.map((d) => normalizeVotacion(d.id, d.data() as Record<string, unknown>));
      set({ votaciones, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createVotacion: async (votacion) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        ...votacion,
        conjuntoId: votacion.conjuntoId || await getAsambleaConjuntoId(votacion.asambleaId),
      };
      const docRef = await addDoc(collection(db, 'votaciones'), payload);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  cerrarVotacion: async (votacionId, usuarioId) => {
    const inicio = iniciarMedicion();
    let conjuntoIdOperacion = '';
    set({ loading: true, error: null });
    try {
      const votacionRef = doc(db, 'votaciones', votacionId);
      const votacionDoc = await getDoc(votacionRef);
      if (!votacionDoc.exists()) throw new Error('Votación no encontrada');
      const votacion = normalizeVotacion(votacionDoc.id, votacionDoc.data() as Record<string, unknown>);
      const conjuntoId = votacion.conjuntoId || await getAsambleaConjuntoId(votacion.asambleaId);
      conjuntoIdOperacion = conjuntoId;

      await updateDoc(votacionRef, { estado: 'cerrada', fechaCierre: new Date() });
      set({
        votaciones: get().votaciones.map((v) => (v.id === votacionId ? { ...v, estado: 'cerrada', fechaCierre: new Date() } : v)),
      });

      await get().registrarEventoAsamblea({
        conjuntoId,
        asambleaId: votacion.asambleaId,
        usuarioId,
        evento: 'cierre_votacion',
        detalle: `Cierre manual de votación: ${votacion.pregunta}`,
      });

      const asambleaRef = doc(db, 'asambleas', votacion.asambleaId);
      const asambleaDoc = await getDoc(asambleaRef);
      if (asambleaDoc.exists()) {
        await updateDoc(asambleaRef, { estado: 'finalizada' });
        set({
          asambleas: dedupeAsambleas(
            get().asambleas.map((asamblea) =>
              asamblea.id === votacion.asambleaId ? { ...asamblea, estado: 'finalizada' } : asamblea
            )
          ),
        });
      }

      set({ loading: false });
      await registrarLogTiempoRespuesta({
        conjuntoId: conjuntoIdOperacion,
        usuarioId,
        modulo: 'votaciones',
        accion: 'cerrar_votacion',
        duracionMs: duracionMs(inicio),
        estado: 'ok',
        detalle: `Votación ${votacionId} cerrada`,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      if (conjuntoIdOperacion) {
        await registrarLogTiempoRespuesta({
          conjuntoId: conjuntoIdOperacion,
          usuarioId,
          modulo: 'votaciones',
          accion: 'cerrar_votacion',
          duracionMs: duracionMs(inicio),
          estado: 'error',
          detalle: error?.message || 'Error no controlado al cerrar votación',
        });
      }
      throw error;
    }
  },

  votar: async (votacionId, opcion, usuarioId, unidadId) => {
    const inicio = iniciarMedicion();
    let conjuntoIdOperacion = '';
    set({ loading: true, error: null });
    try {
      const votacionRef = doc(db, 'votaciones', votacionId);
      const votacionDoc = await getDoc(votacionRef);

      if (!votacionDoc.exists()) throw new Error('Votación no encontrada');

      const votacion = normalizeVotacion(votacionDoc.id, votacionDoc.data() as Record<string, unknown>);
      const conjuntoId = votacion.conjuntoId || await getAsambleaConjuntoId(votacion.asambleaId);
      conjuntoIdOperacion = conjuntoId;
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
        conjuntoId,
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
        asambleas: dedupeAsambleas(
          get().asambleas.map((a) =>
            a.id === votacion.asambleaId ? { ...a, quorumAlcanzado: votantesUnicos.size } : a
          )
        ),
        loading: false,
      });
      await registrarLogTiempoRespuesta({
        conjuntoId: conjuntoIdOperacion,
        usuarioId,
        modulo: 'votaciones',
        accion: 'emitir_voto',
        duracionMs: duracionMs(inicio),
        estado: 'ok',
        detalle: `Voto ${opcion} registrado en votación ${votacionId}`,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      if (conjuntoIdOperacion) {
        await registrarLogTiempoRespuesta({
          conjuntoId: conjuntoIdOperacion,
          usuarioId,
          modulo: 'votaciones',
          accion: 'emitir_voto',
          duracionMs: duracionMs(inicio),
          estado: 'error',
          detalle: error?.message || 'Error no controlado al votar',
        });
      }
      throw error;
    }
  },

  fetchBitacoraAsamblea: async (asambleaId) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'asambleaBitacora'), where('asambleaId', '==', asambleaId), orderBy('fecha', 'desc'));
      const snapshot = await getDocs(q);
      const bitacoraAsamblea = snapshot.docs.map((d) => normalizeBitacora(d.id, d.data() as Record<string, unknown>));
      set({ bitacoraAsamblea, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  registrarEventoAsamblea: async (evento) => {
    try {
      const conjuntoId = evento.conjuntoId || await getAsambleaConjuntoId(evento.asambleaId);
      const docRef = await addDoc(collection(db, 'asambleaBitacora'), {
        ...evento,
        conjuntoId,
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

  sugerencias: [],

  fetchSugerencias: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const baseCollection = collection(db, 'sugerencias');
      let snapshot;
      try {
        const indexedQuery = query(baseCollection, where('conjuntoId', '==', conjuntoId), orderBy('fecha', 'desc'));
        snapshot = await getDocs(indexedQuery);
      } catch (error) {
        if (!isFirestoreIndexError(error)) throw error;
        const fallbackQuery = query(baseCollection, where('conjuntoId', '==', conjuntoId));
        snapshot = await getDocs(fallbackQuery);
      }

      const sugerencias = snapshot.docs
        .map((d) => normalizeSugerencia(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
      set({ sugerencias, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createSugerencia: async (sugerencia) => {
    set({ loading: true, error: null });
    try {
      const usuarioId = auth.currentUser?.uid;
      if (!usuarioId) throw new Error('Tu sesión no es válida. Cierra sesión e inicia nuevamente.');

      const contenido = sugerencia.contenido.trim();
      if (!contenido) throw new Error('La sugerencia no puede estar vacía.');

      const payload = {
        ...sugerencia,
        usuarioId,
        contenido,
        fecha: toDate(sugerencia.fecha) || new Date(),
      };

      const docRef = await addDoc(collection(db, 'sugerencias'), payload);
      const sugerenciaCreada: Sugerencia = {
        id: docRef.id,
        conjuntoId: payload.conjuntoId,
        usuarioId: payload.usuarioId,
        contenido: payload.contenido,
        fecha: toDate(payload.fecha) || new Date(),
        usuarioNombre: payload.usuarioNombre,
        usuarioUnidad: payload.usuarioUnidad,
        usuarioTorre: payload.usuarioTorre,
      };
      set({
        sugerencias: [sugerenciaCreada, ...get().sugerencias],
        loading: false,
      });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
