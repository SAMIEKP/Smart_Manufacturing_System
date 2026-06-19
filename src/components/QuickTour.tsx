import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Sparkles, AlertCircle } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  tab?: string;
}

const STEPS: TourStep[] = [
  {
    targetId: 'tour-sidebar',
    title: 'Lilongwe Command Terminal',
    content: 'Welcome to Lilongwe plant centralized operations! This navigation sidebar lets you jump between Dashboard, Line Detail, Downtime Forecasting, and Quality Reports views.',
    position: 'right',
    tab: 'dashboard'
  },
  {
    targetId: 'tour-refresh',
    title: 'NEW: Real-time Metric Synchronization',
    content: 'Toggle periodic 30-second data auto-refreshes here. When active, real-time metrics, alerts, and inspections update autonomously.',
    position: 'bottom',
    tab: 'dashboard'
  },
  {
    targetId: 'tour-status',
    title: 'Plant Health Indicator',
    content: 'Monitor quick system health alerts. You also can toggle dark modes or industrial click sounds inside this toolbar.',
    position: 'bottom',
    tab: 'dashboard'
  },
  {
    targetId: 'tour-alerts',
    title: 'Central Notification Drawer',
    content: 'Interact with current critical alert counts. Clicking this launches a panel with details to acknowledge warning logs.',
    position: 'left',
    tab: 'dashboard'
  },
  {
    targetId: 'tour-kpis',
    title: 'Production KPIs & OEE',
    content: 'Observe real-time performance indicators such as Overall Equipment Effectiveness (OEE), hourly assembly throughput, cycle durations, and scrap margins.',
    position: 'bottom',
    tab: 'dashboard'
  }
];

interface QuickTourProps {
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function QuickTour({ onClose, activeTab, setActiveTab }: QuickTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Auto-switch tabs to ensure target is visible
  useEffect(() => {
    const step = STEPS[currentStep];
    if (step && step.tab && activeTab !== step.tab) {
      setActiveTab(step.tab);
    }
  }, [currentStep, activeTab, setActiveTab]);

  // Track coordinates of active element
  useEffect(() => {
    const updatePosition = () => {
      const step = STEPS[currentStep];
      if (!step) return;

      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setCoords(null);
      }
    };

    // Delay slightly to allow any tab transition, mounting or resizing
    const timer = setTimeout(updatePosition, 100);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [currentStep, activeTab]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('quick_tour_completed', 'true');
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('quick_tour_completed', 'true');
    onClose();
  };

  const activeStepData = STEPS[currentStep];
  if (!activeStepData) return null;

  // Compute position coordinates safely
  let tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
  };

  if (coords) {
    const padding = 12;
    if (activeStepData.position === 'bottom') {
      tooltipStyle.top = `${coords.top + coords.height + padding}px`;
      tooltipStyle.left = `${coords.left + coords.width / 2}px`;
      tooltipStyle.transform = 'translateX(-50%)';
    } else if (activeStepData.position === 'top') {
      tooltipStyle.top = `${coords.top - padding}px`;
      tooltipStyle.left = `${coords.left + coords.width / 2}px`;
      tooltipStyle.transform = 'translate(-50%, -100%)';
    } else if (activeStepData.position === 'right') {
      tooltipStyle.top = `${coords.top + coords.height / 2}px`;
      tooltipStyle.left = `${coords.left + coords.width + padding}px`;
      tooltipStyle.transform = 'translateY(-50%)';
    } else if (activeStepData.position === 'left') {
      tooltipStyle.top = `${coords.top + coords.height / 2}px`;
      tooltipStyle.left = `${coords.left - padding}px`;
      tooltipStyle.transform = 'translate(-100%, -50%)';
    } else {
      tooltipStyle.top = '50%';
      tooltipStyle.left = '50%';
      tooltipStyle.transform = 'translate(-50%, -50%)';
    }
  } else {
    // Failing safe to screen center
    tooltipStyle.top = '50%';
    tooltipStyle.left = '50%';
    tooltipStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      {/* Semi-transparent backdrop shadow focusing the targeted viewport */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[9990] transition-all"
        onClick={handleSkip}
      />

      {/* Target spotlight glowing borders if target is rendered */}
      {coords && (
        <div 
          className="fixed pointer-events-none border-2 border-[#0058be] dark:border-[#adc6ff] rounded-lg shadow-[0_0_0_100vw_rgba(0,0,0,0.4)] z-[9995] transition-all duration-300"
          style={{
            top: coords.top - 6,
            left: coords.left - 6,
            width: coords.width + 12,
            height: coords.height + 12,
          }}
        >
          {/* Pulsing indicator ring */}
          <div className="absolute inset-0 border border-blue-400 rounded-lg animate-ping opacity-60" />
        </div>
      )}

      {/* Tooltip dialog card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: tooltipStyle.transform?.includes('translateY') ? -20 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={tooltipStyle}
        className="w-[330px] p-5 rounded-2xl bg-white dark:bg-[#2e3038] border border-[#ecedf7] dark:border-[#727785]/20 shadow-[0_12px_40px_rgba(0,0,0,0.15)] z-[9999]"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5 text-[#0058be] dark:text-[#adc6ff]">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Quick Tour • Step {currentStep + 1} of {STEPS.length}</span>
          </div>
          <button 
            onClick={handleSkip}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-sm font-extrabold text-[#191b23] dark:text-zinc-100">
          {activeStepData.title}
        </h3>

        <p className="text-xs text-[#424754] dark:text-[#c2c6d6] font-medium leading-relaxed mt-1.5">
          {activeStepData.content}
        </p>

        <div className="flex items-center justify-between mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <button 
            onClick={handleSkip}
            className="text-[10px] font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors uppercase tracking-wider"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
                title="Go back"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 bg-[#0058be] text-white hover:opacity-90 rounded-lg text-xs font-bold font-semibold transition-all flex items-center gap-1.5"
            >
              <span>{currentStep === STEPS.length - 1 ? 'Finish' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
