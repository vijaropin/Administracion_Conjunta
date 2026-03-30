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

export async function registrarBackendPago(params: {
  pagoId: string;
  metodoPago: string;
  comprobanteUrl?: string;
  fechaPago: string;
}): Promise<void> {
  const headers = await getAuthHeaders();
  const url = `${getBackendBaseUrl()}/api/v1/pagos/${params.pagoId}/registrar-manual`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      metodoPago: params.metodoPago,
      comprobanteUrl: params.comprobanteUrl ?? '',
      fechaPago: params.fechaPago,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Backend request failed with status ${response.status}`);
  }
}

export async function exportarBackendPagos(params: {
  formato: 'excel' | 'pdf';
  estado?: string;
}): Promise<void> {
  const headers = await getAuthHeaders();
  const url = new URL(`${getBackendBaseUrl()}/api/v1/pagos/exportar`);
  url.searchParams.set('formato', params.formato);
  if (params.estado && params.estado !== 'todos') {
    url.searchParams.set('estado', params.estado);
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`Failed to export file. Status: ${response.status}`);
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  
  // Try to extract filename from content-disposition header if present
  const disposition = response.headers.get('content-disposition');
  let filename = `pagos_${new Date().toISOString().slice(0, 10)}.${params.formato === 'excel' ? 'xlsx' : 'pdf'}`;
  
  if (disposition && disposition.indexOf('filename=') !== -1) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '');
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}

export async function crearBackendCajaMenor(params: {
  montoAprobado: number;
  fechaAprobacion: string;
  observaciones?: string;
}): Promise<string> {
  const headers = await getAuthHeaders();
  const url = `${getBackendBaseUrl()}/api/v1/cajas/`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Backend request failed with status ${response.status}`);
  }
  const result = await response.json();
  return result.id;
}

export async function cerrarBackendCajaMenor(cajaId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const url = `${getBackendBaseUrl()}/api/v1/cajas/${cajaId}/cerrar`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Backend request failed with status ${response.status}`);
  }
}

export async function crearBackendGastoCajaMenor(params: {
  cajaId: string;
  concepto: string;
  valor: number;
  fechaGasto: string;
  soporteNombre?: string;
  soporteUrl?: string;
}): Promise<string> {
  const headers = await getAuthHeaders();
  const url = `${getBackendBaseUrl()}/api/v1/cajas/${params.cajaId}/gastos`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      concepto: params.concepto,
      valor: params.valor,
      fechaGasto: params.fechaGasto,
      soporteNombre: params.soporteNombre,
      soporteUrl: params.soporteUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `Backend request failed with status ${response.status}`);
  }
  const result = await response.json();
  return result.id;
}

