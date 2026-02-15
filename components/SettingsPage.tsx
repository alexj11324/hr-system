
import React, { useState, useEffect } from 'react';
import { SettingsIcon, RotateCwIcon } from './Icons';

const SettingsPage: React.FC = () => {
  const [counts, setCounts] = useState({ candidates: 0, applications: 0 });

  useEffect(() => {
    const c = localStorage.getItem('cg_candidates');
    const a = localStorage.getItem('cg_applications');
    setCounts({
      candidates: c ? JSON.parse(c).length : 0,
      applications: a ? JSON.parse(a).length : 0
    });
  }, []);
  
  const handleResetDemo = () => {
    if (confirm("Are you sure you want to reset all demo data? This will clear all candidates and applications.")) {
      localStorage.removeItem('cg_candidates');
      localStorage.removeItem('cg_applications');
      window.location.reload();
    }
  };

  const handleExport = () => {
    const data = {
      candidates: JSON.parse(localStorage.getItem('cg_candidates') || '[]'),
      applications: JSON.parse(localStorage.getItem('cg_applications') || '[]')
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("Data copied to clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                    <SettingsIcon className="w-6 h-6 mr-2 text-gray-500" />
                    Settings
                </h1>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="pb-6 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">General Information</h3>
                    <p className="text-xs text-gray-500 mt-1">Company details and branding.</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Company Name</label>
                            <input disabled type="text" value="Cardio Guard" className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-sm p-2 text-gray-500 cursor-not-allowed border" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Domain</label>
                            <input disabled type="text" value="cardioguard.com" className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 text-sm p-2 text-gray-500 cursor-not-allowed border" />
                        </div>
                    </div>
                </div>

                <div className="pb-6 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500 mt-1">Manage your email preferences.</p>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center">
                            <input id="notif-1" type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                            <label htmlFor="notif-1" className="ml-2 block text-sm text-gray-700">New applicant alerts</label>
                        </div>
                        <div className="flex items-center">
                            <input id="notif-2" type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" defaultChecked />
                            <label htmlFor="notif-2" className="ml-2 block text-sm text-gray-700">Weekly hiring summary</label>
                        </div>
                    </div>
                </div>

                <div className="pb-6 border-b border-gray-100">
                   <h3 className="text-sm font-medium text-gray-900">Data Management</h3>
                   <p className="text-xs text-gray-500 mt-1">Manage local persistence data.</p>
                   
                   <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Data Debugger</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <div className="text-xs text-gray-400 uppercase font-bold">Candidates</div>
                          <div className="text-xl font-black text-gray-900">{counts.candidates}</div>
                        </div>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <div className="text-xs text-gray-400 uppercase font-bold">Applications</div>
                          <div className="text-xl font-black text-gray-900">{counts.applications}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleExport} className="px-3 py-2 bg-white border border-gray-300 rounded text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors">
                          Export localStorage JSON
                        </button>
                        <button 
                          onClick={handleResetDemo}
                          className="flex items-center px-3 py-2 bg-white border border-red-200 text-red-600 rounded text-xs font-bold hover:bg-red-50 transition-colors shadow-sm"
                        >
                           <RotateCwIcon className="w-4 h-4 mr-2" />
                           Reset Demo Data
                        </button>
                      </div>
                   </div>
                </div>
                
                <div className="pt-4">
                    <button className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-black transition-colors">
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsPage;