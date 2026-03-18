import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Parqueadero, Vehiculo, AsignacionParqueadero, EstadisticaParqueaderos } from '@/types';

interface ParqueaderoState {
  parqueaderos: Parqueadero[];
  vehiculos: Vehiculo[];
  asignaciones: AsignacionParqueadero[];
  estadisticas: EstadisticaParqueaderos | null;
  loading: boolean;
  error: string | null;
  
  fetchParqueaderos: (conjuntoId: string) => Promise<void>;
  fetchParqueaderosByTipo: (conjuntoId: string, tipo: string) => Promise<void>;
  createParqueadero: (parqueadero: Omit<Parqueadero, 'id'>) => Promise<string>;
  updateParqueadero: (id: string, data: Partial<Parqueadero>) => Promise<void>;
  deleteParqueadero: (id: string) => Promise<void>;
  asignarParqueadero: (parqueaderoId: string, vehiculoId: string, residenteId: string, unidadId: string) => Promise<void>;
  liberarParqueadero: (parqueaderoId: string) => Promise<void>;
  
  fetchVehiculos: (conjuntoId: string) => Promise<void>;
  fetchVehiculosByResidente: (residenteId: string) => Promise<void>;
  createVehiculo: (vehiculo: Omit<Vehiculo, 'id'>) => Promise<string>;
  updateVehiculo: (id: string, data: Partial<Vehiculo>) => Promise<void>;
  deleteVehiculo: (id: string) => Promise<void>;
  
  fetchAsignaciones: (conjuntoId: string) => Promise<void>;
  createAsignacion: (asignacion: Omit<AsignacionParqueadero, 'id'>) => Promise<string>;
  terminarAsignacion: (asignacionId: string) => Promise<void>;
  
  fetchEstadisticas: (conjuntoId: string) => Promise<void>;
  generarCodigoParqueadero: (conjuntoId: string, tipo: string) => Promise<string>;
}

