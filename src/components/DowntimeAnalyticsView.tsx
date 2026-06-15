import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Timer, 
  Hourglass, 
  AlertTriangle, 
  ArrowUpRight,
  TrendingDown,
  Gauge,
  Sparkles,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

const genericPredictionData = {
  'CNC ALPHA-1': [
    { day: 'Day +1', wear: 45, vibration: 2.1, temperature: 62 },
    { day: 'Day +2', wear: 49, vibration: 2.3, temperature: 63 },
    { day: 'Day +3', wear: 54, vibration: 2.6, temperature: 65 },
    { day: 'Day +4', wear: 60, vibration: 3.0, temperature: 68 },
    { day: 'Day +5', wear: 67, vibration: 3.5, temperature: 72 },
    { day: 'Day +6', wear: 75, vibration: 4.1, temperature: 78 },
    { day: 'Day +7', wear: 82, vibration: 4.8, temperature: 84 },
    { day: 'Day +8', wear: 89, vibration: 5.6, temperature: 91 },
    { day: 'Day +9', wear: 95, vibration: 6.4, temperature: 98 },
    { day: 'Day +10', wear: 99, vibration: 7.2, temperature: 105 },
  ],
  'PRESS DELTA-04': [
    { day: 'Day +1', wear: 68, vibration: 3.4, temperature: 74 },
    { day: 'Day +2', wear: 71, vibration: 3.6, temperature: 75 },
    { day: 'Day +3', wear: 74, vibration: 3.8, temperature: 77 },
    { day: 'Day +4', wear: 78, vibration: 4.0, temperature: 80 },
    { day: 'Day +5', wear: 82, vibration: 4.3, temperature: 83 },
    { day: 'Day +6', wear: 86, vibration: 4.6, temperature: 86 },
    { day: 'Day +7', wear: 90, vibration: 4.9, temperature: 89 },
    { day: 'Day +8', wear: 93, vibration: 5.2, temperature: 92 },
    { day: 'Day +9', wear: 96, vibration: 5.5, temperature: 95 },
    { day: 'Day +10', wear: 98, vibration: 5.8, temperature: 97 },
  ],
  'MILL GAMMA-2': [
    { day: 'Day +1', wear: 20, vibration: 1.2, temperature: 45 },
    { day: 'Day +2', wear: 22, vibration: 1.2, temperature: 46 },
    { day: 'Day +3', wear: 25, vibration: 1.3, temperature: 46 },
    { day: 'Day +4', wear: 28, vibration: 1.4, temperature: 47 },
    { day: 'Day +5', wear: 31, vibration: 1.5, temperature: 49 },
    { day: 'Day +6', wear: 35, vibration: 1.7, temperature: 51 },
    { day: 'Day +7', wear: 39, vibration: 1.9, temperature: 53 },
    { day: 'Day +8', wear: 43, vibration: 2.1, temperature: 55 },
    { day: 'Day +9', wear: 48, vibration: 2.3, temperature: 58 },
    { day: 'Day +10', wear: 53, vibration: 2.6, temperature: 61 },
  ],
  'LATHE SIGMA-1': [
    { day: 'Day +1', wear: 50, vibration: 2.8, temperature: 59 },
    { day: 'Day +2', wear: 53, vibration: 3.0, temperature: 61 },
    { day: 'Day +3', wear: 57, vibration: 3.2, temperature: 63 },
    { day: 'Day +4', wear: 61, vibration: 3.5, temperature: 66 },
    { day: 'Day +5', wear: 66, vibration: 3.9, temperature: 70 },
    { day: 'Day +6', wear: 72, vibration: 4.4, temperature: 75 },
    { day: 'Day +7', wear: 78, vibration: 5.0, temperature: 81 },
    { day: 'Day +8', wear: 85, vibration: 5.7, temperature: 88 },
    { day: 'Day +9', wear: 91, vibration: 6.5, temperature: 96 },
    { day: 'Day +10', wear: 96, vibration: 7.4, temperature: 104 },
  ]
};

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#191b23] border border-zinc-200 dark:border-zinc-800 p-3 shadow-lg text-xs leading-normal rounded-lg">
        <p className="font-extrabold text-[#191b23] dark:text-white mb-1">{label}</p>
        <p className="font-bold text-red-600 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Wear Index: {payload[0]?.value}%
        </p>
        {payload[1] && (
          <p className="font-semibold text-blue-500 flex items-center gap-1 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Vibration: {payload[1].value} mm/s
          </p>
        )}
        {payload[2] && (
          <p className="font-semibold text-amber-600 flex items-center gap-1 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Temp: {payload[2].value} °C
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function DowntimeAnalyticsView() {
  const [selectedTimelineMachine, setSelectedTimelineMachine] = useState<string | null>(null);
  const [selectedPredictiveMachine, setSelectedPredictiveMachine] = useState<string>('CNC ALPHA-1');

  const downtimeTimeline = [
    { name: 'CNC ALPHA-1', events: [
      { type: 'unplanned', left: '15%', width: '5%', desc: 'Mechanical fatigue core repair' },
      { type: 'maintenance', left: '60%', width: '12%', desc: 'Scheduled spindle diagnostic lubrications' }
    ]},
    { name: 'PRESS DELTA-04', events: [
      { type: 'unplanned', left: '5%', width: '8%', desc: 'Sensor misalignment recalibration' },
      { type: 'unplanned', left: '40%', width: '4%', desc: 'Hydraulic high valve drop check' }
    ]},
    { name: 'MILL GAMMA-2', events: [
      { type: 'maintenance', left: '75%', width: '20%', desc: 'Planned monthly conveyor swap' }
    ]},
    { name: 'LATHE SIGMA-1', events: [
      { type: 'unplanned', left: '20%', width: '15%', desc: 'Substantial material short jam jam-1' }
    ]},
    { name: 'BOT OMEGA-9', events: [] }
  ];

  const topImpactedMachines = [
    { code: 'CNC ALPHA-1', hrs: '18.4 hr', freq: 12, reason: 'Mechanical Fatigue', status: 'critical' },
    { code: 'PRESS DELTA-04', hrs: '14.2 hr', freq: 8, reason: 'Sensor Calibration', status: 'warning' },
    { code: 'MILL GAMMA-2', hrs: '9.5 hr', freq: 5, reason: 'Planned Lube', status: 'stable' },
    { code: 'LATHE SIGMA-1', hrs: '7.8 hr', freq: 14, reason: 'Short-stop Jam', status: 'warning' },
    { code: 'BOT OMEGA-9', hrs: '4.1 hr', freq: 3, reason: 'Update Cycle', status: 'stable' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Overview Cards Row */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* MTBF */}
        <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">MTBF (Current Shift)</span>
            <Hourglass className="w-4 h-4 text-[#0058be]" />
          </div>
          <div className="text-4xl font-extrabold text-[#0058be] dark:text-[#adc6ff] mt-3">
            124<span className="text-xl font-medium text-[#727785] ml-0.5">hr</span>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[#ba1a1a]">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-600">+12% vs last shift</span>
          </div>
        </div>

        {/* MTTR */}
        <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">MTTR (Mean Time Repair)</span>
            <Timer className="w-4 h-4 text-[#ba1a1a]" />
          </div>
          <div className="text-4xl font-extrabold text-[#191b23] dark:text-white mt-3">
            42<span className="text-xl font-medium text-[#727785] ml-0.5">min</span>
          </div>
          <div className="flex items-center gap-1 mt-4 text-[#ba1a1a]">
            <TrendingDown className="w-3.5 h-3.5 text-[#ba1a1a]" />
            <span className="text-xs font-bold text-[#ba1a1a]">+5m deviation (delayed)</span>
          </div>
        </div>

        {/* Total Downtime */}
        <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Total Downtime</span>
            <Hourglass className="w-4 h-4 text-[#727785]" />
          </div>
          <div className="text-4xl font-extrabold text-[#191b23] dark:text-white mt-3">
            3.8<span className="text-xl font-medium text-[#727785] ml-0.5">hr</span>
          </div>
          <p className="text-[11px] text-[#727785] font-semibold mt-4">
            4 incidents logged this cycle
          </p>
        </div>

        {/* Availability */}
        <div className="bg-white dark:bg-[#2e3038] p-5 rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider">Availability (OEE)</span>
            <Gauge className="w-4 h-4 text-[#924700]" />
          </div>
          <div className="text-4xl font-extrabold text-[#924700] dark:text-[#ffb786] mt-3">
            94.2<span className="text-xl font-medium text-[#727785] ml-0.5">%</span>
          </div>
          <p className="text-[11px] text-[#727785] font-semibold mt-4">
            Specified Target: 92.0%
          </p>
        </div>

      </section>

      {/* Gantt timeline versus Downtime reasons */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly shift downtime timeline */}
        <div className="lg:col-span-2 bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between">
          <div className="px-5 py-4 border-b border-[#ecedf7] dark:border-[#727785]/20 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/10">
            <h3 className="font-bold text-sm text-[#191b23] dark:text-white">Shift Downtime Timeline</h3>
            <div className="flex gap-4 text-[10px] font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#ba1a1a]" /> Unplanned</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#505f76]" /> Maintenance</span>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            {downtimeTimeline.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-28 text-[11px] font-bold text-[#424754] dark:text-[#c2c6d6] truncate">
                  {item.name}
                </span>
                <div 
                  onClick={() => setSelectedTimelineMachine(selectedTimelineMachine === item.name ? null : item.name)}
                  className="flex-1 h-9 bg-[#f2f3fd] dark:bg-[#191b23] rounded-md relative overflow-hidden cursor-pointer hover:opacity-90"
                >
                  {item.events.map((evt, eIdx) => (
                    <div 
                      key={eIdx}
                      style={{ left: evt.left, width: evt.width }}
                      title={evt.desc}
                      className={`absolute top-0 bottom-0 ${
                        evt.type === 'unplanned' ? 'bg-[#ba1a1a]' : 'bg-[#505f76]'
                      } opacity-85 hover:opacity-100 transition-opacity border-r border-[#ecedf7]`}
                    />
                  ))}
                  {item.events.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Optimal continuous execution - zero logged downtime
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Custom Time line markers */}
            <div className="flex justify-between text-[11px] font-bold text-[#727785] border-t border-[#ecedf7] dark:border-[#191b23] pt-4 mt-6">
              <span>08:00</span>
              <span>10:00</span>
              <span>12:00</span>
              <span>14:00</span>
              <span>16:00</span>
            </div>

            {/* Selected timeline detail focus */}
            {selectedTimelineMachine && (
              <div className="bg-[#ecedf7]/40 dark:bg-[#191b23]/30 p-3.5 rounded-lg border border-[#ecedf7] text-xs">
                <h4 className="font-bold text-[#191b23] dark:text-white">Downtime occurrences for {selectedTimelineMachine}:</h4>
                <ul className="list-disc pl-4 mt-2 space-y-1 text-[#424754] dark:text-[#c2c6d6]">
                  {downtimeTimeline.find(m => m.name === selectedTimelineMachine)?.events.map((evt, idx) => (
                    <li key={idx}>
                      <span className="font-semibold uppercase text-[10px] bg-white dark:bg-black/20 p-1 rounded mr-2 inline-block">
                        {evt.type}
                      </span>
                      {evt.desc}
                    </li>
                  )) || <li>No historical incidents recorded</li>}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Reason for downtime progress visual */}
        <div className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm flex flex-col justify-between p-5">
          <h3 className="font-bold text-sm text-[#191b23] dark:text-white pb-3 border-b border-[#ecedf7] dark:border-[#727785]/20">
            Reason for Downtime
          </h3>

          <div className="flex flex-col items-center justify-center flex-1 py-4">
            {/* Donut representation inline SVG */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#505f76]"
                  strokeDasharray="27 100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#924700]"
                  strokeDasharray="31 100"
                  strokeDashoffset="-27"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#ba1a1a]"
                  strokeDasharray="42 100"
                  strokeDashoffset="-58"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-[#191b23] dark:text-white">4.2h</span>
                <span className="text-[10px] text-[#727785] font-bold uppercase tracking-wider">Total</span>
              </div>
            </div>

            {/* Labels */}
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#ba1a1a]" /> Mechanical Failure</span>
                <span className="text-[#191b23] dark:text-white">42%</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#924700]" /> Power Failure</span>
                <span className="text-[#191b23] dark:text-white">31%</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#505f76]" /> Scheduled Maintenance</span>
                <span className="text-[#191b23] dark:text-white">27%</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Recharts Predictive Maintenance Interval Chart Section */}
      <section className="bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm overflow-hidden p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-[#ecedf7] dark:border-[#727785]/20 bg-zinc-50 dark:bg-zinc-800/10 p-4 rounded-xl">
          <div>
            <h3 className="font-extrabold text-[#191b23] dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>Interval Prognostics & Maintenance Forecasting</span>
            </h3>
            <p className="text-xs text-[#727785] font-semibold mt-1">
              Active telemetry simulation model predicting remaining useful operating durations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#424754] dark:text-[#c2c6d6]">Target Machine:</span>
            <select
              value={selectedPredictiveMachine}
              onChange={(e) => setSelectedPredictiveMachine(e.target.value)}
              className="bg-white dark:bg-[#191b23] border border-[#ecedf7] dark:border-[#727785]/30 rounded-lg text-xs font-bold p-2 text-[#424754] focus:outline-none focus:ring-1 focus:ring-[#0058be]"
            >
              <option value="CNC ALPHA-1">CNC ALPHA-1</option>
              <option value="PRESS DELTA-04">PRESS DELTA-04</option>
              <option value="LATHE SIGMA-1">LATHE SIGMA-1</option>
              <option value="MILL GAMMA-2">MILL GAMMA-2</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Recharts Area */}
          <div className="lg:col-span-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={genericPredictionData[selectedPredictiveMachine as keyof typeof genericPredictionData]}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorWear" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ba1a1a" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ba1a1a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVibe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0058be" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0058be" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecedf7" />
                <XAxis 
                  dataKey="day" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#727785' }}
                />
                <YAxis 
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#727785' }}
                  label={{ value: 'Fatigue Wear Index (%)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fontWeight: 700, fill: '#727785' } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#727785' }}
                  label={{ value: 'Temperature (°C) / Vibration', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 10, fontWeight: 700, fill: '#727785' } }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: 11, fontWeight: 650, paddingTop: 10 }} 
                />
                <ReferenceLine 
                  yAxisId="left"
                  y={85} 
                  stroke="#ba1a1a" 
                  strokeDasharray="4 4" 
                  label={{ value: '85% Wear Action Required', fill: '#ba1a1a', fontSize: 9, fontWeight: 800, position: 'top' }} 
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="wear" 
                  name="Wear Index (%)" 
                  stroke="#ba1a1a" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWear)" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="vibration" 
                  name="Vibration (mm/s)" 
                  stroke="#0058be" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorVibe)" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="temperature" 
                  name="Temp Ambient (°C)" 
                  stroke="#b75b00" 
                  strokeWidth={1.5}
                  fill="none" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Forecast Analysis Insight sidebar panel */}
          <div className="bg-zinc-50 dark:bg-[#191b23]/40 p-4 rounded-xl border border-[#ecedf7] dark:border-zinc-800 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] bg-red-100 dark:bg-red-950/20 text-[#ba1a1a] dark:text-red-400 font-bold px-2 py-0.5 rounded uppercase">
                Predictive Report
              </span>

              <div className="space-y-1.5 mt-2">
                <h4 className="text-[10px] text-[#727785] font-bold uppercase tracking-wider">Estimated Lifespan</h4>
                <div className="text-2xl font-extrabold text-[#191b23] dark:text-white flex items-baseline leading-none">
                  {selectedPredictiveMachine === 'CNC ALPHA-1' ? '168 hrs' : selectedPredictiveMachine === 'PRESS DELTA-04' ? '120 hrs' : selectedPredictiveMachine === 'LATHE SIGMA-1' ? '168 hrs' : '240+ hrs'}
                  <span className="text-xs font-bold text-amber-500 ml-1.5">(Day +{selectedPredictiveMachine === 'CNC ALPHA-1' ? '8' : selectedPredictiveMachine === 'PRESS DELTA-04' ? '6' : selectedPredictiveMachine === 'LATHE SIGMA-1' ? '8' : '10+'})</span>
                </div>
                <p className="text-[10px] font-semibold text-[#424754] dark:text-[#c2c6d6] leading-normal pt-1">
                  Remaining operations duration prior to component safety threshold infringement.
                </p>
              </div>

              <div className="border-t border-[#ecedf7] dark:border-zinc-850 pt-3.5 space-y-2">
                <span className="text-[10px] font-bold text-[#727785] uppercase tracking-wider block">Recommended Parts Support</span>
                <ul className="text-xs font-semibold text-[#191b23] dark:text-zinc-200 list-disc pl-4 space-y-1">
                  {selectedPredictiveMachine === 'CNC ALPHA-1' && (
                    <>
                      <li>High speed spindle bearing</li>
                      <li>Lubrication pressure seals</li>
                    </>
                  )}
                  {selectedPredictiveMachine === 'PRESS DELTA-04' && (
                    <>
                      <li>High torque hydraulic manifold</li>
                      <li>Vibration absorption pads</li>
                    </>
                  )}
                  {selectedPredictiveMachine === 'LATHE SIGMA-1' && (
                    <>
                      <li>Carbide cutting inserts</li>
                      <li>Brushless motor carbon gears</li>
                    </>
                  )}
                  {selectedPredictiveMachine === 'MILL GAMMA-2' && (
                    <>
                      <li>Conveyor pulley tension kits</li>
                      <li>Inductive status proximity scans</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <button 
              onClick={() => alert(`Pre-allocated service order raised for recommended components on ${selectedPredictiveMachine}. Dispatching warehouse items.`)}
              className="w-full bg-[#0058be] hover:opacity-95 text-white font-extrabold text-[11px] py-1.5 rounded-lg mt-4 shadow uppercase"
            >
              Order Preventive Dispatch
            </button>
          </div>

        </div>
      </section>

      {/* Ranks list bento + predictive card */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top 5 impacted */}
        <div className="lg:col-span-2 bg-white dark:bg-[#2e3038] rounded-xl border border-[#ecedf7] dark:border-[#727785]/20 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-4 border-b border-[#ecedf7] dark:border-[#727785]/20 bg-zinc-50 dark:bg-zinc-800/10 flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#191b23] dark:text-white">Top 5 Impacted Machines</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#d0e1fb]/30 text-[#005ac2] px-2 py-0.5 rounded">
              Last 7 days
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f2f3fd]/40 dark:bg-[#191b23]/30 text-[10px] text-[#727785] font-bold uppercase tracking-wider border-b border-[#ecedf7] dark:border-[#727785]/20">
                <tr>
                  <th className="px-5 py-3">Machine ID</th>
                  <th className="px-5 py-3 text-right">Total Downtime</th>
                  <th className="px-5 py-3 text-right">Freq.</th>
                  <th className="px-5 py-3">Primary Reason</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ecedf7] dark:divide-[#191b23]/30 text-xs text-[#191b23] dark:text-white">
                {topImpactedMachines.map((machine, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-3.5 font-bold">{machine.code}</td>
                    <td className="px-5 py-3.5 font-semibold text-right">{machine.hrs}</td>
                    <td className="px-5 py-3.5 font-semibold text-right">{machine.freq}</td>
                    <td className="px-5 py-3.5 font-medium text-[#727785]/90 dark:text-[#c2c6d6]/90">{machine.reason}</td>
                    <td className="px-5 py-3.5 font-semibold">
                      <span className={`inline-flex items-center gap-1 text-[11px] uppercase ${
                        machine.status === 'critical' ? 'text-[#ba1a1a]' : machine.status === 'warning' ? 'text-[#924700]' : 'text-emerald-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          machine.status === 'critical' ? 'bg-[#ba1a1a]' : machine.status === 'warning' ? 'bg-[#924700]' : 'bg-emerald-600'
                        }`} />
                        {machine.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Predictive Card */}
        <div className="bg-[#2170e4] text-[#fefcff] rounded-xl p-6 shadow-sm border border-[#0058be] flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Predictive Alert Insight</span>
            </h3>
            <p className="text-xs opacity-90 mt-3 leading-relaxed">
              Based on specialized vibration telemetry and motor thermal logs collected overnight, <span className="font-bold bg-white/10 px-1 rounded">CNC ALPHA-1</span> shows an <span className="font-bold underline text-amber-200">84% probability of component fatigue failure</span> within 48 operational hours. Immediate check on spindle structures is recommended.
            </p>
          </div>

          <div className="relative h-20 bg-white/5 rounded-lg border border-white/10 mt-4 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <BarChart3 className="w-16 h-16 text-white" />
            </div>
            {/* Sparkline */}
            <svg className="absolute bottom-0 left-0 w-full h-10" preserveAspectRatio="none" viewBox="0 0 100 20">
              <path d="M0,20 L10,13 L20,18 L30,11 L40,15 L50,7 L60,11 L70,3 L80,7 L90,1 L100,2 L100,20 Z" fill="rgba(255,255,255,0.1)" />
              <path d="M0,20 L10,13 L20,18 L30,11 L40,15 L50,7 L60,11 L70,3 L80,7 L90,1 L100,2" fill="none" stroke="white" strokeWidth="0.8" />
            </svg>
          </div>

          <button 
            onClick={() => alert('Generating complete predictive analytical maintenance plan for CNC Alpha-1...')}
            className="w-full bg-[#fefcff] text-[#0058be] font-bold text-xs py-2.5 rounded-lg hover:bg-zinc-100 transition-colors uppercase tracking-wider mt-6"
          >
            Generate Full Report
          </button>
        </div>

      </section>

    </div>
  );
}
