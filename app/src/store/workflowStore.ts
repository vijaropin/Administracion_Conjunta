import { create } from 'zustand';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { SolicitudGestion, SolicitudGestionBitacora } from '@/types';

interface WorkflowState {
  solicitudes: SolicitudGestion[];
  bitacora: SolicitudGestionBitacora[];
  loading: boolean;
  error: string | null;

  fetchSolicitudes: (conjuntoId: string) => Promise<void>;
  fetchBitacora: (solicitudId: string) => Promise<void>;

  crearSolicitud: (payload: Omit<SolicitudGestion, 'id' | 'estado' | 'fechaSolicitud' | 'requiereActa' | 'requiereSoporte' | 'consejoQuorumRequerido' | 'consejoAprobaciones' | 'consejoRechazos' | 'actaFirmasConsejo' | 'consejoVotosBloqueo'>) => Promise<string>;
  actualizarAnexos: (
    solicitudId: string,
    actorId: string,
    actorRol: 'comite_convivencia' | 'consejo' | 'administrador',
    anexos: Partial<Pick<SolicitudGestion, 'anexoActaUrl' | 'anexoActaNombre' | 'anexoSoporteUrl' | 'anexoSoporteNombre'>>
  ) => Promise<void>;
  registrarVotoConsejo: (
    solicitudId: string,
    actorId: string,
    voto: 'aprobar' | 'rechazar',
    quorumRequerido: number,
    motivo?: string,
    actaFolio?: string
  ) => Promise<void>;
  ejecutarAdministrador: (
    solicitudId: string,
    actorId: string,
    detalle?: string,
    refs?: { cajaMenorId?: string; pagoId?: string }
  ) => Promise<void>;
}

