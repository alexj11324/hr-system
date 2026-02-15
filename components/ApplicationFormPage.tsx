
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Job, CandidateType, ApplicantAccount } from '../types';
import { ArrowLeftIcon, BrandSymbol, CheckIcon, FileIcon, XIcon, RotateCwIcon, BrandLogo } from './Icons';

interface ApplicationFormPageProps {
  job: Job;
  applicant: ApplicantAccount;
  onBack: () => void;
  onSubmit: (formData: any) => void;
  onLogoClick?: () => void;
}

const GENDER_OPTIONS = [
  "Select Gender",
  "Female",
  "Male",
  "Non-binary",
  "Transgender",
  "Genderqueer / Gender non-conforming",
  "Prefer not to say",
  "Other"
];

const RACE_OPTIONS = [
  "Select Race / Ethnicity",
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Native Hawaiian or Other Pacific Islander",
  "White",
  "Two or More Races",
  "Prefer not to say"
];

const ApplicationFormPage: React.FC<ApplicationFormPageProps> = ({ job, applicant, onBack, onSubmit, onLogoClick }) => {
  const [formData, setFormData] = useState({
    firstName: applicant.firstName || '',
    lastName: applicant.lastName || '',
    email: applicant.email || '',
    phone: applicant.phone || '',
    linkedin: applicant.linkedin || '',
    portfolio: applicant.portfolio || '',
    excitementText: '',
    evidenceText: '',
    gender: applicant.gender || '',
    race: applicant.race || '',
    resumeName: applicant.resume?.fileName || '',
    resumeData: applicant.resume?.fileData || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with applicant prop in case it updates after mount
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      firstName: applicant.firstName || prev.firstName,
      lastName: applicant.lastName || prev.lastName,
      email: applicant.email || prev.email,
      phone: applicant.phone || prev.phone
    }));
  }, [applicant]);

  const excitementWordCount = useMemo(() => {
    const trimmed = formData.excitementText.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  }, [formData.excitementText]);

  const evidenceWordCount = useMemo(() => {
    const trimmed = formData.evidenceText.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  }, [formData.evidenceText]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        resumeName: file.name,
        resumeData: event.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleWordLimitedChange = (field: 'excitementText' | 'evidenceText', value: string) => {
    const words = value.trim().split(/\s+/);
    const prevValue = formData[field];
    
    // Allow if word count is within limit, or if the user is deleting text
    if (words.length <= 150 || value.length < prevValue.length || (words.length === 151 && value.endsWith(' '))) {
       setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const candidateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        linkedin: formData.linkedin,
        portfolio: formData.portfolio,
        excitementResponse: formData.excitementText,
        evidenceResponse: formData.evidenceText,
        gender: formData.gender === "Select Gender" ? "" : formData.gender,
        race: formData.race === "Select Race / Ethnicity" ? "" : formData.race,
        type: job.title as CandidateType, // Approximate for demo
        resume: {
          fileName: formData.resumeName || 'resume.pdf',
          fileData: formData.resumeData || 'mock',
          uploadedAt: new Date().toISOString()
        }
      };
      onSubmit(candidateData);
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 2000);
  };

  // Validation check for the submit button
  const isFormValid = formData.firstName && 
                    formData.lastName && 
                    formData.email && 
                    formData.phone && 
                    formData.resumeName && 
                    formData.excitementText.trim().length > 0 && 
                    formData.evidenceText.trim().length > 0;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full text-center animate-fade-in">
          <div className="inline-flex p-8 bg-emerald-50 rounded-[2.5rem] mb-10 shadow-2xl shadow-emerald-500/10 border border-emerald-100">
            <CheckIcon className="w-20 h-20 text-emerald-600" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-6 leading-none">Application Transmitted</h1>
          <p className="text-lg font-bold text-gray-500 uppercase tracking-widest leading-relaxed mb-12">
            Your profile has been prioritized. Our talent team will review your credentials for the <span className="text-gray-900">{job.title}</span> role shortly.
          </p>
          <button 
            onClick={onBack}
            className="px-12 py-5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-600 hover:scale-105 transition-all shadow-2xl shadow-gray-900/20"
          >
            Return to Career Site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-red-100">
      {/* Header */}
      <nav className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-3 text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest transition-all group">
            <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          
          <button onClick={onLogoClick} className="group outline-none">
            <BrandLogo textClassName="text-sm font-black uppercase tracking-tighter group-hover:text-red-600 transition-colors" className="group-hover:scale-105 transition-all" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Logged in: {applicant.firstName} {applicant.lastName}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-40 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-12 items-start">
          {/* Job Details Sidebar */}
          <div className="order-2 md:order-1 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/50">
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none mb-6">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-4 mb-10">
                <span className="px-4 py-1.5 bg-gray-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">{job.department}</span>
                <span className="px-4 py-1.5 bg-red-50 text-red-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-red-100">{job.location}</span>
              </div>
              
              <div className="space-y-8 text-sm text-gray-600 font-medium leading-relaxed">
                <p>{job.description}</p>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <div className="order-1 md:order-2">
            <div className="bg-gray-900 text-white rounded-[2.5rem] p-10 shadow-2xl shadow-gray-900/20">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                <div className="w-2 h-8 bg-red-600 rounded-full" /> Apply Now
              </h2>
              
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">First Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.firstName}
                      onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 focus:bg-white/10 transition-all"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Last Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.lastName}
                      onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 focus:bg-white/10 transition-all"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Email Address</label>
                    <input 
                      disabled
                      required
                      type="email" 
                      value={formData.email}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none opacity-40 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 focus:bg-white/10 transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">
                    LinkedIn Profile URL <span className="opacity-40 font-normal lowercase">(Optional)</span>
                  </label>
                  <input 
                    type="url" 
                    value={formData.linkedin}
                    onChange={e => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 focus:bg-white/10 transition-all"
                    placeholder="linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">
                    Portfolio / GitHub / Link <span className="opacity-40 font-normal lowercase">(Optional)</span>
                  </label>
                  <input 
                    type="url" 
                    value={formData.portfolio}
                    onChange={e => setFormData(prev => ({ ...prev, portfolio: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 focus:bg-white/10 transition-all"
                    placeholder="github.com/username"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">
                    Tell us what excites you about CardioGuard?
                  </label>
                  <textarea 
                    required
                    value={formData.excitementText}
                    onChange={e => handleWordLimitedChange('excitementText', e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 focus:bg-white/10 transition-all resize-none"
                    placeholder="Share your motivation..."
                  />
                  <div className="flex justify-end mt-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${excitementWordCount >= 140 ? 'text-red-500' : 'text-white/20'}`}>
                      {excitementWordCount} / 150 Words
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">
                    Which of your previous work (roles and/or projects) do you think represents evidence you'd excel at CardioGuard?
                  </label>
                  <textarea 
                    required
                    value={formData.evidenceText}
                    onChange={e => handleWordLimitedChange('evidenceText', e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 focus:bg-white/10 transition-all resize-none"
                    placeholder="Describe your relevant evidence..."
                  />
                  <div className="flex justify-end mt-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${evidenceWordCount >= 140 ? 'text-red-500' : 'text-white/20'}`}>
                      {evidenceWordCount} / 150 Words
                    </span>
                  </div>
                </div>

                {/* EEO Section */}
                <div className="pt-8 border-t border-white/10 mt-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/60 mb-4">Equal Employment Opportunity</h3>
                  <p className="text-[10px] leading-relaxed text-white/40 font-medium mb-6">
                    To comply with government Equal Employment Opportunity and/or Affirmative Action reporting regulations, we are requesting (but NOT requiring) that you enter this personal data.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">
                        Gender <span className="opacity-40 font-normal lowercase">(Optional)</span>
                      </label>
                      <select 
                        value={formData.gender}
                        onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                      >
                        {GENDER_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className="bg-gray-900 text-white">{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">
                        Race / Ethnicity <span className="opacity-40 font-normal lowercase">(Optional)</span>
                      </label>
                      <select 
                        value={formData.race}
                        onChange={e => setFormData(prev => ({ ...prev, race: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-red-600 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                      >
                        {RACE_OPTIONS.map(opt => (
                          <option key={opt} value={opt} className="bg-gray-900 text-white">{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Resume / CV</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`group w-full border-2 border-dashed border-white/10 rounded-[2rem] p-8 text-center cursor-pointer hover:border-red-600/50 hover:bg-white/5 transition-all ${formData.resumeName ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                    {formData.resumeName ? (
                      <div className="flex items-center justify-center gap-3 text-emerald-400">
                        <FileIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest truncate max-w-[200px]">{formData.resumeName}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileIcon className="w-8 h-8 text-white/20 mx-auto group-hover:text-red-600 transition-colors" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Click to upload document</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="w-full py-5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-red-500 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-red-600/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 mt-10"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCwIcon className="w-4 h-4 animate-spin" /> Transmitting...
                    </>
                  ) : 'Submit Application'}
                </button>
              </form>
            </div>
            <p className="mt-8 text-[9px] font-black text-gray-300 uppercase tracking-widest leading-loose text-center">
              By submitting, you agree to our candidate privacy policy and data retention guidelines.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicationFormPage;
