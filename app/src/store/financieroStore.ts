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
import { fetchBackendPagos } from '@/lib/backend';
import type { CajaMenor, ConceptoPagoConfig, GastoCajaMenor, Pago } from '@/types';

interface FinancieroState {
  pagos: Pago[];
  pagosPendientes: Pago[];
  pagosPagados: Pago[];
  pagosMora: Pago[];
  conceptosPago: ConceptoPagoConfig[];
  cajasMenores: CajaMenor[];
  gastosCajaMenor: GastoCajaMenor[];
  loading: boolean;
  error: string | null;

  fetchPagos: (conjuntoId: string) => Promise<void>;
  fetchPagosByUnidad: (unidadId: string) => Promise<void>;
  fetchPagosByResidente: (residenteId: string) => Promise<void>;
  createPago: (pago: Omit<Pago, 'id' | 'consecutivoGeneral' | 'consecutivoResidente' | 'fechaCreacion'>) => Promise<string>;
  updatePago: (id: string, data: Partial<Pago>) => Promise<void>;
  registrarPago: (id: string, metodoPago: string, comprobante?: string) => Promise<void>;

  fetchConceptosPago: (conjuntoId: string) => Promise<void>;
  createConceptoPago: (concepto: Omit<ConceptoPagoConfig, 'id' | 'fechaCreacion' | 'historialActualizaciones'>) => Promise<string>;
  updateConceptoPago: (id: string, data: Partial<ConceptoPago>, actualizadoPor: string, cambios: string) => Promise<void>;

  fetchCajasMenores: (conjuntoId: string) => Promise<void>;
  fetchGastosCajaMenor: (cajaMenorId: string) => Promise<void>;
  createCajaMenor: (data: Omit<CajaMenor, 'id'>) => Promise<string>;
  cerrarCajaMenor: (id: string, cerradoPor: string) => Promise<void>;
  createGastoCajaMenor: (data: Omit<GastoCajaMenor, 'id'>) => Promise<string>;

  getEstadisticas: (
    conjuntoId: string,
    mes: number,
    anio: number
  ) => Promise<{
    recaudoMes: number;
    recaudoPendiente: number;
    morosos: number;
    totalPagos: number;
  }>;
}

type ConceptoPago = ConceptoPagoConfig;

const defaultConceptos = (conjuntoId: string, creadoPor: string): Omit<ConceptoPagoConfig, 'id' | 'fechaCreacion' | 'historialActualizaciones'>[] => [
  {
    conjuntoId,
    nombre: 'Cuota de administración ordinaria',
    descripcion: 'Cuota mensual aprobada por asamblea',
    aplicaInteresMora: true,
    activo: true,
    creadoPor,
  },
  {
    conjuntoId,
    nombre: 'Cuota extraordinaria',
    descripcion: 'Cuota extraordinaria aprobada por asamblea',
    aplicaInteresMora: true,
    activo: true,
    creadoPor,
  },
  {
    conjuntoId,
    nombre: 'Multas y sanciones',
    descripcion: 'Cobros no pecuniarios convertidos en obligación de pago',
    aplicaInteresMora: true,
    activo: true,
    creadoPor,
  },
  {
    conjuntoId,
    nombre: 'Parqueadero vehicular',
    descripcion: 'Pago por uso de parqueadero para vehículo',
    aplicaInteresMora: false,
    activo: true,
    creadoPor,
  },
  {
    conjuntoId,
    nombre: 'Parqueadero motocicleta',
    descripcion: 'Pago por uso de parqueadero para motocicleta',
    aplicaInteresMora: false,
    activo: true,
    creadoPor,
  },
  {
    conjuntoId,
    nombre: 'Parqueadero bicicleta',
    descripcion: 'Pago por uso de parqueadero para bicicleta',
    aplicaInteresMora: false,
    activo: true,
    creadoPor,
  },
];

const toLocalDate = (value: unknown): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string);
};

const normalizePago = (pago: Pago): Pago => ({
  ...pago,
  fechaVencimiento: toLocalDate(pago.fechaVencimiento),
  fechaPago: pago.fechaPago ? toLocalDate(pago.fechaPago) : undefined,
  fechaCreacion: pago.fechaCreacion ? toLocalDate(pago.fechaCreacion) : undefined,
});

const recalcPagosState = (pagos: Pago[]) => ({
  pagos,
  pagosPendientes: pagos.filter((p) => p.estado === 'pendiente' || p.estado === 'vencido'),
  pagosPagados: pagos.filter((p) => p.estado === 'pagado'),
  pagosMora: pagos.filter((p) => p.estado === 'en_mora'),
});

export const useFinancieroStore = create<FinancieroState>((set, get) => ({
  pagos: [],
  pagosPendientes: [],
  pagosPagados: [],
  pagosMora: [],
  conceptosPago: [],
  cajasMenores: [],
  gastosCajaMenor: [],
  loading: false,
  error: null,

  fetchPagos: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      try {
        const pagosBackend = await fetchBackendPagos({ limit: 200 });
        set({ ...recalcPagosState(pagosBackend.map(normalizePago)), loading: false });
        return;
      } catch {
        // Fallback temporal a Firestore directo mientras termina la migracion al backend.
      }

      const q = query(
        collection(db, 'pagos'),
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaVencimiento', 'desc')
      );
      const snapshot = await getDocs(q);
      const pagos = snapshot.docs.map((d) => normalizePago({ id: d.id, ...d.data() } as Pago));
      set({ ...recalcPagosState(pagos), loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPagosByUnidad: async (unidadId: string) => {
    set({ loading: true, error: null });
    try {
      try {
        const pagosBackend = await fetchBackendPagos({ unidadId, limit: 200 });
        set({ ...recalcPagosState(pagosBackend.map(normalizePago)), loading: false });
        return;
      } catch {
        // Fallback temporal a Firestore directo mientras termina la migracion al backend.
      }

      const q = query(
        collection(db, 'pagos'),
        where('unidadId', '==', unidadId),
        orderBy('fechaVencimiento', 'desc')
      );
      const snapshot = await getDocs(q);
      const pagos = snapshot.docs.map((d) => normalizePago({ id: d.id, ...d.data() } as Pago));
      set({ ...recalcPagosState(pagos), loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPagosByResidente: async (residenteId: string) => {
    set({ loading: true, error: null });
    try {
      try {
        const pagosBackend = await fetchBackendPagos({ residenteId, limit: 200 });
        set({ ...recalcPagosState(pagosBackend.map(normalizePago)), loading: false });
        return;
      } catch {
        // Fallback temporal a Firestore directo mientras termina la migracion al backend.
      }

      const q = query(
        collection(db, 'pagos'),
        where('residenteId', '==', residenteId),
        orderBy('fechaVencimiento', 'desc')
      );
      const snapshot = await getDocs(q);
      const pagos = snapshot.docs.map((d) => normalizePago({ id: d.id, ...d.data() } as Pago));
      set({ ...recalcPagosState(pagos), loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createPago: async (pago) => {
    set({ loading: true, error: null });
    try {
      const { pagos } = get();
      const sameResidenteCount = pagos.filter((p) => p.residenteId === pago.residenteId).length + 1;
      const consecutivoGeneral = `PG-${String(pagos.length + 1).padStart(7, '0')}`;
      const consecutivoResidente = `PR-${pago.residenteId.slice(0, 4).toUpperCase()}-${String(sameResidenteCount).padStart(5, '0')}`;

      const payload: Omit<Pago, 'id'> = {
        ...pago,
        fechaCreacion: new Date(),
        consecutivoGeneral,
        consecutivoResidente,
      };

      const docRef = await addDoc(collection(db, 'pagos'), payload);
      const next = [{ id: docRef.id, ...payload }, ...pagos];
      set({ ...recalcPagosState(next), loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updatePago: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'pagos', id), data as Record<string, unknown>);
      const next = get().pagos.map((p) => (p.id === id ? { ...p, ...data } : p));
      set({ ...recalcPagosState(next), loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  registrarPago: async (id, metodoPago: string, comprobante?: string) => {
    set({ loading: true, error: null });
    try {
      const payload: Pick<Pago, 'estado' | 'metodoPago' | 'comprobante' | 'fechaPago'> = {
        estado: 'pagado',
        metodoPago: metodoPago as Pago['metodoPago'],
        comprobante,
        fechaPago: new Date(),
      };
      await updateDoc(doc(db, 'pagos', id), payload as Record<string, unknown>);
      const next = get().pagos.map((p) => (p.id === id ? { ...p, ...payload } : p));
      set({ ...recalcPagosState(next), loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchConceptosPago: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'conceptosPago'), where('conjuntoId', '==', conjuntoId), orderBy('nombre'));
      const snapshot = await getDocs(q);
      const conceptos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ConceptoPagoConfig));

      if (conceptos.length === 0) {
        const base = defaultConceptos(conjuntoId, 'sistema');
        for (const item of base) {
          await addDoc(collection(db, 'conceptosPago'), {
            ...item,
            fechaCreacion: new Date(),
            historialActualizaciones: [],
          });
        }
        const seededSnapshot = await getDocs(q);
        const seeded = seededSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ConceptoPagoConfig));
        set({ conceptosPago: seeded, loading: false });
        return;
      }

      set({ conceptosPago: conceptos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createConceptoPago: async (concepto) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        ...concepto,
        fechaCreacion: new Date(),
        historialActualizaciones: [],
      };
      const docRef = await addDoc(collection(db, 'conceptosPago'), payload);
      const next = [...get().conceptosPago, { id: docRef.id, ...payload } as ConceptoPagoConfig];
      set({ conceptosPago: next, loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateConceptoPago: async (id, data, actualizadoPor, cambios) => {
    set({ loading: true, error: null });
    try {
      const target = get().conceptosPago.find((c) => c.id === id);
      const historial = [
        ...(target?.historialActualizaciones ?? []),
        { fecha: new Date(), actualizadoPor, cambios },
      ];
      const payload = { ...data, historialActualizaciones: historial };

      await updateDoc(doc(db, 'conceptosPago', id), payload as Record<string, unknown>);
      const next = get().conceptosPago.map((c) =>
        c.id === id ? { ...c, ...data, historialActualizaciones: historial } : c
      );
      set({ conceptosPago: next, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCajasMenores: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'cajasMenores'), where('conjuntoId', '==', conjuntoId), orderBy('fechaAprobacion', 'desc'));
      const snapshot = await getDocs(q);
      const cajas = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CajaMenor));
      set({ cajasMenores: cajas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchGastosCajaMenor: async (cajaMenorId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'gastosCajaMenor'), where('cajaMenorId', '==', cajaMenorId), orderBy('fechaGasto', 'desc'));
      const snapshot = await getDocs(q);
      const gastos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GastoCajaMenor));
      set({ gastosCajaMenor: gastos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createCajaMenor: async (data) => {
    set({ loading: true, error: null });
    try {
      const payload: Omit<CajaMenor, 'id'> = {
        ...data,
        fechaAprobacion: toLocalDate(data.fechaAprobacion),
      };
      const docRef = await addDoc(collection(db, 'cajasMenores'), payload);
      set({ cajasMenores: [{ id: docRef.id, ...payload }, ...get().cajasMenores], loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  cerrarCajaMenor: async (id, cerradoPor) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        estado: 'cerrada',
        fechaCierre: new Date(),
        cerradoPor,
      };
      await updateDoc(doc(db, 'cajasMenores', id), payload as Record<string, unknown>);
      const cajas = get().cajasMenores.map((c) => (c.id === id ? { ...c, ...(payload as any) } : c));
      set({ cajasMenores: cajas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createGastoCajaMenor: async (data) => {
    set({ loading: true, error: null });
    try {
      const payload: Omit<GastoCajaMenor, 'id'> = {
        ...data,
        fechaGasto: toLocalDate(data.fechaGasto),
      };
      const docRef = await addDoc(collection(db, 'gastosCajaMenor'), payload);
      set({ gastosCajaMenor: [{ id: docRef.id, ...payload }, ...get().gastosCajaMenor], loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getEstadisticas: async (conjuntoId: string, mes: number, anio: number) => {
    try {
      const q = query(
        collection(db, 'pagos'),
        where('conjuntoId', '==', conjuntoId),
        where('mes', '==', mes),
        where('anio', '==', anio)
      );
      const snapshot = await getDocs(q);
      const pagos = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Pago));

      const recaudoMes = pagos.filter((p) => p.estado === 'pagado').reduce((sum, p) => sum + p.valor, 0);
      const recaudoPendiente = pagos
        .filter((p) => p.estado === 'pendiente' || p.estado === 'en_mora' || p.estado === 'vencido')
        .reduce((sum, p) => sum + p.valor, 0);
      const morosos = new Set(pagos.filter((p) => p.estado === 'en_mora').map((p) => p.unidadId)).size;

      return {
        recaudoMes,
        recaudoPendiente,
        morosos,
        totalPagos: pagos.length,
      };
    } catch (error: any) {
      set({ error: error.message });
      return {
        recaudoMes: 0,
        recaudoPendiente: 0,
        morosos: 0,
        totalPagos: 0,
      };
    }
  },
}));







