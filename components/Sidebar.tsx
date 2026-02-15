
import React from 'react';
import { LayoutDashboardIcon, BriefcaseIcon, UsersIcon, SettingsIcon, ActivityIcon, MessageSquareIcon, MapPinIcon, BrandSymbol } from './Icons';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  onLogoClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogoClick }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { id: 'jobs', label: 'Jobs', icon: BriefcaseIcon },
    { id: 'candidates', label: 'Candidates', icon: UsersIcon },
    { id: 'employees', label: 'Employees', icon: UsersIcon },
    { id: 'ai_assistant', label: 'AI Assistant', icon: MessageSquareIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 z-10 bg-white border-r border-gray-200 shadow-sm">
      {/* Logo Area */}
      <button 
        onClick={onLogoClick}
        className="flex items-center h-16 px-6 border-b border-gray-100 w-full hover:bg-gray-50 transition-colors text-left outline-none group"
      >
        <BrandSymbol className="h-7 w-7 mr-3 group-hover:scale-110 transition-transform" />
        <span className="text-lg font-bold text-gray-900 tracking-tight">CardioGuard</span>
      </button>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-2 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.id === currentView;
            
            return (
              <a
                key={item.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onViewChange(item.id);
                }}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200
                  ${isActive 
                    ? 'bg-red-50 text-red-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <item.icon 
                  className={`
                    mr-3 flex-shrink-0 h-5 w-5 transition-colors
                    ${isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'}
                  `} 
                />
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Public Preview Access */}
      <div className="p-3">
        <button 
          onClick={() => onViewChange('external_jobs')}
          className="w-full flex items-center justify-between p-4 bg-gray-900 rounded-2xl text-white hover:bg-red-600 transition-all group shadow-xl shadow-gray-900/10"
        >
          <div className="flex items-center">
            <MapPinIcon className="w-4 h-4 mr-3 text-red-500 group-hover:text-white" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Careers</p>
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1 group-hover:text-white/60">Public Site</p>
            </div>
          </div>
          <ActivityIcon className="w-3 h-3 text-white/20 group-hover:text-white" />
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-md p-3 text-center border border-gray-100">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Sprint 1 MVP Build</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
