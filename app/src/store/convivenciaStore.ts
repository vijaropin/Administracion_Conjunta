import { create } from 'zustand';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Conflicto, Audiencia, HistorialCaso, Resolucion, Sancion, EstadisticaConvivencia } from '@/types';

interface ConvivenciaState {
  conflictos: Conflicto[];
  conflictosPendientes: Conflicto[];
  conflictosCriticos: Conflicto[];
  audiencias: Audiencia[];
  estadisticas: EstadisticaConvivencia | null;
  loading: boolean;
  error: string | null;
  
  fetchConflictos: (conjuntoId: string) => Promise<void>;
  fetchConflictoById: (id: string) => Promise<Conflicto | null>;
  createConflicto: (conflicto: Omit<Conflicto, 'id' | 'numeroCaso' | 'historial'>) => Promise<string>;
  updateConflicto: (id: string, data: Partial<Conflicto>) => Promise<void>;
  asignarComite: (conflictoId: string, miembros: string[]) => Promise<void>;
  agregarSeguimiento: (conflictoId: string, seguimiento: Omit<HistorialCaso, 'id' | 'fecha'>) => Promise<void>;
  emitirResolucion: (conflictoId: string, resolucion: Resolucion) => Promise<void>;
  emitirSancion: (conflictoId: string, sancion: Sancion) => Promise<void>;
  apelarSancion: (conflictoId: string, fundamentos: string) => Promise<void>;
  cerrarCaso: (conflictoId: string, motivo: string) => Promise<void>;
  
  fetchAudiencias: (conjuntoId: string) => Promise<void>;
  fetchAudienciasByConflicto: (conflictoId: string) => Promise<void>;
  createAudiencia: (audiencia: Omit<Audiencia, 'id'>) => Promise<string>;
  updateAudiencia: (id: string, data: Partial<Audiencia>) => Promise<void>;
  
  fetchEstadisticas: (conjuntoId: string) => Promise<void>;
  generarNumeroCaso: (conjuntoId: string) => Promise<string>;
}

