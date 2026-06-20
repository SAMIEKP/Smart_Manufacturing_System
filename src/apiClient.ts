export const API_BASE_URL = 'http://127.0.0.1:5001';

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

export async function apiPut<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
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

export async function fetchInspections(): Promise<any[]> {
  return apiGet<any[]>('/api/inspections');
}

export async function fetchMaintenance(): Promise<any[]> {
  return apiGet<any[]>('/api/maintenance');
}

export async function fetchShiftAssignments(): Promise<any[]> {
  return apiGet<any[]>('/api/shift-assignments');
}

export async function fetchThresholds(): Promise<AlertThresholds> {
  return apiGet<AlertThresholds>('/api/thresholds');
}

export async function updateThresholds(thresholds: AlertThresholds): Promise<{ ok: boolean }> {
  return apiPost('/api/thresholds', thresholds);
}

export async function createOperator(operator: ApiOperator): Promise<{ ok: boolean }> {
  return apiPost('/api/operators', operator);
}

export async function updateOperator(id: string, payload: Partial<ApiOperator>): Promise<{ ok: boolean }> {
  return apiPut(`/api/operators/${id}`, payload);
}

export async function deleteOperator(id: string): Promise<{ ok: boolean }> {
  return apiDelete(`/api/operators/${id}`);
}

export async function createInspection(log: {
  id: string;
  timestamp: string;
  partId: string;
  type: string;
  status: 'PASS' | 'FAIL' | 'REWORK';
  severity: 'N/A' | 'MINOR' | 'CRITICAL';
  line?: string;
  cycleTime?: number;
}): Promise<{ ok: boolean }> {
  return apiPost('/api/inspections', log);
}

export async function createMaintenance(event: {
  id: string;
  machineName: string;
  machineCode: string;
  serviceType: string;
  status: string;
  dueDate: string;
  technicianId?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}): Promise<{ ok: boolean }> {
  return apiPost('/api/maintenance', event);
}

export async function updateMaintenance(id: string, payload: Partial<{ machineName: string; machineCode: string; serviceType: string; status: string; dueDate: string; technicianId?: string; notes?: string; priority: 'low' | 'medium' | 'high' }>): Promise<{ ok: boolean }> {
  return apiPut(`/api/maintenance/${id}`, payload);
}

export async function deleteMaintenance(id: string): Promise<{ ok: boolean }> {
  return apiDelete(`/api/maintenance/${id}`);
}

export async function createShiftAssignment(assignment: {
  id: string;
  line: string;
  day: string;
  operatorId: string;
}): Promise<{ ok: boolean }> {
  return apiPost('/api/shift-assignments', assignment);
}

export async function deleteShiftAssignment(id: string): Promise<{ ok: boolean }> {
  return apiDelete(`/api/shift-assignments/${id}`);
}

