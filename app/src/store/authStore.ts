import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { Usuario } from '@/types';

interface AuthState {
  user: Usuario | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<Usuario>) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<Usuario>) => Promise<void>;
  setUser: (user: Usuario | null) => void;
  clearError: () => void;
}

const normalizeUserFromDoc = (
  raw: Partial<Usuario> | undefined,
  uid: string
): Usuario => ({
  ...(raw as Usuario),
  id: raw?.id || uid,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      loading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = normalizeUserFromDoc(userDoc.data() as Partial<Usuario>, firebaseUser.uid);
            if (!userDoc.data()?.id) {
              await updateDoc(doc(db, 'usuarios', firebaseUser.uid), { id: firebaseUser.uid });
            }
            set({ 
              user: userData, 
              firebaseUser,
              loading: false 
            });
          } else {
            throw new Error('Usuario no encontrado en la base de datos');
          }
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al iniciar sesión', 
            loading: false 
          });
          throw error;
        }
      },

      register: async (email: string, password: string, userData: Partial<Usuario>) => {
        set({ loading: true, error: null });
        try {
          const tipoSolicitado = userData.tipo || 'residente';
          const perfilesResidenciales = new Set(['residente', 'propietario_residente', 'arrendatario', 'propietario_no_residente']);

          if (perfilesResidenciales.has(tipoSolicitado) && userData.unidad) {
            const q = query(collection(db, 'usuarios'), where('unidad', '==', userData.unidad));
            const existing = await getDocs(q);
            const perfilesCasa = existing.docs.filter((d) => perfilesResidenciales.has((d.data()?.tipo as string) || ''));
            if (perfilesCasa.length >= 4) {
              throw new Error('La casa ya tiene el máximo de 4 perfiles residenciales registrados.');
            }
          }

          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          const newUser: Usuario = {
            id: firebaseUser.uid,
            email,
            nombres: userData.nombres || '',
            apellidos: userData.apellidos || '',
            telefono: userData.telefono || '',
            tipo: tipoSolicitado as Usuario['tipo'],
            conjuntoId: userData.conjuntoId || '',
            unidad: userData.unidad,
            torre: userData.torre,
            fechaRegistro: new Date(),
            activo: true,
            consentimientoDatos: true
          };
          
          await setDoc(doc(db, 'usuarios', firebaseUser.uid), newUser);
          set({ 
            user: newUser, 
            firebaseUser,
            loading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al registrar usuario', 
            loading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          await signOut(auth);
          set({ 
            user: null, 
            firebaseUser: null, 
            loading: false 
          });
        } catch (error: any) {
          set({ 
            error: error.message || 'Error al cerrar sesión', 
            loading: false 
          });
        }
      },

      updateUser: async (data: Partial<Usuario>) => {
        const { user } = get();
        if (!user) return;
        
        try {
          await updateDoc(doc(db, 'usuarios', user.id), data);
          set({ user: { ...user, ...data } });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      setUser: (user: Usuario | null) => {
        set({ user });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
);

// Listener para cambios en el estado de autenticación
export const initAuthListener = () => {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = normalizeUserFromDoc(userDoc.data() as Partial<Usuario>, firebaseUser.uid);
        useAuthStore.setState({
          user: userData,
          firebaseUser,
          loading: false,
        });
        if (!userDoc.data()?.id) {
          await updateDoc(doc(db, 'usuarios', firebaseUser.uid), { id: firebaseUser.uid });
        }
      } else {
        useAuthStore.setState({
          user: null,
          firebaseUser,
          loading: false,
        });
      }
    } else {
      useAuthStore.setState({ user: null, firebaseUser: null, loading: false });
    }
  });
};
