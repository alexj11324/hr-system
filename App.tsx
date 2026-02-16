import React, { useCallback, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react';
import { supabase } from './lib/supabase';
import { bootstrapAuthState } from './lib/authBootstrap';
import { Job, ViewState, Employee, ApplicantAccount } from './types';
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
const AUTH_TIMEOUT_MS = 8000;
const ADMIN_USER_KEY = 'cardio_guard_current_user';
const LAST_VIEW_KEY = 'cardio_guard_last_view';
const LAST_APPLICATION_JOB_KEY = 'cardio_guard_last_application_job';

const PERSISTED_VIEWS = new Set<ViewState>([
  'dashboard',
  'external_jobs',
  'external_auth',
  'external_profile',
  'application_form',
]);

const CANDIDATE_VIEWS = new Set<ViewState>([
  'external_jobs',
  'external_profile',
  'application_form',
]);

const parseView = (value: string | null): ViewState | null => {
  if (!value) return null;
  return PERSISTED_VIEWS.has(value as ViewState) ? (value as ViewState) : null;
};

const addAuthBreadcrumb = (
  message: string,
  data?: Record<string, unknown>,
  level: 'info' | 'warning' | 'error' = 'info'
) => {
  Sentry.addBreadcrumb({
    category: 'auth.state',
    message,
    data,
    level,
  });
  if (level === 'error') {
    Sentry.captureMessage(`[auth.state] ${message}`, 'warning');
  }
};

const App: React.FC = () => {
  const [authPhase, setAuthPhase] = useState<'bootstrapping' | 'ready'>('bootstrapping');
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem(ADMIN_USER_KEY));
  const [currentApplicant, setCurrentApplicant] = useState<ApplicantAccount | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>(() => parseView(localStorage.getItem(LAST_VIEW_KEY)) ?? 'external_jobs');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<Job | null>(null);
  const [pendingApplicationJobId, setPendingApplicationJobId] = useState<string | null>(() => localStorage.getItem(LAST_APPLICATION_JOB_KEY));
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const clearCandidateState = useCallback(() => {
    setCurrentApplicant(null);
    setAppliedJobIds([]);
    setSelectedJobForApplication(null);
    setPendingApplicationJobId(null);
    localStorage.removeItem(LAST_APPLICATION_JOB_KEY);
  }, []);

  const resolvePublicView = useCallback((preferred: ViewState | null): ViewState => {
    if (preferred === 'external_auth' || preferred === 'external_jobs') {
      return preferred;
    }
    return 'external_jobs';
  }, []);

  const fetchAppliedJobIds = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('job_applications').select('job_id').eq('user_id', userId);
    if (!error && data) {
      setAppliedJobIds(data.map((item) => item.job_id).filter(Boolean));
      return;
    }
    setAppliedJobIds([]);
  }, []);

  const fetchProfile = useCallback(
    async (userId: string, email: string): Promise<ApplicantAccount> => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!error && data) {
        return {
          id: userId,
          email,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '',
          resume: data.resume_url
            ? { fileName: 'Resume', fileData: data.resume_url, uploadedAt: data.updated_at || data.created_at }
            : undefined,
          createdAt: data.created_at || new Date().toISOString(),
        };
      }
      return { id: userId, email, firstName: '', lastName: '', phone: '', createdAt: new Date().toISOString() };
    },
    []
  );

  const fetchJobs = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setJobs(data.map(mapDbJobToFrontend));
        return;
      }
      setJobs(MOCK_JOBS);
    } catch (error) {
      console.error('Failed to fetch jobs, using fallback data:', error);
      setJobs(MOCK_JOBS);
    }
  }, []);

  const applyCandidateSession = useCallback(
    async (user: { id: string; email?: string | null }, preferredView: ViewState | null) => {
      if (!user.email) throw new Error('Candidate session missing email');
      const profile = await fetchProfile(user.id, user.email);
      await fetchAppliedJobIds(user.id);
      setCurrentApplicant(profile);
      setCurrentUser(null);
      localStorage.removeItem(ADMIN_USER_KEY);

      const resolvedView =
        preferredView && CANDIDATE_VIEWS.has(preferredView) ? preferredView : 'external_profile';
      if (resolvedView === 'application_form') {
        const storedJobId = localStorage.getItem(LAST_APPLICATION_JOB_KEY);
        if (storedJobId) {
          setPendingApplicationJobId(storedJobId);
          setCurrentView('application_form');
        } else {
          setCurrentView('external_profile');
        }
      } else {
        setCurrentView(resolvedView);
      }
    },
    [fetchAppliedJobIds, fetchProfile]
  );

  const handleAuthChange = useCallback(
    async (event: string, session: { user?: { id: string; email?: string | null } } | null) => {
      const user = session?.user ?? null;
      addAuthBreadcrumb('on-auth-state-change', { event, hasSession: !!user });

      if (user?.email && user.email !== HR_EMAIL) {
        try {
          await applyCandidateSession(user, parseView(localStorage.getItem(LAST_VIEW_KEY)));
        } catch (error) {
          console.error('Auth state change handling failed:', error);
          addAuthBreadcrumb('auth-change-candidate-failed', { event }, 'error');
          clearCandidateState();
          setCurrentView('external_auth');
        }
        return;
      }

      clearCandidateState();
      if (event === 'SIGNED_OUT') {
        const storedAdmin = localStorage.getItem(ADMIN_USER_KEY);
        setCurrentView(storedAdmin ? 'dashboard' : 'external_jobs');
      }
    },
    [applyCandidateSession, clearCandidateState]
  );

  const recoverCandidateSession = useCallback(
    async (preferredView: ViewState): Promise<boolean> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (!user?.email || user.email === HR_EMAIL) {
          return false;
        }
        addAuthBreadcrumb('recover-candidate-session', { preferredView });
        await applyCandidateSession(user, preferredView);
        return true;
      } catch (error) {
        console.error('Failed to recover candidate session:', error);
        addAuthBreadcrumb('recover-candidate-session-failed', { preferredView }, 'error');
        return false;
      }
    },
    [applyCandidateSession]
  );

  const handleGlobalReset = useCallback(async () => {
    setCurrentUser(null);
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(LAST_VIEW_KEY);
    clearCandidateState();
    await supabase.auth.signOut();
    setCurrentView('dashboard');
    setSelectedCandidateId(null);
  }, [clearCandidateState]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      setAuthPhase('bootstrapping');
      const preferredView = parseView(localStorage.getItem(LAST_VIEW_KEY));
      const result = await bootstrapAuthState({ timeoutMs: AUTH_TIMEOUT_MS, retries: 1 });
      if (!mounted) return;

      if (result.error) {
        console.error('Session bootstrap failed:', result.error);
        addAuthBreadcrumb(
          'session-bootstrap-error',
          { attempts: result.attempts, timedOut: result.timedOut },
          'error'
        );
      }
      if (result.timedOut) {
        addAuthBreadcrumb('session-bootstrap-timeout', {
          attempts: result.attempts,
          recovered: result.recovered,
        });
      }

      const user = result.session?.user ?? null;
      if (user?.email && user.email !== HR_EMAIL) {
        try {
          await applyCandidateSession(user, preferredView);
        } catch (error) {
          console.error('Failed to apply candidate session:', error);
          addAuthBreadcrumb('apply-candidate-session-failed', undefined, 'error');
          clearCandidateState();
          setCurrentView('external_auth');
        } finally {
          if (mounted) setAuthPhase('ready');
        }
        return;
      }

      clearCandidateState();
      const storedAdmin = localStorage.getItem(ADMIN_USER_KEY);
      if (storedAdmin) {
        setCurrentUser(storedAdmin);
        setCurrentView('dashboard');
      } else {
        setCurrentView(resolvePublicView(preferredView));
      }
      setAuthPhase('ready');
    };

    void bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(() => {
        if (!mounted) return;
        void handleAuthChange(event, session as { user?: { id: string; email?: string | null } } | null);
      }, 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [applyCandidateSession, clearCandidateState, handleAuthChange, resolvePublicView]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        await fetchJobs();
        setEmployees(MOCK_EMPLOYEES);
      } catch (error) {
        console.error('Initial data load failed:', error);
        setJobs(MOCK_JOBS);
        setEmployees(MOCK_EMPLOYEES);
      } finally {
        setIsLoadingData(false);
      }
    };
    void fetchData();
  }, [fetchJobs]);

  useEffect(() => {
    if (PERSISTED_VIEWS.has(currentView)) {
      localStorage.setItem(LAST_VIEW_KEY, currentView);
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'application_form' && selectedJobForApplication?.id) {
      localStorage.setItem(LAST_APPLICATION_JOB_KEY, selectedJobForApplication.id);
      setPendingApplicationJobId(selectedJobForApplication.id);
      return;
    }
    if (currentView !== 'application_form') {
      localStorage.removeItem(LAST_APPLICATION_JOB_KEY);
      setPendingApplicationJobId(null);
      setSelectedJobForApplication(null);
    }
  }, [currentView, selectedJobForApplication]);

  useEffect(() => {
    if (authPhase !== 'ready') return;
    if (currentApplicant) return;
    if (currentView !== 'external_profile' && currentView !== 'application_form') return;

    let cancelled = false;
    const recover = async () => {
      const recovered = await recoverCandidateSession(currentView);
      if (cancelled || recovered) return;
      setCurrentView('external_auth');
    };

    void recover();
    return () => {
      cancelled = true;
    };
  }, [authPhase, currentApplicant, currentView, recoverCandidateSession]);

  useEffect(() => {
    if (currentView !== 'application_form' || selectedJobForApplication) return;
    if (!pendingApplicationJobId) {
      setCurrentView('external_profile');
      return;
    }
    const restoredJob = jobs.find((job) => job.id === pendingApplicationJobId);
    if (restoredJob) {
      setSelectedJobForApplication(restoredJob);
      return;
    }
    if (!isLoadingData) {
      setCurrentView('external_profile');
      localStorage.removeItem(LAST_APPLICATION_JOB_KEY);
      setPendingApplicationJobId(null);
    }
  }, [currentView, isLoadingData, jobs, pendingApplicationJobId, selectedJobForApplication]);

  const handleLogin = (user: string) => {
    setCurrentUser(user);
    localStorage.setItem(ADMIN_USER_KEY, user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(ADMIN_USER_KEY);
  };

  const handleApplicantLogin = (applicant: ApplicantAccount) => {
    setCurrentApplicant(applicant);
    const nextView = selectedJobForApplication ? 'application_form' : 'external_profile';
    setCurrentView(nextView);
  };

  const handleExternalLoginIntent = useCallback(async () => {
    const recovered = await recoverCandidateSession('external_profile');
    if (!recovered) {
      setCurrentView('external_auth');
    }
  }, [recoverCandidateSession]);

  const handleExternalApply = useCallback(
    async (job: Job) => {
      setSelectedJobForApplication(job);
      setPendingApplicationJobId(job.id);
      localStorage.setItem(LAST_APPLICATION_JOB_KEY, job.id);

      if (currentApplicant) {
        setCurrentView('application_form');
        return;
      }

      const recovered = await recoverCandidateSession('application_form');
      if (!recovered) {
        setCurrentView('external_auth');
      }
    },
    [currentApplicant, recoverCandidateSession]
  );

  const handleApplicantLogout = async () => {
    await supabase.auth.signOut();
    clearCandidateState();
    setCurrentView('external_jobs');
  };

  const handleUpdateApplicant = (updated: ApplicantAccount) => setCurrentApplicant(updated);
  const handleSelectCandidate = (id: string) => {
    setSelectedCandidateId(id);
    setCurrentView('candidate_detail');
  };

  const handleNewApplication = async (applicationData: any) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      alert('Session expired.');
      setCurrentView('external_auth');
      return;
    }

    const [firstName, ...lastParts] = applicationData.name.split(' ');
    const lastName = lastParts.join(' ');

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: applicationData.email,
      first_name: firstName || applicationData.firstName || '',
      last_name: lastName || applicationData.lastName || '',
      phone: applicationData.phone,
      role: 'applicant',
    });
    if (profileError) {
      console.error('Failed to update profile:', profileError.message);
    }

    const { error } = await supabase.from('job_applications').insert({
      user_id: user.id,
      job_id: selectedJobForApplication?.id ?? null,
      job_title: selectedJobForApplication?.title ?? null,
      first_name: firstName || applicationData.firstName || '',
      last_name: lastName || applicationData.lastName || '',
      email: applicationData.email,
      phone: applicationData.phone,
      linkedin: applicationData.linkedin,
      portfolio: applicationData.portfolio,
      excitement_response: applicationData.excitementResponse,
      evidence_response: applicationData.evidenceResponse,
      gender: applicationData.gender,
      race: applicationData.race,
      application_type: applicationData.type,
      resume_url: applicationData.resume?.fileData ?? null,
      status: 'Applied',
    });

    if (error) {
      alert('Submission failed: ' + error.message);
      return;
    }
    if (selectedJobForApplication?.id) {
      setAppliedJobIds((prev) => [...prev, selectedJobForApplication.id]);
    }
    alert('Application received!');
    setCurrentView('external_profile');
  };

  const handleAddJob = async (newJob: Job) => {
    const { error } = await supabase.from('jobs').insert([mapFrontendJobToDb(newJob)]);
    if (!error) void fetchJobs();
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    const { error } = await supabase.from('jobs').update(mapFrontendJobToDb(updatedJob)).eq('id', updatedJob.id);
    if (!error) void fetchJobs();
  };

  const handleDeleteJob = async (id: string) => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (!error) void fetchJobs();
  };

  const renderContent = () => {
    if (isLoadingData) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      );
    }
    switch (currentView) {
      case 'dashboard':
        return <Dashboard jobs={jobs} employees={employees} />;
      case 'jobs':
        return (
          <JobsPage
            jobs={jobs}
            employees={employees}
            onAddJob={handleAddJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
          />
        );
      case 'employees':
        return (
          <EmployeesPage
            employees={employees}
            onAddEmployee={() => {}}
            onUpdateEmployee={() => {}}
            onDeleteEmployee={() => {}}
          />
        );
      case 'candidates':
        return <CandidatesPage onSelectCandidate={handleSelectCandidate} />;
      case 'candidate_detail':
        return <CandidateProfilePage candidateId={selectedCandidateId} onBack={() => setCurrentView('candidates')} />;
      case 'ai_assistant':
        return <AiAssistant />;
      case 'settings':
        return <SettingsPage />;
      case 'external_jobs':
        return (
          <ExternalJobsPage
            jobs={jobs}
            applicant={currentApplicant}
            appliedJobIds={appliedJobIds}
            onApply={(job) => {
              void handleExternalApply(job);
            }}
            onGoToProfile={() => setCurrentView('external_profile')}
            onLogin={() => {
              void handleExternalLoginIntent();
            }}
            onLogoClick={handleGlobalReset}
          />
        );
      case 'external_auth':
        return <ExternalAuthPage onLogin={handleApplicantLogin} onBack={() => setCurrentView('external_jobs')} onLogoClick={handleGlobalReset} />;
      case 'external_profile':
        return currentApplicant ? (
          <ApplicantDashboard
            applicant={currentApplicant}
            onLogout={handleApplicantLogout}
            onBackToJobs={() => setCurrentView('external_jobs')}
            onUpdateApplicant={handleUpdateApplicant}
            allJobs={jobs}
            onLogoClick={handleGlobalReset}
          />
        ) : (
          <ExternalAuthPage onLogin={handleApplicantLogin} onBack={() => setCurrentView('external_jobs')} onLogoClick={handleGlobalReset} />
        );
      case 'application_form':
        if (!currentApplicant) {
          return <ExternalAuthPage onLogin={handleApplicantLogin} onBack={() => setCurrentView('external_jobs')} onLogoClick={handleGlobalReset} />;
        }
        return selectedJobForApplication ? (
          <ApplicationFormPage
            job={selectedJobForApplication}
            applicant={currentApplicant}
            onBack={() => setCurrentView('external_jobs')}
            onSubmit={handleNewApplication}
            onLogoClick={handleGlobalReset}
          />
        ) : (
          <ExternalJobsPage
            jobs={jobs}
            applicant={currentApplicant}
            appliedJobIds={appliedJobIds}
            onApply={(job) => {
              void handleExternalApply(job);
            }}
            onGoToProfile={() => setCurrentView('external_profile')}
            onLogin={() => {
              void handleExternalLoginIntent();
            }}
            onLogoClick={handleGlobalReset}
          />
        );
      default:
        return <Dashboard jobs={jobs} employees={employees} />;
    }
  };

  if (authPhase === 'bootstrapping') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const isExternalPortalView = ['external_jobs', 'application_form', 'external_auth', 'external_profile'].includes(currentView);
  if (isExternalPortalView) {
    return (
      <div className="relative min-h-screen">
        {renderContent()}
        {currentUser && (
          <div className="fixed bottom-6 right-6 z-[100] animate-fade-in">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-red-600 transition-all shadow-2xl flex items-center gap-3 group"
            >
              <BrandSymbol className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Return to Admin
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} onGoToCareers={() => setCurrentView('external_jobs')} />;
  }

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
