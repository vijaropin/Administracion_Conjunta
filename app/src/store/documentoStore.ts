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
  orderBy,
  increment 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import type { DocumentoConjunto, CarpetaDocumento } from '@/types';

interface DocumentoState {
  documentos: DocumentoConjunto[];
  carpetas: CarpetaDocumento[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
  
  fetchDocumentos: (conjuntoId: string) => Promise<void>;
  fetchDocumentosByCategoria: (conjuntoId: string, categoria: string) => Promise<void>;
  fetchDocumentosByTipo: (conjuntoId: string, tipo: string) => Promise<void>;
  createDocumento: (documento: Omit<DocumentoConjunto, 'id' | 'archivoUrl'>, archivo: File) => Promise<string>;
  updateDocumento: (id: string, data: Partial<DocumentoConjunto>) => Promise<void>;
  deleteDocumento: (id: string) => Promise<void>;
  aprobarDocumento: (id: string, aprobadoPor: string) => Promise<void>;
  incrementarDescargas: (id: string) => Promise<void>;
  
  fetchCarpetas: (conjuntoId: string) => Promise<void>;
  createCarpeta: (carpeta: Omit<CarpetaDocumento, 'id' | 'documentosCount'>) => Promise<string>;
  updateCarpeta: (id: string, data: Partial<CarpetaDocumento>) => Promise<void>;
  deleteCarpeta: (id: string) => Promise<void>;
  
  subirArchivo: (archivo: File, ruta: string) => Promise<string>;
  getEstadisticas: (conjuntoId: string) => Promise<{
    totalDocumentos: number;
    documentosPublicos: number;
    documentosPrivados: number;
    documentosAprobados: number;
    documentosEnRevision: number;
    totalDescargas: number;
  }>;
}

export const useDocumentoStore = create<DocumentoState>((set, get) => ({
  documentos: [],
  carpetas: [],
  loading: false,
  error: null,
  uploadProgress: 0,

  fetchDocumentos: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'documentos'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('fechaSubida', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const documentos: DocumentoConjunto[] = [];
      querySnapshot.forEach((doc) => {
        documentos.push({ id: doc.id, ...doc.data() } as DocumentoConjunto);
      });
      set({ documentos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchDocumentosByCategoria: async (conjuntoId: string, categoria: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'documentos'), 
        where('conjuntoId', '==', conjuntoId),
        where('categoria', '==', categoria),
        orderBy('fechaSubida', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const documentos: DocumentoConjunto[] = [];
      querySnapshot.forEach((doc) => {
        documentos.push({ id: doc.id, ...doc.data() } as DocumentoConjunto);
      });
      set({ documentos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchDocumentosByTipo: async (conjuntoId: string, tipo: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'documentos'), 
        where('conjuntoId', '==', conjuntoId),
        where('tipo', '==', tipo),
        orderBy('fechaSubida', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const documentos: DocumentoConjunto[] = [];
      querySnapshot.forEach((doc) => {
        documentos.push({ id: doc.id, ...doc.data() } as DocumentoConjunto);
      });
      set({ documentos, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  subirArchivo: async (archivo: File, ruta: string) => {
    try {
      const storageRef = ref(storage, ruta);
      await uploadBytes(storageRef, archivo);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error: any) {
      const mensaje =
        error?.code === 'storage/bucket-not-found'
          ? 'Storage no está inicializado en Firebase. Abre Firebase > Storage y presiona Get Started.'
          : error?.message || 'No se pudo subir el archivo';
      set({ error: mensaje });
      throw error;
    }
  },

  createDocumento: async (documento, archivo) => {
    set({ loading: true, error: null, uploadProgress: 0 });
    try {
      // Subir archivo a Storage
      const ruta = `documentos/${documento.conjuntoId}/${Date.now()}_${archivo.name}`;
      const archivoUrl = await get().subirArchivo(archivo, ruta);
      
      // Crear documento en Firestore
      const nuevoDocumento = {
        ...documento,
        archivoUrl,
        archivoNombre: archivo.name,
        archivoTipo: archivo.type,
        archivoTamano: archivo.size,
        fechaSubida: new Date(),
        descargas: 0
      };
      
      const docRef = await addDoc(collection(db, 'documentos'), nuevoDocumento);
      set({ loading: false, uploadProgress: 100 });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false, uploadProgress: 0 });
      throw error;
    }
  },

  updateDocumento: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'documentos', id), data);
      const { documentos } = get();
      set({ 
        documentos: documentos.map(d => d.id === id ? { ...d, ...data } : d),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteDocumento: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'documentos', id));
      const { documentos } = get();
      set({ 
        documentos: documentos.filter(d => d.id !== id),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  aprobarDocumento: async (id, aprobadoPor) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'documentos', id), {
        estado: 'activo',
        aprobadoPor,
        fechaAprobacion: new Date()
      });
      const { documentos } = get();
      set({ 
        documentos: documentos.map(d => d.id === id ? { 
          ...d, 
          estado: 'activo',
          aprobadoPor,
          fechaAprobacion: new Date()
        } : d),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  incrementarDescargas: async (id) => {
    try {
      await updateDoc(doc(db, 'documentos', id), {
        descargas: increment(1)
      });
      const { documentos } = get();
      set({ 
        documentos: documentos.map(d => d.id === id ? { 
          ...d, 
          descargas: (d.descargas || 0) + 1
        } : d)
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  fetchCarpetas: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'carpetasDocumentos'), 
        where('conjuntoId', '==', conjuntoId),
        orderBy('nombre', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const carpetas: CarpetaDocumento[] = [];
      querySnapshot.forEach((doc) => {
        carpetas.push({ id: doc.id, ...doc.data() } as CarpetaDocumento);
      });
      set({ carpetas, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createCarpeta: async (carpeta) => {
    set({ loading: true, error: null });
    try {
      const nuevaCarpeta = {
        ...carpeta,
        documentosCount: 0
      };
      const docRef = await addDoc(collection(db, 'carpetasDocumentos'), nuevaCarpeta);
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateCarpeta: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'carpetasDocumentos', id), data);
      const { carpetas } = get();
      set({ 
        carpetas: carpetas.map(c => c.id === id ? { ...c, ...data } : c),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteCarpeta: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'carpetasDocumentos', id));
      const { carpetas } = get();
      set({ 
        carpetas: carpetas.filter(c => c.id !== id),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getEstadisticas: async (_conjuntoId: string) => {
    try {
      const { documentos } = get();
      
      return {
        totalDocumentos: documentos.length,
        documentosPublicos: documentos.filter(d => d.esPublico).length,
        documentosPrivados: documentos.filter(d => !d.esPublico).length,
        documentosAprobados: documentos.filter(d => d.estado === 'activo').length,
        documentosEnRevision: documentos.filter(d => d.estado === 'en_revision').length,
        totalDescargas: documentos.reduce((sum, d) => sum + (d.descargas || 0), 0)
      };
    } catch (error: any) {
      set({ error: error.message });
      return {
        totalDocumentos: 0,
        documentosPublicos: 0,
        documentosPrivados: 0,
        documentosAprobados: 0,
        documentosEnRevision: 0,
        totalDescargas: 0
      };
    }
  }
}));


