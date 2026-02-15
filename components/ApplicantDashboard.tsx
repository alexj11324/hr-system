
import React, { useState, useEffect, useRef } from 'react';
import { ApplicantAccount, Candidate, Job, CandidateStage } from '../types';
import { supabase } from '../lib/supabase';
import { registerPasskey } from '../lib/auth';
import { BrandLogo, FileIcon, RotateCwIcon, BriefcaseIcon, CheckIcon, MapPinIcon, XIcon } from './Icons';
import { Modal } from './Modal';

interface ApplicantDashboardProps {
  applicant: ApplicantAccount;
  onLogout: () => void;
  onBackToJobs: () => void;
  onUpdateApplicant: (updated: ApplicantAccount) => void;
  allJobs: Job[];
  onLogoClick?: () => void;
}

type JobApplicationRow = {
  id: string;
  created_at?: string;
  user_id: string;
  job_id?: string | null;
  job_title?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  excitement_response?: string | null;
  evidence_response?: string | null;
  gender?: string | null;
  race?: string | null;
  application_type?: string | null;
  resume_url?: string | null;
  status?: string | null;
};

const PIPELINE_STAGES: CandidateStage[] = [
  'Applied',
  'Qualified',
  'Phone Screening',
  'Team Interview',
  'Hiring Manager Interview',
  'Making Offer',
  '30 Day Onboarding',
  'Hired'
];