const uniq = (arr: string[]) => Array.from(new Set(arr));
const toDateOrNull = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const toPeriodKey = (miembroId: string, fechaInicio: unknown, fechaFin: unknown) => {
  const inicio = toDateOrNull(fechaInicio)?.toISOString().slice(0, 10) || 'sin-inicio';
  const fin = toDateOrNull(fechaFin)?.toISOString().slice(0, 10) || 'abierto';
  return `${miembroId}:${inicio}-${fin}`;
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  solicitudes: [],
  bitacora: [],
  loading: false,
  error: null,

  fetchSolicitudes: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'solicitudesGestion'),
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaSolicitud', 'desc')
      );
      const snapshot = await getDocs(q);
      const solicitudes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SolicitudGestion));
      set({ solicitudes, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchBitacora: async (solicitudId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'solicitudesBitacora'),
        where('solicitudId', '==', solicitudId),
        orderBy('fecha', 'asc')
      );
      const snapshot = await getDocs(q);
      const bitacora = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as SolicitudGestionBitacora));
      set({ bitacora, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  crearSolicitud: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data: Omit<SolicitudGestion, 'id'> = {
        ...payload,
        estado: 'pendiente_consejo',
        fechaSolicitud: new Date(),
        requiereActa: true,
        requiereSoporte: true,
        consejoQuorumRequerido: 1,
        consejoAprobaciones: [],
        consejoRechazos: [],
        actaFirmasConsejo: [],
        consejoVotosBloqueo: [],
      };

      const solicitudRef = await addDoc(collection(db, 'solicitudesGestion'), data);

      await addDoc(collection(db, 'solicitudesBitacora'), {
        solicitudId: solicitudRef.id,
        fecha: new Date(),
        actorId: payload.solicitadaPor,
        actorRol: 'comite_convivencia',
        accion: 'creada',
        detalle: `Solicitud creada: ${payload.titulo}`,
      } as Omit<SolicitudGestionBitacora, 'id'>);

      set({ loading: false });
      return solicitudRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  actualizarAnexos: async (solicitudId, actorId, actorRol, anexos) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'solicitudesGestion', solicitudId), anexos as Record<string, unknown>);

      await addDoc(collection(db, 'solicitudesBitacora'), {
        solicitudId,
        fecha: new Date(),
        actorId,
        actorRol,
        accion: 'anexos_actualizados',
        detalle: 'Se cargaron/actualizaron anexos obligatorios (acta/soportes).',
      } as Omit<SolicitudGestionBitacora, 'id'>);

      const next = get().solicitudes.map((s) => (s.id === solicitudId ? { ...s, ...anexos } : s));
      set({ solicitudes: next, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  registrarVotoConsejo: async (solicitudId, actorId, voto, quorumRequerido, motivo, actaFolio) => {
    set({ loading: true, error: null });
    try {
      const solicitud = get().solicitudes.find((s) => s.id === solicitudId);
      if (!solicitud) throw new Error('Solicitud no encontrada');
      if (solicitud.estado !== 'pendiente_consejo') throw new Error('La solicitud ya no está pendiente de consejo');
      const now = new Date();

      const miembrosRef = collection(db, 'conjuntos', solicitud.conjuntoId, 'consejoMiembros');
      const miembrosQuery = query(
        miembrosRef,
        where('usuarioId', '==', actorId),
        where('activo', '==', true)
      );
      const miembrosSnapshot = await getDocs(miembrosQuery);
      if (miembrosSnapshot.empty) {
        throw new Error('Solo pueden votar consejeros activos registrados en consejoMiembros.');
      }

      const miembroVigenteDoc = miembrosSnapshot.docs.find((d) => {
        const data = d.data() as Record<string, unknown>;
        const inicio = toDateOrNull(data.fechaInicio);
        const fin = toDateOrNull(data.fechaFin);
        const cumpleInicio = !inicio || inicio <= now;
        const cumpleFin = !fin || fin >= now;
        return cumpleInicio && cumpleFin;
      });
      if (!miembroVigenteDoc) {
        throw new Error('No tienes un periodo de consejo vigente para votar esta solicitud.');
      }

      const miembroVigente = miembroVigenteDoc.data() as Record<string, unknown>;
      const periodKey = toPeriodKey(miembroVigenteDoc.id, miembroVigente.fechaInicio, miembroVigente.fechaFin);
      const voteLockKey = `${actorId}|${periodKey}`;
      const votosBloqueo = solicitud.consejoVotosBloqueo || [];
      if (votosBloqueo.includes(voteLockKey)) {
        throw new Error('Voto duplicado bloqueado: ya votaste en este periodo de consejo.');
      }

      let aprobaciones = [...(solicitud.consejoAprobaciones || [])];
      let rechazos = [...(solicitud.consejoRechazos || [])];
      const firmaConsejo = `${actorId}|${periodKey}`;

      if (voto === 'aprobar') {
        aprobaciones = uniq([...aprobaciones, firmaConsejo]);
      } else {
        rechazos = uniq([...rechazos, firmaConsejo]);
      }

      const firmas = uniq([...(solicitud.actaFirmasConsejo || []), firmaConsejo]);
      const quorum = Math.max(1, quorumRequerido);

      const payload: Partial<SolicitudGestion> = {
        consejoQuorumRequerido: quorum,
        consejoAprobaciones: aprobaciones,
        consejoRechazos: rechazos,
        actaFirmasConsejo: firmas,
        actaFolio: actaFolio || solicitud.actaFolio,
        consejoVotosBloqueo: uniq([...votosBloqueo, voteLockKey]),
      };

      let accionFinal: 'aprobada_consejo' | 'rechazada_consejo' | null = null;

      if (aprobaciones.length >= quorum) {
        payload.estado = 'aprobada_consejo';
        payload.decisionConsejoPor = actorId;
        payload.fechaDecisionConsejo = new Date();
        payload.motivoDecisionConsejo = motivo || 'Aprobación por quórum del consejo';
        accionFinal = 'aprobada_consejo';
      } else if (rechazos.length >= quorum) {
        payload.estado = 'rechazada_consejo';
        payload.decisionConsejoPor = actorId;
        payload.fechaDecisionConsejo = new Date();
        payload.motivoDecisionConsejo = motivo || 'Rechazo por quórum del consejo';
        accionFinal = 'rechazada_consejo';
      }

      await updateDoc(doc(db, 'solicitudesGestion', solicitudId), payload as Record<string, unknown>);

      await addDoc(collection(db, 'solicitudesBitacora'), {
        solicitudId,
        fecha: new Date(),
        actorId,
        actorRol: 'consejo',
        accion: 'voto_consejo',
        detalle: `Voto ${voto.toUpperCase()} registrado. Aprobaciones: ${aprobaciones.length}/${quorum}. Rechazos: ${rechazos.length}/${quorum}.`,
      } as Omit<SolicitudGestionBitacora, 'id'>);

      if (accionFinal) {
        await addDoc(collection(db, 'solicitudesBitacora'), {
          solicitudId,
          fecha: new Date(),
          actorId,
          actorRol: 'consejo',
          accion: accionFinal,
          detalle: payload.motivoDecisionConsejo,
        } as Omit<SolicitudGestionBitacora, 'id'>);
      }

      const next = get().solicitudes.map((s) => (s.id === solicitudId ? { ...s, ...payload } : s));
      set({ solicitudes: next, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  ejecutarAdministrador: async (solicitudId, actorId, detalle, refs) => {
    set({ loading: true, error: null });
    try {
      const solicitud = get().solicitudes.find((s) => s.id === solicitudId);
      if (!solicitud) throw new Error('Solicitud no encontrada');

      const faltaActa = solicitud.requiereActa && !solicitud.anexoActaUrl;
      const faltaSoporte = solicitud.requiereSoporte && !solicitud.anexoSoporteUrl;
      if (faltaActa || faltaSoporte) {
        throw new Error('No se puede ejecutar: faltan anexos obligatorios (acta/soportes).');
      }

      const payload: Partial<SolicitudGestion> = {
        estado: 'ejecutada_admin',
        ejecutadaPor: actorId,
        fechaEjecucion: new Date(),
        detalleEjecucion: detalle || 'Ejecutada por administrador',
        cajaMenorId: refs?.cajaMenorId,
        pagoId: refs?.pagoId,
      };

      await updateDoc(doc(db, 'solicitudesGestion', solicitudId), payload as Record<string, unknown>);

      await addDoc(collection(db, 'solicitudesBitacora'), {
        solicitudId,
        fecha: new Date(),
        actorId,
        actorRol: 'administrador',
        accion: 'ejecutada_admin',
        detalle: payload.detalleEjecucion,
      } as Omit<SolicitudGestionBitacora, 'id'>);

      const next = get().solicitudes.map((s) => (s.id === solicitudId ? { ...s, ...payload } : s));
      set({ solicitudes: next, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));



