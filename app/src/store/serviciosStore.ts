import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { NovedadServicios, SolicitudImplementos, TareaServicios } from '@/types';

interface ServiciosState {
  novedades: NovedadServicios[];
  solicitudes: SolicitudImplementos[];
  tareas: TareaServicios[];
  loading: boolean;
  error: string | null;
  
  fetchNovedades: (conjuntoId: string) => Promise<void>;
  fetchNovedadesByUsuario: (usuarioId: string) => Promise<void>;
  createNovedad: (novedad: Omit<NovedadServicios, 'id'>) => Promise<string>;
  updateNovedad: (id: string, data: Partial<NovedadServicios>) => Promise<void>;
  asignarNovedad: (id: string, asignadoA: string) => Promise<void>;
  resolverNovedad: (id: string, respuesta: string) => Promise<void>;
  
  fetchSolicitudes: (conjuntoId: string) => Promise<void>;
  fetchSolicitudesByUsuario: (usuarioId: string) => Promise<void>;
  createSolicitud: (solicitud: Omit<SolicitudImplementos, 'id'>) => Promise<string>;
  updateSolicitud: (id: string, data: Partial<SolicitudImplementos>) => Promise<void>;
  aprobarSolicitud: (id: string, aprobadoPor: string) => Promise<void>;
  rechazarSolicitud: (id: string, observaciones: string) => Promise<void>;
  
  fetchTareas: (conjuntoId: string) => Promise<void>;
  fetchTareasByUsuario: (usuarioId: string) => Promise<void>;
  createTarea: (tarea: Omit<TareaServicios, 'id'>) => Promise<string>;
  updateTarea: (id: string, data: Partial<TareaServicios>) => Promise<void>;
  completarTarea: (id: string, evidencias?: string[]) => Promise<void>;
  
  getEstadisticas: (conjuntoId: string) => Promise<{
    novedadesPendientes: number;
    novedadesResueltas: number;
    solicitudesPendientes: number;
    solicitudesAprobadas: number;
    tareasPendientes: number;
    tareasCompletadas: number;
  }>;
}

