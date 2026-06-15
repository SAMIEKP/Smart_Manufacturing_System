export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'system';
  title: string;
  message: string;
  time: string;
  line?: string;
  acknowledged: boolean;
}

export interface Operator {
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
}

export interface ShiftAssignment {
  id: string;
  line: string;
  day: string;
  operatorId: string;
}

export interface InspectionLog {
  id: string;
  timestamp: string;
  partId: string;
  type: string;
  status: 'PASS' | 'FAIL' | 'REWORK';
  severity: 'N/A' | 'MINOR' | 'CRITICAL';
  line?: string;
  cycleTime?: number;
}

export interface MachineHealth {
  id: string;
  name: string;
  code: string;
  health: number;
  status: 'OK' | 'CLEANING REQ.' | 'ACTIVE' | 'DOWN';
  type: 'servo' | 'sensor' | 'exhaust' | 'other';
}

export interface AlertThresholds {
  criticalTemp: number;
  vibrationTolerance: number;
}

export interface MaintenanceEvent {
  id: string;
  machineName: string;
  machineCode: string;
  serviceType: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
  dueDate: string; // "YYYY-MM-DD" e.g., "2026-06-18"
  technicianId?: string; // Operator ID
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

