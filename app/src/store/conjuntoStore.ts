import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ConjuntoResidencial, Unidad, ZonaComun, ConsejoMiembro } from '@/types';

interface ConjuntoState {
  conjuntos: ConjuntoResidencial[];
  conjuntoActual: ConjuntoResidencial | null;
  unidades: Unidad[];
  zonasComunes: ZonaComun[];
  consejoMiembros: ConsejoMiembro[];
  loading: boolean;
  error: string | null;
  
  fetchConjuntos: () => Promise<void>;
  fetchConjuntoById: (id: string) => Promise<void>;
  createConjunto: (conjunto: Omit<ConjuntoResidencial, 'id'>) => Promise<string>;
  updateConjunto: (id: string, data: Partial<ConjuntoResidencial>) => Promise<void>;
  deleteConjunto: (id: string) => Promise<void>;
  setConjuntoActual: (conjunto: ConjuntoResidencial | null) => void;
  
  fetchUnidades: (conjuntoId: string) => Promise<void>;
  createUnidad: (unidad: Omit<Unidad, 'id'>) => Promise<string>;
  updateUnidad: (id: string, data: Partial<Unidad>) => Promise<void>;
  deleteUnidad: (id: string) => Promise<void>;
  
  fetchZonasComunes: (conjuntoId: string) => Promise<void>;
  createZonaComun: (zona: Omit<ZonaComun, 'id'>) => Promise<string>;
  updateZonaComun: (id: string, data: Partial<ZonaComun>) => Promise<void>;
  deleteZonaComun: (id: string) => Promise<void>;

  // Consejo de administración (FASE 1B)
  fetchConsejoMiembros: (conjuntoId: string) => Promise<void>;
  createConsejoMiembro: (
    conjuntoId: string,
    miembro: Omit<ConsejoMiembro, 'id' | 'conjuntoId' | 'fechaRegistro'>
  ) => Promise<string>;
  updateConsejoMiembro: (conjuntoId: string, miembroId: string, data: Partial<ConsejoMiembro>) => Promise<void>;
  setConsejoMiembroActivo: (conjuntoId: string, miembroId: string, activo: boolean) => Promise<void>;
}

export const useConjuntoStore = create<ConjuntoState>((set, get) => ({
  conjuntos: [],
  conjuntoActual: null,
  unidades: [],
  zonasComunes: [],
  consejoMiembros: [],
  loading: false,
  error: null,

  fetchConjuntos: async () => {
    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(collection(db, 'conjuntos'));
      const conjuntos: ConjuntoResidencial[] = [];
      querySnapshot.forEach((doc) => {
        conjuntos.push({ id: doc.id, ...doc.data() } as ConjuntoResidencial);
      });
      set({ conjuntos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchConjuntoById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const docSnap = await getDoc(doc(db, 'conjuntos', id));
      if (docSnap.exists()) {
        set({ 
          conjuntoActual: { id: docSnap.id, ...docSnap.data() } as ConjuntoResidencial,
          loading: false 
        });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createConjunto: async (conjunto) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'conjuntos'), conjunto);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateConjunto: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'conjuntos', id), data);
      const { conjuntoActual } = get();
      if (conjuntoActual?.id === id) {
        set({ conjuntoActual: { ...conjuntoActual, ...data } });
      }
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteConjunto: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'conjuntos', id));
      const { conjuntos } = get();
      set({ 
        conjuntos: conjuntos.filter(c => c.id !== id),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  setConjuntoActual: (conjunto) => {
    set({ conjuntoActual: conjunto });
  },

  fetchUnidades: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'unidades'), where('conjuntoId', '==', conjuntoId));
      const querySnapshot = await getDocs(q);
      const unidades: Unidad[] = [];
      querySnapshot.forEach((doc) => {
        unidades.push({ id: doc.id, ...doc.data() } as Unidad);
      });
      set({ unidades, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createUnidad: async (unidad) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'unidades'), unidad);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUnidad: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'unidades', id), data);
      const { unidades } = get();
      set({ 
        unidades: unidades.map(u => u.id === id ? { ...u, ...data } : u),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteUnidad: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'unidades', id));
      const { unidades } = get();
      set({ 
        unidades: unidades.filter(u => u.id !== id),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchZonasComunes: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(collection(db, 'zonasComunes'), where('conjuntoId', '==', conjuntoId));
      const querySnapshot = await getDocs(q);
      const zonas: ZonaComun[] = [];
      querySnapshot.forEach((doc) => {
        zonas.push({ id: doc.id, ...doc.data() } as ZonaComun);
      });
      set({ zonasComunes: zonas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createZonaComun: async (zona) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'zonasComunes'), zona);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateZonaComun: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'zonasComunes', id), data);
      const { zonasComunes } = get();
      set({ 
        zonasComunes: zonasComunes.map(z => z.id === id ? { ...z, ...data } : z),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteZonaComun: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'zonasComunes', id));
      const { zonasComunes } = get();
      set({ 
        zonasComunes: zonasComunes.filter(z => z.id !== id),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchConsejoMiembros: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'conjuntos', conjuntoId, 'consejoMiembros'),
        orderBy('activo', 'desc'),
        orderBy('fechaRegistro', 'desc')
      );
      const snapshot = await getDocs(q);
      const miembros: ConsejoMiembro[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        miembros.push({
          id: d.id,
          conjuntoId,
          ...data
        } as ConsejoMiembro);
      });
      set({ consejoMiembros: miembros, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createConsejoMiembro: async (conjuntoId, miembro) => {
    set({ loading: true, error: null });
    try {
      const payload = {
        ...miembro,
        conjuntoId,
        activo: miembro.activo ?? true,
        fechaRegistro: new Date()
      };
      const docRef = await addDoc(collection(db, 'conjuntos', conjuntoId, 'consejoMiembros'), payload);

      const { consejoMiembros } = get();
      const nuevo = { id: docRef.id, ...payload } as ConsejoMiembro;
      const next = [nuevo, ...consejoMiembros];
      set({ consejoMiembros: next, loading: false });

      const activeCount = next.filter((m) => m.activo).length;
      await updateDoc(doc(db, 'conjuntos', conjuntoId), { cantidadConsejeros: activeCount });
      const { conjuntoActual } = get();
      if (conjuntoActual?.id === conjuntoId) {
        set({ conjuntoActual: { ...conjuntoActual, cantidadConsejeros: activeCount } });
      }

      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateConsejoMiembro: async (conjuntoId, miembroId, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'conjuntos', conjuntoId, 'consejoMiembros', miembroId), data);
      const { consejoMiembros } = get();
      const next = consejoMiembros.map((m) => (m.id === miembroId ? { ...m, ...data } : m));
      set({ consejoMiembros: next, loading: false });

      const activeCount = next.filter((m) => m.activo).length;
      await updateDoc(doc(db, 'conjuntos', conjuntoId), { cantidadConsejeros: activeCount });
      const { conjuntoActual } = get();
      if (conjuntoActual?.id === conjuntoId) {
        set({ conjuntoActual: { ...conjuntoActual, cantidadConsejeros: activeCount } });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  setConsejoMiembroActivo: async (conjuntoId, miembroId, activo) => {
    await get().updateConsejoMiembro(conjuntoId, miembroId, { activo });
  }
}));
