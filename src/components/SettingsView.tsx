import React, { useEffect, useState } from 'react';
import { 
  Sliders, 
  ShieldAlert, 
  Shuffle, 
  Bell, 
  SlidersHorizontal, 
  Trash2, 
  Copy, 
  Check, 
  CheckCircle,
  MoreVertical,
  Plus,
  Compass,
  X,
  Edit
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import { Operator, AlertThresholds } from '../types';

interface SettingsViewProps {
  operators: Operator[];
  setOperators: (ops: Operator[]) => void;
  thresholds: AlertThresholds;
  setThresholds: (t: AlertThresholds) => void;
}

export default function SettingsView({ 
  operators, 
  setOperators, 
  thresholds, 
  setThresholds 
}: SettingsViewProps) {
  
  const [activeSubSection, setActiveSubSection] = useState('thresholds');

  // local threshold states
  const [tempInput, setTempInput] = useState(thresholds.criticalTemp);
  const [vibrationInput, setVibrationInput] = useState(thresholds.vibrationTolerance);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New operator inline form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Specialist');

  const [iotKeys, setIotKeys] = useState([
    { id: 'key-1', name: 'Factory Floor North Cluster', key: 'pk_live_f982937402374923', created: 'Oct 12, 2023', lastUsed: '4m ago' },
    { id: 'key-2', name: 'Sorting Hub Analytics', key: 'pk_live_a231823749823631', created: 'Sep 05, 2023', lastUsed: '1d ago' }
  ]);

  // Edit operator state engine
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'offline'>('offline');
  const [editExpertise, setEditExpertise] = useState<Record<string, 'None' | 'Beginner' | 'Intermediate' | 'Expert'>>({});

  const handleStartEdit = (op: Operator) => {
    setEditingOperator(op);
    setEditName(op.name);
    setEditEmail(op.email || '');
    setEditRole(op.role);
    setEditStatus(op.status);
    setEditExpertise(op.expertise || {
      'CNC ALPHA-1': 'None',
      'PRESS DELTA-04': 'None',
      'LATHE SIGMA-1': 'None',
      'MILL GAMMA-2': 'None'
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOperator) return;

    const opInitials = editName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const updated = operators.map(op => {
      if (op.id === editingOperator.id) {
        return {
          ...op,
          name: editName,
          email: editEmail,
          role: editRole,
          status: editStatus,
          initials: opInitials || 'OP',
          level: editRole,
          expertise: editExpertise
        };
      }
      return op;
    });

    setOperators(updated);
    setEditingOperator(null);
  };

  const handleUpdateThresholds = () => {
    setThresholds({
      criticalTemp: tempInput,
      vibrationTolerance: vibrationInput
    });
    alert(`System parameters updated! Trigger limits: Critical Temperature: ${tempInput}°C, Vibration tolerance: ${vibrationInput} G-force.`);
  };

  const handleCopyKey = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDeleteKey = (id: string) => {
    if (confirm('Are you sure you want to permanently revoke this IoT node credentials? This action breaks associated communication telemetry.')) {
      setIotKeys(iotKeys.filter(k => k.id !== id));
    }
  };

  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const opInitials = newName
      .split(' ')
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const nOperator: Operator = {
      id: `op-${Date.now()}`,
      name: newName,
      role: newRole,
      email: `${newName.toLowerCase().replace(/\s/g, '')}@autofab.com`,
      lastShift: 'Never logged',
      status: 'offline',
      initials: opInitials || 'OP',
      level: newRole,
      tags: ['New member'],
      expertise: {
        'CNC ALPHA-1': 'None',
        'PRESS DELTA-04': 'None',
        'LATHE SIGMA-1': 'None',
        'MILL GAMMA-2': 'None'
      }
    };

    setOperators([...operators, nOperator]);
    setNewName('');
    setIsAddOpen(false);
  };

  const menuSections = [
    { id: 'thresholds', name: 'Alert Thresholds', icon: SlidersHorizontal },
    { id: 'security', name: 'Security Control', icon: ShieldAlert },
    { id: 'integrations', name: 'Integrations', icon: Shuffle },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start h-full pb-10">
      
      {/* 📋 Fixed Secondary Sidebar */}
      <div className="md:col-span-1">
        <nav className="md:fixed md:w-[180px] lg:w-[230px] xl:w-[280px] md:h-[calc(100vh-150px)] self-start bg-white dark:bg-[#2e3038] p-4 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <div className="space-y-1 w-full">
            <div className="text-[10px] uppercase font-bold text-[#727785] dark:text-[#c2c6d6]/80 mb-3 px-2 tracking-widest leading-none border-b border-[#ecedf7]/60 dark:border-[#727785]/10 pb-2.5">
              System Sections
            </div>
            
            <div className="space-y-1">
              {menuSections.map((sec, index) => {
                const Icon = sec.icon;
                const isActive = activeSubSection === sec.id;
                return (
                  <React.Fragment key={sec.id}>
                    {index > 0 && <hr className="border-[#ecedf7] dark:border-[#727785]/10 my-1.5" />}
                    <button
                      key={sec.id}
                      onClick={() => setActiveSubSection(sec.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#0058be]/10 dark:bg-[#0058be]/20 text-[#0058be] dark:text-[#adc6ff] border-l-4 border-[#0058be] pl-2.5 font-black shadow-xs' 
                          : 'text-[#424754] dark:text-[#c2c6d6] hover:bg-zinc-50 dark:hover:bg-zinc-900/10 hover:text-black dark:hover:text-white border-l-4 border-transparent pl-3'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#0058be] dark:text-[#adc6ff]' : 'text-[#727785]'}`} />
                      <span>{sec.name}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block pt-4 border-t border-[#ecedf7]/60 dark:border-[#727785]/10 text-[10px] text-zinc-400 font-medium font-mono">
            PLC Sync Active
          </div>
        </nav>
      </div>

      {/* Main Settings Form content panel */}
      <div className="md:col-span-3 md:col-start-2 lg:pl-4 space-y-6">

        {/* 1. Threshold settings component */}
        {activeSubSection === 'thresholds' && (
          <div className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm overflow-hidden text-[#191b23] dark:text-white">
            
            <div className="px-5 py-4 border-b border-[#ecedf7] dark:border-[#727785]/20 bg-zinc-50 dark:bg-zinc-800/10 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">Alert Threshold Configuration</h3>
                <p className="text-[11px] text-[#727785] mt-0.5">Control trigger ranges for live telemetry indicators.</p>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-[#b75b00] dark:text-amber-300 font-extrabold uppercase px-2 py-0.5 rounded">
                Real-time Sync
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#727785] tracking-wider uppercase block">
                  Critical Temperature Limit (°C)
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    value={tempInput}
                    onChange={(e) => setTempInput(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/40 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0058be]"
                  />
                  <span className="bg-[#ffdad6]/40 dark:bg-red-950/20 text-[#ba1a1a] px-3.5 py-2.5 rounded-lg font-bold text-xs">
                    Warning
                  </span>
                </div>
                <p className="text-[11px] text-[#727785] leading-relaxed">
                  Triggers an automated emergency shutdown sequence if machines exceed this specified thermal limit for more than 120s.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#727785] tracking-wider uppercase block">
                  Vibration Tolerance (G-force)
                </label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    step="0.1"
                    value={vibrationInput}
                    onChange={(e) => setVibrationInput(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/40 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0058be]"
                  />
                  <span className="bg-[#d0e1fb]/40 dark:bg-[#505f76]/20 text-[#005ac2] dark:text-[#adc6ff] px-3.5 py-2.5 rounded-lg font-bold text-xs">
                    Monitor
                  </span>
                </div>
                <p className="text-[11px] text-[#727785] leading-relaxed">
                  Defines standard peak motion fluctuation profiles allowed before dispatching warning indicators to live operator dashboards.
                </p>
              </div>

            </div>

            <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-800/10 border-t border-[#ecedf7] dark:border-[#727785]/20 flex justify-end">
              <button 
                onClick={handleUpdateThresholds}
                className="px-4 py-2 bg-[#0058be] hover:opacity-90 text-white rounded-lg text-xs font-bold shadow"
              >
                Update Thresholds
              </button>
            </div>

          </div>
        )}

        {/* Static placeholders for security/integrations */}
        {activeSubSection === 'security' && (
          <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm text-center py-10">
            <ShieldAlert className="w-8 h-8 text-[#0058be] mx-auto mb-3" />
            <h4 className="font-extrabold text-[#191b23] dark:text-white text-sm">Industrial Vault Controls</h4>
            <p className="text-xs text-[#727785] mt-1 max-w-sm mx-auto">
              Vault permission parameters remain governed by Enterprise Detroit IT protocols. Contact the senior supervisor for modifications.
            </p>
          </div>
        )}

        {activeSubSection === 'integrations' && (
          <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm text-center py-10">
            <Shuffle className="w-8 h-8 text-[#0058be] mx-auto mb-3" />
            <h4 className="font-extrabold text-[#191b23] dark:text-white text-sm">External PLC Adaptor Channels</h4>
            <p className="text-xs text-[#727785] mt-1 max-w-xs mx-auto">
              Integrations govern MQTT streams, OPC UA adapters, and ERP database synchronization hooks.
            </p>
          </div>
        )}

        {/* 2. Plant Operators Management table section */}
        <section className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm overflow-hidden text-[#191b23] dark:text-white">
          <div className="px-5 py-4 border-b border-[#ecedf7] dark:border-[#727785]/20 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/10">
            <h3 className="font-bold text-sm">Plant Operators</h3>
            <button 
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="text-[#0058be] dark:text-[#adc6ff] font-bold text-xs flex items-center gap-1 hover:underline"
            >
              <Plus className="w-4 h-4" /> Add Operator
            </button>
          </div>

          {/* Add operator inline dropdown */}
          {isAddOpen && (
            <form onSubmit={handleAddOperator} className="p-5 border-b border-[#ecedf7] dark:border-[#727785]/20 bg-[#f2f3fd]/40 dark:bg-[#191b23]/30 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end animate-slideDown">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#727785] uppercase">Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/40 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#727785] uppercase">Role</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2.5 bg-white dark:bg-[#191b23] border border-[#ecedf7]  rounded-lg text-xs font-semibold focus:outline-none text-[#191b23] dark:text-white"
                >
                  <option>Specialist</option>
                  <option>Shift Lead</option>
                  <option>Engineer</option>
                  <option>QC Supervisor</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-[#0058be] hover:opacity-90 text-white font-bold text-xs rounded-lg shadow-sm font-semibold"
                >
                  Add Operator
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAddOpen(false)}
                  className="px-2 py-2 bg-zinc-200 text-[#424754] rounded-lg text-xs font-bold hover:bg-zinc-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f2f3fd]/40 dark:bg-[#191b23]/30 border-b border-[#ecedf7] dark:border-[#727785]/20 text-[10px] text-[#727785] font-extrabold uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Operator</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold">Key Machine Expertise</th>
                  <th className="px-5 py-3 font-bold">Expertise Balance</th>
                  <th className="px-5 py-3 font-bold text-center">Status</th>
                  <th className="px-5 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ecedf7] dark:divide-[#191b23]/30 text-xs">
                {operators.map((op, idx) => {
                  const radarData = [
                    { name: 'CNC', val: op.expertise?.['CNC ALPHA-1'] === 'Expert' ? 100 : op.expertise?.['CNC ALPHA-1'] === 'Intermediate' ? 66 : op.expertise?.['CNC ALPHA-1'] === 'Beginner' ? 33 : 10 },
                    { name: 'Press', val: op.expertise?.['PRESS DELTA-04'] === 'Expert' ? 100 : op.expertise?.['PRESS DELTA-04'] === 'Intermediate' ? 66 : op.expertise?.['PRESS DELTA-04'] === 'Beginner' ? 33 : 10 },
                    { name: 'Lathe', val: op.expertise?.['LATHE SIGMA-1'] === 'Expert' ? 100 : op.expertise?.['LATHE SIGMA-1'] === 'Intermediate' ? 66 : op.expertise?.['LATHE SIGMA-1'] === 'Beginner' ? 33 : 10 },
                    { name: 'Mill', val: op.expertise?.['MILL GAMMA-2'] === 'Expert' ? 100 : op.expertise?.['MILL GAMMA-2'] === 'Intermediate' ? 66 : op.expertise?.['MILL GAMMA-2'] === 'Beginner' ? 33 : 10 },
                  ];

                  return (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#191b23]/20 transition-colors">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d0e1fb] text-[#005ac2] font-extrabold flex items-center justify-center text-xs">
                          {op.initials}
                        </div>
                        <div>
                          <p className="font-bold">{op.name}</p>
                          <p className="text-[10px] text-[#727785] font-medium leading-none mt-0.5">{op.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#727785]/90 dark:text-zinc-300">{op.role}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1 max-w-[150px]">
                          {Object.entries(op.expertise || {}).map(([mach, level]) => (
                            level !== 'None' && (
                              <div key={mach} className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-zinc-500 dark:text-zinc-400 font-medium">{mach.split(' ')[0]}:</span>
                                <span className={
                                  level === 'Expert' 
                                    ? 'text-[#005ac2] dark:text-[#adc6ff]' 
                                    : level === 'Intermediate' 
                                    ? 'text-zinc-700 dark:text-zinc-300' 
                                    : 'text-zinc-400'
                                }>
                                  {level}
                                </span>
                              </div>
                            )
                          ))}
                          {(!op.expertise || Object.values(op.expertise).filter(l => l !== 'None').length === 0) && (
                            <span className="text-[10px] text-zinc-400 italic">No expertise set</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-2">
                        <div className="h-[75px] w-[95px] flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                              <PolarGrid stroke="rgba(114, 119, 133, 0.15)" />
                              <PolarAngleAxis dataKey="name" tick={{ fill: '#727785', fontSize: 7, fontWeight: 'medium' }} />
                              <Radar name={op.name} dataKey="val" stroke="#0058be" fill="#0058be" fillOpacity={0.2} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 font-bold ${
                          op.status === 'active' ? 'text-emerald-600' : 'text-[#727785]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${op.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          {op.status === 'active' ? 'Active' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleStartEdit(op)}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#0058be] hover:bg-[#004bb2] rounded-md shadow-sm uppercase shrink-0 transition"
                        >
                          Edit Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Edit popup overlay dialog */}
          {editingOperator && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-300">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                tabIndex={-1}
                className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-2xl max-w-lg w-full p-6 text-[#191b23] dark:text-white"
              >
                <div className="flex justify-between items-center border-b border-[#ecedf7] dark:border-[#727785]/20 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Edit className="w-4.5 h-4.5 text-[#0058be]" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#191b23] dark:text-zinc-200">
                      Configure Operator Details
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setEditingOperator(null)} 
                    className="p-1 px-1.5 bg-zinc-100 dark:bg-[#191b23] rounded-full text-zinc-500 hover:text-black dark:hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
                  
                  {/* Row 1: Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#727785] uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/40 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0058be]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#727785] uppercase tracking-wider">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/40 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0058be]"
                      />
                    </div>
                  </div>

                  {/* Row 2: Role and Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#727785] uppercase tracking-wider">Role</label>
                      <select 
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/40 rounded-lg text-xs font-bold focus:outline-none text-[#191b23] dark:text-white"
                      >
                        <option>Senior Engineer</option>
                        <option>Shift Lead</option>
                        <option>Specialist</option>
                        <option>QC Supervisor</option>
                        <option>QC Lead</option>
                        <option>Maintenance Specialist</option>
                        <option>Line C Lead</option>
                        <option>Engineer</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#727785] uppercase tracking-wider">Operator Status</label>
                      <select 
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full p-2.5 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/40 rounded-lg text-xs font-bold focus:outline-none text-[#191b23] dark:text-white"
                      >
                        <option value="active">Active (On Duty)</option>
                        <option value="offline">Offline / On Break</option>
                      </select>
                    </div>
                  </div>

                  {/* Machine Expertise Matrix */}
                  <div className="border-t border-[#ecedf7] dark:border-zinc-800 pt-3">
                    <h4 className="text-[10px] font-extrabold text-[#727785] uppercase tracking-widest mb-3">Machine Expertise Levels</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {['CNC ALPHA-1', 'PRESS DELTA-04', 'LATHE SIGMA-1', 'MILL GAMMA-2'].map((key) => (
                        <div key={key} className="flex flex-col gap-1 p-2 bg-zinc-50 dark:bg-[#191b23]/30 border border-[#ecedf7] dark:border-[#727785]/10 rounded-lg">
                          <span className="text-[10px] font-bold text-[#424754] dark:text-zinc-300">{key}</span>
                          <select 
                            value={editExpertise[key] || 'None'}
                            onChange={(e) => setEditExpertise({
                              ...editExpertise,
                              [key]: e.target.value as any
                            })}
                            className="bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-zinc-800 rounded p-1 text-[10px] font-bold text-[#191b23] dark:text-white"
                          >
                            <option value="None">None</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save/Close Buttons */}
                  <div className="flex gap-2.5 justify-end pt-3 border-t border-[#ecedf7] dark:border-zinc-800">
                    <button 
                      type="button" 
                      onClick={() => setEditingOperator(null)}
                      className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-extrabold text-[#727785] dark:text-zinc-300 rounded-lg transition"
                    >
                      Dismiss
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-[#0058be] hover:opacity-95 text-white font-extrabold text-xs rounded-lg shadow transition"
                    >
                      Save Configuration
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          )}

        </section>

        {/* 3. API Key Management section */}
        <section className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm p-5 text-[#191b23] dark:text-white space-y-4">
          <div>
            <h3 className="font-bold text-sm">IoT Device Access (API)</h3>
            <p className="text-[11px] text-[#727785] mt-0.5">Secure tokens for external node sensors and PLC adapters.</p>
          </div>

          <div className="space-y-3">
            {iotKeys.map((keyObj) => (
              <div key={keyObj.id} className="p-4 bg-zinc-50 dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/40 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <Compass className="w-5 h-5 text-[#0058be]" />
                  <div>
                    <h4 className="text-xs font-bold leading-none">{keyObj.name}</h4>
                    <span className="text-[10px] text-[#727785] font-semibold mt-1 inline-block">
                      Created {keyObj.created} • Last used {keyObj.lastUsed}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <code className="bg-white dark:bg-black/20 px-3 py-1.5 border border-[#ecedf7] dark:border-[#727785]/30 rounded text-[10px] font-mono select-all flex-1 sm:flex-none text-[#191b23] dark:text-zinc-300">
                    {keyObj.key.slice(0, 15)}****************
                  </code>

                  <button 
                    onClick={() => handleCopyKey(keyObj.id, keyObj.key)}
                    className="p-1.5 rounded-lg border border-[#ecedf7] dark:border-[#727785]/30 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-[#0058be] transition-colors"
                    title="Copy API key to clipboard"
                  >
                    {copiedKey === keyObj.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button 
                    onClick={() => handleDeleteKey(keyObj.id)}
                    className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 dark:border-red-950 text-red-500 hover:text-[#ba1a1a] transition-colors"
                    title="Revoke and delete API credentials"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={() => {
                const name = prompt('Enter a descriptive title for this new IoT node token: (e.g. Sorting Conveyance B-3 Cluster)');
                if (name && name.trim()) {
                  const nKey = {
                    id: `key-${Date.now()}`,
                    name: name.trim(),
                    key: 'pk_live_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10),
                    created: 'Today',
                    lastUsed: 'Never'
                  };
                  setIotKeys([...iotKeys, nKey]);
                }
              }}
              className="w-full border-2 border-dashed border-[#ecedf7] dark:border-[#727785]/30 p-4 rounded-xl text-xs font-bold text-[#727785] hover:border-[#0058be] hover:text-[#0058be] dark:hover:text-[#adc6ff] transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New API Key for IoT Node</span>
            </button>
          </div>
        </section>

      </div>

    </div>
  );
}
