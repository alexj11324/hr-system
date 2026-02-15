
import React, { useState, useEffect } from 'react';
import { supabase } from "./lib/supabase";
import { Job, ViewState, Employee, Candidate, ApplicantAccount } from './types';
import { MOCK_JOBS, MOCK_EMPLOYEES } from './constants';
import Dashboard from './components/Dashboard';
import JobsPage from './components/JobsPage';
import EmployeesPage from './components/EmployeesPage';
import CandidatesPage from './components/CandidatesPage';
import CandidateProfilePage from './components/CandidateProfilePage';
import AiAssistant from './components/AiAssistant';
import SettingsPage from './components/SettingsPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import ExternalJobsPage from './components/ExternalJobsPage';
import ApplicationFormPage from './components/ApplicationFormPage';
import ExternalAuthPage from './components/ExternalAuthPage';
import ApplicantDashboard from './components/ApplicantDashboard';
import { BrandSymbol } from './components/Icons';
import { mapDbJobToFrontend, mapFrontendJobToDb } from './lib/utils';

const HR_EMAIL = 'hr@cardioguard.com';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentApplicant, setCurrentApplicant] = useState<ApplicantAccount | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const handleGlobalReset = async () => {
    setCurrentUser(null);
    localStorage.removeItem('cardio_guard_current_user');
    await supabase.auth.signOut();
    setCurrentApplicant(null);
    setAppliedJobIds([]);
    setCurrentView('dashboard');
    setSelectedJobForApplication(null);
    setSelectedCandidateId(null);
  };

  const fetchAppliedJobIds = async (userId: string) => {
    const { data, error } = await supabase.from('job_applications').select('job_id').eq('user_id', userId);
    if (!error && data) setAppliedJobIds(data.map(item => item.job_id).filter(Boolean));
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
    if (!error && data) setJobs(data.map(mapDbJobToFrontend));
    else setJobs(MOCK_JOBS);
  };

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async (userId: string, email: string) => {
      if (email === HR_EMAIL) {
        if (mounted) { setCurrentApplicant(null); setAppliedJobIds([]); }
        return;
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (mounted && !error && data) {
        setCurrentApplicant({
          id: userId,
          email: email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '',
          resume: data.resume_url ? { fileName: 'Resume', fileData: data.resume_url, uploadedAt: data.updated_at || data.created_at } : undefined,
          createdAt: data.created_at || new Date().toISOString(),
        });
        await fetchAppliedJobIds(userId);
      } else if (mounted) {
        setCurrentApplicant({ id: userId, email: email, firstName: '', lastName: '', phone: '', createdAt: new Date().toISOString() });
        await fetchAppliedJobIds(userId);
      }
    };

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user ?? null;
        if (mounted) {
          if (user?.email && user.email !== HR_EMAIL) await fetchProfile(user.id, user.email);
          else { setCurrentApplicant(null); setAppliedJobIds([]); }
          setAuthChecked(true);
        }
      } catch (e) {
        if (mounted) setAuthChecked(true);
      }
    };
    checkSession();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      if (user?.email && user.email !== HR_EMAIL) await fetchProfile(user.id, user.email);
      else { setCurrentApplicant(null); setAppliedJobIds([]); }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('cardio_guard_current_user');
    if (storedUser) setCurrentUser(storedUser);
    setIsAuthLoading(false);
    const fetchData = async () => {
      setIsLoadingData(true);
      await fetchJobs();
      setEmployees(MOCK_EMPLOYEES);
      setIsLoadingData(false);
    };
    fetchData();
  }, []);

  const handleLogin = (user: string) => { setCurrentUser(user); localStorage.setItem('cardio_guard_current_user', user); setCurrentView('dashboard'); };
  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('cardio_guard_current_user'); };
  const handleApplicantLogin = (applicant: ApplicantAccount) => { setCurrentApplicant(applicant); if (selectedJobForApplication) setCurrentView('application_form'); else setCurrentView('external_profile'); };
  const handleApplicantLogout = async () => { await supabase.auth.signOut(); setCurrentApplicant(null); setAppliedJobIds([]); setCurrentView('external_jobs'); };
  const handleUpdateApplicant = (updated: ApplicantAccount) => setCurrentApplicant(updated);
  const handleSelectCandidate = (id: string) => { setSelectedCandidateId(id); setCurrentView('candidate_detail'); };

  const handleNewApplication = async (applicationData: any) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { alert("Session expired."); setCurrentView("external_auth"); return; }

    // IDENTIFICATION SOURCE FIX: Ensure explicit names are saved
    // We use the explicit firstName and lastName from the form data
    const firstName = applicationData.firstName || '';
    const lastName = applicationData.lastName || '';
    
    // 1. Update Profile (User Account)
    await supabase.from("profiles").upsert({
      id: user.id,
      email: applicationData.email,
      first_name: firstName,
      last_name: lastName,
      phone: applicationData.phone,
      role: 'applicant'
    });

    // 2. Create Job Application (Snapshot)
    // We explicitly save first_name and last_name here so HR views can read them directly
    const { error } = await supabase.from("job_applications").insert({
      user_id: user.id,
      job_id: selectedJobForApplication?.id ?? null,
      job_title: selectedJobForApplication?.title ?? null,
      first_name: firstName,
      last_name: lastName,
      email: applicationData.email,
      phone: applicationData.phone,
      linkedin: applicationData.linkedin,
      portfolio: applicationData.portfolio,
      excitement_response: applicationData.excitementResponse,
      evidence_response: applicationData.evidenceResponse,
      gender: applicationData.gender,
      race: applicationData.race,
      application_type: applicationData.type,
      resume_url: applicationData.resume?.fileData ?? null
    });

    if (error) { alert("Submission failed: " + error.message); return; }
    if (selectedJobForApplication?.id) setAppliedJobIds(prev => [...prev, selectedJobForApplication.id]);
    alert("Application received!");
    setCurrentView("external_profile");
  };

  const handleAddJob = async (newJob: Job) => {
    const { error } = await supabase.from('jobs').insert([mapFrontendJobToDb(newJob)]);
    if (!error) fetchJobs();
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    const { error } = await supabase.from('jobs').update(mapFrontendJobToDb(updatedJob)).eq('id', updatedJob.id);
    if (!error) fetchJobs();
  };

  const handleDeleteJob = async (id: string) => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (!error) fetchJobs();
  };

  const renderContent = () => {
    if (isLoadingData) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div></div>;
    switch (currentView) {
      case 'dashboard': return <Dashboard jobs={jobs} employees={employees} />;
      case 'jobs': return <JobsPage jobs={jobs} employees={employees} onAddJob={handleAddJob} onUpdateJob={handleUpdateJob} onDeleteJob={handleDeleteJob} />;
      case 'employees': return <EmployeesPage employees={employees} onAddEmployee={() => {}} onUpdateEmployee={() => {}} onDeleteEmployee={() => {}} />;
      case 'candidates': return <CandidatesPage onSelectCandidate={handleSelectCandidate} />;
      case 'candidate_detail': return <CandidateProfilePage candidateId={selectedCandidateId} onBack={() => setCurrentView('candidates')} />;
      case 'ai_assistant': return <AiAssistant />;
      case 'settings': return <SettingsPage />;
      case 'external_jobs': return <ExternalJobsPage jobs={jobs} applicant={currentApplicant} appliedJobIds={appliedJobIds} onApply={(job) => { setSelectedJobForApplication(job); if (!currentApplicant) setCurrentView('external_auth'); else setCurrentView('application_form'); }} onGoToProfile={() => setCurrentView('external_profile')} onLogin={() => setCurrentView('external_auth')} onLogoClick={handleGlobalReset} />;
      case 'external_auth': return <ExternalAuthPage onLogin={handleApplicantLogin} onBack={() => setCurrentView('external_jobs')} onLogoClick={handleGlobalReset} />;
      case 'external_profile': return currentApplicant ? <ApplicantDashboard applicant={currentApplicant} onLogout={handleApplicantLogout} onBackToJobs={() => setCurrentView('external_jobs')} onUpdateApplicant={handleUpdateApplicant} allJobs={jobs} onLogoClick={handleGlobalReset} /> : <ExternalAuthPage onLogin={handleApplicantLogin} onBack={() => setCurrentView('external_jobs')} onLogoClick={handleGlobalReset} />;
      case 'application_form': 
        if (!currentApplicant) return <ExternalAuthPage onLogin={handleApplicantLogin} onBack={() => setCurrentView('external_jobs')} onLogoClick={handleGlobalReset} />;
        return selectedJobForApplication ? <ApplicationFormPage job={selectedJobForApplication} applicant={currentApplicant} onBack={() => setCurrentView('external_jobs')} onSubmit={handleNewApplication} onLogoClick={handleGlobalReset} /> : <ExternalJobsPage jobs={jobs} applicant={currentApplicant} appliedJobIds={appliedJobIds} onApply={(job) => { setSelectedJobForApplication(job); setCurrentView('application_form'); }} onGoToProfile={() => setCurrentView('external_profile')} onLogin={() => setCurrentView('external_auth')} onLogoClick={handleGlobalReset} />;
      default: return <Dashboard jobs={jobs} employees={employees} />;
    }
  };

  if (isAuthLoading) return null;
  const isExternalPortalView = ['external_jobs', 'application_form', 'external_auth', 'external_profile'].includes(currentView);
  if (isExternalPortalView) {
    return (
      <div className="relative min-h-screen">
        {renderContent()}
        {currentUser && (
          <div className="fixed bottom-6 right-6 z-[100] animate-fade-in">
            <button onClick={() => setCurrentView('dashboard')} className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-red-600 transition-all shadow-2xl flex items-center gap-3 group"><BrandSymbol className="w-5 h-5 group-hover:scale-110 transition-transform" />Return to Admin</button>
          </div>
        )}
      </div>
    );
  }
  if (!currentUser) return <LoginPage onLogin={handleLogin} onGoToCareers={() => setCurrentView('external_jobs')} />;
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar currentView={currentView} onViewChange={(view) => setCurrentView(view)} onLogoClick={handleGlobalReset} />
      <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
        <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

export default App;
