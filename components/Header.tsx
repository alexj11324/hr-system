import React from 'react';
import { SearchIcon, BellIcon, MenuIcon } from './Icons';

interface HeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentUser: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, onSearchChange, currentUser, onLogout }) => {
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-20">
      
      {/* Mobile Menu Button (Visible on mobile only) */}
      <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-6 w-6" />
      </button>

      {/* Search Bar */}
      <div className="flex-1 flex justify-center lg:justify-start max-w-2xl ml-4 md:ml-0">
        <div className="w-full max-w-lg lg:max-w-xs relative text-gray-500 focus-within:text-gray-600">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5" />
          </div>
          <input
            name="search"
            id="search"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
            placeholder="Search jobs..."
            type="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="ml-4 flex items-center md:ml-6">
        <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 relative">
          <span className="sr-only">View notifications</span>
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Profile Dropdown Area */}
        <div className="ml-3 relative flex items-center pl-3 border-l border-gray-200">
          <div className="hidden md:flex flex-col items-end mr-3">
            <span className="text-sm font-bold text-gray-900">{currentUser}</span>
            <span className="text-xs text-primary-600 font-medium">HR Team</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200 shadow-sm">
              {getInitials(currentUser)}
            </div>
            
            <button 
                onClick={onLogout}
                className="text-xs font-medium text-gray-500 hover:text-red-600 border border-gray-200 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors"
            >
                Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;