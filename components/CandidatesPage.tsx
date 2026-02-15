
import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, CandidateStage, Job } from '../types';
import {
  UsersIcon,
  SearchIcon,
  FileIcon,
  ArrowLeftIcon,
  XIcon,
  DownloadIcon,
  StarIcon,
  FilterIcon,
  RotateCwIcon,
  TrashIcon,
  EditIcon,
  MessageSquareIcon
} from './Icons';
import { Modal } from './Modal';
import { MOCK_JOBS } from '../constants';
import JSZip from 'jszip';
import { supabase } from '../lib/supabase';
import { base64ToBlobUrl } from '../lib/utils';

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

const REJECTION_REASONS = ['Not qualified', 'Experience mismatch', 'Salary mismatch', 'Position filled', 'Culture fit', 'Other'];

// Interface for structured evaluation
interface CandidateEvaluation {
  technical: number;
  communication: number;
  experience: number;
  culture: number;
  note: string;
}

interface CandidatesPageProps {
  onSelectCandidate: (id: string) => void;
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
  resume_url?: string | null;
  status?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type ProfileRow = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

const normalizeStage = (status?: string | null): CandidateStage => {
  const s = (status ?? '').trim().toLowerCase();
  const map: Record<string, CandidateStage> = {
    submitted: 'Applied',
    applied: 'Applied',
    qualified: 'Qualified',
    'phone screening': 'Phone Screening',
    'team interview': 'Team Interview',
    'hiring manager interview': 'Hiring Manager Interview',
    'making offer': 'Making Offer',
    '30 day onboarding': '30 Day Onboarding',
    hired: 'Hired',
    rejected: 'Rejected' as any,
  };
  return (map[s] ?? (PIPELINE_STAGES.find(st => st.toLowerCase() === s) ?? 'Applied')) as CandidateStage;
};

const CandidatesPage: React.FC<CandidatesPageProps> = ({ onSelectCandidate }) => {
  // --- STATE ---
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'pipeline'>('overview');
  const [overviewTab, setOverviewTab] = useState<'jobs' | 'list'>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null);

  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [candidateSearchTerm, setCandidateSearchTerm] = useState('');
  const [showRejected, setShowRejected] = useState(false);

  // Rejection Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0]);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // HR Evaluations (Sidecar Data from LocalStorage)
  const [evaluations, setEvaluations] = useState<Record<string, CandidateEvaluation>>({});
  
  // Evaluation Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [currentNoteCandidateId, setCurrentNoteCandidateId] = useState<string | null>(null);
  const [currentEvalData, setCurrentEvalData] = useState<CandidateEvaluation>({
    technical: 3,
    communication: 3,
    experience: 3,
    culture: 3,
    note: ''
  });

  // --- DATA FETCHING ---
  
  // Load HR Sidecar Data
  useEffect(() => {
    try {
      const storedEvals = localStorage.getItem('cg_hr_evaluations');
      if (storedEvals) {
        setEvaluations(JSON.parse(storedEvals));
      } else {
        // Fallback migration: try to load old notes if they exist
        const oldNotes = localStorage.getItem('cg_hr_notes');
        const oldRatings = localStorage.getItem('cg_hr_ratings');
        
        if (oldNotes || oldRatings) {
          const notesObj = oldNotes ? JSON.parse(oldNotes) : {};
          const ratingsObj = oldRatings ? JSON.parse(oldRatings) : {};
          
          // Merge old simple data into new structure
          const migrated: Record<string, CandidateEvaluation> = {};
          const allIds = new Set([...Object.keys(notesObj), ...Object.keys(ratingsObj)]);
          
          allIds.forEach(id => {
            migrated[id] = {
              technical: ratingsObj[id] || 3,
              communication: 3,
              experience: 3,
              culture: 3,
              note: notesObj[id] || ''
            };
          });
          setEvaluations(migrated);
        }
      }
    } catch (e) {
      console.error("Error loading HR data", e);
    }
  }, []);

