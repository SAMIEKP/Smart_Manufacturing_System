import React, { useState } from 'react';
import { 
  Building, 
  Search, 
  FileCheck2, 
  Plus, 
  RefreshCw, 
  Sliders, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  X,
  FileText,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InspectionLog } from '../types';
import { createInspection } from '../apiClient';

interface QualityReportsViewProps {
  inspections: InspectionLog[];
  setInspections: (logs: InspectionLog[]) => void;
}

export default function QualityReportsView({ inspections, setInspections }: QualityReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [newPartId, setNewPartId] = useState('CH-9943-Y');
  const [newType, setNewType] = useState('Weld Integrity');
  const [newStatus, setNewStatus] = useState<'PASS' | 'FAIL' | 'REWORK'>('PASS');
  const [newSeverity, setNewSeverity] = useState<'N/A' | 'MINOR' | 'CRITICAL'>('N/A');
  const [newLine, setNewLine] = useState('Line A');
  const [newCycleTime, setNewCycleTime] = useState(45);

  // Calculate Running Line Averages
  const lineSums: Record<string, number> = {};
  const lineCounts: Record<string, number> = {};
  inspections.forEach(item => {
    const ln = item.line || 'Line A';
    const cyc = item.cycleTime || (ln === 'Line A' ? 45 : ln === 'Line B' ? 50 : 40);
    lineSums[ln] = (lineSums[ln] || 0) + cyc;
    lineCounts[ln] = (lineCounts[ln] || 0) + 1;
  });
  const lineAverages: Record<string, number> = {};
  Object.keys(lineSums).forEach(ln => {
    lineAverages[ln] = lineSums[ln] / lineCounts[ln];
  });

  const filteredInspections = inspections.filter(item => 
    item.partId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = new Date();
    const timestamp = d.toTimeString().split(' ')[0]; // HH:MM:SS

    const newLog: InspectionLog = {
      id: `insp-${Date.now()}`,
      timestamp,
      partId: newPartId,
      type: newType,
      status: newStatus,
      severity: newSeverity,
      line: newLine,
      cycleTime: Number(newCycleTime)
    };

    try {
      await createInspection(newLog);
      setInspections([newLog, ...inspections]);
      setIsModalOpen(false);
      setNewPartId(`CH-${Math.floor(Math.random() * 9000 + 1000)}-Z`);
      setNewType('Weld Integrity');
      setNewStatus('PASS');
      setNewSeverity('N/A');
    } catch (err) {
      console.error(err);
      alert('Failed to save inspection log. Please try again.');
    }
  };

  const handleExportPDF = () => {
    alert('Generating consolidated manufacturing quality certificate pdf of ongoing shift...');
  };

  const handleExportCSV = () => {
    if (!inspections || inspections.length === 0) {
      alert('No inspection logs available to export.');
      return;
    }
    
    // Generate CSV content
    const headers = ['ID', 'Timestamp', 'Part ID', 'Inspection Type', 'Status', 'Severity'];
    const rows = inspections.map(item => [
      item.id,
      item.timestamp,
      item.partId,
      item.type,
      item.status,
      item.severity
    ]);
    
    // Format rows safely with double quotes
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Quality_Inspection_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#191b23] dark:text-white">Quality Performance Overview</h2>
          <p className="text-xs text-[#727785] font-semibold mt-1">Reporting Period: Today, Oct 24, 2026</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select 
            onChange={(e) => alert(`Selected filter changed: ${e.target.value}`)}
            className="bg-white dark:bg-[#2e3038] border border-[#ecedf7] dark:border-[#727785]/20 rounded-lg text-xs font-bold p-2.5 text-[#424754]"
          >
            <option>All Production Lines</option>
            <option>Line A - Chassis Assembly</option>
            <option>Line B - Paint Shop</option>
            <option>Line C - Powertrain</option>
          </select>

          <button 
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-[#505f76] hover:bg-slate-600 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={handleExportPDF}
            className="px-4 py-2.5 bg-[#0058be] hover:opacity-90 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </section>

      {/* KPI Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Yield card */}
        <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Yield Rate</span>
            <TrendingUp className="w-4 h-4 text-[#0058be]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0058be] dark:text-[#adc6ff]">98.4%</span>
            <span className="text-xs font-bold text-emerald-600">+1.2% this shift</span>
          </div>
          <div className="mt-4 h-1 w-full bg-[#f2f3fd] dark:bg-[#191b23] rounded-full overflow-hidden">
            <div className="h-full bg-[#0058be] rounded-full" style={{ width: '98.4%' }} />
          </div>
        </div>

        {/* Scrap count */}
        <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Scrap Count</span>
            <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#191b23] dark:text-white">12</span>
            <span className="text-xs font-bold text-emerald-600">-4 units reduction</span>
          </div>
          <p className="text-[10px] text-[#727785] font-semibold mt-4">
            Target parameter: &lt; 20 units/shift
          </p>
        </div>

        {/* Rework Rate */}
        <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Rework Rate</span>
            <Sliders className="w-4 h-4 text-[#924700]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#191b23] dark:text-white">1.2%</span>
            <span className="text-xs font-bold text-emerald-600">Stable</span>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-[#727785]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Optimal continuous quality stream active</span>
          </div>
        </div>

      </section>

      {/* Defect Pareto versus Video Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Defect Pareto chart representation */}
        <div className="lg:col-span-3 bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 p-5 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-sm text-[#191b23] dark:text-white pb-3 border-b border-[#ecedf7] dark:border-[#727785]/20">
            Defect Distribution (Pareto)
          </h3>
          
          <div className="h-[200px] flex items-end justify-between gap-4 mt-6">
            
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-[#2170e4] rounded-t-sm relative group transition-all duration-300 hover:brightness-105" style={{ height: '42%' }}>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#191b23] text-white text-[10px] px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                  42% Flaws
                </div>
              </div>
              <span className="text-[9px] font-bold text-[#727785] whitespace-nowrap uppercase">Welding</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-[#d0e1fb] dark:bg-[#505f76] rounded-t-sm relative group transition-all duration-300 hover:brightness-105" style={{ height: '18%' }}>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#191b23] text-white text-[10px] px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                  18% Scratches
                </div>
              </div>
              <span className="text-[9px] font-bold text-[#727785] whitespace-nowrap uppercase">Scratches</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-[#d0e1fb] dark:bg-[#505f76] rounded-t-sm relative group transition-all duration-300 hover:brightness-105" style={{ height: '12%' }}>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#191b23] text-white text-[10px] px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                  12% Align
                </div>
              </div>
              <span className="text-[9px] font-bold text-[#727785] whitespace-nowrap uppercase">Align</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-[#d0e1fb] dark:bg-[#505f76] rounded-t-sm relative group transition-all duration-300 hover:brightness-105" style={{ height: '9%' }}>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#191b23] text-white text-[10px] px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                  9% Seal
                </div>
              </div>
              <span className="text-[9px] font-bold text-[#727785] whitespace-nowrap uppercase">Seals</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-[#ecedf7] dark:bg-zinc-700 rounded-t-sm relative group transition-all duration-300 hover:brightness-105" style={{ height: '19%' }}>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#191b23] text-white text-[10px] px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                  19% Others
                </div>
              </div>
              <span className="text-[9px] font-bold text-[#727785] whitespace-nowrap uppercase">Others</span>
            </div>

          </div>
        </div>

        {/* Video feed illustration */}
        <div className="lg:col-span-2 relative rounded-xl overflow-hidden shadow-sm group min-h-[250px]">
          <img 
            alt="Robotic Welding inspector video"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhxoDnrw84pb14XCkrLzO3qcJ52_UQL0LNslf9wL6BZUCRD0KIMpjIbVSqbQq6HVCev4eSqQPH-WWZcZ_tTwtDJ1fsxe_0W-jTKvAxI8P3mWnRLW2UpUe3LxWnXnDwdToPB4Y8taDRX9xL4U6Z3INtfqDMnHxpT02v5VZLcJuIV120mTloQtG76EwDIx1_K-CL2Vt-T8K5zsTIcRLM7mCXpdSLvtZv9jjdxQwtUzBNyU67gXJQ-wadN3TYol8Yyr25e_5603SYwaU"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#191b23] to-transparent p-5 flex flex-col justify-end">
            <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Live Inspection Feed</span>
            <h4 className="font-bold text-sm text-white mt-1">Line A - Weld Station 04</h4>
            <div className="flex items-center gap-2 mt-3 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#0058be] animate-pulse" />
              <span>Real-time scan cycle: Passed v2.4.1</span>
            </div>
          </div>
        </div>

      </section>

      {/* Detailed Table Inspection Logs */}
      <section className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table header filter controllers */}
        <div className="p-5 border-b border-[#ecedf7] dark:border-[#727785]/20 bg-zinc-50 dark:bg-zinc-800/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-sm text-[#191b23] dark:text-white">Detailed Inspection Log</h3>
          
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#727785] absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Filter by Part ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/40 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            />
          </div>
        </div>

        {/* Table items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#f2f3fd]/40 dark:bg-[#191b23]/30 border-b border-[#ecedf7] dark:border-[#727785]/20 text-[10px] text-[#727785] font-extrabold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Part ID</th>
                <th className="px-5 py-3">Line</th>
                <th className="px-5 py-3">Inspection Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Cycle Time</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ecedf7] dark:divide-[#191b23]/30 text-xs">
              {filteredInspections.map((item, idx) => {
                const ln = item.line || 'Line A';
                const cyc = item.cycleTime || (ln === 'Line A' ? 45 : ln === 'Line B' ? 50 : 40);
                const runningLineAvg = lineAverages[ln] || (ln === 'Line A' ? 45 : ln === 'Line B' ? 50 : 40);
                const deviationRatio = Math.abs(cyc - runningLineAvg) / runningLineAvg;
                const isDeviating = deviationRatio > 0.20;
                const deviationPercent = Math.round(deviationRatio * 100);

                return (
                  <tr 
                    key={idx} 
                    className={`transition-colors relative ${
                      isDeviating 
                        ? 'bg-amber-50 dark:bg-amber-950/15 border-l-2 border-l-amber-500 hover:bg-amber-100/60 dark:hover:bg-amber-950/25' 
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/10'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-semibold text-[#727785]">{item.timestamp}</td>
                    <td className="px-5 py-3.5 font-bold text-[#191b23] dark:text-white">
                      <div className="flex items-center gap-1.5">
                        {item.partId}
                        {isDeviating && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Cycle deviation flagged" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-zinc-600 dark:text-zinc-300 font-mono text-[10px] uppercase">
                      {ln}
                    </td>
                    <td className="px-5 py-3.5 font-medium">{item.type}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        item.status === 'PASS' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' 
                          : item.status === 'FAIL' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400' 
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'PASS' ? 'bg-emerald-500' : item.status === 'FAIL' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-[10px] uppercase">
                      {item.severity === 'CRITICAL' ? (
                        <span className="text-[#ba1a1a]">{item.severity}</span>
                      ) : item.severity === 'MINOR' ? (
                        <span className="text-[#b75b00]">{item.severity}</span>
                      ) : (
                        <span className="text-[#727785]">{item.severity}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-semibold">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                        <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200">{cyc}s</span>
                        {isDeviating && (
                          <span 
                            className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded leading-none border border-amber-200 dark:border-amber-900/40 inline-block whitespace-nowrap" 
                            title={`Deviates by ${deviationPercent}% from the running average for ${ln} (${Math.round(runningLineAvg)}s)`}
                          >
                            ⚠️ {deviationPercent}% DEVIATION
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[#0058be] dark:text-[#adc6ff]">
                      <button 
                        onClick={() => alert(`Part details: ${item.partId}\nLine: ${ln}\nInspection parameters: ${item.type}\nCycle Time: ${cyc}s (Average: ${Math.round(runningLineAvg)}s)\nStatus: ${item.status}`)}
                        className="hover:underline"
                      >
                        {item.status === 'FAIL' ? 'Rework Log' : 'View Specs'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInspections.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-xs text-[#727785] font-semibold">
                    No inspection parameters match the filter term
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginate indicator */}
        <div className="p-4 border-t border-[#ecedf7] dark:border-[#727785]/20 flex justify-between items-center text-xs font-semibold text-[#727785]">
          <span>Showing {filteredInspections.length} of {inspections.length} entries</span>
          <div className="flex gap-2">
            <button className="p-1 rounded border border-[#ecedf7] dark:border-[#727785]/20 hover:bg-zinc-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="bg-[#0058be] text-white px-3 py-1 rounded text-[11px] font-bold">1</span>
            <button className="p-1 rounded border border-[#ecedf7] dark:border-[#727785]/20 hover:bg-zinc-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </section>

      {/* Floating Entry FAB context */}
      <div className="fixed bottom-6 right-[300px] z-30">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2.5 bg-[#0058be] text-white px-5 py-3.5 rounded-full hover:scale-105 active:scale-95 shadow-xl transition-all font-bold text-xs"
        >
          <Plus className="w-[18px] h-[18px]" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* Dynamic Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#191b23]/60 dark:bg-[#191b23]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 text-[#191b23] dark:text-white"
            >
              <div className="flex justify-between items-center pb-3 border-b border-[#ecedf7] dark:border-[#727785]/20">
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#0058be]" />
                  <span>Manual Inspection Entry</span>
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                >
                  <X className="w-4 h-4 text-[#727785]" />
                </button>
              </div>

              <form onSubmit={handleSaveInspection} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#727785] uppercase tracking-wider">Part ID</label>
                  <input 
                    type="text"
                    required
                    value={newPartId}
                    onChange={(e) => setNewPartId(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/30 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0058be]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#727785] uppercase tracking-wider">Inspection Metric / Type</label>
                  <select 
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/30 rounded-lg text-xs font-semibold focus:outline-none text-[#191b23] dark:text-white"
                  >
                    <option>Weld Integrity</option>
                    <option>Paint Thickness</option>
                    <option>Surface Check</option>
                    <option>Seal Integrity</option>
                    <option>Structural Alignment</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#727785] uppercase tracking-wider">Production Line</label>
                    <select 
                      value={newLine}
                      onChange={(e) => setNewLine(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/30 rounded-lg text-xs font-semibold focus:outline-none text-[#191b23] dark:text-white"
                    >
                      <option value="Line A">Line A</option>
                      <option value="Line B">Line B</option>
                      <option value="Line C">Line C</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#727785] uppercase tracking-wider">Cycle Time (s)</label>
                    <input 
                      type="number"
                      required
                      min={10}
                      max={180}
                      value={newCycleTime}
                      onChange={(e) => setNewCycleTime(Number(e.target.value))}
                      className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/30 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0058be]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[#727785] uppercase tracking-wider">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['PASS', 'FAIL', 'REWORK'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setNewStatus(st as any);
                          if (st === 'PASS') setNewSeverity('N/A');
                        }}
                        className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                          newStatus === st 
                            ? 'bg-[#0058be] text-white font-extrabold shadow' 
                            : 'bg-zinc-100 text-[#424754] dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {newStatus !== 'PASS' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#727785] uppercase tracking-wider">Severity</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['MINOR', 'CRITICAL'].map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setNewSeverity(sev as any)}
                          className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                            newSeverity === sev 
                              ? 'bg-zinc-900 text-white dark:bg-[#ecedf7] dark:text-[#191b23] font-extrabold shadow' 
                              : 'bg-zinc-100 text-[#424754] dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#ecedf7] dark:border-[#727785]/20 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-zinc-100 text-[#424754] rounded-lg text-xs font-bold font-semibold hover:bg-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#0058be] hover:opacity-90 text-white rounded-lg text-xs font-bold leading-none shadow"
                  >
                    Save Entry
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
