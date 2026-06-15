import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  AlertOctagon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X,
  UserCheck2,
  Filter,
  Check,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { Operator, ShiftAssignment } from '../types';

const PLANNING_MACHINES = [
  { name: 'CNC ALPHA-1', baseline: 85 },
  { name: 'PRESS DELTA-04', baseline: 82 },
  { name: 'LATHE SIGMA-1', baseline: 80 },
  { name: 'MILL GAMMA-2', baseline: 75 }
];

const SKILL_EFFICIENCIES: Record<string, number> = {
  'Expert': 96,
  'Intermediate': 82,
  'Beginner': 65,
  'None': 40
};

interface ShiftPlanningViewProps {
  operators: Operator[];
  setOperators: (ops: Operator[]) => void;
  shiftAssignments: ShiftAssignment[];
  setShiftAssignments: (sa: ShiftAssignment[]) => void;
}

export default function ShiftPlanningView({ 
  operators, 
  setOperators, 
  shiftAssignments, 
  setShiftAssignments 
}: ShiftPlanningViewProps) {
  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(null);
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);

  const lines = ['Line A', 'Line B', 'Line C'];
  const days = ['MON 23', 'TUE 24', 'WED 25', 'THU 26', 'FRI 27', 'SAT 28', 'SUN 29'];

  const handleSelectOperator = (id: string) => {
    setSelectedOperatorId(selectedOperatorId === id ? null : id);
  };

  const handleSlotClick = (line: string, day: string) => {
    if (!selectedOperatorId) {
      alert('Select an Available Operator from the left panel first, then click any schedule slot to assign them!');
      return;
    }

    const o = operators.find(op => op.id === selectedOperatorId);
    if (!o) return;

    if (o.status === 'offline') {
      alert(`${o.name} is currently offline/on-break and cannot be assigned to active assembly lines.`);
      return;
    }

    // Determine machine expertise level of selected operator for this line
    const requiredMachine = line === 'Line A' 
      ? 'CNC ALPHA-1' 
      : line === 'Line B' 
      ? 'PRESS DELTA-04' 
      : 'LATHE SIGMA-1'; // Line C primary
    const currentExp = o.expertise?.[requiredMachine] || 'None';
    if (currentExp === 'None' || currentExp === 'Beginner') {
      const confirmAssign = window.confirm(
        `Scheduling Recommendation Alert:\n\n${o.name} has a "${currentExp}" level of expertise for "${requiredMachine}" (primary machine on ${line}).\n\nAre you sure you want to assign them to this production line?`
      );
      if (!confirmAssign) return;
    }

    // Check if slot has already been assigned to this operator
    const alreadyExists = shiftAssignments.some(sa => sa.line === line && sa.day === day && sa.operatorId === selectedOperatorId);
    if (alreadyExists) {
      return;
    }

    const nAssignment: ShiftAssignment = {
      id: `sa-${Date.now()}`,
      line,
      day,
      operatorId: selectedOperatorId
    };

    setShiftAssignments([...shiftAssignments, nAssignment]);
    setSelectedOperatorId(null);
  };

  const handleRemoveAssignment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShiftAssignments(shiftAssignments.filter(sa => sa.id !== id));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full items-start">
      
      {/* Left panel Available Operators */}
      <section className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-[#ecedf7] dark:border-[#727785]/20 pb-4">
          <h3 className="font-bold text-[#191b23] dark:text-white text-sm">Available Operators</h3>
          <span className="bg-[#0058be] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            12 Online
          </span>
        </div>

        <p className="text-[11px] text-[#727785] font-semibold leading-relaxed">
          Select an operator here, then click a production line calendar cell on the right to assign them.
        </p>

        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
          {operators.map((op) => {
            const isSelected = selectedOperatorId === op.id;
            return (
              <button 
                key={op.id}
                onClick={() => handleSelectOperator(op.id)}
                className={`p-3 border rounded-xl text-left transition-all ${
                  isSelected 
                    ? 'border-[#0058be] bg-[#d0e1fb]/20 dark:bg-[#505f76]/40' 
                    : 'border-[#ecedf7] dark:border-[#727785]/20 bg-zinc-50/50 dark:bg-zinc-800/20'
                } ${op.status === 'offline' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#d0e1fb] text-[#005ac2] font-extrabold flex items-center justify-center text-xs">
                    {op.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold">{op.name}</h4>
                    <span className="text-[10px] text-[#727785] font-medium block">{op.level}</span>
                  </div>
                </div>
                
                {op.tags && op.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {op.tags.map((tg, idx) => (
                      <span key={idx} className="text-[9px] bg-white dark:bg-zinc-800 border border-[#ecedf7] dark:border-[#727785]/20 px-1 py-0.5 rounded text-[#727785] font-medium">
                        {tg}
                      </span>
                    ))}
                  </div>
                )}

                {op.expertise && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col gap-1">
                    <p className="text-[8.5px] font-extrabold text-[#727785] uppercase tracking-wider leading-none">Machine Competence</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(op.expertise).map(([mach, lvl]) => (
                        lvl !== 'None' && (
                          <span 
                            key={mach} 
                            className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded leading-none ${
                              lvl === 'Expert' 
                                ? 'bg-[#d0e1fb]/60 text-[#005ac2] dark:bg-sky-950/40 dark:text-sky-300' 
                                : 'bg-zinc-100 text-[#424754] dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                          >
                            {mach.split(' ')[0]}: {lvl}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {op.status === 'offline' && (
                  <p className="text-[10px] text-[#ba1a1a] font-bold flex items-center gap-1 mt-1.5 p-1 bg-[#ffdad6]/20 border border-[#ffdad6]/40 rounded">
                    <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                    <span>On Break / Offline</span>
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Grid calendar Section */}
      <section className="xl:col-span-3 flex flex-col gap-6">
        
        {/* shift coverage stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-[#2e3038] p-4 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#727785] font-bold uppercase tracking-wider">Shift Coverage</p>
              <h4 className="text-2xl font-extrabold mt-1 text-[#191b23] dark:text-white">94%</h4>
            </div>
            <Users className="w-7 h-7 text-[#0058be]" />
          </div>

          <div className="bg-white dark:bg-[#2e3038] p-4 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#727785] font-bold uppercase tracking-wider">Labor Hours</p>
              <h4 className="text-2xl font-extrabold mt-1 text-[#191b23] dark:text-white">1,240</h4>
            </div>
            <Clock className="w-7 h-7 text-[#505f76]" />
          </div>

          <div className="bg-white dark:bg-[#2e3038] p-4 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex items-center justify-between bg-[#ffdad6]/10">
            <div>
              <p className="text-[10px] text-[#ba1a1a] font-bold uppercase tracking-wider">Open Slots</p>
              <h4 className="text-2xl font-extrabold mt-1 text-[#ba1a1a]">4</h4>
            </div>
            <AlertOctagon className="w-7 h-7 text-[#ba1a1a]" />
          </div>

          <div className="bg-white dark:bg-[#2e3038] p-4 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#924700] font-bold uppercase tracking-wider">Overtime Risk</p>
              <h4 className="text-2xl font-extrabold mt-1 text-[#924700]">Low</h4>
            </div>
            <AlertTriangle className="w-7 h-7 text-[#924700]" />
          </div>

        </div>

        {/* Schedule grid table calendar */}
        <div className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm overflow-hidden flex flex-col justify-between">
          
          {/* Calendar controller */}
          <div className="p-5 border-b border-[#ecedf7] dark:border-[#727785]/20 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => alert('Viewing previous planning week logs...')}
                className="p-1 rounded-full border border-[#ecedf7] dark:border-[#727785]/20 hover:bg-[#e6e7f2] dark:hover:bg-[#2e3038]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="font-extrabold text-sm">Oct 23 - Oct 29, 2026</h2>
              <button 
                onClick={() => alert('Viewing next week empty template...')}
                className="p-1 rounded-full border border-[#ecedf7] dark:border-[#727785]/20 hover:bg-[#e6e7f2] dark:hover:bg-[#2e3038]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => alert('Opening schedule search filter popover...')}
                className="px-3 py-1.5 border border-[#ecedf7] dark:border-[#727785]/20 rounded-lg text-xs font-bold hover:bg-zinc-100 flex items-center gap-1 text-[#424754]"
              >
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
              <button 
                onClick={() => alert('Success! Published shift plans sync live with digital plant terminals.')}
                className="px-3.5 py-1.5 bg-[#0058be] hover:opacity-90 rounded-lg text-xs font-bold text-white shadow"
              >
                Publish Schedule
              </button>
            </div>
          </div>

          {/* Table calendar grids */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f2f3fd]/40 dark:bg-[#191b23]/30 text-[10px] text-[#727785] font-extrabold uppercase tracking-wider border-b border-[#ecedf7] dark:border-[#727785]/20">
                  <th className="px-4 py-3 text-left w-40">Production Line</th>
                  {days.map((day, idx) => (
                    <th key={idx} className="px-2 py-3 text-center">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ecedf7] dark:divide-[#727785]/20">
                {lines.map((ln, idx) => (
                  <tr key={idx}>
                    
                    {/* Line Title */}
                    <td className="px-4 py-4 bg-zinc-50 dark:bg-zinc-800/10 font-bold border-r border-[#ecedf7] dark:border-[#727785]/20">
                      <p className="text-xs">{ln} {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}</p>
                      <p className="text-[10px] text-[#727785] font-medium leading-none mt-1">
                        {idx === 0 ? 'Hydraulic Assy' : idx === 1 ? 'Chassis Weld' : 'Quality Control'}
                      </p>
                    </td>

                    {/* Weekly Day cells */}
                    {days.map((day, dIdx) => {
                      // Grab active assignments for this slot
                      const slotAssignments = shiftAssignments.filter(
                        sa => sa.line === ln && sa.day === day
                      );

                      // Demo warning triggers
                      const isLineATuesday = ln === 'Line A' && day === 'TUE 24';
                      const isLineCTuesday = ln === 'Line C' && day === 'MON 23';

                      return (
                        <td 
                          key={dIdx}
                          onClick={() => handleSlotClick(ln, day)}
                          className={`p-1.5 border-r border-[#ecedf7] dark:border-[#727785]/20 min-h-[110px] align-top w-28 hover:bg-[#e6e7f2]/10 transition-colors cursor-pointer relative ${
                            isLineATuesday ? 'bg-red-50/20' : isLineCTuesday ? 'bg-amber-50/10' : ''
                          }`}
                        >
                          <div className="space-y-1">
                            {slotAssignments.map((asg) => {
                              const opObj = operators.find(o => o.id === asg.operatorId);
                              if (!opObj) return null;
                              return (
                                <div 
                                  key={asg.id}
                                  className="p-1 px-1.5 rounded text-[10px] bg-sky-100 dark:bg-[#2170e4]/30 border border-[#2170e4]/40 flex items-center justify-between font-bold"
                                >
                                  <span className="truncate">{opObj.name}</span>
                                  <button 
                                    onClick={(e) => handleRemoveAssignment(asg.id, e)}
                                    className="p-0.5 rounded-full hover:bg-[#2170e4]/20 transition-colors ml-1"
                                    title="Unassign shift"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              );
                            })}

                            {/* Warnings/Indicators mocks */}
                            {isLineATuesday && slotAssignments.length === 0 && (
                              <div className="p-1.5 rounded border border-dashed border-red-300 text-center flex flex-col items-center justify-center h-full min-h-[60px]">
                                <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                                <span className="text-[9px] text-[#ba1a1a] font-bold uppercase tracking-wider leading-none mt-1">
                                  Gap: 1 Tech
                                </span>
                              </div>
                            )}

                            {isLineCTuesday && slotAssignments.length > 0 && (
                              <p className="text-[9px] text-[#b75b00] font-bold text-center bg-[#ffdcc6]/20 py-0.5 rounded leading-none mt-2">
                                Overtime Warn
                              </p>
                            )}

                            {/* Blank Slot placeholder */}
                            {slotAssignments.length === 0 && !isLineATuesday && (
                              <div className="h-full min-h-[65px] border border-dashed border-transparent hover:border-zinc-300/40 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <Plus className="w-3.5 h-3.5 text-[#727785]" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </section>

      {/* 📊 Interactive Operator-Machine Efficiency Heatmap Matrix */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.25 }}
        className="col-span-1 xl:col-span-4 bg-white dark:bg-[#2e3038] p-6 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col gap-4 mt-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-[#ecedf7] dark:border-[#727785]/10">
          <div>
            <h3 className="font-bold text-[#191b23] dark:text-white text-base flex items-center gap-2">
              <span>📊</span>
              <span>Machine-Operator Efficiency Pairing Heatmap</span>
            </h3>
            <p className="text-xs text-[#727785] dark:text-zinc-400 mt-1">
              Cross-examination of operator skill ratings compared against baseline machine quotas. Dark Red elements indicate pairings that fall significantly below recommended standards.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-red-50 text-red-700 dark:bg-red-950/25 dark:text-red-300 border border-red-200 dark:border-red-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Critically Below Target (&lt; -10%)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-300 border border-amber-200 dark:border-amber-900/10">
              Slightly Below (&lt; 0%)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-950/25">
              Target Satisfied (&gt;= 0%)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#ecedf7] dark:border-[#727785]/10">
                <th className="py-3 px-4 font-bold text-[#727785] uppercase tracking-wider w-44">Operator Details</th>
                {PLANNING_MACHINES.map(mach => (
                  <th key={mach.name} className="py-3 px-4 font-bold text-[#727785] uppercase tracking-wider text-center">
                    <div>{mach.name}</div>
                    <div className="text-[10px] font-mono text-zinc-400 normal-case">Baseline Quota: {mach.baseline}%</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {operators.map(op => (
                <tr key={op.id} className="border-b border-[#ecedf7] dark:border-[#727785]/5 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#191b23] dark:text-white flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#d0e1fb] dark:bg-blue-950/40 text-[#005ac2] dark:text-[#adc6ff] font-extrabold flex items-center justify-center text-xs uppercase shrink-0">
                      {op.initials}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">{op.name}</div>
                      <div className="text-[9px] text-zinc-400 font-medium">{op.role}</div>
                    </div>
                  </td>
                  {PLANNING_MACHINES.map(mach => {
                    const skillLevel = op.expertise?.[mach.name] || 'None';
                    const efficiency = SKILL_EFFICIENCIES[skillLevel];
                    const delta = efficiency - mach.baseline;
                    const isSignificantlyBelow = delta <= -10;
                    
                    let bgClass = "bg-emerald-50 dark:bg-emerald-950/15 border-emerald-100 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-300";
                    if (delta < 0 && delta > -10) {
                      bgClass = "bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/10 text-amber-700 dark:text-amber-300";
                    } else if (isSignificantlyBelow) {
                      bgClass = "bg-red-50 dark:bg-rose-950/20 border-red-200 dark:border-rose-900/20 text-red-700 dark:text-rose-400";
                    }

                    return (
                      <td key={mach.name} className="p-2 text-center">
                        <div className={`mx-auto p-2.5 rounded-lg border flex flex-col justify-center items-center w-[150px] transition-all relative ${bgClass}`}>
                          {isSignificantlyBelow && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-0.5 rounded-full text-[8px] animate-pulse" title="Significantly Below Baseline!">
                              ⚠️
                            </span>
                          )}
                          <div className="font-mono font-extrabold text-sm">{efficiency}%</div>
                          <div className="text-[9px] font-bold tracking-tight uppercase flex items-center gap-1 mt-0.5 opacity-90">
                            <span>Rating:</span>
                            <span className="font-extrabold">{skillLevel}</span>
                          </div>
                          <div className="text-[9px] font-mono font-bold mt-1.5 px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-zinc-900/40 select-none">
                            {delta >= 0 ? `+${delta}% above` : `${delta}% below`}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

    </div>
  );
}
