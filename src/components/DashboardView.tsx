import React, { useState } from 'react';
import { 
  TrendingUp, 
  ArrowDown, 
  Percent, 
  CheckCircle2, 
  MoreVertical, 
  Sliders, 
  Activity, 
  AlertTriangle, 
  Info,
  Flame,
  Award,
  Clock,
  Gauge,
  Zap,
  CheckCircle,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Operator, ShiftAssignment } from '../types';

interface DashboardViewProps {
  alerts: any[];
  onAcknowledge: (id: string) => void;
  onNavigateToMachine: () => void;
  isEmergencyActive: boolean;
  operators: Operator[];
  shiftAssignments: ShiftAssignment[];
}

export default function DashboardView({ 
  alerts, 
  onAcknowledge, 
  onNavigateToMachine, 
  isEmergencyActive,
  operators = [],
  shiftAssignments = []
}: DashboardViewProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-06-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-06-15');
  const [showTrendChart, setShowTrendChart] = useState<boolean>(false);
  const [showOeeTrendModal, setShowOeeTrendModal] = useState<boolean>(false);

  const [handoverNotes, setHandoverNotes] = useState<string>(() => {
    return localStorage.getItem('shift_handover_notes') || '';
  });
  const [saveNotesSuccess, setSaveNotesSuccess] = useState<boolean>(false);

  const handleSaveHandoverNotes = () => {
    localStorage.setItem('shift_handover_notes', handoverNotes);
    setSaveNotesSuccess(true);
    setTimeout(() => setSaveNotesSuccess(false), 3000);
  };

  // Shift Summary Calculations based on Scheduled Operators & Expertise
  const getLineProductionFactor = (lineName: string, primaryMachine: string) => {
    if (isEmergencyActive) return 0;
    
    const assigned = shiftAssignments.filter(sa => sa.line === lineName);
    if (assigned.length === 0) return 0.20; // fallback standard run-rate when unstaffed

    const multipliers: Record<string, number> = { 'Expert': 1.15, 'Intermediate': 0.95, 'Beginner': 0.75, 'None': 0.45 };
    let sumMultiplier = 0;

    assigned.forEach(sa => {
      const op = operators.find(o => o.id === sa.operatorId);
      const lvl = op?.expertise?.[primaryMachine] || 'None';
      sumMultiplier += multipliers[lvl];
    });

    const averageMultiplier = sumMultiplier / assigned.length;
    const personnelFactor = Math.min(assigned.length, 2) * 0.35 + 0.65;
    return averageMultiplier * personnelFactor;
  };

  // Line A
  const factorA = getLineProductionFactor('Line A', 'CNC ALPHA-1');
  const targetA = 4200;
  const producedA = isEmergencyActive ? 0 : Math.round(targetA * Math.min(factorA, 1.15));
  const progressPercentA = isEmergencyActive ? 0 : parseFloat(((producedA / targetA) * 100).toFixed(1));
  const cycleA = isEmergencyActive ? 0 : Math.max(38, Math.min(65, Math.round(45 / (factorA || 1))));

  // Line B
  const factorB = getLineProductionFactor('Line B', 'PRESS DELTA-04');
  const targetB = 3800;
  const producedB = isEmergencyActive ? 0 : Math.round(targetB * Math.min(factorB, 1.15));
  const progressPercentB = isEmergencyActive ? 0 : parseFloat(((producedB / targetB) * 100).toFixed(1));
  const cycleB = isEmergencyActive ? 0 : Math.max(42, Math.min(75, Math.round(50 / (factorB || 1))));

  // Line C
  const factorC = getLineProductionFactor('Line C', 'LATHE SIGMA-1');
  const targetC = 2000;
  const producedC = isEmergencyActive ? 0 : Math.round(targetC * Math.min(factorC, 1.15));
  const progressPercentC = isEmergencyActive ? 0 : parseFloat(((producedC / targetC) * 100).toFixed(1));
  const cycleC = isEmergencyActive ? 0 : Math.max(30, Math.min(55, Math.round(40 / (factorC || 1))));

  // Top Performers calculation
  const expValues: Record<string, number> = {
    'Expert': 96,
    'Intermediate': 82,
    'Beginner': 68,
    'None': 40
  };

  const rankedPerformers = operators.map(op => {
    const expDict = op.expertise || {};
    const machinesSupported = ['CNC ALPHA-1', 'PRESS DELTA-04', 'LATHE SIGMA-1', 'MILL GAMMA-2'];
    
    const sum = machinesSupported.reduce((acc, m) => acc + (expValues[expDict[m]] || 40), 0);
    const avgExpertise = sum / machinesSupported.length;

    const opAssignments = shiftAssignments.filter(sa => sa.operatorId === op.id);
    const assignmentBonus = opAssignments.length * 6; // reward scheduling with bonus
    
    let alignmentBonus = 0;
    opAssignments.forEach(sa => {
      let reqMachine = "";
      if (sa.line === 'Line A') reqMachine = "CNC ALPHA-1";
      else if (sa.line === 'Line B') reqMachine = "PRESS DELTA-04";
      else if (sa.line === 'Line C') reqMachine = "LATHE SIGMA-1";

      const lvl = expDict[reqMachine] || 'None';
      if (lvl === 'Expert') alignmentBonus += 10;
      else if (lvl === 'Intermediate') alignmentBonus += 5;
      else if (lvl === 'Beginner') alignmentBonus += 1;
      else alignmentBonus -= 10;
    });

    let rawScore = avgExpertise + assignmentBonus + alignmentBonus;
    if (rawScore > 100) rawScore = 100;
    if (rawScore < 40) rawScore = 40;

    return {
      ...op,
      efficiencyScore: parseFloat(rawScore.toFixed(1)),
      assignmentsCount: opAssignments.length
    };
  });

  const topPerformers = [...rankedPerformers].sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  // Heatmap machine states
  const heatmapData = [
    { name: 'M-101', value: '98%', status: 'Optimal Health', color: 'bg-emerald-600' },
    { name: 'M-102', value: '94%', status: 'Optimal Health', color: 'bg-emerald-500' },
    { name: 'M-103', value: '89%', status: 'Good Health', color: 'bg-emerald-400' },
    { name: 'M-104', value: '95%', status: 'Optimal Health', color: 'bg-emerald-600' },
    { name: 'M-105', value: '72%', status: 'Maintenance Needed', color: 'bg-yellow-400' },
    { name: 'M-106', value: '91%', status: 'Optimal Health', color: 'bg-emerald-500' },
    { name: 'M-107', value: '93%', status: 'Optimal Health', color: 'bg-emerald-500' },
    { name: 'M-108', value: '0%', status: 'DOWN (Critical)', color: 'bg-red-500 animate-pulse' },
    { name: 'M-109', value: '94%', status: 'Optimal Health', color: 'bg-emerald-500' },
    { name: 'M-110', value: '81%', status: 'Satisfactory', color: 'bg-green-300' },
    { name: 'M-111', value: '92%', status: 'Optimal Health', color: 'bg-emerald-500' },
    { name: 'M-112', value: '96%', status: 'Optimal Health', color: 'bg-emerald-600' },
    { name: 'M-113', value: '95%', status: 'Optimal Health', color: 'bg-emerald-500' },
    { name: 'M-114', value: '78%', status: 'Minor Calibration Req.', color: 'bg-green-200' },
    { name: 'M-115', value: '97%', status: 'Optimal Health', color: 'bg-emerald-600' },
  ];

  const criticalAlertsCount = alerts.filter(a => a.type === 'critical' && !a.acknowledged).length;
  const warningAlertsCount = alerts.filter(a => a.type === 'warning' && !a.acknowledged).length;
  const infoAlertsCount = alerts.filter(a => a.type === 'info' && !a.acknowledged).length;

  // Real-time calculation of overall plant OEE based on specific heatmap machine telemetry values
  const telemetryOeeAvg = parseFloat(
    (
      heatmapData.reduce((acc, m) => acc + (parseInt(m.value.replace('%', '')) || 0), 0) /
      heatmapData.length
    ).toFixed(1)
  );
  const calculatedOee = isEmergencyActive ? 0.0 : telemetryOeeAvg;

  // OEE fluctuations data for shift sparkline
  const oeeFluctuationsData = [
    { hour: '08:00', oee: 84.5 },
    { hour: '09:00', oee: 83.2 },
    { hour: '10:00', oee: 85.8 },
    { hour: '11:00', oee: 84.1 },
    { hour: '12:00', oee: 86.9 },
    { hour: '13:00', oee: 88.4 },
    { hour: '14:00', oee: calculatedOee || 89.2 },
  ];

  // 7-day trend dataset for color-coded sparklines
  const oeeTrend7Day = [
    { day: 'Mon', value: 83.2 },
    { day: 'Tue', value: 84.1 },
    { day: 'Wed', value: 82.9 },
    { day: 'Thu', value: 85.4 },
    { day: 'Fri', value: 86.1 },
    { day: 'Sat', value: 84.8 },
    { day: 'Sun', value: isEmergencyActive ? 40 : (calculatedOee || 89.2) },
  ];

  const throughputTrend7Day = [
    { day: 'Mon', value: 1180 },
    { day: 'Tue', value: 1210 },
    { day: 'Wed', value: 1195 },
    { day: 'Thu', value: 1225 },
    { day: 'Fri', value: 1240 },
    { day: 'Sat', value: 1205 },
    { day: 'Sun', value: isEmergencyActive ? 0 : 1240 },
  ];

  const cycleTimeTrend7Day = [
    { day: 'Mon', value: 48 },
    { day: 'Tue', value: 47 },
    { day: 'Wed', value: 49 },
    { day: 'Thu', value: 46 },
    { day: 'Fri', value: 45 },
    { day: 'Sat', value: 46 },
    { day: 'Sun', value: isEmergencyActive ? 60 : 45 },
  ];

  const scrapsTrend7Day = [
    { day: 'Mon', value: 2.1 },
    { day: 'Tue', value: 1.9 },
    { day: 'Wed', value: 2.3 },
    { day: 'Thu', value: 1.8 },
    { day: 'Fri', value: 1.7 },
    { day: 'Sat', value: 2.0 },
    { day: 'Sun', value: isEmergencyActive ? 0 : 1.8 },
  ];


  // Dynamic values scaling depending on selectedDateRange
  let finalTargetA = targetA;
  let finalProducedA = producedA;
  let finalProgressPercentA = progressPercentA;
  let finalCycleA = cycleA;

  let finalTargetB = targetB;
  let finalProducedB = producedB;
  let finalProgressPercentB = progressPercentB;
  let finalCycleB = cycleB;

  let finalTargetC = targetC;
  let finalProducedC = producedC;
  let finalProgressPercentC = progressPercentC;
  let finalCycleC = cycleC;

  if (selectedDateRange === 'yesterday') {
    finalTargetA = 4200; finalProducedA = 4010; finalProgressPercentA = 95.5; finalCycleA = 46;
    finalTargetB = 3800; finalProducedB = 3720; finalProgressPercentB = 97.9; finalCycleB = 51;
    finalTargetC = 2000; finalProducedC = 1910; finalProgressPercentC = 95.5; finalCycleC = 41;
  } else if (selectedDateRange === '7days') {
    finalTargetA = 4200 * 7; finalProducedA = 28240; finalProgressPercentA = 96.1; finalCycleA = 45;
    finalTargetB = 3800 * 7; finalProducedB = 25480; finalProgressPercentB = 95.8; finalCycleB = 50;
    finalTargetC = 2000 * 7; finalProducedC = 13440; finalProgressPercentC = 96.0; finalCycleC = 40;
  } else if (selectedDateRange === 'custom') {
    const d1 = new Date(customStartDate);
    const d2 = new Date(customEndDate);
    const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    finalTargetA = 4200 * diffDays;
    finalProducedA = Math.round(finalTargetA * 0.957);
    finalProgressPercentA = 95.7;
    finalCycleA = 46;

    finalTargetB = 3800 * diffDays;
    finalProducedB = Math.round(finalTargetB * 0.963);
    finalProgressPercentB = 96.3;
    finalCycleB = 52;

    finalTargetC = 2000 * diffDays;
    finalProducedC = Math.round(finalTargetC * 0.941);
    finalProgressPercentC = 94.1;
    finalCycleC = 42;
  }

  const handleDownloadPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Header Banner
      doc.setFillColor(25, 27, 35); // elegant dark charcoal
      doc.rect(0, 0, 210, 42, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('TITAN SYSTEMS - SHIFT REVIEW', 15, 16);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(161, 168, 186);
      doc.text('Lilongwe Central Command Production & Logistics Report', 15, 24);
      doc.text(`Scope: ${selectedDateRange === 'today' ? 'Today (Current Shift)' : selectedDateRange === 'yesterday' ? 'Yesterday (Comparative)' : selectedDateRange === '7days' ? 'Last 7 Days Run Average' : `Custom Period (${customStartDate} to ${customEndDate})`}`, 15, 30);
      doc.text(`Run Date: ${new Date().toLocaleString()}`, 15, 36);
      
      // Divider
      doc.setFillColor(0, 88, 190); // blue accent ribbon
      doc.rect(0, 42, 210, 3, 'F');

      // Primary Status Section
      doc.setTextColor(25, 27, 35);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('1. Productivity Statistics', 15, 54);
      
      doc.setLineWidth(0.4);
      doc.setDrawColor(220, 224, 235);
      doc.line(15, 57, 195, 57);
      
      // Table Header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Line / Station', 15, 63);
      doc.text('Primary Machine', 45, 63);
      doc.text('Target (Units)', 85, 63);
      doc.text('Produced', 120, 63);
      doc.text('Prog. %', 155, 63);
      doc.text('Avg Cycle', 178, 63);
      
      doc.setLineWidth(0.2);
      doc.line(15, 66, 195, 66);
      
      // Rows
      doc.setFont('helvetica', 'normal');
      
      // Line A Row
      doc.text('Line A', 15, 73);
      doc.text('CNC ALPHA-1', 45, 73);
      doc.text(finalTargetA.toLocaleString(), 85, 73);
      doc.text(finalProducedA.toLocaleString(), 120, 73);
      doc.text(`${finalProgressPercentA}%`, 155, 73);
      doc.text(`${finalCycleA}s`, 178, 73);
      
      // Line B Row
      doc.text('Line B', 15, 80);
      doc.text('PRESS DELTA-04', 45, 80);
      doc.text(finalTargetB.toLocaleString(), 85, 80);
      doc.text(finalProducedB.toLocaleString(), 120, 80);
      doc.text(`${finalProgressPercentB}%`, 155, 80);
      doc.text(`${finalCycleB}s`, 178, 80);
      
      // Line C Row
      doc.text('Line C', 15, 87);
      doc.text('LATHE SIGMA-1', 45, 87);
      doc.text(finalTargetC.toLocaleString(), 85, 87);
      doc.text(finalProducedC.toLocaleString(), 120, 87);
      doc.text(`${finalProgressPercentC}%`, 155, 87);
      doc.text(`${finalCycleC}s`, 178, 87);
      
      doc.line(15, 91, 195, 91);
      
      // Section 2: Equipment Assessment
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('2. Equipment Assessment & Core Metrics', 15, 103);
      doc.line(15, 106, 195, 106);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Overall Plant OEE:', 15, 112);
      doc.setFont('helvetica', 'normal');
      doc.text(`${calculatedOee}% (Status: Stable)`, 55, 112);

      doc.setFont('helvetica', 'bold');
      doc.text('Hourly Throughput Target:', 15, 119);
      doc.setFont('helvetica', 'normal');
      doc.text(`${isEmergencyActive ? '0 (HALTED)' : '1,240 units / hour (Stable)'}`, 65, 119);

      doc.setFont('helvetica', 'bold');
      doc.text('Quality Control Scrap Rate:', 15, 126);
      doc.setFont('helvetica', 'normal');
      doc.text(`${isEmergencyActive ? '0.0%' : '1.8% (Target limit: <2.5%)'}`, 68, 126);

      doc.setFont('helvetica', 'bold');
      doc.text('Pending Unacknowledged Alerts:', 15, 133);
      doc.setFont('helvetica', 'normal');
      doc.text(`${alerts.filter(a => !a.acknowledged).length} active notifications`, 73, 133);

      doc.line(15, 137, 195, 137);

      // Section 3: Staffing Alignments
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('3. Top Schedulable Operators on Duty', 15, 149);
      doc.line(15, 152, 195, 152);
      
      doc.setFontSize(10);
      let yOffset = 159;
      topPerformers.slice(0, 4).forEach((op, idx) => {
        doc.setFont('helvetica', 'normal');
        doc.text(`#${idx + 1}  ${op.name} (${op.role})`, 18, yOffset);
        doc.setFont('helvetica', 'bold');
        doc.text(`${op.efficiencyScore}% Eff`, 150, yOffset);
        yOffset += 7;
      });

      // Signature Area / Verification
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Authorized Command Approval:', 15, yOffset + 12);
      
      doc.setDrawColor(180, 185, 200);
      doc.line(15, yOffset + 24, 75, yOffset + 24);
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(114, 119, 133);
      doc.text('Director of Operations', 15, yOffset + 28);
      
      doc.save(`ShiftReport_${selectedDateRange}_${new Date().toISOString().split('T')[0]}.pdf`);
    });
  };

  return (
    <div className="space-y-6">
      {isEmergencyActive && (
        <div className="bg-[#ffdad6] text-[#ba1a1a] p-4 rounded-xl border border-[#ba1a1a]/30 flex items-center gap-3 animate-pulse">
          <Flame className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Emergency System-Wide Pause Triggered</h4>
            <p className="text-xs mt-0.5">All automated assembly lines are locked. Review system statuses and clear flags before restarting.</p>
          </div>
        </div>
      )}

      {/* Top Welcome Alert Banner with dynamic OEE telemetry card */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-6">
        
        {/* Terminal Info Column */}
        <div className="flex-1 flex flex-col justify-between bg-[#f2f3fd] dark:bg-[#2e3038] py-4 px-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20">
          <div>
            <h2 className="text-[#191b23] dark:text-white font-extrabold text-base">Lilongwe Central Command Terminal</h2>
            <p className="text-xs text-[#424754] dark:text-[#c2c6d6] mt-1 leading-relaxed">
              Industrial overview system. Live telemetry synchronizes every 30 seconds directly from physical PLC registers.
            </p>
          </div>
          <button 
            type="button"
            onClick={onNavigateToMachine}
            className="text-[#0058be] dark:text-[#adc6ff] hover:underline text-xs flex items-center gap-1 font-bold mt-4 self-start"
          >
            <span>Primary Assembly (W-102) details</span>
            <span className="text-sm">→</span>
          </button>
        </div>

        {/* Dynamic Shift OEE summary card */}
        <div className="bg-white dark:bg-[#2e3038] border border-[#ecedf7] dark:border-[#727785]/20 rounded-xl p-4 lg:w-96 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden" id="card-shift-oee">
          <div className="absolute right-[-10px] top-[-10px] bg-emerald-500/10 w-24 h-24 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-extrabold tracking-wider text-[#727785] dark:text-[#c2c6d6] uppercase">
              Shift OEE (Computed Telemetry)
            </span>
            <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded ${
              calculatedOee > 85 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-[#adc6ff]'
            }`}>
              {isEmergencyActive ? 'HALTED' : calculatedOee > 85 ? 'OPTIMAL' : 'BELOW PAR'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#191b23] dark:text-white tracking-tight">
              {calculatedOee}%
            </span>
            <span className="text-[10px] font-bold text-[#727785]">
              Real-time calculations
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${calculatedOee > 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${calculatedOee}%` }}
              />
            </div>
            <span className="text-[9px] font-extrabold text-[#727785] shrink-0 font-mono">
              {heatmapData.filter(m => parseInt(m.value) > 0).length} / {heatmapData.length} online
            </span>
          </div>

          {/* Sparkline OEE Fluctuations */}
          <div className="h-10 w-full mt-3 flex flex-col justify-end">
            <div className="text-[8px] font-extrabold uppercase tracking-widest text-[#727785]/80 mb-1">Shift Trend Sparkline</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={oeeFluctuationsData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <defs>
                  <linearGradient id="oeeSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isEmergencyActive ? "#ba1a1a" : "#10b981"} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={isEmergencyActive ? "#ba1a1a" : "#10b981"} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="oee" 
                  stroke={isEmergencyActive ? "#ba1a1a" : "#10b981"} 
                  strokeWidth={1.5} 
                  fillOpacity={1} 
                  fill="url(#oeeSparkGrad)" 
                  dot={{ r: 2, strokeWidth: 0, fill: isEmergencyActive ? "#ba1a1a" : "#10b981" }}
                  activeDot={{ r: 4 }}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#191b23] text-white text-[8px] px-1 py-0.5 rounded border border-[#ecedf7]/20 font-bold font-mono">
                          {payload[0].value}%
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Central Grid of KPI Cards */}
      <div id="tour-kpis" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* OEE KPI */}
        <motion.div 
          whileHover={{ 
            scale: 1.02, 
            boxShadow: "0 10px 25px -5px rgba(0, 88, 190, 0.15)", 
            borderColor: "rgba(0, 88, 190, 0.45)" 
          }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-default flex flex-col justify-between"
          id="card-oee-kpi"
        >
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#424754] dark:text-[#c2c6d6] uppercase opacity-80">
                  Overall Equipment Effectiveness
                </p>
                <h3 className="text-4xl font-extrabold text-[#191b23] dark:text-white mt-2 flex items-baseline leading-none">
                  {isEmergencyActive ? '0.0' : calculatedOee}
                  <span className="text-xl font-medium text-[#727785] ml-0.5">%</span>
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-[#001a42] dark:bg-emerald-950/20 dark:text-emerald-300 text-[10px] font-bold rounded flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[#10b981]" />
                +2.4%
              </span>
            </div>
            
            <div className="mt-4">
              <div className="h-2 w-full bg-[#f2f3fd] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: isEmergencyActive ? '0%' : `${calculatedOee}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-[9px] font-bold text-[#727785] uppercase tracking-wider block mb-1">OEE 7-Day Trend</span>
            <div className="h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={oeeTrend7Day} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id="oeeTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isEmergencyActive ? "#ba1a1a" : "#10b981"} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={isEmergencyActive ? "#ba1a1a" : "#10b981"} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={isEmergencyActive ? "#ba1a1a" : "#10b981"} 
                    strokeWidth={1.5} 
                    fillOpacity={1} 
                    fill="url(#oeeTrendGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center text-[10px] text-[#727785] mt-1.5 font-medium border-t border-[#ecedf7]/30 dark:border-[#727785]/10 pt-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Stable Limit</span>
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOeeTrendModal(true);
                }}
                className="text-[#0058be] dark:text-[#adc6ff] hover:underline font-extrabold flex items-center gap-0.5 uppercase tracking-wide cursor-pointer transition-colors"
                id="btn-view-oee-30d-trend"
              >
                View Trend Details →
              </button>
            </div>
          </div>
        </motion.div>

        {/* Throughput KPI */}
        <motion.div 
          whileHover={{ 
            scale: 1.02, 
            boxShadow: "0 10px 25px -5px rgba(0, 88, 190, 0.15)", 
            borderColor: "rgba(0, 88, 190, 0.45)" 
          }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-default flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#424754] dark:text-[#c2c6d6] uppercase opacity-80">
                  Current Throughput
                </p>
                <h3 className="text-4xl font-extrabold text-[#191b23] dark:text-white mt-2 flex items-baseline leading-none">
                  {isEmergencyActive ? '0' : '1,240'}
                  <span className="text-xs font-semibold text-[#727785] ml-1">pcs/h</span>
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-[#d0e1fb] text-[#005ac2] dark:bg-[#d0e1fb]/20 dark:text-[#adc6ff] text-[10px] font-bold rounded uppercase">
                {isEmergencyActive ? 'HAZARD' : 'On Track'}
              </span>
            </div>
            <p className="text-[10px] font-medium text-[#727785] mt-1.5">
              Target: Run 1,200 units/hr
            </p>
          </div>

          <div className="mt-4">
            <span className="text-[9px] font-bold text-[#727785] uppercase tracking-wider block mb-1">Throughput 7-Day Trend</span>
            <div className="h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputTrend7Day} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id="thruTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isEmergencyActive ? "#ba1a1a" : "#3b82f6"} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={isEmergencyActive ? "#ba1a1a" : "#3b82f6"} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={isEmergencyActive ? "#ba1a1a" : "#3b82f6"} 
                    strokeWidth={1.5} 
                    fillOpacity={1} 
                    fill="url(#thruTrendGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] text-[#727785] mt-1.5 font-medium border-t border-[#ecedf7]/30 dark:border-[#727785]/10 pt-1">
              <span>Baseline: 1.2k units</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">Steady</span>
            </div>
          </div>
        </motion.div>

        {/* Cycle Time KPI */}
        <motion.div 
          whileHover={{ 
            scale: 1.02, 
            boxShadow: "0 10px 25px -5px rgba(0, 88, 190, 0.15)", 
            borderColor: "rgba(0, 88, 190, 0.45)" 
          }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-default flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#424754] dark:text-[#c2c6d6] uppercase opacity-80">
                  Avg Cycle Time
                </p>
                <h3 className="text-4xl font-extrabold text-[#191b23] dark:text-white mt-2 flex items-baseline leading-none">
                  {isEmergencyActive ? '--' : '45'}
                  <span className="text-xl font-medium text-[#727785] ml-0.5">s</span>
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-[10px] font-bold rounded flex items-center gap-1">
                <ArrowDown className="w-3 h-3 text-[#3b82f6]" />
                -3s IMPROV.
              </span>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-[9px] font-bold text-[#727785] uppercase tracking-wider block mb-1">Cycle Time 7-Day Speed (Lower is better)</span>
            <div className="h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cycleTimeTrend7Day} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id="cycleTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f59e0b" 
                    strokeWidth={1.5} 
                    fillOpacity={1} 
                    fill="url(#cycleTrendGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] text-[#727785] mt-1.5 font-medium border-t border-[#ecedf7]/30 dark:border-[#727785]/10 pt-1">
              <span>Ref Target: 48s</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">Efficient</span>
            </div>
          </div>
        </motion.div>

        {/* Scrap Rate KPI */}
        <motion.div 
          whileHover={{ 
            scale: 1.02, 
            boxShadow: "0 10px 25px -5px rgba(0, 88, 190, 0.15)", 
            borderColor: "rgba(0, 88, 190, 0.45)" 
          }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all cursor-default flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold tracking-wider text-[#424754] dark:text-[#c2c6d6] uppercase opacity-80">
                  Scrap Rate
                </p>
                <h3 className="text-4xl font-extrabold text-[#191b23] dark:text-white mt-2 flex items-baseline leading-none">
                  {isEmergencyActive ? '0.0' : '1.8'}
                  <span className="text-xl font-medium text-[#727785] ml-0.5">%</span>
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 text-[10px] font-bold rounded uppercase">
                Excellent
              </span>
            </div>
          </div>

          <div className="mt-4">
            <span className="text-[9px] font-bold text-[#727785] uppercase tracking-wider block mb-1">Scrap Rate 7-Day Trend (Lower is better)</span>
            <div className="h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scrapsTrend7Day} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <defs>
                    <linearGradient id="scrapTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={1.5} 
                    fillOpacity={1} 
                    fill="url(#scrapTrendGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] text-[#727785] mt-1.5 font-medium border-t border-[#ecedf7]/30 dark:border-[#727785]/10 pt-1">
              <span>Threshold: &lt;2.5%</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Healthy</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Circular Telemetry Hub section */}
      <div className="mt-1">
        <div className="flex items-center justify-between mb-3.5">
          <h4 className="text-[10px] font-extrabold text-[#727785] dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <span>🔘 Circular Node Telemetry</span>
            <span className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 font-normal normal-case">(Round hardware registers)</span>
          </h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-zinc-50/50 dark:bg-zinc-900/10 p-5 rounded-2xl border border-[#ecedf7] dark:border-[#727785]/10 justify-items-center">
          
          {/* Circle Node 1: Hydraulic Oil Temp */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white dark:bg-[#2e3038] border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-center items-center p-3 text-center relative overflow-hidden group cursor-pointer"
          >
            {/* Circular glowing aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent rounded-full group-hover:scale-110 transition-transform duration-500" />
            {/* Concentric SVG track ring */}
            <svg className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)] -rotate-90 pointer-events-none">
              <circle cx="50%" cy="50%" r="60" stroke="rgba(245, 158, 11, 0.08)" strokeWidth="3" fill="transparent" />
              <circle cx="50%" cy="50%" r="60" stroke="#f59e0b" strokeWidth="3" fill="transparent" strokeDasharray="377" strokeDashoffset="110" strokeLinecap="round" className="opacity-80 group-hover:opacity-100 transition-opacity" />
            </svg>
            <Flame className="w-5 h-5 text-amber-500 mb-0.5 z-10" />
            <span className="text-lg sm:text-xl font-extrabold text-[#191b23] dark:text-zinc-100 tracking-tight z-10">48.2 <span className="text-xs font-semibold text-[#727785]">°C</span></span>
            <span className="text-[9px] font-bold text-[#727785] uppercase tracking-wider mt-0.5 z-10">Hydraulic Oil</span>
            <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 uppercase flex items-center gap-1 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Optimal
            </span>
          </motion.div>

          {/* Circle Node 2: Pneumatic Pressure */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white dark:bg-[#2e3038] border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-center items-center p-3 text-center relative overflow-hidden group cursor-pointer"
          >
            {/* Circular glowing aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full group-hover:scale-110 transition-transform duration-500" />
            {/* Concentric SVG track ring */}
            <svg className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)] -rotate-90 pointer-events-none">
              <circle cx="50%" cy="50%" r="60" stroke="rgba(59, 130, 246, 0.08)" strokeWidth="3" fill="transparent" />
              <circle cx="50%" cy="50%" r="60" stroke="#3b82f6" strokeWidth="3" fill="transparent" strokeDasharray="377" strokeDashoffset="140" strokeLinecap="round" className="opacity-80 group-hover:opacity-100 transition-opacity" />
            </svg>
            <Gauge className="w-5 h-5 text-blue-500 mb-0.5 z-10" />
            <span className="text-lg sm:text-xl font-extrabold text-[#191b23] dark:text-zinc-100 tracking-tight z-10">6.4 <span className="text-xs font-semibold text-[#727785]">bar</span></span>
            <span className="text-[9px] font-bold text-[#727785] uppercase tracking-wider mt-0.5 z-10">Pneumatic Air</span>
            <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 uppercase flex items-center gap-1 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Normal
            </span>
          </motion.div>

          {/* Circle Node 3: Vibration Axis */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white dark:bg-[#2e3038] border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-center items-center p-3 text-center relative overflow-hidden group cursor-pointer"
          >
            {/* Circular glowing aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent rounded-full group-hover:scale-110 transition-transform duration-500" />
            {/* Concentric SVG track ring */}
            <svg className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)] -rotate-90 pointer-events-none">
              <circle cx="50%" cy="50%" r="60" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="3" fill="transparent" />
              <circle cx="50%" cy="50%" r="60" stroke="#10b981" strokeWidth="3" fill="transparent" strokeDasharray="377" strokeDashoffset="75" strokeLinecap="round" className="opacity-80 group-hover:opacity-100 transition-opacity" />
            </svg>
            <Activity className="w-5 h-5 text-emerald-500 mb-0.5 z-10" />
            <span className="text-lg sm:text-xl font-extrabold text-[#191b23] dark:text-zinc-100 tracking-tight z-10">1.1 <span className="text-xs font-semibold text-[#727785]">mm/s</span></span>
            <span className="text-[9px] font-bold text-[#727785] uppercase tracking-wider mt-0.5 z-10">Spindle Vibration</span>
            <span className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 uppercase flex items-center gap-1 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Smooth
            </span>
          </motion.div>

          {/* Circle Node 4: Active Energy Load */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white dark:bg-[#2e3038] border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_4px_12px_rgba(0,0,0,0.03)] flex flex-col justify-center items-center p-3 text-center relative overflow-hidden group cursor-pointer"
          >
            {/* Circular glowing aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 to-transparent rounded-full group-hover:scale-110 transition-transform duration-500" />
            {/* Concentric SVG track ring */}
            <svg className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)] -rotate-90 pointer-events-none">
              <circle cx="50%" cy="50%" r="60" stroke="rgba(139, 92, 246, 0.08)" strokeWidth="3" fill="transparent" />
              <circle cx="50%" cy="50%" r="60" stroke="#8b5cf6" strokeWidth="3" fill="transparent" strokeDasharray="377" strokeDashoffset="200" strokeLinecap="round" className="opacity-80 group-hover:opacity-100 transition-opacity" />
            </svg>
            <Zap className="w-5 h-5 text-violet-500 mb-0.5 z-10" />
            <span className="text-lg sm:text-xl font-extrabold text-[#191b23] dark:text-zinc-100 tracking-tight z-10">38.5 <span className="text-xs font-semibold text-[#727785]">kW</span></span>
            <span className="text-[9px] font-bold text-[#727785] uppercase tracking-wider mt-0.5 z-10">Core Grid Draw</span>
            <span className="text-[8px] font-extrabold text-blue-600 dark:text-[#adc6ff] mt-1 uppercase flex items-center gap-1 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Eco Active
            </span>
          </motion.div>

        </div>
      </div>

      {/* Personnel & Production Line Performance Hub (Shift Summary & Top Performers Widgets) */}
      <div id="shift-summary-rankings" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Shift Summary Component - Daily Productivity Report */}
        <div className="lg:col-span-7 bg-white dark:bg-[#2e3038] border border-[#ecedf7] dark:border-[#727785]/20 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between" id="component-shift-report">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-[#ecedf7] dark:border-[#727785]/10">
            <div>
              <h4 className="font-extrabold text-sm text-[#191b23] dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Gauge className="w-4.5 h-4.5 text-[#0058be]" />
                Shift Productivity Report
              </h4>
              <p className="text-[10px] text-[#727785] font-semibold mt-0.5">Line capacity vs targets synced with personnel alignments</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Scope Selector */}
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="bg-[#f2f3fd] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-[10px] font-extrabold py-1 px-2.5 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#0058be] cursor-pointer"
              >
                <option value="today">Today (Current)</option>
                <option value="yesterday">Yesterday (Comparative)</option>
                <option value="7days">7-Day Run Average</option>
                <option value="custom">Custom Date Range...</option>
              </select>

              {/* Generate PDF Button */}
              <button
                onClick={handleDownloadPDF}
                className="bg-[#0058be] hover:bg-opacity-90 text-white text-[9px] font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm uppercase tracking-wider cursor-pointer transition-all active:scale-95 shrink-0"
                title="Download PDF report for management review"
                id="btn-download-pdf"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                PDF Summary
              </button>
            </div>
          </div>

          {/* Conditional Custom Date Selector block */}
          {selectedDateRange === 'custom' && (
            <div className="mb-4 flex flex-wrap gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800/60 animate-fade-in">
              <div className="flex-1 min-w-[110px]">
                <label className="block text-[8px] font-extrabold uppercase tracking-wider text-[#727785] mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => setCustomStartDate(e.target.value)} 
                  className="w-full bg-white dark:bg-[#191b23] border border-zinc-200 dark:border-zinc-700/60 rounded-lg py-1 px-2 text-[11px] font-extrabold text-zinc-700 dark:text-zinc-200"
                />
              </div>
              <div className="flex-1 min-w-[110px]">
                <label className="block text-[8px] font-extrabold uppercase tracking-wider text-[#727785] mb-1">End Date</label>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => setCustomEndDate(e.target.value)} 
                  className="w-full bg-white dark:bg-[#191b23] border border-zinc-200 dark:border-zinc-700/60 rounded-lg py-1 px-2 text-[11px] font-extrabold text-zinc-700 dark:text-zinc-200"
                />
              </div>
              <div className="flex items-end text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                🔄 Automatic projection active
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Line A Report */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-xs text-[#191b23] dark:text-zinc-200">Line A</span>
                  <span className="text-[10px] text-[#727785] font-medium ml-2 font-mono">CNC Precision</span>
                </div>
                <div className="text-[11px] font-extrabold font-mono text-[#191b23] dark:text-white">
                  {finalProducedA.toLocaleString()} / {finalTargetA.toLocaleString()} units <span className="text-[10px] text-[#727785] font-bold">({finalProgressPercentA}%)</span>
                </div>
              </div>
              <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    finalProgressPercentA >= 100 
                      ? 'bg-emerald-500' 
                      : finalProgressPercentA >= 80 
                      ? 'bg-blue-500' 
                      : 'bg-red-500/80'
                  }`}
                  style={{ width: `${Math.min(finalProgressPercentA, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-[#727785]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0058be]" />
                  Avg Cycle: {isEmergencyActive ? '--' : `${finalCycleA}s`} <span className="font-normal">(target: 45s)</span>
                </span>
                <span className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/30 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase text-[#727785]/90">
                  <Users className="w-3 h-3 shrink-0" />
                  {shiftAssignments.filter(sa => sa.line === 'Line A').length} operators
                </span>
              </div>
            </div>

            {/* Line B Report */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-xs text-[#191b23] dark:text-zinc-200">Line B</span>
                  <span className="text-[10px] text-[#727785] font-medium ml-2 font-mono">Hydraulic Press</span>
                </div>
                <div className="text-[11px] font-extrabold font-mono text-[#191b23] dark:text-white">
                  {finalProducedB.toLocaleString()} / {finalTargetB.toLocaleString()} units <span className="text-[10px] text-[#727785] font-bold">({finalProgressPercentB}%)</span>
                </div>
              </div>
              <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    finalProgressPercentB >= 100 
                      ? 'bg-emerald-500' 
                      : finalProgressPercentB >= 80 
                      ? 'bg-blue-500' 
                      : 'bg-amber-500/80'
                  }`}
                  style={{ width: `${Math.min(finalProgressPercentB, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-[#727785]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0058be]" />
                  Avg Cycle: {isEmergencyActive ? '--' : `${finalCycleB}s`} <span className="font-normal">(target: 50s)</span>
                </span>
                <span className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/30 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase text-[#727785]/90">
                  <Users className="w-3 h-3 shrink-0" />
                  {shiftAssignments.filter(sa => sa.line === 'Line B').length} operators
                </span>
              </div>
            </div>

            {/* Line C Report */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-xs text-[#191b23] dark:text-zinc-200">Line C</span>
                  <span className="text-[10px] text-[#727785] font-medium ml-2 font-mono">Automated Lathe</span>
                </div>
                <div className="text-[11px] font-extrabold font-mono text-[#191b23] dark:text-white">
                  {finalProducedC.toLocaleString()} / {finalTargetC.toLocaleString()} units <span className="text-[10px] text-[#727785] font-bold">({finalProgressPercentC}%)</span>
                </div>
              </div>
              <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    finalProgressPercentC >= 100 
                      ? 'bg-emerald-500' 
                      : finalProgressPercentC >= 80 
                      ? 'bg-blue-500' 
                      : 'bg-red-500/85'
                  }`}
                  style={{ width: `${Math.min(finalProgressPercentC, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-[#727785]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#0058be]" />
                  Avg Cycle: {isEmergencyActive ? '--' : `${finalCycleC}s`} <span className="font-normal">(target: 40s)</span>
                </span>
                <span className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/30 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase text-[#727785]/90">
                  <Users className="w-3 h-3 shrink-0" />
                  {shiftAssignments.filter(sa => sa.line === 'Line C').length} operators
                </span>
              </div>
            </div>

            {/* Handover Notes persist section */}
            <div className="mt-6 pt-4 border-t border-[#ecedf7] dark:border-[#727785]/10 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-[#727785] dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  📋 Supervisor Handover Notes (next-shift log)
                </span>
                {saveNotesSuccess && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                    ✓ Shift notes updated successfully
                  </span>
                )}
              </div>
              <textarea
                placeholder="Enter machine anomalies, shift incidents or backlog requests here. These updates persist for the oncoming supervisor..."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 bg-[#f2f3fd]/30 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/20 rounded-lg text-[#191b23] dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#0058be] h-20 resize-none leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveHandoverNotes}
                  className="bg-[#0058be] hover:bg-[#0047a0] text-white text-[9px] font-extrabold px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition-all active:scale-95"
                >
                  Save Comments
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Top Performers Widget */}
        <div className="lg:col-span-5 bg-white dark:bg-[#2e3038] border border-[#ecedf7] dark:border-[#727785]/20 rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between" id="leaderboard-top-performers">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#ecedf7] dark:border-[#727785]/10">
            <div>
              <h4 className="font-extrabold text-sm text-[#191b23] dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Award className="w-4.5 h-4.5 text-amber-500" />
                Top Operators
              </h4>
              <p className="text-[10px] text-[#727785] font-semibold mt-0.5">Floor efficiency values & scheduling match metrics</p>
            </div>
            
            {/* View Toggle */}
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[9px] font-extrabold">
              <button 
                type="button" 
                onClick={() => setShowTrendChart(false)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${!showTrendChart ? 'bg-white dark:bg-[#191b23] shadow-sm text-zinc-900 dark:text-white' : 'text-[#727785]'}`}
              >
                Rank
              </button>
              <button 
                type="button" 
                onClick={() => setShowTrendChart(true)}
                className={`px-2 py-1 rounded-md transition-all cursor-pointer ${showTrendChart ? 'bg-white dark:bg-[#191b23] shadow-sm text-zinc-900 dark:text-white' : 'text-[#727785]'}`}
              >
                7D Trend (Recharts)
              </button>
            </div>
          </div>

          {showTrendChart ? (
            /* Trend Line Chart representing dynamic score progression over the last 7 days */
            <div className="h-[275px] flex flex-col justify-between animate-fade-in" id="top-operators-trend-recharts">
              <div className="flex-1 w-full max-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map((day, dIdx) => {
                      const dataPoint: any = { name: day };
                      topPerformers.slice(0, 3).forEach((op, opIdx) => {
                        const baseScore = op.efficiencyScore || 85;
                        const scoreShift = baseScore - (6 - dIdx) * (1.2 + opIdx * 0.15) + Math.cos(dIdx + opIdx) * 2.5;
                        dataPoint[op.name] = Math.min(100, Math.max(50, Math.round(scoreShift)));
                      });
                      return dataPoint;
                    })} 
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(114,119,133,0.12)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#727785', fontSize: 9, fontWeight: 'extrabold' }} 
                    />
                    <YAxis 
                      domain={[60, 100]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#727785', fontSize: 9, fontWeight: 'extrabold' }} 
                    />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: '#191b23', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                      labelStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                      itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    {topPerformers.slice(0, 3).map((op, opIdx) => (
                      <Line 
                        key={op.id}
                        type="monotone" 
                        dataKey={op.name} 
                        stroke={opIdx === 0 ? '#0058be' : opIdx === 1 ? '#f59e0b' : '#10b981'} 
                        strokeWidth={2.5} 
                        dot={{ r: 3, strokeWidth: 0, fill: opIdx === 0 ? '#0058be' : opIdx === 1 ? '#f59e0b' : '#10b981' }} 
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Legends */}
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-2 shrink-0">
                {topPerformers.slice(0, 3).map((op, opIdx) => (
                  <div key={op.id} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opIdx === 0 ? '#0058be' : opIdx === 1 ? '#f59e0b' : '#10b981' }} />
                    <span className="text-[9px] font-extrabold text-[#424754] dark:text-zinc-300 font-mono">{op.initials} ({op.efficiencyScore}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[305px] pr-1 scrollbar-thin animate-fade-in">
              {topPerformers.map((op, index) => (
                <div key={op.id} className="flex items-center justify-between p-2.5 rounded-xl border border-[#ecedf7] dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#13151a]/20">
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold leading-none ${
                      index === 0 
                        ? 'bg-amber-100 text-[#8a5500] dark:bg-amber-950/50 dark:text-amber-300' 
                        : index === 1 
                        ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100' 
                        : 'bg-zinc-100 text-[#727785] dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      #{index + 1}
                    </span>
                    
                    {/* Avatar Icon placeholder */}
                    <div className="w-7 h-7 rounded-lg bg-[#0058be]/10 dark:bg-blue-500/10 flex items-center justify-center font-extrabold text-xs text-[#0058be] dark:text-blue-300">
                      {op.initials}
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-[#191b23] dark:text-white leading-tight">{op.name}</h5>
                      <p className="text-[9px] text-[#727785] font-medium leading-normal mt-0.5">{op.role}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-xs font-extrabold text-[#005cda] dark:text-blue-400 font-mono">
                        {op.efficiencyScore}%
                      </span>
                    </div>
                    {/* Miniature visualization bar */}
                    <div className="w-16 h-1 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden mt-1 ml-auto">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          op.efficiencyScore >= 90 
                            ? 'bg-emerald-500' 
                            : op.efficiencyScore >= 75 
                            ? 'bg-[#0058be]' 
                            : 'bg-amber-500'
                        }`} 
                        style={{ width: `${op.efficiencyScore}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Main Core Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Production Line Performance Wave Chart */}
        <div className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#ecedf7] dark:border-[#727785]/20 flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#191b23] dark:text-white">Production Line Performance</h4>
            <div className="flex gap-4">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0058be]" /> Line A
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#924700]" /> Line B
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#424754] dark:text-[#c2c6d6] border-l border-[#ecedf7] dark:border-[#727785]/20 pl-4">
                <span className="w-4 h-0.5 bg-[#727785]/40" /> Target
              </span>
            </div>
          </div>
          <div className="p-6 h-[280px] relative flex flex-col justify-end">
            <div className="absolute inset-x-6 top-10 bottom-16 grid grid-rows-4 pointer-events-none">
              <div className="border-b border-[#ecedf7]/60 dark:border-[#191b23]/40" />
              <div className="border-b border-[#ecedf7]/60 dark:border-[#191b23]/40" />
              <div className="border-b border-[#ecedf7]/60 dark:border-[#191b23]/40" />
              <div className="border-b border-dashed border-[#0058be]/20" />
            </div>

            {/* Custom Responsive SVG Wave */}
            {isEmergencyActive ? (
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-[#727785] animate-pulse">
                Telemetry streams inactive - Emergency mode active
              </div>
            ) : (
              <svg className="absolute inset-x-6 top-10 bottom-16 w-[calc(100%-48px)] h-[calc(100%-104px)] overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 120">
                {/* Grid guidelines */}
                <line x1="0" y1="90" x2="500" y2="90" stroke="#727785" strokeOpacity="0.2" strokeDasharray="3 3" />
                
                {/* Line A Curve (Blue) */}
                <path 
                  d="M0,105 Q60,95 120,110 T240,80 T360,95 T480,75 L500,85" 
                  fill="none" 
                  stroke="#0058be" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                
                {/* Line B Curve (Amber) */}
                <path 
                  d="M0,115 Q60,118 120,100 T240,111 T360,90 T480,115 L500,108" 
                  fill="none" 
                  stroke="#924700" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />

                {/* Target line */}
                <line x1="0" y1="80" x2="500" y2="80" stroke="#727785" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.5" />
              </svg>
            )}

            <div className="flex justify-between pt-4 text-[10px] font-bold text-[#727785] opacity-70 border-t border-[#ecedf7] dark:border-[#727785]/20">
              <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span>
            </div>
          </div>
        </div>

        {/* Downtime Causes Pareto Card */}
        <div className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#ecedf7] dark:border-[#727785]/20 flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#191b23] dark:text-white">Downtime Causes</h4>
            <button className="text-[#727785] hover:text-black dark:hover:text-white p-1 rounded">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            
            {/* Cause 1 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span>Mechanical Failure</span>
                <span className="text-[#191b23] dark:text-white">42h (58%)</span>
              </div>
              <div className="h-2 w-full bg-[#ecedf7] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-[#ba1a1a] rounded-full" style={{ width: '58%' }} />
              </div>
            </div>

            {/* Cause 2 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span>Changeover Delay</span>
                <span className="text-[#191b23] dark:text-white">15h (21%)</span>
              </div>
              <div className="h-2 w-full bg-[#ecedf7] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-[#924700] rounded-full" style={{ width: '21%' }} />
              </div>
            </div>

            {/* Cause 3 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span>Operator Absence</span>
                <span className="text-[#191b23] dark:text-white">8h (11%)</span>
              </div>
              <div className="h-2 w-full bg-[#ecedf7] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-[#505f76] rounded-full" style={{ width: '11%' }} />
              </div>
            </div>

            {/* Cause 4 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span>Material Shortage</span>
                <span className="text-[#191b23] dark:text-white">7h (10%)</span>
              </div>
              <div className="h-2 w-full bg-[#ecedf7] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-[#b7c8e1] rounded-full" style={{ width: '10%' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Secondary Floor Optimization Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Machine Utilization Heatmap */}
        <div className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h4 className="font-bold text-sm text-[#191b23] dark:text-white mb-4">Machine Utilization</h4>
          <div className="grid grid-cols-5 gap-2 relative">
            {heatmapData.map((cell, idx) => (
              <button
                key={idx}
                onMouseEnter={() => setSelectedCell(cell.name)}
                onMouseLeave={() => setSelectedCell(null)}
                onClick={() => alert(`Active machine details: ${cell.name}\nOperating efficiency: ${cell.value}\nStatus: ${cell.status}`)}
                className={`aspect-square ${cell.color} rounded-md shadow-sm transition-transform duration-200 hover:scale-110`}
                title={`${cell.name}: ${cell.value}`}
              />
            ))}

            {/* Floating Info Tooltip */}
            {selectedCell && (
              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-[#2e3038] text-white text-[11px] px-3 py-1.5 rounded shadow-lg pointer-events-none z-50 transition-all border border-[#ecedf7]/35 w-[140px] text-center font-bold">
                {selectedCell}: {heatmapData.find(c => c.name === selectedCell)?.value}
                <div className="text-[10px] text-emerald-300 font-normal mt-0.5">
                  {heatmapData.find(c => c.name === selectedCell)?.status}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-between items-center text-[10px] font-bold text-[#727785] opacity-80">
            <span>Low Utilization</span>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 bg-green-100 dark:bg-green-950/20 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-green-300 dark:bg-green-700/40 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-green-500 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm" />
            </div>
            <span>High Efficiency</span>
          </div>
        </div>

        {/* Scrap Causes Mini Bar Chart */}
        <div className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <h4 className="font-bold text-sm text-[#191b23] dark:text-white mb-4">Scrap Causes</h4>
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            
            <div className="flex items-center gap-3">
              <span className="w-20 text-[10px] font-bold text-[#727785] truncate uppercase">Welding Defect</span>
              <div className="flex-1 h-3 bg-[#ecedf7] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-[#0058be] rounded-full w-[65%]" />
              </div>
              <span className="text-[11px] font-extrabold text-[#191b23] dark:text-white w-6 text-right">482</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-20 text-[10px] font-bold text-[#727785] truncate uppercase">Surface Finish</span>
              <div className="flex-1 h-3 bg-[#ecedf7] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-[#0058be] rounded-full w-[30%]" />
              </div>
              <span className="text-[11px] font-extrabold text-[#191b23] dark:text-white w-6 text-right">124</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-20 text-[10px] font-bold text-[#727785] truncate uppercase">Tolerance Gap</span>
              <div className="flex-1 h-3 bg-[#ecedf7] dark:bg-[#191b23] rounded-full overflow-hidden">
                <div className="h-full bg-[#0058be] rounded-full w-[15%]" />
              </div>
              <span className="text-[11px] font-extrabold text-[#191b23] dark:text-white w-6 text-right">42</span>
            </div>

          </div>
        </div>

        {/* Industrial Alerts Live Summary */}
        <div className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-sm text-[#191b23] dark:text-white">Alerts Summary</h4>
            <span className="text-[10px] font-bold text-[#727785] opacity-70">Last 24h</span>
          </div>

          <div className="space-y-2 flex-1 flex flex-col justify-center">
            
            <div className="flex items-center justify-between p-2.5 bg-[#ffdad6]/20 border border-[#ffdad6]/50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
                <span className="text-xs font-semibold text-[#191b23] dark:text-white">Critical Alerts</span>
              </div>
              <span className="text-sm font-extrabold text-[#ba1a1a]">{criticalAlertsCount}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#ffdcc6]/20 border border-[#ffdcc6]/50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#b75b00]" />
                <span className="text-xs font-semibold text-[#191b23] dark:text-white">Warnings</span>
              </div>
              <span className="text-sm font-extrabold text-[#b75b00]">{warningAlertsCount}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-[#d0e1fb]/20 border border-[#d0e1fb]/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#0058be]" />
                <span className="text-xs font-semibold text-[#191b23] dark:text-white">System Info</span>
              </div>
              <span className="text-sm font-extrabold text-[#0058be]">{infoAlertsCount}</span>
            </div>

          </div>
        </div>

      </div>

      {/* 30-Day OEE Detailed Trend Modal */}
      <AnimatePresence>
        {showOeeTrendModal && (
          <div className="fixed inset-0 bg-[#191b23]/70 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-[#1a1b23] rounded-2xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-2xl max-w-3xl w-full p-6 relative overflow-hidden"
            >
              {/* Top Banner Accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#0058be] to-blue-500" />
              
              <div className="flex justify-between items-start mb-6 pt-2">
                <div>
                  <h3 className="text-lg font-extrabold text-[#191b23] dark:text-white flex items-center gap-2">
                    <span className="p-1 px-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded text-xs font-mono">OEE DEEP ANALYTICS</span>
                    <span>30-Day Performance History</span>
                  </h3>
                  <p className="text-xs text-[#727785] dark:text-zinc-400 mt-1">
                    Continuous OEE tracker showing actual manufacturing effectiveness versus plant benchmark standards.
                  </p>
                </div>
                <button 
                  onClick={() => setShowOeeTrendModal(false)}
                  className="p-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 transition uppercase tracking-wider cursor-pointer"
                >
                  Close [ESC]
                </button>
              </div>

              {/* 30-Day Statistics Panel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-[#191b23]/40 rounded-xl mb-6 border border-zinc-100 dark:border-zinc-800/50">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider block">30D Avg Efficiency</span>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">88.3%</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider block">Standard Benchmark</span>
                  <div className="text-xl font-extrabold text-[#0058be] dark:text-blue-400">85.0%</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider block">Peak Observed Rate</span>
                  <div className="text-xl font-extrabold text-emerald-500 dark:text-emerald-300">93.8%</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider block">Days Above Standard</span>
                  <div className="text-xl font-extrabold text-[#191b23] dark:text-zinc-150">25 / 30 Days</div>
                </div>
              </div>

              {/* Recharts High-density Graph */}
              <div className="h-64 w-full bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-xl border border-zinc-100 dark:border-zinc-850">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={Array.from({ length: 30 }, (_, index) => {
                      const dayNum = index + 1;
                      const factors = [86.2, 88.5, 89.1, 84.8, 85.9, 87.4, 91.2, 92.5, 90.1, 83.4, 
                                      85.6, 88.1, 89.4, 86.8, 87.2, 89.9, 93.1, 91.2, 88.4, 84.9, 
                                      86.5, 87.9, 89.2, 91.5, 93.8, 92.1, 89.4, 88.2, 89.9, isEmergencyActive ? 0.0 : (calculatedOee || 89.2)];
                      return {
                        day: `Jun ${dayNum.toString().padStart(2, '0')}`,
                        oee: factors[index] || 88.5,
                        benchmark: 85
                      };
                    })} 
                    margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="oee30dGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isEmergencyActive ? "#ba1a1a" : "#10b981"} stopOpacity={0.35}/>
                        <stop offset="95%" stopColor={isEmergencyActive ? "#ba1a1a" : "#10b981"} stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-250 dark:text-zinc-800" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: '#727785', fontSize: 9, fontWeight: 600 }} 
                      axisLine={{ stroke: '#ecedf7', strokeWidth: 1 }}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={isEmergencyActive ? [0, 100] : [70, 100]} 
                      tick={{ fill: '#727785', fontSize: 9, fontWeight: 600 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip 
                      contentStyle={{
                        backgroundColor: '#191b23',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                      }}
                      itemStyle={{ color: isEmergencyActive ? '#ef4444' : '#10b981' }}
                    />
                    <ReferenceLine 
                      y={85} 
                      stroke="#ef4444" 
                      strokeDasharray="4 4" 
                      label={{ value: 'Standard Target 85%', fill: '#ef4444', fontSize: 9, position: 'top', fontWeight: 'bold' }} 
                    />
                    <Area 
                      type="monotone" 
                      name="OEE Score"
                      dataKey="oee" 
                      stroke={isEmergencyActive ? "#ef4444" : "#10b981"} 
                      strokeWidth={2} 
                      fill="url(#oee30dGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Explanatory footer */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] text-zinc-500 dark:text-zinc-400 gap-2 mt-6">
                <span>Data source: Plant PLC Modbus couplers. Continuous real-time polling active.</span>
                <button
                  onClick={() => setShowOeeTrendModal(false)}
                  className="px-5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-extrabold uppercase border border-zinc-200 dark:border-zinc-700 font-mono text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                >
                  Dismiss Analytics
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
