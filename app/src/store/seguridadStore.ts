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
import type { Visitante, Incidente, ReservaZona } from '@/types';

interface SeguridadState {
  visitantes: Visitante[];
  incidentes: Incidente[];
  reservas: ReservaZona[];
  loading: boolean;
  error: string | null;
  
  fetchVisitantes: (conjuntoId: string) => Promise<void>;
  fetchVisitantesHoy: (conjuntoId: string) => Promise<void>;
  createVisitante: (visitante: Omit<Visitante, 'id'>) => Promise<string>;
  registrarSalida: (id: string) => Promise<void>;
  
  fetchIncidentes: (conjuntoId: string) => Promise<void>;
  createIncidente: (incidente: Omit<Incidente, 'id'>) => Promise<string>;
  updateIncidente: (id: string, data: Partial<Incidente>) => Promise<void>;
  asignarIncidente: (id: string, asignadoA: string) => Promise<void>;
  resolverIncidente: (id: string, respuesta: string) => Promise<void>;
  
  fetchReservas: (conjuntoId: string) => Promise<void>;
  fetchReservasByResidente: (residenteId: string) => Promise<void>;
  createReserva: (reserva: Omit<ReservaZona, 'id'>) => Promise<string>;
  updateReserva: (id: string, data: Partial<ReservaZona>) => Promise<void>;
  cancelarReserva: (id: string) => Promise<void>;
}

export const useSeguridadStore = create<SeguridadState>((set, get) => ({
  visitantes: [],
  incidentes: [],
  reservas: [],
  loading: false,
  error: null,

  fetchVisitantes: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'visitantes'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaIngreso', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const visitantes: Visitante[] = [];
      querySnapshot.forEach((doc) => {
        visitantes.push({ id: doc.id, ...doc.data() } as Visitante);
      });
      set({ visitantes, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchVisitantesHoy: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const q = query(
        collection(db, 'visitantes'), 
        where('conjuntoId', '==', conjuntoId),
        where('fechaIngreso', '>=', hoy),
        orderBy('fechaIngreso', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const visitantes: Visitante[] = [];
      querySnapshot.forEach((doc) => {
        visitantes.push({ id: doc.id, ...doc.data() } as Visitante);
      });
      set({ visitantes, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createVisitante: async (visitante) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'visitantes'), visitante);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  registrarSalida: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'visitantes', id), {
        fechaSalida: new Date()
      });
      const { visitantes } = get();
      set({ 
        visitantes: visitantes.map(v => v.id === id ? { ...v, fechaSalida: new Date() } : v),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchIncidentes: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'incidentes'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fecha', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const incidentes: Incidente[] = [];
      querySnapshot.forEach((doc) => {
        incidentes.push({ id: doc.id, ...doc.data() } as Incidente);
      });
      set({ incidentes, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createIncidente: async (incidente) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'incidentes'), incidente);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateIncidente: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'incidentes', id), data);
      const { incidentes } = get();
      set({ 
        incidentes: incidentes.map(i => i.id === id ? { ...i, ...data } : i),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  asignarIncidente: async (id, asignadoA) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'incidentes', id), {
        asignadoA,
        estado: 'en_proceso'
      });
      const { incidentes } = get();
      set({ 
        incidentes: incidentes.map(i => i.id === id ? { ...i, asignadoA, estado: 'en_proceso' } : i),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  resolverIncidente: async (id, respuesta) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'incidentes', id), {
        respuesta,
        estado: 'resuelto',
        fechaResolucion: new Date()
      });
      const { incidentes } = get();
      set({ 
        incidentes: incidentes.map(i => i.id === id ? { 
          ...i, 
          respuesta, 
          estado: 'resuelto',
          fechaResolucion: new Date()
        } : i),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchReservas: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'reservas'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fecha', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reservas: ReservaZona[] = [];
      querySnapshot.forEach((doc) => {
        reservas.push({ id: doc.id, ...doc.data() } as ReservaZona);
      });
      set({ reservas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchReservasByResidente: async (residenteId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'reservas'), 
        where('residenteId', '==', residenteId),
        orderBy('fecha', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const reservas: ReservaZona[] = [];
      querySnapshot.forEach((doc) => {
        reservas.push({ id: doc.id, ...doc.data() } as ReservaZona);
      });
      set({ reservas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createReserva: async (reserva) => {
    set({ loading: true, error: null });
    try {
      const payload = { ...reserva, fechaSolicitud: reserva.fechaSolicitud ?? new Date() };
      const docRef = await addDoc(collection(db, 'reservas'), payload);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateReserva: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'reservas', id), data);
      const { reservas } = get();
      set({ 
        reservas: reservas.map(r => r.id === id ? { ...r, ...data } : r),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  cancelarReserva: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'reservas', id), {
        estado: 'cancelada'
      });
      const { reservas } = get();
      set({ 
        reservas: reservas.map(r => r.id === id ? { ...r, estado: 'cancelada' } : r),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  }
}));

