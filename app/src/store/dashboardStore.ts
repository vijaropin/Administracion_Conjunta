import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getCountFromServer 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { DashboardStats } from '@/types';

interface DashboardState {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  
  fetchStats: (conjuntoId: string) => Promise<void>;
  getRecaudoMensual: (conjuntoId: string, mes: number, anio: number) => Promise<number>;
  getMorosos: (conjuntoId: string) => Promise<number>;
  getIncidentesAbiertos: (conjuntoId: string) => Promise<number>;
  getVisitantesHoy: (conjuntoId: string) => Promise<number>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: {
    totalUnidades: 0,
    unidadesOcupadas: 0,
    unidadesDesocupadas: 0,
    morosos: 0,
    recaudoMes: 0,
    recaudoPendiente: 0,
    incidentesAbiertos: 0,
    visitantesHoy: 0
  },
  loading: false,
  error: null,

  fetchStats: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      // Total unidades
      const unidadesRef = collection(db, 'unidades');
      const unidadesQuery = query(unidadesRef, where('conjuntoId', '==', conjuntoId));
      const unidadesSnapshot = await getCountFromServer(unidadesQuery);
      const totalUnidades = unidadesSnapshot.data().count;

      // Unidades ocupadas
      const ocupadasQuery = query(unidadesRef, where('conjuntoId', '==', conjuntoId), where('estado', '==', 'ocupada'));
      const ocupadasSnapshot = await getCountFromServer(ocupadasQuery);
      const unidadesOcupadas = ocupadasSnapshot.data().count;

      // Unidades desocupadas
      const desocupadasQuery = query(unidadesRef, where('conjuntoId', '==', conjuntoId), where('estado', '==', 'desocupada'));
      const desocupadasSnapshot = await getCountFromServer(desocupadasQuery);
      const unidadesDesocupadas = desocupadasSnapshot.data().count;

      // Incidentes abiertos
      const incidentesRef = collection(db, 'incidentes');
      const incidentesQuery = query(
        incidentesRef, 
        where('conjuntoId', '==', conjuntoId),
        where('estado', 'in', ['reportado', 'en_proceso'])
      );
      const incidentesSnapshot = await getCountFromServer(incidentesQuery);
      const incidentesAbiertos = incidentesSnapshot.data().count;

      // Visitantes hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const visitantesRef = collection(db, 'visitantes');
      const visitantesQuery = query(
        visitantesRef,
        where('conjuntoId', '==', conjuntoId),
        where('fechaIngreso', '>=', hoy)
      );
      const visitantesSnapshot = await getCountFromServer(visitantesQuery);
      const visitantesHoy = visitantesSnapshot.data().count;

      // Recaudo del mes actual
      const mes = new Date().getMonth() + 1;
      const anio = new Date().getFullYear();
      
      const pagosRef = collection(db, 'pagos');
      const pagosQuery = query(
        pagosRef,
        where('conjuntoId', '==', conjuntoId),
        where('mes', '==', mes),
        where('anio', '==', anio)
      );
      const pagosSnapshot = await getDocs(pagosQuery);
      
      let recaudoMes = 0;
      let recaudoPendiente = 0;
      const morososSet = new Set<string>();

      pagosSnapshot.forEach((doc) => {
        const pago = doc.data();
        if (pago.estado === 'pagado') {
          recaudoMes += pago.valor;
        } else {
          recaudoPendiente += pago.valor;
          if (pago.estado === 'en_mora') {
            morososSet.add(pago.unidadId);
          }
        }
      });

      set({
        stats: {
          totalUnidades,
          unidadesOcupadas,
          unidadesDesocupadas,
          morosos: morososSet.size,
          recaudoMes,
          recaudoPendiente,
          incidentesAbiertos,
          visitantesHoy
        },
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getRecaudoMensual: async (conjuntoId: string, mes: number, anio: number) => {
    try {
      const pagosRef = collection(db, 'pagos');
      const pagosQuery = query(
        pagosRef,
        where('conjuntoId', '==', conjuntoId),
        where('mes', '==', mes),
        where('anio', '==', anio),
        where('estado', '==', 'pagado')
      );
      const pagosSnapshot = await getDocs(pagosQuery);
      
      let recaudo = 0;
      pagosSnapshot.forEach((doc) => {
        recaudo += doc.data().valor;
      });
      
      return recaudo;
    } catch (error) {
      return 0;
    }
  },

  getMorosos: async (conjuntoId: string) => {
    try {
      const pagosRef = collection(db, 'pagos');
      const pagosQuery = query(
        pagosRef,
        where('conjuntoId', '==', conjuntoId),
        where('estado', '==', 'en_mora')
      );
      const pagosSnapshot = await getDocs(pagosQuery);
      
      const morososSet = new Set<string>();
      pagosSnapshot.forEach((doc) => {
        morososSet.add(doc.data().unidadId);
      });
      
      return morososSet.size;
    } catch (error) {
      return 0;
    }
  },

  getIncidentesAbiertos: async (conjuntoId: string) => {
    try {
      const incidentesRef = collection(db, 'incidentes');
      const incidentesQuery = query(
        incidentesRef, 
        where('conjuntoId', '==', conjuntoId),
        where('estado', 'in', ['reportado', 'en_proceso'])
      );
      const snapshot = await getCountFromServer(incidentesQuery);
      return snapshot.data().count;
    } catch (error) {
      return 0;
    }
  },

  getVisitantesHoy: async (conjuntoId: string) => {
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const visitantesRef = collection(db, 'visitantes');
      const visitantesQuery = query(
        visitantesRef,
        where('conjuntoId', '==', conjuntoId),
        where('fechaIngreso', '>=', hoy)
      );
      const snapshot = await getCountFromServer(visitantesQuery);
      return snapshot.data().count;
    } catch (error) {
      return 0;
    }
  }
}));
