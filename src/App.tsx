import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Menu, 
  Sun, 
  Moon, 
  X, 
  AlertTriangle, 
  Check, 
  Info, 
  Volume2, 
  VolumeX,
  Play,
  Search,
  SlidersHorizontal,
  Volume1,
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

// Imports from types and local files
import { Alert, Operator, ShiftAssignment, InspectionLog, AlertThresholds, MaintenanceEvent } from './types';
import { 
  INITIAL_ALERTS, 
  INITIAL_OPERATORS, 
  INITIAL_SHIFTS, 
  INITIAL_INSPECTIONS, 
  DEFAULT_THRESHOLDS 
} from './data';

const INITIAL_MAINTENANCE: MaintenanceEvent[] = [
  {
    id: 'maint-1',
    machineName: 'CNC ALPHA-1',
    machineCode: 'SV-102-A1',
    serviceType: 'Axis 3 Servomotor Realignment',
    status: 'Overdue',
    dueDate: '2026-06-12',
    technicianId: 'op-5', // Robert Brown
    priority: 'high',
    notes: 'vibration sensor feedback exceeded limits by 14% on last shift.'
  },
  {
    id: 'maint-2',
    machineName: 'PRESS DELTA-04',
    machineCode: 'PR-92',
    serviceType: 'Hydraulic Seal & Fluid Swap',
    status: 'In Progress',
    dueDate: '2026-06-16',
    technicianId: 'op-1', // Marcus Kane
    priority: 'medium',
    notes: 'Standard 500-hour system overhaul.'
  },
  {
    id: 'maint-3',
    machineName: 'Precision Laser',
    machineCode: 'LS-004-W1',
    serviceType: 'Lens Cleaning & Defocus Alignment',
    status: 'Scheduled',
    dueDate: '2026-06-18',
    priority: 'high',
    notes: 'Calibration checks display minor weld gap tolerance drifting.'
  },
  {
    id: 'maint-4',
    machineName: 'LATHE SIGMA-1',
    machineCode: 'LT-88',
    serviceType: 'Main Spindle Bearing Lubrication',
    status: 'Scheduled',
    dueDate: '2026-06-25',
    technicianId: 'op-3', // John Doe
    priority: 'low'
  },
  {
    id: 'maint-5',
    machineName: 'MILL GAMMA-2',
    machineCode: 'ML-02',
    serviceType: 'Coolant Pump Line Flush',
    status: 'Completed',
    dueDate: '2026-06-10',
    technicianId: 'op-5', // Robert Brown
    priority: 'low',
    notes: 'Completed coolant swap and filter replacement.'
  }
];


