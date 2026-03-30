import { create } from 'zustand';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { LogTiempoRespuesta } from '@/types';

interface MonitoreoState {
  logs: LogTiempoRespuesta[];
  loading: boolean;
  error: string | null;
  fetchLogs: (conjuntoId: string, maxItems?: number) => Promise<void>;
}

const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(value as string);
};

const normalizeLog = (id: string, data: Record<string, unknown>): LogTiempoRespuesta => ({
  id,
  conjuntoId: String(data.conjuntoId || ''),
  usuarioId: typeof data.usuarioId === 'string' ? data.usuarioId : undefined,
  modulo: data.modulo === 'votaciones' || data.modulo === 'avisos' ? data.modulo : 'pagos',
  accion: String(data.accion || ''),
  duracionMs: Number(data.duracionMs || 0),
  estado: data.estado === 'error' ? 'error' : 'ok',
  detalle: typeof data.detalle === 'string' ? data.detalle : undefined,
  fecha: toDate(data.fecha),
});

const isFirestoreIndexError = (error: unknown) => {
  const firebaseError = error as { code?: string; message?: string } | undefined;
  return firebaseError?.code === 'failed-precondition' || /index/i.test(String(firebaseError?.message || ''));
};

export const useMonitoreoStore = create<MonitoreoState>((set) => ({
  logs: [],
  loading: false,
  error: null,

  fetchLogs: async (conjuntoId, maxItems = 300) => {
    set({ loading: true, error: null });
    try {
      const logsRef = collection(db, 'logsTiemposRespuesta');
      let snapshot;

      try {
        const indexedQuery = query(
          logsRef,
          where('conjuntoId', '==', conjuntoId),
          orderBy('fecha', 'desc'),
          limit(maxItems)
        );
        snapshot = await getDocs(indexedQuery);
      } catch (error) {
        if (!isFirestoreIndexError(error)) throw error;
        const fallbackQuery = query(logsRef, where('conjuntoId', '==', conjuntoId), limit(maxItems));
        snapshot = await getDocs(fallbackQuery);
      }

      const logs = snapshot.docs
        .map((d) => normalizeLog(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
        .slice(0, maxItems);

      set({ logs, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'No se pudieron cargar los logs', loading: false });
    }
  },
}));

