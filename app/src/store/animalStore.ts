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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import type {
  AnimalCompania,
  EstadisticaAnimales,
  CertificadoVacunacion,
  PolizaResponsabilidadCivil
} from '@/types';

interface AnimalState {
  animales: AnimalCompania[];
  estadisticas: EstadisticaAnimales | null;
  loading: boolean;
  error: string | null;

  fetchAnimales: (conjuntoId: string) => Promise<void>;
  fetchAnimalesByUnidad: (unidadId: string) => Promise<void>;
  fetchAnimalesByResidente: (residenteId: string) => Promise<void>;
  createAnimal: (animal: Omit<AnimalCompania, 'id'>) => Promise<string>;
  updateAnimal: (id: string, data: Partial<AnimalCompania>) => Promise<void>;
  deleteAnimal: (id: string) => Promise<void>;

  uploadCertificadoVacunacion: (
    animalId: string,
    certificado: Omit<CertificadoVacunacion, 'id'>,
    archivo?: File
  ) => Promise<void>;
  deleteCertificadoVacunacion: (animalId: string, certificadoId: string) => Promise<void>;

  uploadPoliza: (
    animalId: string,
    poliza: PolizaResponsabilidadCivil,
    archivo?: File
  ) => Promise<void>;
  deletePoliza: (animalId: string) => Promise<void>;

  uploadFoto: (animalId: string, archivo: File) => Promise<string>;

  verificarVencimientos: (conjuntoId: string) => Promise<{
    certificadosVencidos: number;
    certificadosPorVencer: number;
    polizasVencidas: number;
    polizasPorVencer: number;
  }>;

  fetchEstadisticas: (conjuntoId: string) => Promise<void>;
}