  const fetchJobs = async () => {
    const { data } = await supabase.from('jobs').select('*');
    if (data) {
      setJobs(data.map((j: any) => ({
        id: j.id,
        title: j.title,
        department: j.department,
        hiringManager: j.hiring_manager,
        salaryRange: `$${(j.salary_min || 0) / 1000}k - $${(j.salary_max || 0) / 1000}k`,
        location: j.location,
        status: j.status,
        postedDate: j.created_at.split('T')[0]
      } as any)));
    } else {
      setJobs(MOCK_JOBS);
    }
  };

  async function fetchCandidatesFromSupabase() {
    setIsLoading(true);
    const { data, error } = await supabase.from('job_applications').select('*').order('created_at', { ascending: false });
    if (error) {
      setCandidates([]);
      setIsLoading(false);
      return;
    }
    const rows = (data ?? []) as JobApplicationRow[];
    const userIds = Array.from(new Set(rows.map(r => r.user_id))).filter(Boolean);
    
    let profilesById: Record<string, ProfileRow> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds);
      if (profiles) {
        profilesById = (profiles as ProfileRow[]).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, ProfileRow>);
      }
    }

    const mapped: Candidate[] = rows.map((r) => {
      const p = profilesById[r.user_id];
      // RESOLUTION LOGIC: 
      // 1. Try to get first/last from the application snapshot (job_applications table)
      // 2. Fallback to profile table if missing
      const firstName = r.first_name || p?.first_name || '';
      const lastName = r.last_name || p?.last_name || '';
      
      // Construct Full Name
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      
      // Determine final display name and primary field
      // If fullName exists, use it. Otherwise fallback to email.
      const displayName = fullName || r.email || 'Applicant';
      
      return {
        id: r.id,
        applicantId: r.user_id,
        firstName,
        lastName,
        fullName: fullName || undefined, // Store explicit fullName
        name: displayName, // Legacy field used for filtering
        email: r.email || p?.email || '',
        phone: r.phone || '',
        linkedin: r.linkedin || undefined,
        portfolio: r.portfolio || undefined,
        type: r.job_title || 'Unknown Role',
        stage: normalizeStage(r.status),
        lastUpdated: (r.created_at ?? new Date().toISOString()).split('T')[0],
        source: 'Careers Portal',
        resumeUrl: r.resume_url ?? undefined,
        jobId: r.job_id ?? undefined
      } as any;
    });
    setCandidates(mapped);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchJobs();
    fetchCandidatesFromSupabase();
  }, []);

  // --- ACTIONS ---

  const downloadZippedResumes = async (targetCandidates: Candidate[], zipName: string) => {
    const zip = new JSZip();
    let count = 0;
    for (const c of targetCandidates) {
      if (c.resumeUrl && c.resumeUrl.startsWith('data:')) {
        const parts = c.resumeUrl.split(';base64,');
        if (parts.length === 2) {
          const extension = parts[0].includes('pdf') ? 'pdf' : parts[0].includes('word') ? 'docx' : 'pdf';
          const safeName = c.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          zip.file(`${safeName}_resume.${extension}`, parts[1], { base64: true });
          count++;
        }
      }
    }
    if (count === 0) {
      alert("No resumes found to download for these candidates.");
      return;
    }
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${zipName.replace(/\s+/g, '_')}_Resumes.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSingleResume = (c: Candidate) => {
    if (!c.resumeUrl) {
      alert("No resume available for this candidate.");
      return;
    }
    try {
      const blobUrl = base64ToBlobUrl(c.resumeUrl);
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = c.resumeUrl.includes('pdf') ? 'pdf' : c.resumeUrl.includes('word') ? 'docx' : 'pdf';
      link.download = `${c.name.replace(/\s+/g, '_')}_Resume.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Timeout revoke to ensure download starts
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      console.error("Download failed", e);
      alert("Could not download file.");
    }
  };

  const handleOpenNoteModal = (candidateId: string) => {
    setCurrentNoteCandidateId(candidateId);
    
    // Load existing evaluation or defaults
    const existing = evaluations[candidateId] || {
      technical: 3,
      communication: 3,
      experience: 3,
      culture: 3,
      note: ''
    };
    
    setCurrentEvalData(existing);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    if (currentNoteCandidateId) {
      const updated = { 
        ...evaluations, 
        [currentNoteCandidateId]: currentEvalData 
      };
      setEvaluations(updated);
      localStorage.setItem('cg_hr_evaluations', JSON.stringify(updated));
    }
    setIsNoteModalOpen(false);
    setCurrentNoteCandidateId(null);
  };

  const handleMoveStage = async (id: string, stage: CandidateStage) => {
    const { error } = await supabase.from('job_applications').update({ status: stage }).eq('id', id);
    if (!error) {
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage, lastUpdated: new Date().toISOString().split('T')[0] } : c));
    }
  };

  const confirmReject = async () => {
    if (!candidateToReject) return;
    const { error } = await supabase.from('job_applications').update({ status: 'Rejected' }).eq('id', candidateToReject.id);
    if (!error) {
      setCandidates(prev => prev.map(c => c.id === candidateToReject.id ? { ...c, stage: 'Rejected' as any, rejectedReason: rejectionReason, rejectedNotes: rejectionNotes } : c));
      setIsRejectModalOpen(false);
    }
  };

  // --- STAGE COLOR HELPERS ---
  const getStageBadgeClass = (stage: string) => {
    if (['Applied', 'Qualified'].includes(stage)) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (['Phone Screening', 'Team Interview', 'Hiring Manager Interview'].includes(stage)) return 'bg-purple-50 text-purple-700 border-purple-100';
    if (['Making Offer', '30 Day Onboarding', 'Hired'].includes(stage)) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (stage === 'Rejected') return 'bg-red-50 text-red-700 border-red-100';
    return 'bg-gray-50 text-gray-700 border-gray-100';
  };

  const getStageTextClass = (stage: string) => {
    if (['Applied', 'Qualified'].includes(stage)) return 'text-blue-700';
    if (['Phone Screening', 'Team Interview', 'Hiring Manager Interview'].includes(stage)) return 'text-purple-700';
    if (['Making Offer', '30 Day Onboarding', 'Hired'].includes(stage)) return 'text-emerald-700';
    return 'text-gray-700';
  };

  // --- COMPUTED ---

  const activeJobs = useMemo(() => jobs.filter(j => j.status === 'Open' || j.status === 'Paused'), [jobs]);
  const filteredJobs = useMemo(() => activeJobs.filter(j => departmentFilter === 'All' || j.department === departmentFilter), [activeJobs, departmentFilter]);
  const filteredCandidatesList = useMemo(() => candidates.filter(c => {
    const job = jobs.find(j => j.id === c.jobId);
    const searchStr = `${c.name} ${c.email} ${job?.title} ${c.stage}`.toLowerCase();
    const matchesSearch = searchStr.includes(candidateSearchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'All' || job?.department === departmentFilter;
    const matchesRejected = showRejected ? c.stage === ('Rejected' as any) : c.stage !== ('Rejected' as any);
    return matchesSearch && matchesDept && matchesRejected;
  }), [candidates, candidateSearchTerm, jobs, departmentFilter, showRejected]);

  const funnelStats = useMemo(() => {
    const stats: Record<string, number> = {};
    PIPELINE_STAGES.forEach(s => (stats[s] = 0));
    candidates.forEach(c => { if (c.stage !== ('Rejected' as any) && stats[c.stage] !== undefined) stats[c.stage]++; });
    return stats;
  }, [candidates]);

  if (isLoading) return <div className="flex items-center justify-center h-[60vh]"><RotateCwIcon className="w-8 h-8 animate-spin text-gray-300" /></div>;

  // --- PIPELINE VIEW RENDER ---
  if (viewMode === 'pipeline' && selectedJobId) {
    const job = jobs.find(j => j.id === selectedJobId);
    const jobCandidates = candidates.filter(c => c.jobId === selectedJobId);
    const activePipeline = jobCandidates.filter(c => c.stage !== ('Rejected' as any));
    const rejected = jobCandidates.filter(c => c.stage === ('Rejected' as any));

    return (
      <div className="max-w-[1800px] mx-auto h-[calc(100vh-140px)] flex flex-col animate-fade-in">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('overview')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"><ArrowLeftIcon className="w-5 h-5" /></button>
            <div><h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tighter">{job?.title || 'Job Pipeline'}</h1><p className="text-sm text-gray-500 uppercase tracking-widest font-black text-[10px]">{job?.department} • {job?.location} • {activePipeline.length} Active</p></div>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button onClick={() => setShowRejected(false)} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${!showRejected ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Active</button>
            <button onClick={() => setShowRejected(true)} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${showRejected ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}>Rejected ({rejected.length})</button>
          </div>
        </div>
        {!showRejected ? (
          <div className="flex-1 overflow-x-auto pb-4"><div className="flex h-full gap-4 min-w-max">
            {PIPELINE_STAGES.map(stage => {
              const stageCands = activePipeline.filter(c => c.stage === stage);
              return (
                <div key={stage} className="w-80 flex flex-col h-full rounded-xl border bg-gray-100/50 border-gray-200/60">
                  <div className="p-3 border-b flex justify-between items-center rounded-t-xl sticky top-0 bg-gray-50 border-gray-200/50 z-10">
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${getStageTextClass(stage)}`}>{stage}</h3>
                    <span className="bg-white px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-500 border border-gray-200">{stageCands.length}</span>
                  </div>
                  <div className="p-2 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {stageCands.map(c => {
                      const evalData = evaluations[c.id];
                      const hasEval = !!evalData;
                      
                      let scoreBadge = { text: '—', className: 'bg-gray-50 text-gray-300 border-gray-100' };
                      if (evalData) {
                          const avg = ((evalData.technical || 0) + (evalData.communication || 0) + (evalData.experience || 0) + (evalData.culture || 0)) / 4;
                          scoreBadge = {
                              text: avg.toFixed(1),
                              className: avg >= 4 ? 'bg-green-50 text-green-700 border-green-100' : (avg >= 3 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100')
                          };
                      }
                      
                      return (
                        <div key={c.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3">
                          {/* Header */}
                          <div>
                            <div className="flex justify-between items-start mb-1">
                               <button onClick={() => onSelectCandidate(c.id)} className="text-sm font-bold text-gray-900 hover:text-red-600 uppercase tracking-tighter text-left leading-tight transition-colors pr-2 truncate">
                                 {c.fullName || c.name}
                               </button>
                               <div className={`shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded border ${scoreBadge.className}`} title="Overall Evaluation Score">
                                  {scoreBadge.text}
                               </div>
                            </div>
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">{c.email}</div>
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                            <select 
                              className="flex-1 bg-gray-50 text-[10px] font-black uppercase border border-gray-200 rounded px-2 py-1.5 focus:ring-red-500 outline-none cursor-pointer w-0 min-w-[80px]" 
                              value={c.stage} 
                              onChange={(e) => handleMoveStage(c.id, e.target.value as CandidateStage)}
                            >
                              {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            
                            <div className="flex items-center gap-1">
                                <button 
                                   onClick={() => handleOpenNoteModal(c.id)} 
                                   className={`p-1.5 rounded transition-colors ${hasEval ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                   title="HR Evaluation"
                                >
                                   <EditIcon className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                   onClick={() => handleDownloadSingleResume(c)}
                                   className={`p-1.5 rounded transition-colors ${c.resumeUrl ? 'text-gray-400 hover:text-gray-900 hover:bg-gray-100' : 'text-gray-200 cursor-not-allowed'}`}
                                   title="Download Resume"
                                   disabled={!c.resumeUrl}
                                >
                                   <DownloadIcon className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                   onClick={() => { setCandidateToReject(c); setIsRejectModalOpen(true); }} 
                                   className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                   title="Reject"
                                >
                                   <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div></div>
        ) : (
          /* Rejected View */
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-6"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Rejection History</h3>{rejected.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Candidate</th><th className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Reason</th><th className="px-6 py-3 text-right"></th></tr></thead>
              <tbody className="bg-white divide-y divide-gray-200">{rejected.map(c => (
                <tr key={c.id}>
                  <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => onSelectCandidate(c.id)} className="text-sm font-bold text-gray-900 hover:text-red-600 uppercase tracking-tighter transition-colors">{c.fullName || c.name}</button><div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{c.email}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 bg-red-50 text-red-700 rounded text-[9px] font-black uppercase border border-red-100">{(c as any).rejectedReason || 'Unspecified'}</span></td>
                  <td className="px-6 py-4 text-right"><button onClick={() => handleMoveStage(c.id, 'Applied')} className="text-[9px] font-black text-red-600 uppercase hover:underline">Restore</button></td>
                </tr>
              ))}</tbody>
            </table>
          ) : <div className="text-center py-20 text-gray-400 font-bold uppercase text-xs tracking-widest">No rejected candidates.</div>}</div>
        )}

        {/* Rejection Modal */}
        <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Candidate">
          <div className="space-y-4">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Reason</label>
            <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}>{REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}</select>
            <textarea className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="Notes (Internal Only)" rows={3} value={rejectionNotes} onChange={(e) => setRejectionNotes(e.target.value)} />
            <div className="pt-4 flex justify-end gap-3"><button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-black uppercase tracking-widest">Cancel</button><button onClick={confirmReject} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-black uppercase tracking-widest">Confirm Rejection</button></div>
          </div>
        </Modal>

        {/* Evaluation Modal */}
        <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title="HR Evaluation">
          <div className="space-y-6">
            <p className="text-xs text-gray-500 font-medium">Rate the candidate across key competencies and add internal notes.</p>
            
            {/* Structured Ratings */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Technical Skills', key: 'technical' },
                { label: 'Communication', key: 'communication' },
                { label: 'Experience Relevance', key: 'experience' },
                { label: 'Culture Fit', key: 'culture' }
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{field.label}</label>
                  <select
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg p-2 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={(currentEvalData as any)[field.key]}
                    onChange={(e) => setCurrentEvalData({ ...currentEvalData, [field.key]: parseInt(e.target.value) })}
                  >
                    <option value={1}>1 - Poor</option>
                    <option value={2}>2 - Weak</option>
                    <option value={3}>3 - Average</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Internal Notes</label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]" 
                placeholder="Enter detailed evaluation notes here..." 
                value={currentEvalData.note} 
                onChange={(e) => setCurrentEvalData({ ...currentEvalData, note: e.target.value })} 
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button onClick={() => setIsNoteModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveNote} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-indigo-700">Save Evaluation</button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // --- OVERVIEW VIEW RENDER ---

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tighter leading-none mb-2">Recruiting Funnel</h1><p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Real-time candidate pipeline across active roles.</p></div>
        <button onClick={() => downloadZippedResumes(candidates, 'All')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-50 shadow-sm transition-all"><DownloadIcon className="w-4 h-4" /> Download All Resumes</button>
      </div>
      
      <div className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIPELINE_STAGES.map(stage => {
          const count = funnelStats[stage] || 0;
          const isHired = stage === 'Hired';
          return (
            <div key={stage} className={`relative rounded-xl border p-4 shadow-sm flex flex-col transition-all ${isHired ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' : 'bg-white border-gray-200 hover:border-red-300'}`}>
              <span className={`text-[10px] font-black uppercase tracking-widest mb-2 ${getStageTextClass(stage)}`}>{stage}</span>
              <span className={`text-4xl font-black ${isHired ? 'text-emerald-700' : count > 0 ? 'text-gray-900' : 'text-gray-200'}`}>{count}</span>
            </div>
          );
        })}
      </div>

      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit border border-gray-100 mb-4 sm:mb-0">
          <button onClick={() => setOverviewTab('jobs')} className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${overviewTab === 'jobs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>By Job Pipeline</button>
          <button onClick={() => setOverviewTab('list')} className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${overviewTab === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>All Candidates List</button>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search..." value={candidateSearchTerm} onChange={(e) => setCandidateSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-red-500 outline-none transition-all" /></div>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="bg-white border border-gray-200 text-gray-700 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer">{['All', ...Array.from(new Set(activeJobs.map(j => j.department)))].map(d => <option key={d} value={d}>{d}</option>)}</select>
        </div>
      </div>

      {overviewTab === 'jobs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map(job => {
            const jobCands = candidates.filter(c => c.jobId === job.id && c.stage !== ('Rejected' as any));
            
            // Calculate Pipeline Metrics
            const appliedCount = jobCands.filter(c => ['Applied', 'Qualified'].includes(c.stage)).length;
            const interviewCount = jobCands.filter(c => ['Phone Screening', 'Team Interview', 'Hiring Manager Interview'].includes(c.stage)).length;
            const offerCount = jobCands.filter(c => c.stage === 'Making Offer').length;

            return (
              <div key={job.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6 cursor-pointer group" onClick={() => { setSelectedJobId(job.id); setViewMode('pipeline'); }}>
                <div className="flex justify-between items-start mb-4">
                  <div><h3 className="text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors uppercase tracking-tighter leading-tight">{job.title}</h3><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{job.department}</p></div>
                  <div 
                    className="relative flex items-center gap-2"
                    onMouseEnter={(e) => { e.stopPropagation(); setHoveredJobId(job.id); }}
                    onMouseLeave={() => setHoveredJobId(null)}
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadZippedResumes(jobCands, job.title); }}
                      className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition-all shadow-sm group/dl"
                      title="Download Resumes for this Role"
                    >
                      <DownloadIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2.5 py-1 rounded-full border border-gray-200 transition-all group-hover:border-red-200">{jobCands.length}</span>
                    
                    {hoveredJobId === job.id && jobCands.length > 0 && (
                      <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-2xl p-3 z-[60] animate-fade-in pointer-events-auto">
                        <h4 className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2 border-b pb-1 text-center">Click candidate to view</h4>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                          {jobCands.map(c => (
                            <button 
                              key={c.id} 
                              onClick={(e) => { e.stopPropagation(); onSelectCandidate(c.id); }}
                              className="w-full text-left p-1.5 rounded bg-gray-50 hover:bg-red-50 text-[9px] font-black text-gray-900 uppercase tracking-tighter truncate leading-none transition-all border border-transparent hover:border-red-100"
                            >
                              {c.fullName || c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 h-1.5 rounded-full overflow-hidden bg-gray-100 mb-4">
                  <div className="bg-blue-400 h-full" style={{ width: `${(jobCands.filter(c => ['Applied', 'Qualified'].includes(c.stage)).length / (jobCands.length || 1)) * 100}%` }} />
                  <div className="bg-purple-400 h-full" style={{ width: `${(jobCands.filter(c => ['Phone Screening', 'Team Interview', 'Hiring Manager Interview'].includes(c.stage)).length / (jobCands.length || 1)) * 100}%` }} />
                  <div className="bg-emerald-400 h-full" style={{ width: `${(jobCands.filter(c => ['Making Offer', '30 Day Onboarding', 'Hired'].includes(c.stage)).length / (jobCands.length || 1)) * 100}%` }} />
                </div>

                {/* Pipeline Metrics Row */}
                <div className="flex items-center justify-between px-1 mb-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${appliedCount > 0 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <span className={appliedCount > 0 ? 'text-gray-700' : ''}>Applied {appliedCount}</span>
                  </div>
                  <div className="text-gray-200">|</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${interviewCount > 0 ? 'bg-purple-500' : 'bg-gray-300'}`} />
                    <span className={interviewCount > 0 ? 'text-gray-700' : ''}>Interview {interviewCount}</span>
                  </div>
                  <div className="text-gray-200">|</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${offerCount > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span className={offerCount > 0 ? 'text-gray-700' : ''}>Offer {offerCount}</span>
                  </div>
                </div>

                <button className="w-full py-2 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-600 rounded-lg group-hover:bg-gray-100 transition-colors">View Pipeline</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr><th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th><th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Posting</th><th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Stage</th><th className="px-6 py-4 text-right"></th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-100">{filteredCandidatesList.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap"><button onClick={() => onSelectCandidate(c.id)} className="text-sm font-bold text-gray-900 hover:text-red-600 uppercase tracking-tighter transition-colors">{c.fullName || c.name}</button><div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{c.email}</div></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700 uppercase tracking-tighter truncate max-w-[200px]">{jobs.find(j => j.id === c.jobId)?.title || 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStageBadgeClass(c.stage)}`}>{c.stage}</span></td>
                <td className="px-6 py-4 text-right"><button onClick={() => onSelectCandidate(c.id)} className="text-[9px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-all">Profile</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CandidatesPage;
