import React from 'react';
import { 
  LayoutDashboard, 
  Factory, 
  Settings, 
  Calendar, 
  BarChart3, 
  FileSpreadsheet, 
  AlertTriangle, 
  HelpCircle,
  Construction,
  Wrench
} from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onEmergencyStop: () => void;
  isEmergencyActive: boolean;
  onStartTour: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onEmergencyStop, isEmergencyActive, onStartTour }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'machines', name: 'Production Lines', icon: Factory },
    { id: 'analytics', name: 'Downtime Analysis', icon: BarChart3 },
    { id: 'maintenance', name: 'Maintenance Scheduler', icon: Wrench },
    { id: 'shifts', name: 'Shift Planning', icon: Calendar },
    { id: 'quality', name: 'Quality Reports', icon: FileSpreadsheet },
    { id: 'settings', name: 'System Settings', icon: Settings },
  ];

  return (
    <aside id="tour-sidebar" className="w-[240px] h-screen fixed left-0 top-0 border-r border-[#ecedf7] dark:border-[#727785]/20 bg-white dark:bg-[#191b23] flex flex-col p-4 z-40 transition-colors duration-200">
      {/* Brand Header */}
      <div className="mb-8 px-2">
        <h1 className="text-xl font-extrabold text-[#0058be] dark:text-[#adc6ff] tracking-tight flex items-center gap-1.5">
          <span className="bg-[#0058be]/10 dark:bg-[#adc6ff]/10 p-1 rounded">
            <Construction className="w-5 h-5 text-[#0058be] dark:text-[#adc6ff]" />
          </span>
          AutoFab Pro
        </h1>
        <p className="text-xs font-medium text-[#424754] dark:text-[#c2c6d6] opacity-75 mt-1">
          Plant 04 - Lilongwe
        </p>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-[#d0e1fb] dark:bg-[#505f76] text-[#005ac2] dark:text-white font-semibold' 
                  : 'text-[#424754] dark:text-[#c2c6d6] hover:bg-[#e6e7f2] dark:hover:bg-[#2e3038] hover:text-black dark:hover:text-white'
              }`}
            >
              <IconComponent className={`w-[18px] h-[18px] ${isActive ? 'text-[#005ac2] dark:text-white' : 'text-[#727785]'}`} />
              <span>{item.name}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#0058be] dark:bg-[#adc6ff] rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto space-y-2 pt-4 border-t border-[#ecedf7] dark:border-[#727785]/20">
        <button 
          onClick={onEmergencyStop}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
            isEmergencyActive 
              ? 'bg-[#ba1a1a] text-white shadow-lg shadow-red-500/30' 
              : 'text-[#ba1a1a] hover:bg-[#ba1a1a]/10 dark:text-red-400 dark:hover:bg-red-400/10'
          }`}
        >
          <AlertTriangle className={`w-[18px] h-[18px] ${isEmergencyActive ? 'animate-bounce' : ''}`} />
          <span>{isEmergencyActive ? 'Emergency Active' : 'Emergency Stop'}</span>
        </button>

        <button
          onClick={(e) => { e.preventDefault(); onStartTour(); }}
          className="w-full flex items-center gap-3 px-3 py-2 text-[#424754] dark:text-[#c2c6d6] hover:bg-[#e6e7f2] dark:hover:bg-[#2e3038] rounded-lg text-sm transition-colors text-left"
        >
          <HelpCircle className="w-[18px] h-[18px] text-[#0058be]" />
          <span>Quick Tour</span>
        </button>

        <a 
          href="#support" 
          onClick={(e) => { e.preventDefault(); alert('Redirecting to plant support and communication channels...'); }}
          className="flex items-center gap-3 px-3 py-2 text-[#424754] dark:text-[#c2c6d6] hover:bg-[#e6e7f2] dark:hover:bg-[#2e3038] rounded-lg text-sm transition-colors"
        >
          <HelpCircle className="w-[18px] h-[18px] text-[#727785]" />
          <span>Support</span>
        </a>
      </div>
    </aside>
  );
}
