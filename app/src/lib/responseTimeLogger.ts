import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { LogTiempoRespuesta } from '@/types';

type LogTiempoRespuestaInput = Omit<LogTiempoRespuesta, 'id' | 'fecha'> & {
  fecha?: Date;
};

export const iniciarMedicion = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();

export const duracionMs = (inicio: number): number => {
  const fin =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  return Math.max(0, Math.round(fin - inicio));
};

export const registrarLogTiempoRespuesta = async (input: LogTiempoRespuestaInput): Promise<void> => {
  try {
    await addDoc(collection(db, 'logsTiemposRespuesta'), {
      ...input,
      fecha: input.fecha ?? new Date(),
    });
  } catch (error) {
    // El registro de monitoreo no debe bloquear la operación principal.
    console.warn('No fue posible registrar log de tiempo de respuesta:', error);
  }
};

