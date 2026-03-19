import { auth } from '@/config/firebase';
import type { Pago } from '@/types';

interface BackendPagosResponse {
  total: number;
  items: Pago[];
}

const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export function getBackendBaseUrl(): string {
  return (import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/$/, '');
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated Firebase user available');
  }

  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchBackendPagos(params?: {
  residenteId?: string;
  unidadId?: string;
  estado?: string;
  limit?: number;
}): Promise<Pago[]> {
  const headers = await getAuthHeaders();
  const url = new URL(`${getBackendBaseUrl()}/api/v1/pagos`);

  if (params?.residenteId) url.searchParams.set('residenteId', params.residenteId);
  if (params?.unidadId) url.searchParams.set('unidadId', params.unidadId);
  if (params?.estado) url.searchParams.set('estado', params.estado);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`);
  }

  const data = (await response.json()) as BackendPagosResponse;
  return data.items ?? [];
}

export async function generarBackendPagos(params: {
  mes: number;
  anio: number;
  permitirFuturo?: boolean;
}): Promise<{ creados: number; omitidosDuplicado: number }> {
  const headers = await getAuthHeaders();
  const url = `${getBackendBaseUrl()}/api/v1/pagos/generar`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      mes: params.mes,
      anio: params.anio,
      permitirFuturo: params.permitirFuturo ?? false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { creados: number; omitidos_duplicado: number };
  return {
    creados: data.creados ?? 0,
    omitidosDuplicado: data.omitidos_duplicado ?? 0,
  };
}
