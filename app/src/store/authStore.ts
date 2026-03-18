import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
            const userData = userDoc.data() as Usuario;
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
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          const newUser: Usuario = {
            id: firebaseUser.uid,
            email,
            nombres: userData.nombres || '',
            apellidos: userData.apellidos || '',
            telefono: userData.telefono || '',
            tipo: userData.tipo || 'residente',
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
    const { setUser } = useAuthStore.getState();
    
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as Usuario);
      }
    } else {
      setUser(null);
    }
  });
};