export const useServiciosStore = create<ServiciosState>((set, get) => ({
  novedades: [],
  solicitudes: [],
  tareas: [],
  loading: false,
  error: null,

  fetchNovedades: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'novedadesServicios'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaReporte', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const novedades: NovedadServicios[] = [];
      querySnapshot.forEach((doc) => {
        novedades.push({ id: doc.id, ...doc.data() } as NovedadServicios);
      });
      set({ novedades, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchNovedadesByUsuario: async (usuarioId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'novedadesServicios'), 
        where('reportadoPor', '==', usuarioId),
        orderBy('fechaReporte', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const novedades: NovedadServicios[] = [];
      querySnapshot.forEach((doc) => {
        novedades.push({ id: doc.id, ...doc.data() } as NovedadServicios);
      });
      set({ novedades, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createNovedad: async (novedad) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'novedadesServicios'), novedad);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateNovedad: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'novedadesServicios', id), data);
      const { novedades } = get();
      set({ 
        novedades: novedades.map(n => n.id === id ? { ...n, ...data } : n),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  asignarNovedad: async (id, asignadoA) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'novedadesServicios', id), {
        asignadoA,
        estado: 'en_proceso'
      });
      const { novedades } = get();
      set({ 
        novedades: novedades.map(n => n.id === id ? { ...n, asignadoA, estado: 'en_proceso' } : n),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  resolverNovedad: async (id, respuesta) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'novedadesServicios', id), {
        respuesta,
        estado: 'resuelta',
        fechaResolucion: new Date()
      });
      const { novedades } = get();
      set({ 
        novedades: novedades.map(n => n.id === id ? { 
          ...n, 
          respuesta, 
          estado: 'resuelta',
          fechaResolucion: new Date()
        } : n),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSolicitudes: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'solicitudesImplementos'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaSolicitud', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const solicitudes: SolicitudImplementos[] = [];
      querySnapshot.forEach((doc) => {
        solicitudes.push({ id: doc.id, ...doc.data() } as SolicitudImplementos);
      });
      set({ solicitudes, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSolicitudesByUsuario: async (usuarioId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'solicitudesImplementos'), 
        where('solicitadoPor', '==', usuarioId),
        orderBy('fechaSolicitud', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const solicitudes: SolicitudImplementos[] = [];
      querySnapshot.forEach((doc) => {
        solicitudes.push({ id: doc.id, ...doc.data() } as SolicitudImplementos);
      });
      set({ solicitudes, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createSolicitud: async (solicitud) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'solicitudesImplementos'), solicitud);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSolicitud: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'solicitudesImplementos', id), data);
      const { solicitudes } = get();
      set({ 
        solicitudes: solicitudes.map(s => s.id === id ? { ...s, ...data } : s),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  aprobarSolicitud: async (id, aprobadoPor) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'solicitudesImplementos', id), {
        estado: 'aprobada',
        aprobadoPor,
        fechaAprobacion: new Date()
      });
      const { solicitudes } = get();
      set({ 
        solicitudes: solicitudes.map(s => s.id === id ? { 
          ...s, 
          estado: 'aprobada',
          aprobadoPor,
          fechaAprobacion: new Date()
        } : s),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  rechazarSolicitud: async (id, observaciones) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'solicitudesImplementos', id), {
        estado: 'rechazada',
        observaciones
      });
      const { solicitudes } = get();
      set({ 
        solicitudes: solicitudes.map(s => s.id === id ? { 
          ...s, 
          estado: 'rechazada',
          observaciones
        } : s),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTareas: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'tareasServicios'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaProgramada', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const tareas: TareaServicios[] = [];
      querySnapshot.forEach((doc) => {
        tareas.push({ id: doc.id, ...doc.data() } as TareaServicios);
      });
      set({ tareas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTareasByUsuario: async (usuarioId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'tareasServicios'), 
        where('asignadaA', '==', usuarioId),
        orderBy('fechaProgramada', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const tareas: TareaServicios[] = [];
      querySnapshot.forEach((doc) => {
        tareas.push({ id: doc.id, ...doc.data() } as TareaServicios);
      });
      set({ tareas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTarea: async (tarea) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'tareasServicios'), tarea);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateTarea: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'tareasServicios', id), data);
      const { tareas } = get();
      set({ 
        tareas: tareas.map(t => t.id === id ? { ...t, ...data } : t),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  completarTarea: async (id, evidencias) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'tareasServicios', id), {
        estado: 'completada',
        fechaEjecucion: new Date(),
        evidencias
      });
      const { tareas } = get();
      set({ 
        tareas: tareas.map(t => t.id === id ? { 
          ...t, 
          estado: 'completada',
          fechaEjecucion: new Date(),
          evidencias
        } : t),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getEstadisticas: async (_conjuntoId: string) => {
    try {
      const { novedades, solicitudes, tareas } = get();
      
      return {
        novedadesPendientes: novedades.filter(n => n.estado === 'reportada' || n.estado === 'en_proceso').length,
        novedadesResueltas: novedades.filter(n => n.estado === 'resuelta' || n.estado === 'cerrada').length,
        solicitudesPendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
        solicitudesAprobadas: solicitudes.filter(s => s.estado === 'aprobada' || s.estado === 'entregada').length,
        tareasPendientes: tareas.filter(t => t.estado === 'programada' || t.estado === 'en_ejecucion').length,
        tareasCompletadas: tareas.filter(t => t.estado === 'completada').length
      };
    } catch (error: any) {
      set({ error: error.message });
      return {
        novedadesPendientes: 0,
        novedadesResueltas: 0,
        solicitudesPendientes: 0,
        solicitudesAprobadas: 0,
        tareasPendientes: 0,
        tareasCompletadas: 0
      };
    }
  }
}));