export const useAnimalStore = create<AnimalState>((set, get) => ({
  animales: [],
  estadisticas: null,
  loading: false,
  error: null,

  fetchAnimales: async (conjuntoId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'animales'),
        where('conjuntoId', '==', conjuntoId),
        where('activo', '==', true),
        orderBy('fechaRegistro', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const animales: AnimalCompania[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        animales.push({
          id: doc.id,
          ...data,
          fechaRegistro: data.fechaRegistro?.toDate() || new Date(),
          fechaNacimiento: data.fechaNacimiento?.toDate(),
          certificadosVacunacion: (data.certificadosVacunacion || []).map((c: any) => ({
            ...c,
            fechaAplicacion: c.fechaAplicacion?.toDate() || new Date(),
            fechaVencimiento: c.fechaVencimiento?.toDate() || new Date()
          })),
          microchip: data.microchip ? {
            ...data.microchip,
            fechaImplantacion: data.microchip.fechaImplantacion?.toDate() || new Date()
          } : undefined,
          polizaResponsabilidadCivil: data.polizaResponsabilidadCivil ? {
            ...data.polizaResponsabilidadCivil,
            fechaInicio: data.polizaResponsabilidadCivil.fechaInicio?.toDate() || new Date(),
            fechaVencimiento: data.polizaResponsabilidadCivil.fechaVencimiento?.toDate() || new Date()
          } : undefined
        } as AnimalCompania);
      });
      set({ animales, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAnimalesByUnidad: async (unidadId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'animales'),
        where('unidadId', '==', unidadId),
        where('activo', '==', true),
        orderBy('fechaRegistro', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const animales: AnimalCompania[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        animales.push({
          id: doc.id,
          ...data,
          fechaRegistro: data.fechaRegistro?.toDate() || new Date(),
          fechaNacimiento: data.fechaNacimiento?.toDate(),
          certificadosVacunacion: (data.certificadosVacunacion || []).map((c: any) => ({
            ...c,
            fechaAplicacion: c.fechaAplicacion?.toDate() || new Date(),
            fechaVencimiento: c.fechaVencimiento?.toDate() || new Date()
          })),
          microchip: data.microchip ? {
            ...data.microchip,
            fechaImplantacion: data.microchip.fechaImplantacion?.toDate() || new Date()
          } : undefined,
          polizaResponsabilidadCivil: data.polizaResponsabilidadCivil ? {
            ...data.polizaResponsabilidadCivil,
            fechaInicio: data.polizaResponsabilidadCivil.fechaInicio?.toDate() || new Date(),
            fechaVencimiento: data.polizaResponsabilidadCivil.fechaVencimiento?.toDate() || new Date()
          } : undefined
        } as AnimalCompania);
      });
      set({ animales, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAnimalesByResidente: async (residenteId: string) => {
    set({ loading: true, error: null });
    try {
      const q = query(
        collection(db, 'animales'),
        where('residenteId', '==', residenteId),
        where('activo', '==', true),
        orderBy('fechaRegistro', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const animales: AnimalCompania[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        animales.push({
          id: doc.id,
          ...data,
          fechaRegistro: data.fechaRegistro?.toDate() || new Date(),
          fechaNacimiento: data.fechaNacimiento?.toDate(),
          certificadosVacunacion: (data.certificadosVacunacion || []).map((c: any) => ({
            ...c,
            fechaAplicacion: c.fechaAplicacion?.toDate() || new Date(),
            fechaVencimiento: c.fechaVencimiento?.toDate() || new Date()
          })),
          microchip: data.microchip ? {
            ...data.microchip,
            fechaImplantacion: data.microchip.fechaImplantacion?.toDate() || new Date()
          } : undefined,
          polizaResponsabilidadCivil: data.polizaResponsabilidadCivil ? {
            ...data.polizaResponsabilidadCivil,
            fechaInicio: data.polizaResponsabilidadCivil.fechaInicio?.toDate() || new Date(),
            fechaVencimiento: data.polizaResponsabilidadCivil.fechaVencimiento?.toDate() || new Date()
          } : undefined
        } as AnimalCompania);
      });
      set({ animales, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createAnimal: async (animal) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'animales'), {
        ...animal,
        fechaRegistro: animal.fechaRegistro || new Date(),
        certificadosVacunacion: animal.certificadosVacunacion || []
      });
      set({ loading: false });
      return docRef.id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateAnimal: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'animales', id), data);
      const { animales } = get();
      set({
        animales: animales.map(a => a.id === id ? { ...a, ...data } : a),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteAnimal: async (id) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'animales', id), { activo: false });
      const { animales } = get();
      set({
        animales: animales.filter(a => a.id !== id),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  uploadCertificadoVacunacion: async (animalId, certificado, archivo) => {
    set({ loading: true, error: null });
    try {
      let archivoUrl = certificado.archivoUrl;
      let archivoNombre = certificado.archivoNombre;

      if (archivo) {
        const animalDoc = await getDoc(doc(db, 'animales', animalId));
        const animalData = animalDoc.data();
        const conjuntoId = animalData?.conjuntoId;

        const storageRef = ref(
          storage,
          `conjuntos/${conjuntoId}/animales/${animalId}/certificados/${Date.now()}_${archivo.name}`
        );
        await uploadBytes(storageRef, archivo);
        archivoUrl = await getDownloadURL(storageRef);
        archivoNombre = archivo.name;
      }

      const animalDoc = await getDoc(doc(db, 'animales', animalId));
      const animalData = animalDoc.data();
      const certificados = animalData?.certificadosVacunacion || [];

      const nuevoCertificado: CertificadoVacunacion = {
        id: Date.now().toString(),
        ...certificado,
        archivoUrl,
        archivoNombre
      };

      await updateDoc(doc(db, 'animales', animalId), {
        certificadosVacunacion: [...certificados, nuevoCertificado]
      });

      const { animales } = get();
      set({
        animales: animales.map(a => {
          if (a.id === animalId) {
            return {
              ...a,
              certificadosVacunacion: [...a.certificadosVacunacion, nuevoCertificado]
            };
          }
          return a;
        }),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteCertificadoVacunacion: async (animalId, certificadoId) => {
    set({ loading: true, error: null });
    try {
      const animalDoc = await getDoc(doc(db, 'animales', animalId));
      const animalData = animalDoc.data();
      const certificados = animalData?.certificadosVacunacion || [];
      const certificado = certificados.find((c: CertificadoVacunacion) => c.id === certificadoId);

      if (certificado?.archivoUrl) {
        try {
          const storageRef = ref(storage, certificado.archivoUrl);
          await deleteObject(storageRef);
        } catch (error) {
          console.warn('Error al eliminar archivo:', error);
        }
      }

      const certificadosActualizados = certificados.filter(
        (c: CertificadoVacunacion) => c.id !== certificadoId
      );

      await updateDoc(doc(db, 'animales', animalId), {
        certificadosVacunacion: certificadosActualizados
      });

      const { animales } = get();
      set({
        animales: animales.map(a => {
          if (a.id === animalId) {
            return {
              ...a,
              certificadosVacunacion: a.certificadosVacunacion.filter(c => c.id !== certificadoId)
            };
          }
          return a;
        }),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  uploadPoliza: async (animalId, poliza, archivo) => {
    set({ loading: true, error: null });
    try {
      let archivoUrl = poliza.archivoUrl;
      let archivoNombre = poliza.archivoNombre;

      if (archivo) {
        const animalDoc = await getDoc(doc(db, 'animales', animalId));
        const animalData = animalDoc.data();
        const conjuntoId = animalData?.conjuntoId;

        const storageRef = ref(
          storage,
          `conjuntos/${conjuntoId}/animales/${animalId}/polizas/${Date.now()}_${archivo.name}`
        );
        await uploadBytes(storageRef, archivo);
        archivoUrl = await getDownloadURL(storageRef);
        archivoNombre = archivo.name;
      }

      await updateDoc(doc(db, 'animales', animalId), {
        polizaResponsabilidadCivil: {
          ...poliza,
          archivoUrl,
          archivoNombre
        }
      });

      const { animales } = get();
      set({
        animales: animales.map(a => {
          if (a.id === animalId) {
            return {
              ...a,
              polizaResponsabilidadCivil: {
                ...poliza,
                archivoUrl,
                archivoNombre
              }
            };
          }
          return a;
        }),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deletePoliza: async (animalId) => {
    set({ loading: true, error: null });
    try {
      const animalDoc = await getDoc(doc(db, 'animales', animalId));
      const animalData = animalDoc.data();
      const poliza = animalData?.polizaResponsabilidadCivil;

      if (poliza?.archivoUrl) {
        try {
          const storageRef = ref(storage, poliza.archivoUrl);
          await deleteObject(storageRef);
        } catch (error) {
          console.warn('Error al eliminar archivo:', error);
        }
      }

      await updateDoc(doc(db, 'animales', animalId), {
        polizaResponsabilidadCivil: null
      });

      const { animales } = get();
      set({
        animales: animales.map(a => {
          if (a.id === animalId) {
            return {
              ...a,
              polizaResponsabilidadCivil: undefined
            };
          }
          return a;
        }),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  uploadFoto: async (animalId, archivo) => {
    set({ loading: true, error: null });
    try {
      const animalDoc = await getDoc(doc(db, 'animales', animalId));
      const animalData = animalDoc.data();
      const conjuntoId = animalData?.conjuntoId;

      const storageRef = ref(
        storage,
        `conjuntos/${conjuntoId}/animales/${animalId}/foto_${Date.now()}_${archivo.name}`
      );
      await uploadBytes(storageRef, archivo);
      const fotoUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'animales', animalId), { foto: fotoUrl });

      const { animales } = get();
      set({
        animales: animales.map(a => a.id === animalId ? { ...a, foto: fotoUrl } : a),
        loading: false
      });

      return fotoUrl;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  verificarVencimientos: async (conjuntoId) => {
    try {
      const { fetchAnimales } = get();
      await fetchAnimales(conjuntoId);
      const { animales } = get();

      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(hoy.getDate() + 30);

      let certificadosVencidos = 0;
      let certificadosPorVencer = 0;
      let polizasVencidas = 0;
      let polizasPorVencer = 0;

      animales.forEach(animal => {
        animal.certificadosVacunacion.forEach(cert => {
          const fechaVenc = new Date(cert.fechaVencimiento);
          if (fechaVenc < hoy) {
            certificadosVencidos++;
          } else if (fechaVenc <= en30Dias) {
            certificadosPorVencer++;
          }
        });

        if (animal.polizaResponsabilidadCivil) {
          const fechaVenc = new Date(animal.polizaResponsabilidadCivil.fechaVencimiento);
          if (fechaVenc < hoy) {
            polizasVencidas++;
          } else if (fechaVenc <= en30Dias) {
            polizasPorVencer++;
          }
        }
      });

      return {
        certificadosVencidos,
        certificadosPorVencer,
        polizasVencidas,
        polizasPorVencer
      };
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchEstadisticas: async (conjuntoId: string) => {
    try {
      const { fetchAnimales } = get();
      await fetchAnimales(conjuntoId);
      const { animales } = get();

      const totalAnimales = animales.length;
      const totalPerros = animales.filter(a => a.tipo === 'perro').length;
      const totalGatos = animales.filter(a => a.tipo === 'gato').length;
      const totalOtros = animales.filter(a => a.tipo === 'otro').length;
      const animalesConMicrochip = animales.filter(a => a.microchip).length;
      const animalesConPoliza = animales.filter(a => a.polizaResponsabilidadCivil).length;

      const hoy = new Date();
      const en30Dias = new Date();
      en30Dias.setDate(hoy.getDate() + 30);

      let certificadosVencidos = 0;
      let certificadosPorVencer = 0;
      let polizasVencidas = 0;
      let polizasPorVencer = 0;

      animales.forEach(animal => {
        animal.certificadosVacunacion.forEach(cert => {
          const fechaVenc = new Date(cert.fechaVencimiento);
          if (fechaVenc < hoy) {
            certificadosVencidos++;
          } else if (fechaVenc <= en30Dias) {
            certificadosPorVencer++;
          }
        });

        if (animal.polizaResponsabilidadCivil) {
          const fechaVenc = new Date(animal.polizaResponsabilidadCivil.fechaVencimiento);
          if (fechaVenc < hoy) {
            polizasVencidas++;
          } else if (fechaVenc <= en30Dias) {
            polizasPorVencer++;
          }
        }
      });

      const animalesPorUnidad: { [unidadId: string]: number } = {};
      animales.forEach(animal => {
        animalesPorUnidad[animal.unidadId] = (animalesPorUnidad[animal.unidadId] || 0) + 1;
      });

      const estadisticas: EstadisticaAnimales = {
        totalAnimales,
        totalPerros,
        totalGatos,
        totalOtros,
        animalesConMicrochip,
        animalesConPoliza,
        certificadosVencidos,
        certificadosPorVencer,
        polizasVencidas,
        polizasPorVencer,
        animalesPorUnidad
      };

      set({ estadisticas });
    } catch (error: any) {
      set({ error: error.message });
    }
  }
}));

