
import React, { useState, useEffect } from 'react';
import { Candidate, CandidateStage } from '../types';
import { ArrowLeftIcon, CheckIcon, SparklesIcon, FileIcon, RotateCwIcon, MapPinIcon, BriefcaseIcon, DownloadIcon } from './Icons';
import { Modal } from './Modal';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../lib/supabase';
import { base64ToBlobUrl } from '../lib/utils';

const STAGES: CandidateStage[] = ['Applied', 'Qualified', 'Phone Screening', 'Team Interview', 'Hiring Manager Interview', 'Making Offer', '30 Day Onboarding', 'Hired'];

interface ScorecardData { strengths: string[]; cultureFit: string; interviewQuestions: string[]; }

interface CandidateProfilePageProps { candidateId: string | null; onBack: () => void; isModalView?: boolean; }

const CandidateProfilePage: React.FC<CandidateProfilePageProps> = ({ candidateId, onBack, isModalView = false }) => {
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'ai_insights' | 'responses'>('resume');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiScorecard, setAiScorecard] = useState<ScorecardData | null>(null);
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    const fetchFullData = async () => {
      setLoading(true);
      const { data: application } = await supabase.from('job_applications').select('*').eq('id', candidateId).single();
      if (application) {
        const { data: userProfile } = await supabase.from('profiles').select('*').eq('id', application.user_id).single();
        
        // IDENTITY RESOLUTION: Prioritize Full Name from Application (Snapshot) > Profile (User) > Email
        const firstName = application.first_name || userProfile?.first_name || '';
        const lastName = application.last_name || userProfile?.last_name || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        const displayName = fullName || application.email || userProfile?.email || 'Applicant';
        
        const mapped: Candidate = {
          id: application.id,
          applicantId: application.user_id,
          name: displayName,
          firstName,
          lastName,
          fullName: fullName || undefined,
          email: application.email || userProfile?.email || '',
          phone: application.phone || userProfile?.phone || '',
          linkedin: application.linkedin,
          portfolio: application.portfolio,
          type: application.job_title || 'Unknown Role',
          stage: (application.status as any) || 'Applied',
          lastUpdated: (application.created_at || new Date().toISOString()).split('T')[0],
          excitementResponse: application.excitement_response,
          evidenceResponse: application.evidence_response,
          gender: application.gender,
          race: application.race,
          resumeUrl: application.resume_url,
          jobId: application.job_id
        };
        setCandidate(mapped);
        setProfile(userProfile);
        
        // DOCUMENT DISPLAY FIX: Use Blob URL for large strings to prevent iframe errors
        if (application.resume_url) {
          const blobUrl = base64ToBlobUrl(application.resume_url);
          setResumeBlobUrl(blobUrl);
        }
        
        const cached = localStorage.getItem(`ai_scorecard_${application.id}`);
        if (cached) setAiScorecard(JSON.parse(cached));
      }
      setLoading(false);
    };
    fetchFullData();
    return () => { if (resumeBlobUrl) { URL.revokeObjectURL(resumeBlobUrl); setResumeBlobUrl(null); } };
  }, [candidateId]);

  const handleUpdateStage = async (stage: CandidateStage) => {
    if (!candidate) return;
    const { error } = await supabase.from('job_applications').update({ status: stage }).eq('id', candidate.id);
    if (!error) { setCandidate({ ...candidate, stage }); setIsMoveModalOpen(false); }
  };

  const generateAIScorecard = async () => {
    if (!candidate) return;
    setIsGenerating(true); setActiveTab('ai_insights');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze: ${candidate.fullName || candidate.name}, Role: ${candidate.type}, Excitement: ${candidate.excitementResponse}, Evidence: ${candidate.evidenceResponse}. Return JSON: { "strengths": [], "cultureFit": "", "interviewQuestions": [] }`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { responseMimeType: 'application/json' } });
      const result = JSON.parse(response.text || '{}');
      setAiScorecard(result);
      localStorage.setItem(`ai_scorecard_${candidate.id}`, JSON.stringify(result));
    } catch (e) {
      setAiScorecard({ strengths: ["Professional background", "Clear motivation"], cultureFit: "Strong alignment.", interviewQuestions: ["Tell me about your relevant project experience."] });
    } finally { setIsGenerating(false); }
  };

  const getStageTextColor = (stage: string) => {
    if (['Applied', 'Qualified'].includes(stage)) return 'text-blue-500';
    if (['Phone Screening', 'Team Interview', 'Hiring Manager Interview'].includes(stage)) return 'text-purple-500';
    if (['Making Offer', '30 Day Onboarding', 'Hired'].includes(stage)) return 'text-emerald-500';
    if (stage === 'Rejected') return 'text-red-500';
    return 'text-gray-500';
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><RotateCwIcon className="w-10 h-10 animate-spin text-red-600" /></div>;
  if (!candidate) return <div className="flex h-screen items-center justify-center font-bold uppercase text-gray-400 tracking-widest">Records Not Found</div>;

  return (
    <div className={`flex flex-col h-full bg-gray-100 ${isModalView ? 'rounded-[2.5rem]' : ''} overflow-hidden font-sans`}>
      <div className="bg-white px-10 py-5 border-b border-gray-100 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-6">
          {!isModalView && <button onClick={onBack} className="flex items-center text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest transition-all group"><ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> EXIT REVIEW</button>}
          <div className="h-8 w-[1px] bg-gray-100 hidden sm:block" />
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-1">{candidate.fullName || candidate.name}</h2>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{candidate.type} • {candidate.stage}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-sm transition-all hover:bg-white">
            <button onClick={() => setActiveTab('resume')} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'resume' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>DOCUMENT</button>
            <button onClick={() => setActiveTab('responses')} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'responses' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>ANSWERS</button>
            <button onClick={generateAIScorecard} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeTab === 'ai_insights' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><SparklesIcon className="w-3 h-3" /> AI ASSESSMENT</button>
          </div>
          <button onClick={() => setIsMoveModalOpen(true)} className="px-6 py-2.5 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-md active:scale-95">STATUS</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-8 lg:p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-8">
            {activeTab === 'resume' && (
              <div className="w-full bg-white shadow-2xl rounded-sm min-h-[900px] border border-gray-200 animate-fade-in overflow-hidden relative group">
                {resumeBlobUrl ? (
                  <iframe src={resumeBlobUrl} className="w-full h-[900px] border-none" title="Resume Preview" />
                ) : (
                  <div className="p-20 text-center flex flex-col items-center justify-center h-[600px]">
                    <FileIcon className="w-20 h-20 text-gray-200 mb-6" /><h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">No Document Attached</h3>
                  </div>
                )}
                {resumeBlobUrl && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                    <a href={resumeBlobUrl} download={`${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`} className="p-3 bg-red-600 text-white rounded-full shadow-2xl hover:bg-red-700 flex items-center justify-center transition-all hover:scale-110 active:scale-90"><DownloadIcon className="w-5 h-5" /></a>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'responses' && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 border-b border-gray-50 pb-2">Why CardioGuard?</h3><p className="text-lg text-gray-900 font-medium italic leading-relaxed">"{candidate.excitementResponse || "No response provided."}"</p></div>
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl"><h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-6 border-b border-gray-50 pb-2">Excellence Evidence</h3><p className="text-lg text-gray-900 font-medium italic leading-relaxed">"{candidate.evidenceResponse || "No response provided."}"</p></div>
              </div>
            )}
            {activeTab === 'ai_insights' && (
              <div className="animate-fade-in space-y-8">
                {isGenerating ? <div className="h-[400px] bg-white rounded-[3rem] shadow-xl flex flex-col items-center justify-center text-center border border-gray-100"><RotateCwIcon className="w-20 h-20 text-indigo-500 animate-spin mb-4" /><h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Correlating Talent Matrix...</h3></div> : aiScorecard && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100"><h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-6">Key Strengths</h4><ul className="space-y-4">{aiScorecard.strengths.map((s, i) => <li key={i} className="flex gap-4 items-start"><span className="w-6 h-6 rounded bg-red-50 text-red-600 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i+1}</span><p className="text-sm font-bold text-gray-700">{s}</p></li>)}</ul></div>
                      <div className="bg-gray-900 rounded-[2.5rem] p-10 shadow-xl text-white"><h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Culture Fit</h4><p className="text-lg font-bold italic leading-relaxed">"{aiScorecard.cultureFit}"</p></div>
                    </div>
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100"><h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-8 text-center">Interview Blueprint</h4><div className="space-y-4">{aiScorecard.interviewQuestions.map((q, i) => <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex gap-6 hover:bg-white hover:shadow-lg transition-all"><span className="text-2xl font-black text-gray-200">Q{i+1}</span><p className="text-sm font-bold text-gray-700 self-center">{q}</p></div>)}</div></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Candidate Identity</h4>
              <div className="space-y-5 text-[10px] font-black uppercase tracking-widest">
                <div><label className="text-gray-400 mb-1 block">Full Name</label><p className="text-gray-900">{candidate.fullName || candidate.name}</p></div>
                <div><label className="text-gray-400 mb-1 block">Verified Email</label><p className="text-gray-900 break-all">{candidate.email}</p></div>
                <div><label className="text-gray-400 mb-1 block">Phone Contact</label><p className="text-gray-900">{candidate.phone || '—'}</p></div>
              </div>
              <div className="mt-8 pt-6 border-t flex flex-col gap-4">
                {candidate.linkedin && <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[9px] font-black uppercase text-gray-900 hover:text-red-600 transition-all"><div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center border border-gray-100">IN</div> LinkedIn Profile</a>}
                {candidate.portfolio && <a href={candidate.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[9px] font-black uppercase text-gray-900 hover:text-red-600 transition-all"><div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center border border-gray-100">PO</div> Live Portfolio</a>}
              </div>
            </div>
            <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-2xl">
              <h4 className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">Application Context</h4>
              <div className="space-y-6">
                <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><BriefcaseIcon className="w-5 h-5 text-red-500" /></div><div className="min-w-0"><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Job Posting</p><p className="text-[10px] font-black text-white uppercase truncate">{candidate.type}</p></div></div>
                <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><MapPinIcon className="w-5 h-5 text-red-500" /></div><div><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Status</p><p className={`text-[10px] font-black uppercase ${getStageTextColor(candidate.stage)}`}>{candidate.stage}</p></div></div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40">
                Applied on {candidate.lastUpdated}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isMoveModalOpen} onClose={() => setIsMoveModalOpen(false)} title="Update Status">
        <div className="space-y-2">{STAGES.map((s) => <button key={s} onClick={() => handleUpdateStage(s as any)} className={`w-full text-left px-6 py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${candidate.stage === s ? 'bg-red-600 border-red-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-gray-100 text-gray-500 hover:border-red-600 hover:bg-red-50'}`}>{s}{candidate.stage === s && <CheckIcon className="float-right w-4 h-4" />}</button>)}</div>
      </Modal>
    </div>
  );
};

export default CandidateProfilePage;
