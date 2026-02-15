import React, { useMemo, useState, useEffect } from 'react';
import { Job, Employee } from '../types';
import { BriefcaseIcon, UsersIcon, ActivityIcon, BarChartIcon, PieChartIcon, CheckIcon, EditIcon } from './Icons';
import { Modal } from './Modal';

interface DashboardProps {
  jobs: Job[];
  employees: Employee[];
}

const StatCard = ({ label, value, icon: Icon, colorClass, subtext }: { label: string, value: string | number, icon: any, colorClass: string, subtext?: string }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-lg ${colorClass} mr-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      {subtext && <p className="text-[10px] text-gray-400 mt-0.5">{subtext}</p>}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ jobs, employees }) => {
  // --- Hiring Goals State (Persisted) ---
  const [hiringGoals, setHiringGoals] = useState<{ annualTarget: number; monthlyTargets: number[] }>({
    annualTarget: 1000,
    monthlyTargets: [80, 85, 90, 85, 90, 95, 80, 85, 90, 85, 75, 60]
  });
  
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoals, setTempGoals] = useState(hiringGoals);

  useEffect(() => {
    const stored = localStorage.getItem('cardio_guard_hiring_goals');
    if (stored) {
      try {
        setHiringGoals(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse hiring goals", e);
      }
    }
  }, []);

  const handleOpenGoals = () => {
    setTempGoals(JSON.parse(JSON.stringify(hiringGoals))); // Deep copy
    setIsGoalModalOpen(true);
  };

  const handleSaveGoals = () => {
    setHiringGoals(tempGoals);
    localStorage.setItem('cardio_guard_hiring_goals', JSON.stringify(tempGoals));
    setIsGoalModalOpen(false);
  };

  const handleAutoDistribute = () => {
    const total = tempGoals.annualTarget || 0;
    const base = Math.floor(total / 12);
    const remainder = total % 12;
    
    const newMonths = Array(12).fill(base);
    // Distribute remainder
    for (let i = 0; i < remainder; i++) {
      newMonths[i]++;
    }
    setTempGoals({ ...tempGoals, monthlyTargets: newMonths });
  };

  // --- Calculations ---
  // 1. Stats based on Configured Target
  const targetHiring = hiringGoals.annualTarget;
  const totalEmployees = employees.length;
  const remainingToHire = Math.max(0, targetHiring - totalEmployees);
  const percentComplete = targetHiring > 0 ? Math.round((totalEmployees / targetHiring) * 100) : 0;

  const openPositions = jobs.filter(j => j.status === 'Open').length;
  const closedPausedPositions = jobs.filter(j => ['Closed', 'Paused'].includes(j.status)).length;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxMonthlyTarget = Math.max(...hiringGoals.monthlyTargets, 10); // Ensure non-zero denominator

  // 2. Dynamic Department Distribution (Strict 3-Team Structure)
  const { stats: deptStats, gradientString } = useMemo(() => {
    // Buckets for the 3 specific teams
    const counts: Record<string, number> = {
      'Web Development': 0,
      'Talent Management & Recruiting': 0,
      'Product Development': 0
    };

    employees.forEach(emp => {
      // Normalize to match exact keys
      const dept = emp.department;
      if (counts.hasOwnProperty(dept)) {
        counts[dept]++;
      } else {
        // Fallback mapping if legacy data exists in local storage
        if (dept.includes('Web') || dept.includes('Engineer')) counts['Web Development']++;
        else if (dept.includes('Talent') || dept.includes('People')) counts['Talent Management & Recruiting']++;
        else counts['Product Development']++;
      }
    });

    const total = employees.length || 1; // Avoid divide by zero
    
    // Configuration for the 3 teams
    const config: Record<string, { color: string, hex: string }> = {
      'Web Development': { color: 'bg-blue-500', hex: '#3b82f6' },
      'Talent Management & Recruiting': { color: 'bg-yellow-500', hex: '#eab308' },
      'Product Development': { color: 'bg-indigo-500', hex: '#6366f1' },
    };

    const stats = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
        color: config[name].color,
        hex: config[name].hex
      }))
      .sort((a, b) => b.count - a.count); // Sort largest to smallest

    // Generate Dynamic Conic Gradient
    let currentDeg = 0;
    const gradientParts = stats.map(stat => {
      const start = currentDeg;
      const end = currentDeg + (stat.count / total) * 100;
      currentDeg = end;
      return `${stat.hex} ${start}% ${end}%`;
    });

    // Fallback if no data
    const gradientString = gradientParts.length > 0 
      ? `conic-gradient(${gradientParts.join(', ')})` 
      : 'conic-gradient(#e5e7eb 0% 100%)';

    return { stats, gradientString };
  }, [employees]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time snapshot of recruiting progress.</p>
        </div>
        <button 
          onClick={handleOpenGoals}
          className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
        >
          <EditIcon className="w-4 h-4 mr-2 text-gray-500" />
          Edit Targets
        </button>
      </div>

      {/* 2. Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          label="Hiring Target" 
          value={targetHiring} 
          icon={ActivityIcon} 
          colorClass="bg-red-500"
          subtext={`${remainingToHire} remaining to hire (${percentComplete}% done)`}
        />
        <StatCard 
          label="Total Employees" 
          value={totalEmployees} 
          icon={UsersIcon} 
          colorClass="bg-indigo-500"
          subtext="Active headcount"
        />
        <StatCard 
          label="Open Positions" 
          value={openPositions} 
          icon={BriefcaseIcon} 
          colorClass="bg-green-500"
          subtext="Currently recruiting"
        />
        <StatCard 
          label="Closed / Paused" 
          value={closedPausedPositions} 
          icon={CheckIcon} 
          colorClass="bg-gray-400"
          subtext="Filled or on hold"
        />
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hiring Trends Bar Chart (Dynamic) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
            <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Projected Hiring Velocity</h3>
                  <p className="text-xs text-gray-500">Target roles filled per month (Planned)</p>
                </div>
                <BarChartIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 px-2 pb-2">
                {hiringGoals.monthlyTargets.map((value, i) => (
                    <div key={i} className="flex flex-col items-center w-full group cursor-default h-full justify-end">
                        <div className="relative w-full flex justify-center">
                           <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-blue-600 z-10 bg-white px-1 rounded shadow-sm border border-gray-100">
                             {value}
                           </div>
                        </div>
                        <div 
                            className="w-full max-w-[40px] bg-blue-500 rounded-t-sm opacity-80 group-hover:opacity-100 transition-all duration-300" 
                            style={{ height: `${(value / maxMonthlyTarget) * 85}%` }} // Scale to max 85% height to leave room for tooltip
                        ></div>
                        <span className="text-[10px] text-gray-500 mt-3 font-medium uppercase truncate w-full text-center">
                            {monthNames[i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Headcount Donut Chart (Dynamic 3-Team) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Headcount Ratio</h3>
                  <p className="text-xs text-gray-500">Distribution by Team</p>
                </div>
                <PieChartIcon className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
                {/* Donut Chart Visual */}
                <div 
                    className="w-48 h-48 rounded-full shadow-sm transition-all duration-500"
                    style={{ background: gradientString }}
                >
                    <div className="w-28 h-28 bg-white rounded-full relative top-10 left-10 flex flex-col items-center justify-center shadow-inner">
                         <span className="text-2xl font-bold text-gray-800">{totalEmployees}</span>
                         <span className="text-[10px] text-gray-400 uppercase tracking-wider">Total</span>
                    </div>
                </div>
                
                {/* Legend */}
                <div className="mt-8 w-full space-y-3">
                    {deptStats.length > 0 ? (
                      deptStats.map((stat) => (
                        <div key={stat.name} className="flex justify-between items-start text-xs text-gray-600">
                          <div className="flex items-start flex-1 mr-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${stat.color} mr-2 mt-0.5 flex-shrink-0`}></span>
                            <span className="leading-tight" title={stat.name}>{stat.name}</span>
                          </div>
                          <div className="flex gap-3 flex-shrink-0">
                             <span className="text-gray-400">{stat.count}</span>
                             <span className="font-semibold w-8 text-right">{stat.percent}%</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 text-center">No employee data available.</p>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* EDIT GOALS MODAL */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Configure Hiring Goals"
      >
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Annual Hiring Target
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                min="0"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                value={tempGoals.annualTarget}
                onChange={(e) => setTempGoals({...tempGoals, annualTarget: parseInt(e.target.value) || 0})}
              />
              <button 
                onClick={handleAutoDistribute}
                className="whitespace-nowrap px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                title="Split annual target evenly across months"
              >
                Auto-Distribute
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Sets the "Hiring Target" metric and distributes budget.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Monthly Hiring Targets
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {tempGoals.monthlyTargets.map((val, i) => (
                <div key={i}>
                  <label className="text-xs text-gray-500 block mb-1 font-medium">{monthNames[i]}</label>
                  <input 
                    type="number" 
                    min="0"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-xs border p-2"
                    value={val}
                    onChange={(e) => {
                      const newMonths = [...tempGoals.monthlyTargets];
                      newMonths[i] = parseInt(e.target.value) || 0;
                      setTempGoals({...tempGoals, monthlyTargets: newMonths});
                    }} 
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2">
               <span className="text-xs text-gray-400">Sum of months: {tempGoals.monthlyTargets.reduce((a, b) => a + b, 0)}</span>
               {tempGoals.monthlyTargets.reduce((a, b) => a + b, 0) !== tempGoals.annualTarget && (
                 <span className="text-xs text-yellow-600 font-medium">⚠️ Does not match annual</span>
               )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button 
              onClick={() => setIsGoalModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveGoals}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Dashboard;