// Modular views imports
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import MachineDetailView from './components/MachineDetailView';
import DowntimeAnalyticsView from './components/DowntimeAnalyticsView';
import MaintenanceSchedulerView from './components/MaintenanceSchedulerView';
import ShiftPlanningView from './components/ShiftPlanningView';
import QualityReportsView from './components/QualityReportsView';
import SettingsView from './components/SettingsView';
import QuickTour from './components/QuickTour';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const getTelemetryDataForAlert = (alertId: string) => {
    switch (alertId) {
      case 'alt-1': // Servo Overheat
        return [
          { time: '-15m', value: 72, label: 'Temp' },
          { time: '-10m', value: 74, label: 'Temp' },
          { time: '-5m', value: 79, label: 'Temp' },
          { time: 'Trigger', value: 86, label: 'Temp' },
          { time: '+5m', value: 82, label: 'Temp' },
          { time: '+10m', value: 75, label: 'Temp' },
        ];
      case 'alt-2': // Pressure Dip
        return [
          { time: '-15m', value: 100, label: 'Pressure' },
          { time: '-10m', value: 99, label: 'Pressure' },
          { time: '-5m', value: 98, label: 'Pressure' },
          { time: 'Trigger', value: 91, label: 'Pressure' },
          { time: '+5m', value: 93, label: 'Pressure' },
          { time: '+10m', value: 95, label: 'Pressure' },
        ];
      case 'alt-3': // Line C started
        return [
          { time: '-15m', value: 45, label: 'OEE' },
          { time: '-10m', value: 65, label: 'OEE' },
          { time: '-5m', value: 80, label: 'OEE' },
          { time: 'Trigger', value: 88, label: 'OEE' },
          { time: '+5m', value: 90, label: 'OEE' },
          { time: '+10m', value: 92, label: 'OEE' },
        ];
      default: // Backup or some dynamically generated alerts during simulation
        return [
          { time: '-15m', value: 45, label: 'CPU' },
          { time: '-10m', value: 50, label: 'CPU' },
          { time: '-5m', value: 92, label: 'CPU' },
          { time: 'Trigger', value: 35, label: 'CPU' },
          { time: '+5m', value: 42, label: 'CPU' },
          { time: '+10m', value: 40, label: 'CPU' },
        ];
    }
  };

  // Auto-refresh and Onboarding Tour controls
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30);
  const [showTour, setShowTour] = useState<boolean>(false);
  
  // Shared state engines
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [operators, setOperators] = useState<Operator[]>(INITIAL_OPERATORS);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>(INITIAL_SHIFTS);
  const [inspections, setInspections] = useState<InspectionLog[]>(INITIAL_INSPECTIONS);
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>(INITIAL_MAINTENANCE);

  // Monitor maintenance events and trigger alerts for items within 48 hours of June 15, 2026
  useEffect(() => {
    const todayStr = '2026-06-15';
    const today = new Date(todayStr);
    const newAlerts: Alert[] = [];

    maintenanceEvents.forEach(evt => {
      if (evt.status === 'Completed') return;

      const dueDate = new Date(evt.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffHours = diffTime / (1000 * 60 * 60);

      // Pre-emptive alert triggers exactly 48 hours (or less) before maintenance is due
      if (diffHours >= -24 && diffHours <= 48) {
        const generatedId = `maint-warning-alt-${evt.id}`;
        const alreadyExists = alerts.some(a => a.id === generatedId);
        
        if (!alreadyExists) {
          const hoursLeftMsg = diffHours <= 0 ? 'overdue' : `due in ${Math.round(diffHours)} hours`;
          
          newAlerts.push({
            id: generatedId,
            type: 'warning',
            title: `Pre-Emptive: ${evt.machineName} Service`,
            message: `Equipment service [${evt.serviceType}] is scheduled on ${evt.dueDate} (${hoursLeftMsg} from current shift date June 15, 2026). Please verify assignments.`,
            time: '14:52',
            line: evt.machineName.includes('ALPHA-1') || evt.machineName.includes('Line A') ? 'Line A' : evt.machineName.includes('DELTA-04') || evt.machineName.includes('Line B') ? 'Line B' : 'Line C',
            acknowledged: false
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
    }
  }, [maintenanceEvents, alerts]);


  const [resettingAlertId, setResettingAlertId] = useState<string | null>(null);
  const [resetSuccessAlertId, setResetSuccessAlertId] = useState<string | null>(null);

  const handleRemoteReset = (id: string) => {
    setResettingAlertId(id);
    setResetSuccessAlertId(null);
    setTimeout(() => {
      setResettingAlertId(null);
      setResetSuccessAlertId(id);
      setTimeout(() => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true, message: `${a.message} (PLC register cleared remotely)` } : a));
        setResetSuccessAlertId(null);
      }, 1500);
    }, 1500);
  };

  // Sound indicators and simulation pauses
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Advanced Alert controls state
  const [criticalSoundTone, setCriticalSoundTone] = useState<number>(880);
  const [warningSoundTone, setWarningSoundTone] = useState<number>(440);
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);
  const [alertSortBy, setAlertSortBy] = useState<'newest' | 'oldest' | 'critical-first'>('newest');
  const [alertSearchQuery, setAlertSearchQuery] = useState<string>('');
  const [soundSettingsOpen, setSoundSettingsOpen] = useState<boolean>(false);

  // Helper to play selected tone with custom frequency
  const playTestTone = (freq: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime); 
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  // Sync dark mode class with root html element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Auto-launch tour on first-time login
  useEffect(() => {
    const completed = localStorage.getItem('quick_tour_completed');
    if (!completed) {
      setShowTour(true);
    }
  }, []);

  const triggerPeriodicDataUpdate = () => {
    const partPrefixes = ['CH', 'BD', 'PW', 'PX', 'GE', 'CN'];
    const suffixes = ['Z', 'Y', 'X', 'W'];
    const randomPrefix = partPrefixes[Math.floor(Math.random() * partPrefixes.length)];
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randomType = ['Weld Integrity', 'Paint Thickness', 'Surface Check', 'Seal Integrity', 'Structural Alignment'][Math.floor(Math.random() * 5)];
    const randomStatus = Math.random() > 0.15 ? 'PASS' : (Math.random() > 0.5 ? 'FAIL' : 'REWORK');
    const randomSeverity = randomStatus === 'PASS' ? 'N/A' : (Math.random() > 0.6 ? 'CRITICAL' : 'MINOR');
    const newPartId = `${randomPrefix}-${randomNum}-${randomSuffix}`;
    const d = new Date();
    const timestamp = d.toTimeString().split(' ')[0]; // HH:MM:SS

    const randomLine = ['Line A', 'Line B', 'Line C'][Math.floor(Math.random() * 3)];
    const baseCycle = randomLine === 'Line A' ? 45 : (randomLine === 'Line B' ? 50 : 40);
    const isDeviant = Math.random() < 0.25;
    const deviationPercent = isDeviant ? (0.22 + Math.random() * 0.15) : (Math.random() * 0.12);
    const sign = Math.random() > 0.5 ? 1 : -1;
    const cycleTime = Math.round(baseCycle * (1 + sign * deviationPercent));

    const newLog: InspectionLog = {
      id: `insp-auto-${Date.now()}`,
      timestamp,
      partId: newPartId,
      type: randomType,
      status: randomStatus as any,
      severity: randomSeverity as any,
      line: randomLine,
      cycleTime: cycleTime,
    };

    setInspections(prev => [newLog, ...prev.slice(0, 49)]);

    if (Math.random() < 0.25) {
      const errorCodes = [
        { title: 'Calibration Dev', msg: 'Slight thermal expansion drift detected on robotic arm axis W-102.', line: 'Line A' },
        { title: 'Conveyor Drag', msg: 'Slight friction drag torque over threshold warning on main assembly Line B.', line: 'Line B' },
        { title: 'Laser Alignment', msg: 'Laser optical scanner casing reported dusty lens reading. Calibration auto-corrected.', line: 'Line C' },
        { title: 'Nozzle Flow Rate', msg: 'Paint spray droplet volume nozzle pressure spikes detected. Auto-purge triggered.', line: 'Line B' }
      ];
      const selectedObj = errorCodes[Math.floor(Math.random() * errorCodes.length)];
      const newAlert: Alert = {
        id: `alt-auto-${Date.now()}`,
        type: 'warning',
        title: selectedObj.title,
        message: selectedObj.msg,
        line: selectedObj.line,
        time: d.toTimeString().split(' ')[0].substring(0, 5),
        acknowledged: false
      };
      setAlerts(prev => [newAlert, ...prev]);

      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(warningSoundTone, audioCtx.currentTime); 
          gain.gain.setValueAtTime(0.012, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.12);
        } catch (e) {}
      }
    }
  };

  // Periodic auto-refresh countdown
  useEffect(() => {
    if (!autoRefreshEnabled || isEmergencyActive) {
      setRefreshCountdown(30);
      return;
    }

    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          triggerPeriodicDataUpdate();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, isEmergencyActive, soundEnabled]);

  // Alert management functions
  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    if (soundEnabled) {
      try {
        // Play soft subtle native confirmation sound if possible
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } catch (e) {
        // Fallback for isolated system sandboxes
      }
    }
  };

  const handleClearAllAlerts = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    alert('All ongoing warning notifications have been marked acknowledged.');
  };

  const triggerEmergencyStop = () => {
    const status = !isEmergencyActive;
    setIsEmergencyActive(status);
    
    if (status) {
      // Append a core emergency alert
      const emergencyAlert: Alert = {
        id: `alt-emergency-${Date.now()}`,
        type: 'critical',
        title: 'EMERGENCY STOP TRIGGERED',
        message: 'Manual plant emergency central halt initiated by operator. All line flows are forced-stopped.',
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        acknowledged: false
      };
      setAlerts([emergencyAlert, ...alerts]);

      if (soundEnabled) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(criticalSoundTone, audioCtx.currentTime); 
          gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } catch (e) {}
      }

      alert('WARNING: manual emergency system freeze applied. Robotic nodes are deactivated and system indicators locked.');
    } else {
      alert('Standard plant operation resumed. Watch telemetry and clear pending status errors.');
    }
  };

  const unacknowledgedCriticalAlerts = alerts.filter(a => a.type === 'critical' && !a.acknowledged);

  return (
    <div className={`min-h-screen flex text-[#191b23] dark:text-zinc-50 bg-[#fbfbfe] dark:bg-[#13151a] transition-colors duration-200 font-sans`}>
      
      {/* 1. Left Fixed Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onEmergencyStop={triggerEmergencyStop}
        isEmergencyActive={isEmergencyActive}
        onStartTour={() => setShowTour(true)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 pl-[240px] flex flex-col min-h-screen">
        
        {/* Central Hub Global Header */}
        <header className="h-[70px] border-b border-[#ecedf7] dark:border-[#727785]/20 bg-white dark:bg-[#191b23] px-8 flex justify-between items-center z-10 sticky top-0 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <h2 className="text-[#191b23] dark:text-zinc-200 font-extrabold text-sm uppercase tracking-widest hidden md:block">
              {activeTab === 'dashboard' && 'Command Dashboard'}
              {activeTab === 'machines' && 'Production Line Detail'}
              {activeTab === 'analytics' && 'Downtime Forecasting'}
              {activeTab === 'maintenance' && 'Equipment Servicing Calendar'}
              {activeTab === 'shifts' && 'Staff Planning'}
              {activeTab === 'quality' && 'Quality & Defect Analysis'}
              {activeTab === 'settings' && 'System Parameters'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Auto-Refresh Toggle with Countdown */}
            <div id="tour-refresh" className="flex items-center gap-2 bg-[#f2f3fd] dark:bg-zinc-800/10 px-3 py-1.5 rounded-lg border border-[#ecedf7] dark:border-[#727785]/25 text-xs text-[#424754] dark:text-zinc-300">
              <span className="font-bold">Live Sync:</span>
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`relative w-8 h-[18px] flex items-center rounded-full transition-colors duration-300 ${autoRefreshEnabled ? 'bg-[#0058be]' : 'bg-[#727785]/40'}`}
                title={autoRefreshEnabled ? "Disable periodic 30s updates" : "Enable periodic 30s updates"}
              >
                <span className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${autoRefreshEnabled ? 'translate-x-[17px]' : 'translate-x-0.5'}`} />
              </button>
              {autoRefreshEnabled && (
                <span className="font-mono font-bold text-[#0058be] dark:text-blue-400 min-w-[20px] text-right">
                  {refreshCountdown}s
                </span>
              )}
            </div>

            {/* Quick Status Pill */}
            <div id="tour-status" className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#f2f3fd] dark:bg-zinc-800/50 rounded-lg border border-[#ecedf7] dark:border-zinc-700/30 text-xs">
              <span className={`w-2 h-2 rounded-full ${isEmergencyActive ? 'bg-[#ba1a1a] animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="font-bold text-[#424754] dark:text-zinc-300">
                {isEmergencyActive ? 'SYSTEM HALT' : 'PLANT STABLE'}
              </span>
            </div>

            {/* Sound Toggle */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 border border-[#ecedf7] dark:border-[#727785]/20 rounded-lg hover:bg-[#e6e7f2] dark:hover:bg-[#2e3038] text-[#727785] dark:text-zinc-300 transition-colors"
              title={soundEnabled ? 'Mute notification sound clicks' : 'Enable notification sound clicks'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>

            {/* Dark Mode toggle trigger */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-[#ecedf7] dark:border-[#727785]/20 rounded-lg hover:bg-[#e6e7f2] dark:hover:bg-[#2e3038] text-[#727785] dark:text-zinc-300 transition-colors overflow-hidden"
              title="Toggle Light / Dark mode"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={darkMode ? "dark" : "light"}
                  initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 180, scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "backOut" }}
                  className="flex items-center justify-center"
                >
                  {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Live alerts sliding panel trigger */}
            <button 
              id="tour-alerts"
              onClick={() => setIsAlertDrawerOpen(true)}
              className="p-2 border border-[#ecedf7] dark:border-[#727785]/20 rounded-lg hover:bg-[#e6e7f2] dark:hover:bg-[#2e3038] text-[#727785] dark:text-zinc-300 transition-colors relative"
              title="Open pending logs"
            >
              <Bell className="w-4 h-4" />
              {unacknowledgedCriticalAlerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#ba1a1a] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {unacknowledgedCriticalAlerts.length}
                </span>
              )}
            </button>

          </div>
        </header>

        {/* Core Screen Canvas Panel */}
        <main className="flex-1 p-8 overflow-y-auto max-w-[1400px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.995 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full h-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardView 
                  alerts={alerts} 
                  onAcknowledge={handleAcknowledgeAlert} 
                  onNavigateToMachine={() => setActiveTab('machines')}
                  isEmergencyActive={isEmergencyActive}
                  operators={operators}
                  shiftAssignments={shiftAssignments}
                />
              )}

              {activeTab === 'machines' && (
                <MachineDetailView darkMode={darkMode} />
              )}

              {activeTab === 'analytics' && (
                <DowntimeAnalyticsView />
              )}

              {activeTab === 'maintenance' && (
                <MaintenanceSchedulerView 
                  operators={operators} 
                  events={maintenanceEvents}
                  setEvents={setMaintenanceEvents}
                />
              )}

              {activeTab === 'shifts' && (
                <ShiftPlanningView 
                  operators={operators}
                  setOperators={setOperators}
                  shiftAssignments={shiftAssignments}
                  setShiftAssignments={setShiftAssignments}
                />
              )}

              {activeTab === 'quality' && (
                <QualityReportsView 
                  inspections={inspections}
                  setInspections={setInspections}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  operators={operators}
                  setOperators={setOperators}
                  thresholds={thresholds}
                  setThresholds={setThresholds}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* 3. Sliding Alert center drawer detail overlay */}
      <AnimatePresence>
        {isAlertDrawerOpen && (
          <>
            {/* Backdrop blur clickoff */}
            <div 
              onClick={() => setIsAlertDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Sliding Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-white dark:bg-[#191b23] border-l border-[#ecedf7] dark:border-[#727785]/20 p-5 shadow-2xl z-50 flex flex-col justify-between text-[#191b23] dark:text-white"
            >
              
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#ecedf7] dark:border-[#727785]/20 pb-4 mb-3 shrink-0">
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
                    <span>Industrial Alerts</span>
                  </h3>
                  <button 
                    onClick={() => setIsAlertDrawerOpen(false)}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Scrollable controls and alerts content */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                  
                  {/* RECHARTS ALERT FREQUENCY BAR CHART */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/85">
                    <div className="text-[10px] font-extrabold text-[#727785] dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex justify-between items-center flex-wrap gap-2">
                      <span className="flex items-center gap-1 flex-wrap">
                        <span>📊 Alert Frequency (Last 24h)</span>
                        {(() => {
                          const baseline = 5;
                          const currentTotal = alerts.length;
                          const change = ((currentTotal - baseline) / baseline) * 100;
                          const sign = change > 0 ? '+' : '';
                          const formattedChange = `${sign}${Math.round(change)}%`;
                          return (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              change > 0 
                                ? 'bg-red-500/10 text-[#ba1a1a] dark:text-red-400' 
                                : change < 0 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-zinc-100 text-[#727785] dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {formattedChange} {change > 0 ? '↑' : change < 0 ? '↓' : '→'} vs yesterday
                            </span>
                          );
                        })()}
                      </span>
                      <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">Distribution</span>
                    </div>
                    <div className="h-20 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            { name: 'Critical', count: alerts.filter(a => a.type === 'critical').length, color: '#ef4444' },
                            { name: 'Warning', count: alerts.filter(a => a.type === 'warning').length, color: '#f59e0b' },
                            { name: 'Info/Sys', count: alerts.filter(a => a.type === 'info' || a.type === 'system').length, color: '#3b82f6' }
                          ]} 
                          margin={{ top: 0, right: 10, left: -30, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(114,119,133,0.1)" />
                          <XAxis dataKey="name" tick={{ fill: '#727785', fontSize: 8, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} tick={{ fill: '#727785', fontSize: 8 }} tickLine={false} axisLine={false} />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ backgroundColor: '#191b23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 4px' }}
                            labelStyle={{ color: '#fff', fontSize: '8px', fontWeight: 'bold', margin: 0 }}
                            itemStyle={{ color: '#0058be', fontSize: '8px', fontWeight: 'bold', padding: 0 }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            <Cell fill="#ef4444" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#3b82f6" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* SOUND PROFILES CONFIGURATION SECTION */}
                  <div className="bg-[#f2f3fd]/50 dark:bg-zinc-800/10 border border-[#ecedf7] dark:border-zinc-700/25 rounded-xl p-2.5">
                    <button 
                      type="button"
                      onClick={() => setSoundSettingsOpen(!soundSettingsOpen)}
                      className="w-full flex justify-between items-center text-[10px] font-extrabold text-[#727785] dark:text-zinc-400 uppercase tracking-widest focus:outline-none"
                    >
                      <span className="flex items-center gap-1">🎵 Sound Profiles Settings</span>
                      <span className="text-[9px] font-mono">{soundSettingsOpen ? '▲ Hide' : '▼ Expand'}</span>
                    </button>
                    
                    {soundSettingsOpen && (
                      <div className="mt-2.5 space-y-2.5 pt-2.5 border-t border-[#ecedf7]/60 dark:border-zinc-700/25 animate-fadeIn">
                        {/* Critical Tone */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex justify-between">
                            <span>Critical Alarm Profile</span>
                            <span className="font-mono text-[#ba1a1a]">{criticalSoundTone} Hz</span>
                          </label>
                          <div className="flex gap-1.5">
                            <select
                              value={criticalSoundTone}
                              onChange={(e) => {
                                const freq = Number(e.target.value);
                                setCriticalSoundTone(freq);
                                playTestTone(freq);
                              }}
                              className="flex-1 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-700/40 rounded-lg p-1.5 text-xs font-bold text-[#191b23] dark:text-zinc-200"
                            >
                              <option value="880">🚨 High Siren (880 Hz)</option>
                              <option value="1200">⚡ Rapid Pulse (1200 Hz)</option>
                              <option value="660">🔊 Medium Horn (660 Hz)</option>
                              <option value="330">🔈 Deep Chime (330 Hz)</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => playTestTone(criticalSoundTone)}
                              className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-white font-extrabold flex items-center justify-center shrink-0 cursor-pointer"
                              title="Test Play"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                            </button>
                          </div>
                        </div>

                        {/* Warning Tone */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide flex justify-between">
                            <span>Warning Alarm Profile</span>
                            <span className="font-mono text-amber-500">{warningSoundTone} Hz</span>
                          </label>
                          <div className="flex gap-1.5">
                            <select
                              value={warningSoundTone}
                              onChange={(e) => {
                                const freq = Number(e.target.value);
                                setWarningSoundTone(freq);
                                playTestTone(freq);
                              }}
                              className="flex-1 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-700/40 rounded-lg p-1.5 text-xs font-bold text-[#191b23] dark:text-zinc-200"
                            >
                              <option value="440">🔔 Subtle Beep (440 Hz)</option>
                              <option value="580">🎶 System Chime (580 Hz)</option>
                              <option value="350">📡 Slow Signal (350 Hz)</option>
                              <option value="220">🔊 Low Hum (220 Hz)</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => playTestTone(warningSoundTone)}
                              className="p-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white font-extrabold flex items-center justify-center shrink-0 cursor-pointer"
                              title="Test Play"
                            >
                              <Play className="w-3.5 h-3.5 fill-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SEARCH BAR */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search alerts by title or message..."
                      value={alertSearchQuery}
                      onChange={(e) => setAlertSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-zinc-50 dark:bg-zinc-900 border border-[#ecedf7] dark:border-zinc-700/50 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0058be] text-[#191b23] dark:text-white"
                    />
                    {alertSearchQuery && (
                      <button 
                        onClick={() => setAlertSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold font-mono"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* FILTER SEVERITY & SORT DROPDOWNS */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="drawer-alert-filter" className="text-[9px] font-extrabold text-[#727785] dark:text-zinc-400 uppercase tracking-wider block mb-1">
                        Severity Filter
                      </label>
                      <select
                        id="drawer-alert-filter"
                        value={alertFilter}
                        onChange={(e) => setAlertFilter(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-[#ecedf7] dark:border-[#727785]/20 rounded-lg p-1.5 text-[10px] font-bold text-[#191b23] dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#0058be]"
                      >
                        <option value="all">⚠️ Show All</option>
                        <option value="critical">🚨 Critical Only</option>
                        <option value="warning">⚡ Warning Only</option>
                        <option value="info">ℹ️ Info Only</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="drawer-alert-sort" className="text-[9px] font-extrabold text-[#727785] dark:text-zinc-400 uppercase tracking-wider block mb-1">
                        Sort Priority
                      </label>
                      <select
                        id="drawer-alert-sort"
                        value={alertSortBy}
                        onChange={(e) => setAlertSortBy(e.target.value as any)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-[#ecedf7] dark:border-[#727785]/20 rounded-lg p-1.5 text-[10px] font-bold text-[#191b23] dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#0058be]"
                      >
                        <option value="newest">🕒 Newest First</option>
                        <option value="oldest">⏳ Oldest First</option>
                        <option value="critical-first">🔥 Critical First</option>
                      </select>
                    </div>
                  </div>

                  {/* BULK ACTION PANEL */}
                  {selectedAlertIds.length > 0 && (
                    <div className="bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-between gap-3 animate-pulse">
                      <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span>✓</span><span>{selectedAlertIds.length} select</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAlertIds([])}
                          className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-[#191b23] dark:text-zinc-200 text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg uppercase tracking-wide transition cursor-pointer"
                        >
                          Deselect
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAlerts(prev => prev.map(a => selectedAlertIds.includes(a.id) ? { ...a, acknowledged: true } : a));
                            setSelectedAlertIds([]);
                            alert(`Bulk marked ${selectedAlertIds.length} alerts as Acknowledged.`);
                          }}
                          className="bg-[#0058be] hover:bg-opacity-95 text-white text-[9px] font-extrabold px-3 py-1.5 rounded-lg uppercase tracking-wide shadow transition cursor-pointer"
                        >
                          Clear Selected
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Alerts List rendering */}
                  {(() => {
                    // Filter alerts
                    const filteredAlerts = alerts.filter((item) => {
                      if (alertFilter === 'critical' && item.type !== 'critical') return false;
                      if (alertFilter === 'warning' && item.type !== 'warning') return false;
                      if (alertFilter === 'info' && item.type !== 'info' && item.type !== 'system') return false;
                      
                      if (alertSearchQuery.trim() !== '') {
                        const q = alertSearchQuery.toLowerCase();
                        const titleMatch = (item.title || '').toLowerCase().includes(q);
                        const msgMatch = (item.message || '').toLowerCase().includes(q);
                        if (!titleMatch && !msgMatch) return false;
                      }
                      return true;
                    });

                    // Sort alerts
                    const sortedAlerts = [...filteredAlerts].sort((a, b) => {
                      if (alertSortBy === 'critical-first') {
                        if (a.type === 'critical' && b.type !== 'critical') return -1;
                        if (a.type !== 'critical' && b.type === 'critical') return 1;
                      }
                      const parseTime = (t: string) => {
                        const parts = (t || '').split(':').map(Number);
                        return parts[0] * 60 + (parts[1] || 0);
                      };
                      const diff = parseTime(b.time) - parseTime(a.time);
                      return alertSortBy === 'oldest' ? -diff : diff;
                    });

                    return (
                      <div className="space-y-2.5">
                        <AnimatePresence mode="popLayout">
                          {sortedAlerts.map((item) => {
                            const isSelected = selectedAlertIds.includes(item.id);
                            return (
                              <motion.div 
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ 
                                  layout: { type: "spring", stiffness: 300, damping: 28 },
                                  opacity: { duration: 0.18 },
                                  y: { duration: 0.18 }
                                }}
                                uid-target={`alert-item-${item.id}`}
                                onClick={() => setExpandedAlertId(prev => prev === item.id ? null : item.id)}
                                className={`p-3 border rounded-xl flex flex-col justify-between transition-all cursor-pointer hover:border-zinc-350 dark:hover:border-zinc-700 ${
                                  item.acknowledged 
                                    ? 'border-[#ecedf7] bg-zinc-50/40 opacity-60 dark:border-zinc-800 dark:bg-black/10' 
                                    : item.type === 'critical'
                                    ? 'border-red-200 bg-red-50/10 dark:border-red-950/40'
                                    : 'border-amber-200 bg-amber-50/10 dark:border-amber-950/20'
                                }`}
                              >
                                <div className="flex gap-2.5 items-start">
                                  {/* Checkbox component */}
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSelected) {
                                        setSelectedAlertIds(prev => prev.filter(id => id !== item.id));
                                      } else {
                                        setSelectedAlertIds(prev => [...prev, item.id]);
                                      }
                                    }}
                                    className="flex items-center justify-center shrink-0 pr-0.5 pt-1 cursor-pointer"
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}} // dummy call, outer parent is onClick handler
                                      className="w-3.5 h-3.5 accent-[#0058be] rounded border-zinc-300 dark:border-zinc-700 cursor-pointer"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-1 p-0">
                                      <div className="flex gap-1.5 items-center">
                                        {item.type === 'critical' ? (
                                          <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                                        ) : (
                                          <Info className="w-4 h-4 text-[#0058be] shrink-0" />
                                        )}
                                        <h4 className="text-xs font-bold leading-tight truncate text-[#191b23] dark:text-zinc-105">{item.title}</h4>
                                      </div>
                                      <span className="text-[9px] font-bold text-[#727785] font-mono shrink-0">{item.time}</span>
                                    </div>

                                    <p className="text-[11px] text-[#727785] dark:text-zinc-400 font-semibold mt-1 leading-normal">
                                      {item.message}
                                    </p>

                                    <div className="mt-1 flex justify-end">
                                      <span className="text-[8px] uppercase px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded font-extrabold font-mono shrink-0">
                                        {expandedAlertId === item.id ? 'Hide registers ▴' : 'Show registers ▾'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded Telemetry Graph */}
                                {expandedAlertId === item.id && (
                                  <div 
                                    className="mt-3 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-800"
                                    onClick={(e) => e.stopPropagation()} // Prevent closing on graph interaction
                                  >
                                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1.5">
                                      📟 PLC register snapshot around trigger
                                    </span>
                                    <div className="h-28 w-full bg-zinc-50 dark:bg-zinc-900/35 p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={getTelemetryDataForAlert(item.id)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                          <defs>
                                            <linearGradient id={`colorValue-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="5%" stopColor={item.type === 'critical' ? '#ef4444' : '#f59e0b'} stopOpacity={0.35}/>
                                              <stop offset="95%" stopColor={item.type === 'critical' ? '#ef4444' : '#f59e0b'} stopOpacity={0.05}/>
                                            </linearGradient>
                                          </defs>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(114,119,133,0.1)" />
                                          <XAxis dataKey="time" tick={{ fill: '#727785', fontSize: 8, fontWeight: 'bold' }} tickLine={false} axisLine={false} />
                                          <YAxis minTickGap={2} unit={item.id === 'alt-1' ? '°C' : item.id === 'alt-2' ? ' PSI' : '%'} tick={{ fill: '#727785', fontSize: 8 }} tickLine={false} axisLine={false} />
                                          <Tooltip 
                                            contentStyle={{ backgroundColor: '#191b23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '3px 6px' }}
                                            labelStyle={{ color: '#fff', fontSize: '8px', fontWeight: 'bold', margin:0 }}
                                            itemStyle={{ color: '#0058be', fontSize: '8px', fontWeight: 'bold', padding:0 }}
                                          />
                                          <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke={item.type === 'critical' ? '#ef4444' : '#f59e0b'} 
                                            strokeWidth={1.5} 
                                            fillOpacity={1} 
                                            fill={`url(#colorValue-${item.id})`} 
                                          />
                                        </AreaChart>
                                      </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-[8px] font-extrabold text-zinc-500 uppercase">
                                      <span>Metric Tracked: {getTelemetryDataForAlert(item.id)[0]?.label || 'value'}</span>
                                      <span className={item.type === 'critical' ? 'text-red-500 font-bold' : 'text-amber-500 font-bold'}>
                                        {item.id === 'alt-1' ? 'Threshold: 85°C' : item.id === 'alt-2' ? 'Limit Deviation: 5%' : 'Optimal'}
                                      </span>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-between items-center mt-3 border-t border-[#ecedf7] dark:border-[#727785]/20 pt-2 text-[10px] font-bold">
                                  {item.line ? (
                                    <span className="text-[#727785] uppercase bg-[#f2f3fd] dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[9px]">
                                      {item.line}
                                    </span>
                                  ) : (
                                    <span className="text-[#727785] text-[9px] uppercase">SYSTEM</span>
                                  )}

                                  <div className="flex items-center gap-2">
                                    {item.type === 'warning' && !item.acknowledged && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoteReset(item.id);
                                        }}
                                        disabled={resettingAlertId === item.id || resetSuccessAlertId === item.id}
                                        className={`text-[9px] font-extrabold px-2.5 py-1 rounded cursor-pointer uppercase tracking-wider transition-all ${
                                          resetSuccessAlertId === item.id
                                            ? 'bg-emerald-600 text-white'
                                            : resettingAlertId === item.id
                                            ? 'bg-amber-500 text-white animate-pulse'
                                            : 'bg-zinc-800 text-zinc-100 dark:bg-zinc-700 hover:bg-zinc-650'
                                        }`}
                                      >
                                        {resetSuccessAlertId === item.id ? (
                                          '✓ Reset Ok'
                                        ) : resettingAlertId === item.id ? (
                                          '🔄 Resetting...'
                                        ) : (
                                          '⚡ Remote Reset'
                                        )}
                                      </button>
                                    )}

                                    {!item.acknowledged ? (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation(); // Avoid triggering details toggle when acknowledging
                                          handleAcknowledgeAlert(item.id);
                                        }}
                                        className="bg-[#0058be] hover:opacity-90 text-white font-extrabold px-2.5 py-1 text-[9px] rounded cursor-pointer animate-fadeIn"
                                      >
                                        ACKNOWLEDGE
                                      </button>
                                    ) : (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-0.5 text-[9px]">
                                        <Check className="w-3.5 h-3.5" /> ACKED
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        {sortedAlerts.length === 0 && (
                          <div className="text-center py-8 text-xs font-bold text-[#727785] bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-[#ecedf7] dark:border-zinc-800/80">
                            No matching alerts of this severity tier.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              </div>

              {/* Bottom bulk acknowledge */}
              <button 
                onClick={handleClearAllAlerts}
                className="w-full bg-[#0058be] hover:opacity-90 py-2.5 rounded-lg text-xs font-bold text-white shadow shrink-0 mt-3 cursor-pointer"
              >
                Acknowledge All Alerts
              </button>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showTour && (
        <QuickTour 
          onClose={() => setShowTour(false)} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      )}

      {/* Top-Right Persistent Toast Notification Stack with framer-motion */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3.5 max-w-xs sm:max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {alerts.filter(a => a.type === 'critical' && !a.acknowledged).map((toast) => (
            <motion.div 
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
              className="bg-red-500 dark:bg-red-650 text-white rounded-xl shadow-2xl p-4 border border-white/20 flex flex-col gap-2.5 cursor-pointer pointer-events-auto h-auto relative overflow-hidden"
              onClick={() => handleAcknowledgeAlert(toast.id)}
            >
              <div className="absolute right-1.5 top-1.5 bg-white/10 hover:bg-white/20 p-1 rounded-full text-white/90 transition" title="Acknowledge">
                <X className="w-3.5 h-3.5" />
              </div>
              
              <div className="flex gap-2.5 items-start pr-6">
                <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-[9px] tracking-widest uppercase text-white/80">Critical System Alarm</h4>
                  <h5 className="font-extrabold text-sm mt-0.5 leading-tight">{toast.title}</h5>
                  <p className="text-xs text-white/90 mt-1 leading-normal font-medium">{toast.message}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-[9px] font-extrabold bg-black/15 px-2.5 py-1.5 rounded uppercase tracking-wider">
                <span>{toast.line || 'System'} • {toast.time}</span>
                <span className="underline hover:no-underline flex items-center gap-0.5 shrink-0">
                  Click to Acknowledge
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
