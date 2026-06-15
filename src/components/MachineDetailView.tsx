import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  History, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Gauge, 
  Cpu, 
  Eye, 
  Sparkles,
  RefreshCw,
  Power
} from 'lucide-react';
import { motion } from 'motion/react';

interface MachineDetailViewProps {
  darkMode: boolean;
}

export default function MachineDetailView({ darkMode }: MachineDetailViewProps) {
  const [isMachineRunning, setIsMachineRunning] = useState(true);
  const [laserHealth, setLaserHealth] = useState(74);
  const [servoHealth, setServoHealth] = useState(98);
  const [exhaustHealth, setExhaustHealth] = useState(92);
  const [simulatedPressure, setSimulatedPressure] = useState(1450);
  const [simulatedTemp, setSimulatedTemp] = useState(72.4);
  const [simulatedVoltage, setSimulatedVoltage] = useState(480.2);

  const [simulatedTime, setSimulatedTime] = useState('14:02:11');

  // Trigger real-time visual telemetry fluctuations
  useEffect(() => {
    if (!isMachineRunning) return;

    const interval = setInterval(() => {
      // fluctuation logic
      setSimulatedPressure(prev => Math.round(prev + (Math.random() * 30 - 15)));
      setSimulatedTemp(prev => parseFloat((prev + (Math.random() * 0.4 - 0.2)).toFixed(1)));
      setSimulatedVoltage(prev => parseFloat((prev + (Math.random() * 1.2 - 0.6)).toFixed(1)));

      const d = new Date();
      setSimulatedTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [isMachineRunning]);

  const handleCleanLaser = () => {
    alert('Initiating automated precision cleaning of optical lenses for Precision Laser (LS-004-W1)...');
    setLaserHealth(100);
  };

  const handleCalibrateAxis = () => {
    alert('Calibrating mechanical axis sensors and clearing physical offset parameters...');
    setServoHealth(100);
    setExhaustHealth(100);
  };

  return (
    <div className="space-y-6">
      
      {/* Breadcrumbs & Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ecedf7] dark:border-[#727785]/20 pb-5">
        <div className="space-y-1">
          <nav className="flex items-center gap-1.5 text-xs text-[#727785] font-semibold uppercase tracking-wider">
            <span>Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Production Lines</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#191b23] dark:text-white font-bold">Machine Detail</span>
          </nav>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-2xl font-extrabold text-[#191b23] dark:text-white">
              Robotic Welder W-102
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
              isMachineRunning 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isMachineRunning ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isMachineRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsMachineRunning(!isMachineRunning)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              isMachineRunning 
                ? 'border-red-200 text-[#ba1a1a] hover:bg-red-50 dark:border-red-950' 
                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-950'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isMachineRunning ? 'Stop Machine' : 'Start Machine'}</span>
          </button>

          <button 
            onClick={() => alert('Accessing historical maintenance records and raw operator logs...')}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#ecedf7] dark:border-[#727785]/20 hover:bg-[#e6e7f2] dark:hover:bg-[#2e3038] text-xs font-bold rounded-lg text-[#424754] dark:text-white transition-colors"
          >
            <History className="w-4 h-4 text-[#727785]" />
            <span>Maintenance Logs</span>
          </button>

          <button 
            onClick={handleCalibrateAxis}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0058be] hover:opacity-90 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-transform"
          >
            <Settings className="w-4 h-4" />
            <span>Calibrate Axis</span>
          </button>
        </div>
      </div>

      {/* Stats KPI top row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-[#2e3038] p-4 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold tracking-wider text-[#727785] uppercase">
            Active Program
          </p>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-xl font-bold text-[#0058be] dark:text-[#adc6ff]">WELD-X7</span>
            <span className="text-[11px] text-[#727785] font-semibold">v2.4.1</span>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-[#f2f3fd] dark:bg-[#191b23] rounded-full overflow-hidden">
              <div className="h-full bg-[#0058be] transition-all duration-300" style={{ width: isMachineRunning ? '65%' : '0%' }} />
            </div>
            <p className="text-[10px] text-[#727785] font-medium mt-1.5">{isMachineRunning ? '65% Step Completion' : 'Execution paused'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2e3038] p-4 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold tracking-wider text-[#727785] uppercase">
            Last Maintenance
          </p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-[#191b23] dark:text-white">12</span>
            <span className="text-xs text-[#727785] font-semibold">Days ago</span>
          </div>
          <p className="text-xs text-[#005ac2] dark:text-[#adc6ff] font-semibold mt-4 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Routine Check Passed</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#2e3038] p-4 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold tracking-wider text-[#727785] uppercase">
            Total Run Time
          </p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-[#191b23] dark:text-white">4,128</span>
            <span className="text-xs text-[#727785] font-semibold">Hours</span>
          </div>
          <p className="text-[11px] text-[#727785] font-medium mt-4 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-[#727785]" />
            <span>Uptime Efficiency: 98.2%</span>
          </p>
        </div>

        <div className="bg-white dark:bg-[#2e3038] p-4 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold tracking-wider text-[#727785] uppercase">
            Next Service Due
          </p>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-xl font-bold text-[#ba1a1a] dark:text-red-400">18</span>
            <span className="text-xs text-[#727785] font-semibold">Days</span>
          </div>
          <p className="text-[11px] text-[#727785] font-medium mt-4">
            Est: Sept 24, 2026
          </p>
        </div>

      </div>

      {/* Middle Telemetry stream card */}
      <section className="bg-white dark:bg-[#2e3038] p-6 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#ecedf7] dark:border-[#727785]/20 pb-4 mb-5">
          <div>
            <h3 className="font-bold text-sm text-[#191b23] dark:text-white">Real-time Telemetry</h3>
            <p className="text-xs text-[#727785]">Multi-sensor synchronized stream</p>
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-[#0058be]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0058be]" /> Pressure
            </span>
            <span className="flex items-center gap-1 text-[#924700]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#924700]" /> Temp
            </span>
            <span className="flex items-center gap-1 text-[#505f76]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#505f76] border border-[#ecedf7]" /> Voltage
            </span>
          </div>
        </div>

        <div className="h-[200px] w-full relative">
          {/* Custom SVG Grid & Multi-curves */}
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
            {/* Grid base lines */}
            <line x1="0" y1="40" x2="1000" y2="40" stroke="#ecedf7" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="0" y1="100" x2="1000" y2="100" stroke="#ecedf7" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="0" y1="160" x2="1000" y2="160" stroke="#ecedf7" strokeWidth="1" strokeOpacity="0.4" />

            {/* Pressure (Blue) */}
            <path 
              d="M0,100 L100,95 L200,105 L300,102 L400,92 L500,95 L620,100 L750,91 L880,103 L1000,100" 
              fill="none" 
              stroke="#0058be" 
              strokeWidth="2.5" 
              className="opacity-90"
            />

            {/* Temperature (Amber) */}
            <path 
              d="M0,140 L100,142 L200,138 L300,145 L400,130 L500,128 L620,122 L750,135 L880,141 L1000,140" 
              fill="none" 
              stroke="#924700" 
              strokeWidth="2.5" 
              className="opacity-90"
            />

            {/* Voltage (Gray) */}
            <path 
              d="M0,50 L100,48 L200,52 L300,50 L400,49 L500,51 L620,50 L750,52 L880,50 L1000,50" 
              fill="none" 
              stroke="#505f76" 
              strokeWidth="1.5" 
              strokeDasharray="6 3" 
              className="opacity-60"
            />
          </svg>

          {/* Glowing vertical slider cursor representation */}
          <div className="absolute top-0 bottom-0 left-2/3 border-l-2 border-dashed border-[#0058be] flex flex-col items-center">
            <span className="bg-[#0058be] text-white text-[9px] font-bold px-1.5 py-0.5 rounded -mt-2.5 shadow">
              {simulatedTime}
            </span>
          </div>
        </div>

        {/* Bottom indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-[#ecedf7] dark:border-[#727785]/20 pt-6">
          
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-[#f2f3fd] dark:bg-[#191b23] rounded-lg flex items-center justify-center text-[#0058be] shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Hydraulic Pressure</p>
              <p className="text-sm font-extrabold text-[#191b23] dark:text-white">
                {isMachineRunning ? simulatedPressure : '0'} PSI{' '}
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Stable</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-orange-50 dark:bg-orange-950/20 rounded-lg flex items-center justify-center text-[#924700] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Motor Temperature</p>
              <p className="text-sm font-extrabold text-[#191b23] dark:text-white">
                {isMachineRunning ? simulatedTemp : '0.0'} °C{' '}
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Rising</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-slate-50 dark:bg-[#191b23] rounded-lg flex items-center justify-center text-[#505f76] shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Voltage Stability</p>
              <p className="text-sm font-extrabold text-[#191b23] dark:text-white">
                {isMachineRunning ? simulatedVoltage : '0.0'} V{' '}
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Nominal</span>
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Component Health Diagnostics */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base text-[#191b23] dark:text-white">Component Health Inventory</h3>
          <p className="text-xs text-[#727785]">Last diagnostic scan: 2 mins ago</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Servo health */}
          <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-sm text-[#191b23] dark:text-white">Servo Axis A-1</h4>
                <p className="text-xs text-[#727785]">ID: SV-102-A1</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span>Functional Health</span>
                <span>{servoHealth}%</span>
              </div>
              <div className="h-2 w-full bg-[#f2f3fd] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${servoHealth}%` }} />
              </div>
            </div>
            <div className="mt-5 border-t border-[#ecedf7] dark:border-[#191b23] pt-3.5 flex justify-between items-center">
              <button 
                onClick={() => alert('Accessing core Servo logs and operational metrics...')}
                className="text-[11px] font-bold text-[#0058be] dark:text-[#adc6ff] hover:underline"
              >
                View Specs
              </button>
              <span className="text-xs font-bold text-[#727785] uppercase">OK</span>
            </div>
          </div>

          {/* Laser Health */}
          <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-sm text-[#191b23] dark:text-white">Precision Laser</h4>
                <p className="text-xs text-[#727785]">ID: LS-004-W1</p>
              </div>
              <AlertTriangle className={`w-5 h-5 ${laserHealth < 100 ? 'text-amber-500' : 'text-emerald-500'}`} />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span>Functional Health</span>
                <span>{laserHealth}%</span>
              </div>
              <div className="h-2 w-full bg-[#f2f3fd] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-[#b75b00] rounded-full" style={{ width: `${laserHealth}%` }} />
              </div>
            </div>
            <div className="mt-5 border-t border-[#ecedf7] dark:border-[#191b23] pt-3.5 flex justify-between items-center">
              <button 
                onClick={() => alert('Accessing precision sensor coordinates...')}
                className="text-[11px] font-bold text-[#0058be] dark:text-[#adc6ff] hover:underline"
              >
                View Logs
              </button>
              {laserHealth < 100 ? (
                <button 
                  onClick={handleCleanLaser}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded"
                >
                  CLEAN LENSES
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-600">CLEANED</span>
              )}
            </div>
          </div>

          {/* Exhaust fan */}
          <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-sm text-[#191b23] dark:text-white">Exhaust Module</h4>
                <p className="text-xs text-[#727785]">ID: EX-09</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span>Functional Health</span>
                <span>{exhaustHealth}%</span>
              </div>
              <div className="h-2 w-full bg-[#f2f3fd] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${exhaustHealth}%` }} />
              </div>
            </div>
            <div className="mt-5 border-t border-[#ecedf7] dark:border-[#191b23] pt-3.5 flex justify-between items-center">
              <button 
                onClick={() => alert('Accessing exhaust diagnostic and RPM data...')}
                className="text-[11px] font-bold text-[#0058be] dark:text-[#adc6ff] hover:underline"
              >
                View Specs
              </button>
              <span className="text-xs font-bold text-emerald-600">ACTIVE</span>
            </div>
          </div>

        </div>
      </section>

      {/* Floating Action Intent for Twin View */}
      <div className="fixed bottom-6 right-[300px] z-30">
        <button 
          onClick={() => alert('Launching immersive interactive 3D digital twin visualization engine in virtual workspace...')}
          className="flex items-center gap-2.5 bg-zinc-900 text-white dark:bg-[#ecedf7] dark:text-[#191b23] px-5 py-3 rounded-full hover:scale-105 active:scale-95 shadow-xl transition-all font-bold text-xs"
        >
          <Eye className="w-4 h-4" />
          <span>Enter Digital Twin View</span>
        </button>
      </div>

    </div>
  );
}