const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({
  applicant,
  onLogout,
  onBackToJobs,
  onUpdateApplicant,
  allJobs,
  onLogoClick,
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'profile'>('applications');
  const [applications, setApplications] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<ApplicantAccount>(applicant);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedAppForStatus, setSelectedAppForStatus] = useState<Candidate | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileData(applicant);
  }, [applicant]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) return;
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, email, created_at')
          .eq('id', user.id)
          .single();
        if (cancelled) return;
        if (!error && profile) {
          const merged: ApplicantAccount = {
            ...profileData,
            id: user.id,
            email: profile.email ?? user.email ?? profileData.email,
            firstName: profile.first_name ?? '',
            lastName: profile.last_name ?? '',
            phone: profile.phone ?? '',
            createdAt: profile.created_at ?? profileData.createdAt ?? new Date().toISOString(),
          };
          setProfileData(merged);
          onUpdateApplicant(merged);
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  async function loadApplications() {
    setIsLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setApplications([]);
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as JobApplicationRow[];
    const mapped: Candidate[] = rows.map((r) => ({
      id: r.id,
      applicantId: r.user_id,
      name: `${profileData.firstName ?? ''} ${profileData.lastName ?? ''}`.trim() || (r.email ?? ''),
      email: r.email ?? profileData.email,
      phone: r.phone ?? profileData.phone,
      linkedin: r.linkedin ?? undefined,
      portfolio: r.portfolio ?? undefined,
      excitementResponse: r.excitement_response ?? undefined,
      evidenceResponse: r.evidence_response ?? undefined,
      gender: r.gender ?? undefined,
      race: r.race ?? undefined,
      type: (r.job_title as any) ?? undefined,
      stage: (r.status as any) ?? 'Applied',
      lastUpdated: (r.created_at ?? new Date().toISOString()).split('T')[0],
      source: 'Careers Portal',
      resume: r.resume_url
        ? { fileName: 'Resume', fileData: r.resume_url, uploadedAt: r.created_at ?? new Date().toISOString() }
        : undefined,
      jobId: r.job_id ?? undefined,
    }));
    setApplications(mapped);
    setIsLoading(false);
  }

  useEffect(() => {
    loadApplications();
  }, [applicant.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      alert('You must be signed in to update your profile.');
      setIsSavingProfile(false);
      return;
    }
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: profileData.email,
      role: 'applicant',
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      phone: profileData.phone,
    });
    setIsSavingProfile(false);
    if (error) {
      alert('Failed to update profile: ' + error.message);
      return;
    }
    onUpdateApplicant(profileData);
    alert('Profile updated successfully!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const updated = {
        ...profileData,
        resume: {
          fileName: file.name,
          fileData: event.target?.result as string,
          uploadedAt: new Date().toISOString(),
        },
      };
      setProfileData(updated);
      onUpdateApplicant(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterPasskey = async () => {
    try {
      await registerPasskey();
      alert("Passkey successfully registered! You can now use it to sign in.");
    } catch (err: any) {
      console.error("Passkey registration failed:", err);
      let friendlyError = err?.message ?? "Failed to register passkey.";
      if (friendlyError.toLowerCase().includes("webauthn is not supported")) {
        friendlyError = "Passkeys are not supported on this device or browser.";
      }
      alert(friendlyError);
    }
  };

  const getStatusColorClass = (stage: string) => {
    if (stage === 'Rejected') return 'text-red-500';
    if (['Applied', 'Qualified'].includes(stage)) return 'text-blue-500';
    if (['Phone Screening', 'Team Interview', 'Hiring Manager Interview'].includes(stage)) return 'text-purple-500';
    if (['Making Offer', '30 Day Onboarding', 'Hired'].includes(stage)) return 'text-emerald-500';
    return 'text-gray-500';
  };

  const renderPipelineProgress = (currentStage: string) => {
    const isRejected = currentStage === 'Rejected';
    // Normalize current stage matching the HR board exactly
    const normalizedCurrent = PIPELINE_STAGES.includes(currentStage as any) ? currentStage : 'Applied';
    const currentIndex = PIPELINE_STAGES.indexOf(normalizedCurrent as any);

    return (
      <div className="py-6 px-2">
        {isRejected ? (
          <div className="text-center py-12 bg-red-50 rounded-[2rem] border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
               <XIcon className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-2xl font-black text-red-600 uppercase tracking-tighter">Application Closed</h4>
            <p className="text-sm font-bold text-red-400 uppercase tracking-widest mt-2 max-w-xs mx-auto">Thank you for your interest. We've decided to move forward with other candidates at this time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                const isFuture = idx > currentIndex;

                return (
                  <div key={stage} className={`flex items-start gap-5 transition-all duration-300 ${isFuture ? 'opacity-30' : 'opacity-100'}`}>
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' :
                        isCurrent ? 'bg-white border-red-600 text-red-600 scale-110 shadow-xl shadow-red-600/20 ring-4 ring-red-50' :
                        'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        {isCompleted ? <CheckIcon className="w-5 h-5" /> : <span className="text-xs font-black">{idx + 1}</span>}
                      </div>
                      {idx !== PIPELINE_STAGES.length - 1 && (
                        <div className={`w-0.5 h-10 my-1 transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-100'}`} />
                      )}
                    </div>
                    <div className="pt-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h5 className={`text-sm font-black uppercase tracking-widest ${
                          isCompleted ? 'text-emerald-600' :
                          isCurrent ? 'text-gray-900' :
                          'text-gray-300'
                        }`}>
                          {stage}
                        </h5>
                        {isCurrent && (
                          <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse tracking-widest">
                            CURRENT
                          </span>
                        )}
                      </div>
                      
                      {/* Show subtext ONLY for current or completed items, remove "Upcoming milestone" */}
                      {(isCurrent || isCompleted) && (
                        <p className={`text-[10px] uppercase font-bold mt-1 tracking-wider ${isCompleted ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {isCompleted ? 'Step completed' : 'Our team is currently reviewing your profile'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-red-100">
      <nav className="fixed top-0 inset-x-0 bg-white border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={onLogoClick} className="group outline-none">
            <BrandLogo textClassName="text-xl font-black uppercase tracking-tighter group-hover:text-red-600 transition-colors" className="group-hover:scale-105 transition-all" />
          </button>
          <div className="flex items-center gap-6">
            <button
              onClick={onBackToJobs}
              className="text-[10px] font-black text-gray-500 hover:text-red-600 uppercase tracking-widest transition-all"
            >
              Explore Roles
            </button>
            <div className="w-[1px] h-6 bg-gray-100" />
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                {profileData.firstName} {profileData.lastName}
              </span>
              <button
                onClick={onLogout}
                className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-24 max-w-5xl mx-auto px-6">
        <header className="mb-12">
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter uppercase mb-2">My Career Portal</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Manage your profile and track your journey at CardioGuard
          </p>
        </header>

        <div className="flex bg-gray-50 p-1.5 rounded-[1.5rem] mb-12 w-fit border border-gray-100">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'applications' ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'profile' ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            My Profile
          </button>
        </div>

        {activeTab === 'applications' ? (
          <div className="space-y-6">
            {isLoading ? (
              <div className="py-20 flex justify-center">
                <RotateCwIcon className="w-8 h-8 animate-spin text-gray-200" />
              </div>
            ) : applications.length > 0 ? (
              applications.map((app) => {
                const job = allJobs.find((j) => j.id === app.jobId);
                const appliedDate = app.lastUpdated ? new Date(app.lastUpdated).toLocaleDateString() : '—';
                const stage = app.stage || 'Applied';

                return (
                  <div
                    key={app.id}
                    className="bg-white border border-gray-100 rounded-[2rem] p-8 hover:border-red-600/30 hover:shadow-2xl hover:shadow-red-500/5 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-gray-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">
                          {(job as any)?.department || 'CardioGuard'}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${getStatusColorClass(stage)}`}>
                          {stage === 'Rejected' ? <XIcon className="w-3 h-3" /> : <CheckIcon className="w-3 h-3" />} {stage}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
                        {job?.title || (app as any).jobTitle || app.type || 'Application'}
                      </h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Applied on {appliedDate}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedAppForStatus(app)}
                      className="px-6 py-3 border border-gray-200 text-[10px] font-black text-gray-900 uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                      View Status
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <BriefcaseIcon className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">No Applications Yet</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 mb-8">
                  Start your journey today by exploring our open roles.
                </p>
                <button
                  onClick={onBackToJobs}
                  className="px-10 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-gray-900/10"
                >
                  Explore Roles
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 animate-fade-in">
            <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-2xl shadow-gray-200/20">
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-10 flex items-center gap-3">
                <div className="w-1.5 h-8 bg-red-600 rounded-full" /> Profile Information
              </h2>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                      Email
                    </label>
                    <input
                      disabled
                      type="email"
                      value={profileData.email}
                      className="w-full bg-gray-100 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={(profileData as any).linkedin || ''}
                      onChange={(e) => setProfileData({ ...(profileData as any), linkedin: e.target.value } as any)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                      Portfolio
                    </label>
                    <input
                      type="url"
                      placeholder="https://portfolio.com"
                      value={(profileData as any).portfolio || ''}
                      onChange={(e) => setProfileData({ ...(profileData as any), portfolio: e.target.value } as any)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-10 py-5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-gray-900/10 disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-900 text-white rounded-[2.5rem] p-10 shadow-2xl shadow-gray-900/20">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                  <div className="w-1 h-6 bg-red-600 rounded-full" /> Primary Resume
                </h3>

                {profileData.resume ? (
                  <div className="flex items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate">
                        {profileData.resume.fileName}
                      </span>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[9px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-all"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-white/10 rounded-2xl p-8 text-center group hover:border-red-600/50 hover:bg-white/5 transition-all"
                  >
                    <FileIcon className="w-6 h-6 text-white/20 mx-auto mb-3 group-hover:text-red-600" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Upload Document</p>
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-xl shadow-gray-200/20">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-4">Account Security</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-8">
                  Manage your security credentials.
                </p>
                <button
                  onClick={handleRegisterPasskey}
                  className="w-full px-6 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-600 transition-all shadow-xl shadow-gray-900/10 mb-4"
                >
                  Register Passkey
                </button>
                <button className="w-full px-6 py-4 bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-2xl cursor-not-allowed">
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED STATUS MODAL */}
      <Modal 
        isOpen={!!selectedAppForStatus} 
        onClose={() => setSelectedAppForStatus(null)} 
        title="Recruitment Milestone Tracker"
      >
        {selectedAppForStatus && (
          <div className="animate-fade-in max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            <div className="mb-8 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-gray-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">
                  {allJobs.find(j => j.id === selectedAppForStatus.jobId)?.department || 'Engineering'}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusColorClass(selectedAppForStatus.stage || 'Applied')}`}>
                   {selectedAppForStatus.stage}
                </span>
              </div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-tight">
                {allJobs.find(j => j.id === selectedAppForStatus.jobId)?.title || selectedAppForStatus.type}
              </h3>
              <div className="flex items-center gap-2 text-gray-400 mt-2">
                <MapPinIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                   {allJobs.find(j => j.id === selectedAppForStatus.jobId)?.location || 'Remote'}
                </span>
              </div>
            </div>
            
            {renderPipelineProgress(selectedAppForStatus.stage || 'Applied')}

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end sticky bottom-0 bg-white pb-2">
              <button 
                onClick={() => setSelectedAppForStatus(null)}
                className="px-8 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-gray-900/10"
              >
                Done Tracking
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApplicantDashboard;