export const useParqueaderoStore = create<ParqueaderoState>((set, get) => ({
  parqueaderos: [],
  vehiculos: [],
  asignaciones: [],
  estadisticas: null,
  loading: false,
  error: null,

  fetchParqueaderos: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'parqueaderos'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('codigo', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const parqueaderos: Parqueadero[] = [];
      querySnapshot.forEach((doc) => {
        parqueaderos.push({ id: doc.id, ...doc.data() } as Parqueadero);
      });
      set({ parqueaderos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchParqueaderosByTipo: async (conjuntoId: string, tipo: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'parqueaderos'), 
        where('conjuntoId', '==', conjuntoId),
        where('tipo', '==', tipo),
        orderBy('codigo', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const parqueaderos: Parqueadero[] = [];
      querySnapshot.forEach((doc) => {
        parqueaderos.push({ id: doc.id, ...doc.data() } as Parqueadero);
      });
      set({ parqueaderos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  generarCodigoParqueadero: async (conjuntoId: string, tipo: string) => {
    const prefix = tipo === 'carro' ? 'C' : tipo === 'moto' ? 'M' : 'B';
    const q = query(
      collection(db, 'parqueaderos'),
      where('conjuntoId', '==', conjuntoId),
      where('tipo', '==', tipo)
    );
    const snapshot = await getDocs(q);
    const count = snapshot.size + 1;
    return `${prefix}-${String(count).padStart(3, '0')}`;
  },

  createParqueadero: async (parqueadero) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'parqueaderos'), parqueadero);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateParqueadero: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'parqueaderos', id), data);
      const { parqueaderos } = get();
      set({ 
        parqueaderos: parqueaderos.map(p => p.id === id ? { ...p, ...data } : p),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteParqueadero: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'parqueaderos', id));
      const { parqueaderos } = get();
      set({ 
        parqueaderos: parqueaderos.filter(p => p.id !== id),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  asignarParqueadero: async (parqueaderoId, vehiculoId, residenteId, unidadId) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'parqueaderos', parqueaderoId), {
        estado: 'asignado',
        vehiculoAsignado: vehiculoId,
        residenteAsignado: residenteId,
        unidadAsignada: unidadId,
        fechaAsignacion: new Date()
      });
      const { parqueaderos } = get();
      set({ 
        parqueaderos: parqueaderos.map(p => p.id === parqueaderoId ? { 
          ...p, 
          estado: 'asignado',
          vehiculoAsignado: vehiculoId,
          residenteAsignado: residenteId,
          unidadAsignada: unidadId,
          fechaAsignacion: new Date()
        } : p),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  liberarParqueadero: async (parqueaderoId) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'parqueaderos', parqueaderoId), {
        estado: 'disponible',
        vehiculoAsignado: null,
        residenteAsignado: null,
        unidadAsignada: null,
        fechaAsignacion: null
      });
      const { parqueaderos } = get();
      set({ 
        parqueaderos: parqueaderos.map(p => p.id === parqueaderoId ? { 
          ...p, 
          estado: 'disponible',
          vehiculoAsignado: undefined,
          residenteAsignado: undefined,
          unidadAsignada: undefined,
          fechaAsignacion: undefined
        } : p),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchVehiculos: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'vehiculos'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaRegistro', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const vehiculos: Vehiculo[] = [];
      querySnapshot.forEach((doc) => {
        vehiculos.push({ id: doc.id, ...doc.data() } as Vehiculo);
      });
      set({ vehiculos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchVehiculosByResidente: async (residenteId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'vehiculos'), 
        where('residenteId', '==', residenteId),
        orderBy('fechaRegistro', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const vehiculos: Vehiculo[] = [];
      querySnapshot.forEach((doc) => {
        vehiculos.push({ id: doc.id, ...doc.data() } as Vehiculo);
      });
      set({ vehiculos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createVehiculo: async (vehiculo) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'vehiculos'), vehiculo);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateVehiculo: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'vehiculos', id), data);
      const { vehiculos } = get();
      set({ 
        vehiculos: vehiculos.map(v => v.id === id ? { ...v, ...data } : v),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteVehiculo: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'vehiculos', id));
      const { vehiculos } = get();
      set({ 
        vehiculos: vehiculos.filter(v => v.id !== id),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAsignaciones: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'asignacionesParqueadero'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaInicio', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const asignaciones: AsignacionParqueadero[] = [];
      querySnapshot.forEach((doc) => {
        asignaciones.push({ id: doc.id, ...doc.data() } as AsignacionParqueadero);
      });
      set({ asignaciones, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createAsignacion: async (asignacion) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'asignacionesParqueadero'), asignacion);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  terminarAsignacion: async (asignacionId) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'asignacionesParqueadero', asignacionId), {
        estado: 'terminada',
        fechaFin: new Date()
      });
      const { asignaciones } = get();
      set({ 
        asignaciones: asignaciones.map(a => a.id === asignacionId ? { 
          ...a, 
          estado: 'terminada',
          fechaFin: new Date()
        } : a),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEstadisticas: async (_conjuntoId: string) => {
    try {
      const { parqueaderos, asignaciones } = get();
      
      const carros = parqueaderos.filter(p => p.tipo === 'carro');
      const motos = parqueaderos.filter(p => p.tipo === 'moto');
      const bicicletas = parqueaderos.filter(p => p.tipo === 'bicicleta');
      
      const ocupadosCarros = carros.filter(p => p.estado === 'asignado').length;
      const ocupadosMotos = motos.filter(p => p.estado === 'asignado').length;
      const ocupadosBicicletas = bicicletas.filter(p => p.estado === 'asignado').length;
      
      const totalParqueaderos = parqueaderos.length;
      const totalOcupados = ocupadosCarros + ocupadosMotos + ocupadosBicicletas;
      
      const ingresos = asignaciones
        .filter(a => a.estado === 'activa' && a.valorCuota)
        .reduce((sum, a) => sum + (a.valorCuota || 0), 0);
      
      const estadisticas: EstadisticaParqueaderos = {
        totalCarros: carros.length,
        totalMotos: motos.length,
        totalBicicletas: bicicletas.length,
        ocupadosCarros,
        ocupadosMotos,
        ocupadosBicicletas,
        disponiblesCarros: carros.length - ocupadosCarros,
        disponiblesMotos: motos.length - ocupadosMotos,
        disponiblesBicicletas: bicicletas.length - ocupadosBicicletas,
        porcentajeOcupacion: totalParqueaderos > 0 ? (totalOcupados / totalParqueaderos) * 100 : 0,
        ingresosPorParqueaderos: ingresos
      };
      
      set({ estadisticas });
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));
