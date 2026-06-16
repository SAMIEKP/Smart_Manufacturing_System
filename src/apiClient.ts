export const API_BASE_URL = 'http://127.0.0.1:5000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${txt}`);
  }
  return (await res.json()) as T;
}

export type ApiAlert = {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'system';
  title: string;
  message: string;
  time: string;
  line?: string;
  acknowledged: boolean;
};

export type ApiOperator = {
  id: string;
  name: string;
  role: string;
  email: string;
  lastShift: string;
  status: 'active' | 'offline';
  initials: string;
  level?: string;
  tags?: string[];
  expertise?: Record<string, 'None' | 'Beginner' | 'Intermediate' | 'Expert'>;
};

export type AlertThresholds = {
  criticalTemp: number;
  vibrationTolerance: number;
};

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function fetchAlerts(): Promise<ApiAlert[]> {
  return apiGet<ApiAlert[]>('/api/alerts');
}

export async function ackAlerts(ids: string[]): Promise<{ ok: boolean; acknowledged: number }> {
  return apiPost('/api/alerts/ack', { ids });
}

export async function bulkAckAllWarningCriticalAlerts(ids: string[]): Promise<{ ok: boolean; acknowledged: number }> {
  return ackAlerts(ids);
}

export async function fetchOperators(): Promise<ApiOperator[]> {
  return apiGet<ApiOperator[]>('/api/operators');
}

export async function fetchThresholds(): Promise<AlertThresholds> {
  return apiGet<AlertThresholds>('/api/thresholds');
}

export async function updateThresholds(thresholds: AlertThresholds): Promise<{ ok: boolean }> {
  return apiPost('/api/thresholds', thresholds);
}

