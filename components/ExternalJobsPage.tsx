
import React, { useState, useMemo } from 'react';
import { Job, ApplicantAccount } from '../types';
import { BrandLogo, SearchIcon, MapPinIcon, BriefcaseIcon, BrandSymbol, CheckIcon } from './Icons';

interface ExternalJobsPageProps {
  jobs: Job[];
  applicant: ApplicantAccount | null;
  appliedJobIds?: string[];
  onApply: (job: Job) => void;
  onGoToProfile: () => void;
  onLogin: () => void;
  onLogoClick?: () => void;
}

const ExternalJobsPage: React.FC<ExternalJobsPageProps> = ({ 
  jobs, 
  applicant, 
  appliedJobIds = [], 
  onApply, 
  onGoToProfile, 
  onLogin, 
  onLogoClick 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDept, setActiveDept] = useState('All');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openJobs = useMemo(() => jobs.filter(j => j.status === 'Open'), [jobs]);
  
  const departments = useMemo(() => {
    const depts = new Set(openJobs.map(j => j.department));
    return ['All', ...Array.from(depts)].sort();
  }, [openJobs]);

  const filteredJobs = useMemo(() => {
    return openJobs.filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = activeDept === 'All' || j.department === activeDept;
      return matchesSearch && matchesDept;
    });
  }, [openJobs, searchTerm, activeDept]);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-red-100">
      {/* Brand Navigation Header - Fixed to Top */}
      <nav className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={onLogoClick}
            className="group flex items-center outline-none"
          >
            <BrandLogo 
              symbolSize="w-9 h-9" 
              textClassName="text-xl font-black uppercase tracking-tighter group-hover:text-red-600 transition-colors" 
              className="group-hover:scale-105 transition-transform"
            />
          </button>
          <div className="hidden md:flex items-center gap-10">
            {/* Removed unnecessary/dead links per request */}
            {applicant ? (
              <button onClick={onGoToProfile} className="px-6 py-2.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-600 transition-all flex items-center gap-3">
                My Dashboard
              </button>
            ) : (
              <button onClick={onLogin} className="px-6 py-2.5 bg-gray-50 text-gray-900 border border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-gray-100 transition-all">
                Sign In
              </button>
            )}
          </div>
          <button className="md:hidden p-2 text-gray-400" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            )}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-3">
            {applicant ? (
              <button onClick={() => { onGoToProfile(); setMobileMenuOpen(false); }} className="w-full px-6 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-red-600 transition-all">
                My Dashboard
              </button>
            ) : (
              <button onClick={() => { onLogin(); setMobileMenuOpen(false); }} className="w-full px-6 py-3 bg-gray-50 text-gray-900 border border-gray-200 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-gray-100 transition-all">
                Sign In
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Hero Section - Padding adjusted for Top Fixed Nav */}
      <section className="bg-gray-900 text-white pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
          <BrandSymbol className="w-full h-full scale-[2]" />
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-500 px-4 py-2 rounded-full mb-8 border border-red-600/30">
            <BrandSymbol className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Now Hiring</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] uppercase mb-8">
            Join the <span className="text-red-600">CardioGuard</span> Mission
          </h1>
          <p className="text-lg md:text-xl text-gray-400 font-medium max-w-2xl leading-relaxed">
            We're building the future of healthcare technology. Join a team dedicated to saving lives through innovation, precision, and world-class engineering.
          </p>
        </div>
      </section>

      {/* Filter Bar - Sticky relative to Fixed Nav (Height 20 / 80px) */}
      <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto">
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  activeDept === dept 
                  ? 'bg-gray-900 text-white shadow-lg' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-red-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 gap-8">
          {filteredJobs.map(job => {
            const hasApplied = appliedJobIds.includes(job.id);
            return (
              <div 
                key={job.id} 
                className={`group bg-white border border-gray-100 rounded-[2.5rem] p-10 transition-all ${hasApplied ? 'opacity-80 grayscale-[0.5]' : 'hover:border-red-600/30 hover:shadow-2xl hover:shadow-red-500/10 cursor-pointer'}`}
                onClick={() => !hasApplied && onApply(job)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-900 text-[9px] font-black rounded-lg uppercase tracking-widest border border-gray-200">
                        {job.department}
                      </span>
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{job.location}</span>
                      </div>
                      {hasApplied && (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Application Submitted</span>
                        </div>
                      )}
                    </div>
                    <h3 className={`text-3xl font-black text-gray-900 tracking-tighter uppercase transition-colors ${!hasApplied ? 'group-hover:text-red-600' : ''}`}>
                      {job.title}
                    </h3>
                  </div>
                  
                  {hasApplied ? (
                    <button 
                      disabled
                      className="px-8 py-4 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-emerald-100 flex items-center gap-2 cursor-default"
                    >
                      <CheckIcon className="w-4 h-4" /> Already Applied
                    </button>
                  ) : (
                    <button className="px-8 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-red-600 hover:scale-105 transition-all shadow-xl shadow-gray-900/10">
                      {applicant ? 'Apply Now' : 'Sign In to Apply'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredJobs.length === 0 && (
            <div className="py-20 text-center">
              <div className="inline-flex p-6 bg-gray-50 rounded-full mb-6">
                <BriefcaseIcon className="w-12 h-12 text-gray-200" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">No roles found</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Try adjusting your filters or search term</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-20 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <BrandLogo textClassName="text-xl font-black uppercase tracking-tighter" symbolSize="w-10 h-10" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">© 2024 High-Performance Healthcare Systems</p>
        </div>
      </footer>
    </div>
  );
};

export default ExternalJobsPage;
