import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  UserCheck, 
  Clock, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Operator, MaintenanceEvent } from '../types';
import { createMaintenance, updateMaintenance, deleteMaintenance } from '../apiClient';

interface MaintenanceSchedulerViewProps {
  operators: Operator[];
  events: MaintenanceEvent[];
  setEvents: React.Dispatch<React.SetStateAction<MaintenanceEvent[]>>;
}

export default function MaintenanceSchedulerView({ 
  operators,
  events,
  setEvents 
}: MaintenanceSchedulerViewProps) {

  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-06-15');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<string | null>(null);

  // Form states for new event
  const [newMachineName, setNewMachineName] = useState('CNC ALPHA-1');
  const [newMachineCode, setNewMachineCode] = useState('CNC-A1');
  const [newServiceType, setNewServiceType] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTechId, setNewTechId] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Calendar configuration (June 2026)
  const year = 2026;
  const month = 5; // 0-indexed, so 5 = June
  const monthName = "June 2026";
  const daysInMonth = 30;
  const startDayOfWeek = 1; // 1 = Monday (June 1st, 2026 is a Monday)

  const calendarDays = Array.from({ length: daysInMonth }, (_, idx) => {
    const dayNum = idx + 1;
    const dateStr = `2026-06-${dayNum.toString().padStart(2, '0')}`;
    return {
      dayNum,
      dateStr,
      events: events.filter(e => e.dueDate === dateStr)
    };
  });

  // Calculate grid padding cells (pre-June days)
  const paddingBeforeDays = Array.from({ length: startDayOfWeek }, (_, idx) => null);

  const selectedDayEvents = events.filter(e => e.dueDate === selectedDateStr);

  const handleAssignTechnician = async (eventId: string, techId: string) => {
    const updatedEvents = events.map(ev => {
      if (ev.id === eventId) {
        return { 
          ...ev, 
          technicianId: techId || undefined,
          status: ev.status === 'Scheduled' && techId ? 'In Progress' : ev.status
        };
      }
      return ev;
    });

    setEvents(updatedEvents);

    try {
      await updateMaintenance(eventId, {
        technicianId: techId || undefined,
        status: updatedEvents.find(ev => ev.id === eventId)?.status || 'Scheduled'
      });
    } catch (err) {
      console.error(err);
      alert('Could not assign technician. Please retry.');
      setEvents(events);
    }
  };

  const handleUpdateStatus = async (eventId: string, status: any) => {
    const updatedEvents = events.map(ev => {
      if (ev.id === eventId) {
        return { ...ev, status };
      }
      return ev;
    });
    setEvents(updatedEvents);

    try {
      await updateMaintenance(eventId, { status });
    } catch (err) {
      console.error(err);
      alert('Unable to update status. Please try again.');
      setEvents(events);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceType.trim()) return;

    const nEvent: MaintenanceEvent = {
      id: `maint-${Date.now()}`,
      machineName: newMachineName,
      machineCode: newMachineCode,
      serviceType: newServiceType,
      status: 'Scheduled',
      dueDate: selectedDateStr,
      technicianId: newTechId || undefined,
      priority: newPriority,
      notes: newNotes.trim() || undefined
    };

    try {
      await createMaintenance(nEvent);
      setEvents([...events, nEvent]);
      setNewServiceType('');
      setNewNotes('');
      setNewTechId('');
      setNewPriority('medium');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert('Unable to add maintenance event. Please try again.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance schedule block?')) {
      return;
    }

    const prevEvents = events;
    setEvents(events.filter(e => e.id !== id));

    try {
      await deleteMaintenance(id);
    } catch (err) {
      console.error(err);
      alert('Unable to delete maintenance event. Reverting.');
      setEvents(prevEvents);
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterPriority === 'all') return true;
    return e.priority === filterPriority;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Overdue': return 'bg-red-100 text-[#ba1a1a] dark:bg-red-950/40 dark:text-red-400';
      case 'In Progress': return 'bg-amber-100 text-[#b75b00] dark:bg-amber-950/40 dark:text-amber-400';
      case 'Completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';
      default: return 'bg-blue-100 text-[#005ac2] dark:bg-blue-950/30 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#f2f3fd] dark:bg-[#2e3038] py-4 px-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 gap-4">
        <div>
          <h2 className="text-[#191b23] dark:text-white font-extrabold text-base flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#0058be]" />
            <span>Industrial Maintenance & Calibration Scheduler</span>
          </h2>
          <p className="text-xs text-[#424754] dark:text-[#c2c6d6] mt-0.5">
            Coordinate upcoming equipment overhauls, sensor calibrations, and mechanical technician assignments.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="p-2 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-800 rounded-lg text-xs font-bold text-[#191b23] dark:text-white focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">Critical / High</option>
            <option value="medium">Medium</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 4 Cols: Day details & Form */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* Day details view */}
          <div className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-[#ecedf7] dark:border-[#727785]/20 bg-zinc-50 dark:bg-zinc-800/10 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-[#191b23] dark:text-white">
                  Schedule for {selectedDateStr.split('-')[1]}/ {selectedDateStr.split('-')[2]}/2026
                </h3>
                <p className="text-[10px] text-[#727785] font-semibold mt-0.5 uppercase">Daily Services Panel</p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-[#0058be] hover:bg-[#004bb2] text-white rounded-lg text-xs font-bold shadow flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Plan Service
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1">
              {showAddForm ? (
                <form onSubmit={handleAddEvent} className="p-4 bg-zinc-50 dark:bg-[#191b23]/30 border border-[#ecedf7] dark:border-zinc-800 rounded-xl space-y-3 animate-slideDown">
                  <h4 className="text-[11px] font-extrabold uppercase text-[#727785] tracking-wider">Plan New Service Event</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#727785]">Machine</label>
                      <select 
                        value={newMachineName}
                        onChange={(e) => {
                          setNewMachineName(e.target.value);
                          setNewMachineCode(e.target.value === 'CNC ALPHA-1' ? 'SV-102-A1' : e.target.value === 'PRESS DELTA-04' ? 'PR-92' : e.target.value === 'Precision Laser' ? 'LS-004-W1' : 'LT-88');
                        }}
                        className="w-full p-2 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-800 rounded text-xs text-[#191b23] dark:text-white"
                      >
                        <option>CNC ALPHA-1</option>
                        <option>PRESS DELTA-04</option>
                        <option>Precision Laser</option>
                        <option>LATHE SIGMA-1</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#727785]">Priority</label>
                      <select 
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full p-2 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-800 rounded text-xs text-[#191b23] dark:text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High / Critical</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#727785]">Service Tasks / Job Description</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Swapping mechanical linkage gears"
                      value={newServiceType}
                      onChange={(e) => setNewServiceType(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-800 rounded text-xs focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#727785]">Initial Technician</label>
                      <select 
                        value={newTechId}
                        onChange={(e) => setNewTechId(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-800 rounded text-xs text-[#191b23] dark:text-white"
                      >
                        <option value="">-- Select --</option>
                        {operators.map(tech => (
                          <option key={tech.id} value={tech.id}>{tech.name} ({tech.role})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#727785]">Additional Log Notes</label>
                      <input 
                        type="text"
                        placeholder="e.g., replacement parts ordered"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-800 rounded text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="px-3.5 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-[#424754] dark:text-zinc-300 text-xs font-bold rounded-lg hover:opacity-90"
                    >
                      Dismiss
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-1.5 bg-[#0058be] text-white text-xs font-bold rounded-lg hover:opacity-90 shadow-sm"
                    >
                      Add to calendar
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Day Events list */}
              <div className="space-y-4">
                {selectedDayEvents.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-xl">
                    <CalendarIcon className="w-8 h-8 text-[#727785] mx-auto opacity-40 mb-3" />
                    <h5 className="text-xs font-bold text-zinc-400">No scheduled services on this date</h5>
                    <p className="text-[10px] text-zinc-400 mt-1">Select another day on the calendar or click "Plan Service" to log one.</p>
                  </div>
                ) : (
                  selectedDayEvents.map(ev => {
                    const tech = operators.find(o => o.id === ev.technicianId);
                    return (
                      <div key={ev.id} className="p-4 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-800 rounded-xl relative space-y-3 shadow-xs">
                        
                        {/* Header info */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] bg-[#d0e1fb]/60 text-[#005ac2] font-extrabold px-1.5 py-0.5 rounded mr-1.5 uppercase tracking-wide leading-none">{ev.machineCode}</span>
                            <h4 className="text-xs font-extrabold inline-block text-[#191b23] dark:text-white">{ev.machineName}</h4>
                            <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mt-1.5 leading-relaxed">{ev.serviceType}</p>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="text-[#727785] hover:text-[#ba1a1a] p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition shrink-0"
                            title="Delete event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Event Tags */}
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                          
                          {/* Status Badge */}
                          <span className={`${getStatusStyle(ev.status)} px-2.5 py-0.5 rounded-full`}>
                            {ev.status}
                          </span>

                          {/* Priority Badge */}
                          <span className={`px-2 py-0.5 rounded uppercase font-extrabold ${
                            ev.priority === 'high' ? 'bg-red-50 text-red-700 dark:bg-red-950/20' : ev.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-zinc-100 text-[#727785]'
                          }`}>
                            {ev.priority} priorit.
                          </span>

                        </div>

                        {/* Controls: Technician & Action */}
                        <div className="pt-2.5 border-t border-[#ecedf7] dark:border-zinc-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          
                          {/* Tech select allocator */}
                          <div className="space-y-1 w-full sm:w-auto">
                            <label className="text-[9px] font-extrabold text-[#727785] uppercase tracking-wide flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-[#0058be]" />
                              <span>Assign Technician:</span>
                            </label>
                            <select 
                              value={ev.technicianId || ''}
                              onChange={(e) => handleAssignTechnician(ev.id, e.target.value)}
                              className="w-full p-1 bg-white dark:bg-[#13151a] border border-[#ecedf7] dark:border-zinc-700/60 rounded text-[10px] font-bold text-[#191b23] dark:text-white"
                            >
                              <option value="">Unassigned</option>
                              {operators.map(op => (
                                <option key={op.id} value={op.id}>{op.name} ({op.role})</option>
                              ))}
                            </select>
                          </div>

                          {/* Actions status togglers */}
                          <div className="flex gap-1.5 self-end">
                            {ev.status !== 'Completed' ? (
                              <button
                                onClick={() => handleUpdateStatus(ev.id, 'Completed')}
                                className="px-2 py-1 text-[9px] font-extrabold bg-[#0058be] hover:bg-emerald-600 hover:text-white text-white rounded transition uppercase"
                              >
                                Mark Completed
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(ev.id, 'Scheduled')}
                                className="px-2 py-1 text-[9px] font-extrabold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded hover:bg-zinc-300 transition uppercase"
                              >
                                Re-Open
                              </button>
                            )}
                          </div>

                        </div>

                        {/* Extra notes */}
                        {ev.notes && (
                          <div className="p-2 bg-[#d0e1fb]/20 border-l-2 border-[#0058be] rounded text-[10px] text-zinc-500 font-medium italic select-all leading-normal">
                            Note: {ev.notes}
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </section>

        {/* Right 7 Cols: Month calendar view */}
        <section className="lg:col-span-7 bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 p-5 shadow-sm overflow-hidden space-y-4">
          
          {/* Calendar header controller */}
          <div className="flex justify-between items-center border-b border-[#ecedf7] dark:border-[#727785]/20 pb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#0058be]" />
              <h3 className="font-extrabold text-sm text-[#191b23] dark:text-white">{monthName}</h3>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => alert('Calendar schedules before June 2026 are archived in system history.')}
                className="p-1 border border-[#ecedf7] dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => alert('July 2026 schedule drafting is currently locked. Complete current month tasks.')}
                className="p-1 border border-[#ecedf7] dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month calendar grid */}
          <div>
            {/* Week Headers */}
            <div className="grid grid-cols-7 text-center text-[10px] text-[#727785] font-extrabold uppercase tracking-wider mb-2">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1">
              
              {/* Padding cells */}
              {paddingBeforeDays.map((_, idx) => (
                <div key={`padding-${idx}`} className="bg-zinc-50/50 dark:bg-zinc-900/10 border border-transparent rounded aspect-square select-none opacity-40" />
              ))}

              {/* True days */}
              {calendarDays.map((dayObj) => {
                const isSelected = selectedDateStr === dayObj.dateStr;
                const hasOverdue = dayObj.events.some(e => e.status === 'Overdue');
                const hasInProgress = dayObj.events.some(e => e.status === 'In Progress');
                const hasPending = dayObj.events.some(e => e.status === 'Scheduled');
                const hasCompleted = dayObj.events.some(e => e.status === 'Completed');

                return (
                  <button
                    key={dayObj.dayNum}
                    onClick={() => setSelectedDateStr(dayObj.dateStr)}
                    className={`aspect-square p-1.5 border rounded-lg flex flex-col justify-between text-left transition-all relative ${
                      isSelected 
                        ? 'border-[#0058be] bg-[#d0e1fb]/20 text-[#005ac2] font-extrabold focus:outline-none'
                        : 'border-[#ecedf7] dark:border-[#727785]/10 hover:border-[#0058be]/40 bg-white dark:bg-[#1c1d24]/60 hover:bg-zinc-50'
                    }`}
                  >
                    {/* Day number */}
                    <span className="text-xs font-bold">{dayObj.dayNum}</span>

                    {/* Compact Events Indicators bar */}
                    {dayObj.events.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-auto">
                        {dayObj.events.map((e, eIdx) => (
                          <span 
                            key={e.id}
                            className={`w-2 h-2 rounded-full ${
                              e.status === 'Overdue' 
                                ? 'bg-red-500 animate-pulse' 
                                : e.status === 'In Progress' 
                                ? 'bg-amber-500' 
                                : e.status === 'Completed'
                                ? 'bg-emerald-500' 
                                : 'bg-blue-500'
                            }`}
                            title={`${e.machineName}: ${e.serviceType}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}

            </div>
          </div>

          {/* Calendar Color Legend */}
          <div className="flex flex-wrap gap-4 pt-3 border-t border-[#ecedf7] dark:border-zinc-800 text-[10px] font-bold text-[#727785] justify-center sm:justify-start">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0" /> Overdue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shrink-0" /> In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shrink-0" /> Scheduled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0" /> Completed
            </span>
          </div>

        </section>

      </div>

      {/* AI Predicted Upcoming Service Log */}
      <section className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#ecedf7] dark:border-[#727785]/20 pb-4 gap-4">
          <div>
            <h3 className="font-extrabold text-sm text-[#191b23] dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <span className="text-amber-500">🔮</span> Predictive Service Log (Analytics Engine)
            </h3>
            <p className="text-xs text-[#727785] mt-0.5">Predicted maintenance windows calculated from machine wear models, sorted by urgency.</p>
          </div>
          <span className="bg-zinc-100 dark:bg-zinc-850 px-3 py-1 rounded text-[10px] font-mono text-[#727785] font-extrabold">
            Engine Status: ACTIVE
          </span>
        </div>

        {/* 📊 Predictive Failure Urgency Heatmap */}
        <div className="bg-zinc-50 dark:bg-[#1a1b23]/50 rounded-xl p-4 border border-zinc-150/60 dark:border-zinc-800/80 shadow-inner">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-2 border-b border-zinc-200/50 dark:border-zinc-850">
            <div>
              <h4 className="text-xs font-extrabold text-[#191b23] dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>Urgency Heatmap — Machine Downtime Hazards (Next 10 Days)</span>
              </h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Each node forecasts aggregate breakdown risk levels based on thermal, vibration, and duty-cycle strain. Select a node to query.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-[#727785] bg-white dark:bg-zinc-800/40 border border-[#ecedf7] dark:border-zinc-800 p-1 px-2 rounded">
              <span className="w-2 h-2 rounded-sm bg-emerald-500/20 border border-emerald-500/30" /> Low (0-40%)
              <span className="w-2 h-2 rounded-sm bg-yellow-500/20 border border-yellow-500/30 ml-2" /> Med (41-70%)
              <span className="w-2 h-2 rounded-sm bg-amber-500/20 border border-amber-500/30 ml-2" /> High (71-89%)
              <span className="w-2 h-2 rounded-sm bg-red-500/20 border border-red-500/30 ml-2 animate-pulse" /> Critical (&gt;90%)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
            {[
              { date: '2026-06-15', label: 'Mon 15', level: 'CRITICAL', score: 95, failures: 1, details: 'Overdue service warnings + Spindle noise vibration peak triggers high breakdown hazard on CNC ALPHA-1.' },
              { date: '2026-06-16', label: 'Tue 16', level: 'HIGH', score: 72, failures: 1, details: 'PRESS DELTA-04 Hydraulic Fluid pressure spikes above historical standard tolerances during live duty.' },
              { date: '2026-06-17', label: 'Wed 17', level: 'LOW', score: 18, failures: 0, details: 'Clean baseline operations. Normal duty cycles recorded across all line processes.' },
              { date: '2026-06-18', label: 'Thu 18', level: 'HIGH', score: 85, failures: 1, details: 'Precision Laser optical sensors projected dirty feed deviation. Cleansing cycle recommended.' },
              { date: '2026-06-19', label: 'Fri 19', level: 'MEDIUM', score: 48, failures: 0, details: 'Minor mechanical linkage play on MILL GAMMA-2. Safe limits but requires visual monitoring.' },
              { date: '2026-06-20', label: 'Sat 20', level: 'LOW', score: 12, failures: 0, details: 'Low weekend yield plan reducing operational component friction fatigue. Risk state is ideal.' },
              { date: '2026-06-21', label: 'Sun 21', level: 'CRITICAL', score: 94, failures: 2, details: 'Predicted catastrophic cylinder gas pressure decay for PRESS DELTA-04 hydraulic components.' },
              { date: '2026-06-22', label: 'Mon 22', level: 'HIGH', score: 82, failures: 1, details: 'CNC ALPHA-1 servo heat load curves reach wear limits. Predictive bearing re-greasing dispatch advised.' },
              { date: '2026-06-23', label: 'Tue 23', level: 'MEDIUM', score: 55, failures: 1, details: 'Lathe Sigma-1 belts show minor rotational eccentricity under full torque load.' },
              { date: '2026-06-24', label: 'Wed 24', level: 'LOW', score: 32, failures: 0, details: 'Standard tool calibration window. Wear sensors normal.' }
            ].map((dayObj) => {
              const isSel = selectedHeatmapDay === dayObj.date;

              let colorClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20';
              if (dayObj.level === 'CRITICAL') {
                colorClass = 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-500/20';
              } else if (dayObj.level === 'HIGH') {
                colorClass = 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20';
              } else if (dayObj.level === 'MEDIUM') {
                colorClass = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-500/20';
              }

              return (
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  key={dayObj.date}
                  onClick={() => setSelectedHeatmapDay(isSel ? null : dayObj.date)}
                  className={`p-2 rounded-lg border text-center flex flex-col justify-between items-center transition-all cursor-pointer relative h-[68px] ${colorClass} ${
                    isSel ? 'ring-2 ring-blue-500 dark:ring-blue-400 border-transparent bg-white dark:bg-[#1a1b23] shadow-md' : ''
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-tight block">{dayObj.label}</span>
                  <span className="text-sm font-extrabold leading-none block my-0.5">{dayObj.score}%</span>
                  <span className="text-[8px] font-bold block opacity-70 uppercase tracking-wider">{dayObj.level}</span>

                  {dayObj.failures > 0 && (
                    <span className="absolute -top-1.5 -right-1 bg-red-600 text-white rounded-full w-3.5 h-3.5 text-[8px] font-bold flex items-center justify-center border border-white dark:border-zinc-800">
                      {dayObj.failures}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {selectedHeatmapDay && (() => {
              const detailsList = [
                { date: '2026-06-15', title: 'June 15 (Current)', details: 'Alpha-1 spindle bearing wear exceeding 85%. Overdue status triggers failure risk alert.' },
                { date: '2026-06-16', title: 'June 16 (Day +1)', details: 'Delta-04 pressure seals show wear deviation under load.' },
                { date: '2026-06-17', title: 'June 17 (Day +2)', details: 'Optimized operation window. No critical threshold alignments needed.' },
                { date: '2026-06-18', title: 'June 18 (Day +3)', details: 'Laser optical lens recalibration schedule alignment.' },
                { date: '2026-06-19', title: 'June 19 (Day +4)', details: 'Minor mechanical linkage play on MILL GAMMA-2. Safe limits but requires visual monitoring.' },
                { date: '2026-06-20', title: 'June 20 (Day +5)', details: 'Low weekend yield plan reducing operational component friction fatigue. Risk state is ideal.' },
                { date: '2026-06-21', title: 'June 21 (Day +6)', details: 'Predicted catastrophic cylinder gas pressure decay for PRESS DELTA-04 hydraulic components.' },
                { date: '2026-06-22', title: 'June 22 (Day +7)', details: 'CNC ALPHA-1 servo heat load curves reach wear limits. Predictive bearing re-greasing dispatch advised.' },
                { date: '2026-06-23', title: 'June 23 (Day +8)', details: 'Lathe Sigma-1 belts show minor rotational eccentricity under full torque load.' },
                { date: '2026-06-24', title: 'June 24 (Day +9)', details: 'Standard tool calibration window. Wear sensors normal.' }
              ];
              const match = detailsList.find(d => d.date === selectedHeatmapDay);
              if (!match) return null;
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="mt-3 p-3 bg-white dark:bg-[#1a1b23] border border-[#ecedf7] dark:border-zinc-800 rounded-lg"
                >
                  <div className="flex justify-between items-center pb-1 border-b border-[#ecedf7] dark:border-zinc-850">
                    <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-300">Live AI Hazard Intel</span>
                    <button 
                      onClick={() => setSelectedHeatmapDay(null)}
                      className="text-[10px] font-bold text-zinc-400 hover:text-black dark:hover:text-white"
                    >
                      Dismiss ×
                    </button>
                  </div>
                  <div className="mt-1.5">
                    <h5 className="text-[11px] font-black text-zinc-900 dark:text-white">{match.title} Diagnosis:</h5>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed font-medium">
                      {match.details}
                    </p>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: "pred-1",
              machineName: "PRESS DELTA-04",
              code: "PR-92",
              recommendedAction: "Hydraulic Fluid & Valve seal replacement (Critical Wear)",
              predictedWindow: "In 120 operating hours (Day +6)",
              urgency: "CRITICAL",
              riskIndex: 94,
              sourceFactor: "vibration drift & seal degradation trajectory"
            },
            {
              id: "pred-2",
              machineName: "CNC ALPHA-1",
              code: "SV-102-A1",
              recommendedAction: "Servo Alignment & Spindle Recalibration Task",
              predictedWindow: "In 168 operating hours (Day +8)",
              urgency: "HIGH",
              riskIndex: 82,
              sourceFactor: "thermal dissipation decay"
            },
            {
              id: "pred-3",
              machineName: "LATHE SIGMA-1",
              code: "LT-88",
              recommendedAction: "Main bearing replacement & belt alignment",
              predictedWindow: "In 168 operating hours (Day +8)",
              urgency: "MEDIUM",
              riskIndex: 78,
              sourceFactor: "eccentric rotation displacement"
            },
            {
              id: "pred-4",
              machineName: "MILL GAMMA-2",
              code: "ML-02",
              recommendedAction: "Coolant line flush & valve clearance audit",
              predictedWindow: "In 240 operating hours (Day +10)",
              urgency: "LOW",
              riskIndex: 35,
              sourceFactor: "stable fluid displacement ratios"
            }
          ].map((pred) => {
            const urgencyStyles = {
              CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/30',
              HIGH: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
              MEDIUM: 'bg-blue-500/10 text-blue-600 border-[#005ac2]/10',
              LOW: 'bg-zinc-100 text-zinc-500 border-zinc-200'
            }[pred.urgency] || 'bg-zinc-100 text-zinc-500 border-zinc-200';

            const handleScheduleFromPrediction = () => {
              const dateOffset = pred.id === 'pred-1' ? 6 : pred.id === 'pred-2' ? 8 : pred.id === 'pred-3' ? 8 : 10;
              const futureDateStr = `2026-06-${(15 + dateOffset).toString().padStart(2, '0')}`;
              
              if (events.some(e => e.machineCode === pred.code && e.dueDate === futureDateStr)) {
                alert(`${pred.machineName} standard service is already logged for ${futureDateStr}.`);
                return;
              }

              const nEvent: MaintenanceEvent = {
                id: `maint-pred-${Date.now()}`,
                machineName: pred.machineName,
                machineCode: pred.code,
                serviceType: pred.recommendedAction,
                status: 'Scheduled',
                dueDate: futureDateStr,
                priority: pred.urgency === 'CRITICAL' || pred.urgency === 'HIGH' ? 'high' : pred.urgency === 'MEDIUM' ? 'medium' : 'low',
                notes: `Predicted maintenance window raised by live analytics due to ${pred.sourceFactor}.`
              };

              setEvents([...events, nEvent]);
              setSelectedDateStr(futureDateStr);
              alert(`AI Predictive Maintenance Dispatch Successful! Dispatched task: "${pred.recommendedAction}" for ${pred.machineName}, scheduled on ${futureDateStr}.`);
            };

            return (
              <motion.div 
                whileHover={{ y: -2 }}
                key={pred.id} 
                className="flex flex-col justify-between p-4 bg-zinc-50/50 dark:bg-[#1c1d24]/45 border border-zinc-100 dark:border-[#727785]/15 rounded-xl hover:shadow-md transition-all space-y-3"
              >
                <div className="space-y-1.5 animate-fadeIn">
                  <div className="flex justify-between items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-zinc-400 font-mono">{pred.code}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full uppercase leading-none ${urgencyStyles}`}>
                      ● {pred.urgency}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-150 leading-tight">
                    {pred.machineName}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    {pred.recommendedAction}
                  </p>
                </div>

                <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-850 pt-2.5">
                  <div className="flex flex-col gap-1 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                    <span>Predicted Window: <strong className="text-zinc-700 dark:text-zinc-300 font-extrabold">{pred.predictedWindow}</strong></span>
                    <span>Risk Index: <strong className="text-red-500 font-extrabold">{pred.riskIndex}%</strong></span>
                    <span className="truncate">Derived from: <span className="text-zinc-500 lowercase font-medium italic">{pred.sourceFactor}</span></span>
                  </div>

                  <button
                    onClick={handleScheduleFromPrediction}
                    className="w-full mt-1.5 bg-[#0058be] hover:bg-opacity-90 text-[10px] text-white font-extrabold uppercase tracking-widest py-1.5 rounded-lg text-center transition cursor-pointer"
                  >
                    Schedule Service
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