export const useConvivenciaStore = create<ConvivenciaState>((set, get) => ({
  conflictos: [],
  conflictosPendientes: [],
  conflictosCriticos: [],
  audiencias: [],
  estadisticas: null,
  loading: false,
  error: null,

  fetchConflictos: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'conflictos'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaReporte', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const conflictos: Conflicto[] = [];
      querySnapshot.forEach((doc) => {
        conflictos.push({ id: doc.id, ...doc.data() } as Conflicto);
      });
      
      set({ 
        conflictos,
        conflictosPendientes: conflictos.filter(c => 
          c.estado === 'recibido' || c.estado === 'en_revision' || c.estado === 'en_mediacio'
        ),
        conflictosCriticos: conflictos.filter(c => 
          c.prioridad === 'critica' && c.estado !== 'archivado' && c.estado !== 'sancionado'
        ),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchConflictoById: async (id: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'conflictos', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Conflicto;
      }
      return null;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },

  generarNumeroCaso: async (conjuntoId: string) => {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    
    // Contar casos del año actual para generar correlativo
    const q = query(
      collection(db, 'conflictos'),
      where('conjuntoId', '==', conjuntoId)
    );
    const snapshot = await getDocs(q);
    const casosAnio = snapshot.docs.filter(d => {
      const fechaCaso = d.data().fechaReporte?.toDate?.() || new Date(d.data().fechaReporte);
      return fechaCaso.getFullYear() === anio;
    });
    
    const correlativo = String(casosAnio.length + 1).padStart(4, '0');
    return `CC-${anio}${mes}-${correlativo}`;
  },

  createConflicto: async (conflicto) => {
    set({ loading: true, error: null });
    try {
      const numeroCaso = await get().generarNumeroCaso(conflicto.conjuntoId);
      
      const nuevoConflicto = {
        ...conflicto,
        numeroCaso,
        historial: [{
          id: Date.now().toString(),
          fecha: new Date(),
          accion: 'Caso recibido y registrado',
          descripcion: 'El caso ha sido registrado en el sistema del Comité de Convivencia',
          realizadoPor: conflicto.comiteAsignado[0] || 'sistema',
          tipo: 'creacion'
        }],
        fechaReporte: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'conflictos'), nuevoConflicto);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateConflicto: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'conflictos', id), data);
      const { conflictos } = get();
      set({ 
        conflictos: conflictos.map(c => c.id === id ? { ...c, ...data } : c),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  asignarComite: async (conflictoId, miembros) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'conflictos', conflictoId), {
        comiteAsignado: miembros,
        estado: 'en_revision'
      });
      
      // Agregar seguimiento
      const seguimiento: Omit<HistorialCaso, 'id' | 'fecha'> = {
        accion: 'Asignación de comité',
        descripcion: `Miembros asignados: ${miembros.join(', ')}`,
        realizadoPor: miembros[0],
        tipo: 'asignacion'
      };
      await get().agregarSeguimiento(conflictoId, seguimiento);
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  agregarSeguimiento: async (conflictoId, seguimiento) => {
    try {
      const conflictoRef = doc(db, 'conflictos', conflictoId);
      const conflictoDoc = await getDoc(conflictoRef);
      
      if (conflictoDoc.exists()) {
        const conflicto = conflictoDoc.data() as Conflicto;
        const nuevoHistorial = [...(conflicto.historial || []), {
          ...seguimiento,
          id: Date.now().toString(),
          fecha: new Date()
        }];
        
        await updateDoc(conflictoRef, { historial: nuevoHistorial });
        
        const { conflictos } = get();
        set({ 
          conflictos: conflictos.map(c => c.id === conflictoId ? { 
            ...c, 
            historial: nuevoHistorial 
          } : c)
        });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  emitirResolucion: async (conflictoId, resolucion) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'conflictos', conflictoId), {
        resolucion,
        estado: resolucion.decision === 'conciliacion' ? 'archivado' : 'sancionado'
      });
      
      // Agregar seguimiento
      const seguimiento: Omit<HistorialCaso, 'id' | 'fecha'> = {
        accion: 'Resolución emitida',
        descripcion: `Decisión: ${resolucion.decision}. ${resolucion.fundamentos.substring(0, 100)}...`,
        realizadoPor: resolucion.emitidaPor,
        tipo: 'resolucion'
      };
      await get().agregarSeguimiento(conflictoId, seguimiento);
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  emitirSancion: async (conflictoId, sancion) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'conflictos', conflictoId), {
        sancion,
        estado: 'sancionado'
      });
      
      // Agregar seguimiento
      const seguimiento: Omit<HistorialCaso, 'id' | 'fecha'> = {
        accion: 'Sanción impuesta',
        descripcion: `Tipo: ${sancion.tipo}. ${sancion.descripcion}`,
        realizadoPor: sancion.emitidaPor,
        tipo: 'sancion'
      };
      await get().agregarSeguimiento(conflictoId, seguimiento);
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  apelarSancion: async (conflictoId, fundamentos) => {
    set({ loading: true, error: null });
    try {
      const conflictoRef = doc(db, 'conflictos', conflictoId);
      const conflictoDoc = await getDoc(conflictoRef);
      
      if (conflictoDoc.exists()) {
        const conflicto = conflictoDoc.data() as Conflicto;
        await updateDoc(conflictoRef, {
          'sancion.apelada': true,
          'sancion.fundamentosApelacion': fundamentos,
          estado: 'apelado'
        });
        
        // Agregar seguimiento
        const seguimiento: Omit<HistorialCaso, 'id' | 'fecha'> = {
          accion: 'Sanción apelada',
          descripcion: fundamentos,
          realizadoPor: conflicto.residenteInvolucrado1,
          tipo: 'apelacion'
        };
        await get().agregarSeguimiento(conflictoId, seguimiento);
      }
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  cerrarCaso: async (conflictoId, motivo) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'conflictos', conflictoId), {
        estado: 'archivado',
        fechaCierre: new Date()
      });
      
      // Agregar seguimiento
      const seguimiento: Omit<HistorialCaso, 'id' | 'fecha'> = {
        accion: 'Caso cerrado',
        descripcion: motivo,
        realizadoPor: 'sistema',
        tipo: 'cierre'
      };
      await get().agregarSeguimiento(conflictoId, seguimiento);
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAudiencias: async (_conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      // Obtener audiencias de los conflictos del conjunto
      const conflictosIds = get().conflictos.map(c => c.id);
      if (conflictosIds.length === 0) {
        set({ audiencias: [], loading: false });
        return;
      }
      const q = query(
        collection(db, 'audiencias'), 
        where('conflictoId', 'in', conflictosIds)
      );
      const querySnapshot = await getDocs(q);
      const audiencias: Audiencia[] = [];
      querySnapshot.forEach((doc) => {
        audiencias.push({ id: doc.id, ...doc.data() } as Audiencia);
      });
      set({ audiencias, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAudienciasByConflicto: async (conflictoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'audiencias'), 
        where('conflictoId', '==', conflictoId),
        orderBy('fecha', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const audiencias: Audiencia[] = [];
      querySnapshot.forEach((doc) => {
        audiencias.push({ id: doc.id, ...doc.data() } as Audiencia);
      });
      set({ audiencias, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createAudiencia: async (audiencia) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'audiencias'), audiencia);
      
      // Agregar seguimiento al conflicto
      const seguimiento: Omit<HistorialCaso, 'id' | 'fecha'> = {
        accion: 'Audiencia programada',
        descripcion: `Fecha: ${audiencia.fecha} ${audiencia.hora}. Lugar: ${audiencia.lugar}`,
        realizadoPor: audiencia.comitePresente[0],
        tipo: 'audiencia'
      };
      await get().agregarSeguimiento(audiencia.conflictoId, seguimiento);
      
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateAudiencia: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'audiencias', id), data);
      const { audiencias } = get();
      set({ 
        audiencias: audiencias.map(a => a.id === id ? { ...a, ...data } : a),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEstadisticas: async (conjuntoId: string) => {
    try {
      await get().fetchConflictos(conjuntoId);
      void conjuntoId; // Usado para filtrar estadísticas
      const { conflictos } = get();
      
      const casosResueltos = conflictos.filter(c => c.estado === 'sancionado' || c.estado === 'archivado');
      const casosPendientes = conflictos.filter(c => 
        c.estado === 'recibido' || c.estado === 'en_revision' || c.estado === 'en_mediacio'
      );
      
      // Calcular tiempo promedio de resolución
      const tiemposResolucion = casosResueltos
        .filter(c => c.fechaCierre)
        .map(c => {
          const inicio = new Date(c.fechaReporte).getTime();
          const fin = new Date(c.fechaCierre!).getTime();
          return (fin - inicio) / (1000 * 60 * 60 * 24); // días
        });
      
      const tiempoPromedio = tiemposResolucion.length > 0 
        ? tiemposResolucion.reduce((a, b) => a + b, 0) / tiemposResolucion.length 
        : 0;
      
      // Casos por tipo
      const casosPorTipo: { [tipo: string]: number } = {};
      conflictos.forEach(c => {
        casosPorTipo[c.tipo] = (casosPorTipo[c.tipo] || 0) + 1;
      });
      
      // Casos por mes
      const casosPorMes: { [mes: string]: number } = {};
      conflictos.forEach(c => {
        const fecha = new Date(c.fechaReporte);
        const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        casosPorMes[mes] = (casosPorMes[mes] || 0) + 1;
      });
      
      // Sanciones
      const sancionesAplicadas = conflictos.filter(c => c.sancion).length;
      const multasCobradas = conflictos
        .filter(c => c.sancion?.tipo === 'multa' && c.sancion?.cumplida)
        .reduce((sum, c) => sum + (c.sancion?.valorMulta || 0), 0);
      
      const conciliacionesExitosas = conflictos.filter(c => 
        c.resolucion?.decision === 'conciliacion'
      ).length;
      
      const estadisticas: EstadisticaConvivencia = {
        totalCasos: conflictos.length,
        casosPendientes: casosPendientes.length,
        casosResueltos: casosResueltos.length,
        casosArchivados: conflictos.filter(c => c.estado === 'archivado').length,
        tasaResolucion: conflictos.length > 0 ? (casosResueltos.length / conflictos.length) * 100 : 0,
        tiempoPromedioResolucion: Math.round(tiempoPromedio),
        casosPorTipo,
        casosPorMes,
        sancionesAplicadas,
        multasCobradas,
        conciliacionesExitosas
      };
      
      set({ estadisticas });
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));

