import { Alert, Operator, ShiftAssignment, InspectionLog, MachineHealth, AlertThresholds } from './types';

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alt-1',
    type: 'critical',
    title: 'W-102: Servo Overheat',
    message: 'Primary axis motor exceeding 85°C. Cooling systems activated.',
    time: '14:32',
    line: 'Line A',
    acknowledged: false
  },
  {
    id: 'alt-2',
    type: 'warning',
    title: 'Pressure Dip - Line B',
    message: 'Hydraulic pump 4 showing 5% deviation from nominal.',
    time: '14:28',
    line: 'Line B',
    acknowledged: false
  },
  {
    id: 'alt-3',
    type: 'info',
    title: 'Line C - Shift Started',
    message: 'Team Blue checked in. Target: 4,200 units.',
    time: '14:15',
    line: 'Line C',
    acknowledged: false
  },
  {
    id: 'alt-4',
    type: 'system',
    title: 'Backup Complete',
    message: 'Daily controller logs and cloud sync compiled successfully.',
    time: '13:30',
    acknowledged: true
  }
];

export const INITIAL_OPERATORS: Operator[] = [
  {
    id: 'op-1',
    name: 'Marcus Kane',
    role: 'Senior Engineer',
    email: 'm.kane@titanops.com',
    lastShift: 'Today, 06:30',
    status: 'active',
    initials: 'MK',
    level: 'Lvl 3 Specialist',
    tags: ['Line A', 'Safety+'],
    expertise: { 'CNC ALPHA-1': 'Expert', 'PRESS DELTA-04': 'Intermediate', 'LATHE SIGMA-1': 'Beginner', 'MILL GAMMA-2': 'Expert' }
  },
  {
    id: 'op-2',
    name: 'Sarah Rossi',
    role: 'Shift Lead',
    email: 's.rossi@titanops.com',
    lastShift: 'Yesterday, 14:00',
    status: 'offline',
    initials: 'SR',
    level: 'QC Lead',
    tags: ['Line B', 'ISO 9001'],
    expertise: { 'CNC ALPHA-1': 'Beginner', 'PRESS DELTA-04': 'Expert', 'LATHE SIGMA-1': 'Intermediate', 'MILL GAMMA-2': 'None' }
  },
  {
    id: 'op-3',
    name: 'John Doe',
    role: 'Specialist',
    email: 'j.doe@autofab.com',
    lastShift: 'Today, 08:00',
    status: 'active',
    initials: 'JD',
    level: 'Lvl 3 Specialist',
    tags: ['Line A', 'Safety+'],
    expertise: { 'CNC ALPHA-1': 'Expert', 'PRESS DELTA-04': 'None', 'LATHE SIGMA-1': 'Expert', 'MILL GAMMA-2': 'Beginner' }
  },
  {
    id: 'op-4',
    name: 'Sarah Miller',
    role: 'QC Supervisor',
    email: 's.miller@autofab.com',
    lastShift: 'Today, 08:00',
    status: 'active',
    initials: 'SM',
    level: 'QC Supervisor',
    tags: ['Line B', 'ISO 9001'],
    expertise: { 'CNC ALPHA-1': 'None', 'PRESS DELTA-04': 'Expert', 'LATHE SIGMA-1': 'None', 'MILL GAMMA-2': 'Expert' }
  },
  {
    id: 'op-5',
    name: 'Robert Brown',
    role: 'Maintenance Specialist',
    email: 'r.brown@autofab.com',
    lastShift: 'On Break',
    status: 'offline',
    initials: 'RB',
    level: 'Maintenance',
    tags: ['On Break'],
    expertise: { 'CNC ALPHA-1': 'Beginner', 'PRESS DELTA-04': 'Beginner', 'LATHE SIGMA-1': 'Intermediate', 'MILL GAMMA-2': 'Intermediate' }
  },
  {
    id: 'op-6',
    name: 'Anna Kowalski',
    role: 'Line C Lead',
    email: 'a.kowalski@autofab.com',
    lastShift: 'Yesterday, 14:00',
    status: 'active',
    initials: 'AK',
    level: 'Line C Lead',
    tags: ['Automation'],
    expertise: { 'CNC ALPHA-1': 'None', 'PRESS DELTA-04': 'None', 'LATHE SIGMA-1': 'Expert', 'MILL GAMMA-2': 'Expert' }
  }
];

export const INITIAL_SHIFTS: ShiftAssignment[] = [
  { id: 'sa-1', line: 'Line A', day: 'MON 23', operatorId: 'op-3' }, // J. Doe
  { id: 'sa-2', line: 'Line A', day: 'MON 23', operatorId: 'op-4' }, // S. Miller
  { id: 'sa-3', line: 'Line B', day: 'TUE 24', operatorId: 'op-1' }, // M. Kane
  { id: 'sa-4', line: 'Line C', day: 'MON 23', operatorId: 'op-6' }  // A. Kowalski
];

export const INITIAL_INSPECTIONS: InspectionLog[] = [
  {
    id: 'insp-1',
    timestamp: '14:32:05',
    partId: 'CH-9942-X',
    type: 'Weld Integrity',
    status: 'PASS',
    severity: 'N/A',
    line: 'Line A',
    cycleTime: 45
  },
  {
    id: 'insp-2',
    timestamp: '14:30:12',
    partId: 'PT-4421-B',
    type: 'Paint Thickness',
    status: 'FAIL',
    severity: 'CRITICAL',
    line: 'Line B',
    cycleTime: 52
  },
  {
    id: 'insp-3',
    timestamp: '14:28:45',
    partId: 'CH-9941-X',
    type: 'Weld Integrity',
    status: 'PASS',
    severity: 'N/A',
    line: 'Line A',
    cycleTime: 44
  },
  {
    id: 'insp-4',
    timestamp: '14:25:33',
    partId: 'CH-9940-X',
    type: 'Surface Check',
    status: 'REWORK',
    severity: 'MINOR',
    line: 'Line C',
    cycleTime: 41
  },
  {
    id: 'insp-5',
    timestamp: '14:20:10',
    partId: 'CH-9939-X',
    type: 'Weld Integrity',
    status: 'PASS',
    severity: 'N/A',
    line: 'Line A',
    cycleTime: 58 // Deviant: avg Line A is ~46.2s, 58 is +25% deviation
  },
  {
    id: 'insp-6',
    timestamp: '14:15:22',
    partId: 'PT-4420-B',
    type: 'Paint Thickness',
    status: 'REWORK',
    severity: 'MINOR',
    line: 'Line B',
    cycleTime: 35 // Deviant: avg Line B is ~48.7s, 35 is -28% deviation
  },
  {
    id: 'insp-7',
    timestamp: '14:10:04',
    partId: 'LN-2210-C',
    type: 'Seal Integrity',
    status: 'PASS',
    severity: 'N/A',
    line: 'Line C',
    cycleTime: 54 // Deviant: avg Line C is ~45s, 54 is +20% deviation
  }
];

export const MACHINE_HEALTHS: MachineHealth[] = [
  {
    id: 'mh-1',
    name: 'Servo Axis A-1',
    code: 'SV-102-A1',
    health: 98,
    status: 'OK',
    type: 'servo'
  },
  {
    id: 'mh-2',
    name: 'Precision Laser',
    code: 'LS-004-W1',
    health: 74,
    status: 'CLEANING REQ.',
    type: 'sensor'
  },
  {
    id: 'mh-3',
    name: 'Exhaust Module',
    code: 'EX-09',
    health: 92,
    status: 'ACTIVE',
    type: 'exhaust'
  }
];

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  criticalTemp: 85,
  vibrationTolerance: 2.4
};
