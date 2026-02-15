
export interface Job {
  id: string;
  title: string;
  department: string;
  hiringManager: string;
  salaryRange: string;
  description: string;
  location: string;
  status: 'Open' | 'Draft' | 'Closed' | 'Paused';
  postedDate: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  employmentType?: 'Full-time' | 'Contract';
  joinDate: string;
}

export type CandidateType = string;

export type CandidateStage = 
  | 'Applied'
  | 'Qualified' 
  | 'Phone Screening' 
  | 'Team Interview' 
  | 'Hiring Manager Interview' 
  | 'Making Offer' 
  | '30 Day Onboarding' 
  | 'Hired'
  | 'Rejected';

export interface InterviewScore {
  id: string;
  candidateId: string;
  communication: number;
  technical: number;
  culture: number;
  problemSolving: number;
  notes: string;
  recommendation: 'Strong Yes' | 'Yes' | 'Maybe' | 'No';
  createdAt: string;
}

export interface ApplicantAccount {
  id: string;
  email: string;
  password?: string; // In MVP we simulate with simple storage
  firstName: string;
  lastName: string;
  phone: string;
  linkedin?: string;
  portfolio?: string;
  gender?: string;
  race?: string;
  resume?: {
    fileName: string;
    fileData: string;
    uploadedAt: string;
  };
  createdAt: string;
}

export interface Candidate {
  id: string;
  jobId?: string; // Link to specific job posting
  applicantId?: string; // Link to the applicant account
  name: string; // Legacy field, kept for compatibility but should be populated with fullName
  firstName?: string;
  lastName?: string;
  fullName?: string; // Primary display name
  type: CandidateType;
  stage: CandidateStage;
  lastUpdated: string;
  resume?: {
    fileName: string;
    fileData: string; // base64 / data uri
    uploadedAt: string;
  };
  resumeUrl?: string; // URL to hosted resume file
  email?: string;
  phone?: string;
  source?: string;
  linkedin?: string;
  portfolio?: string;
  excitementResponse?: string;
  evidenceResponse?: string;
  gender?: string;
  race?: string;
  score?: InterviewScore; // Attached score
  yearsExperience?: number;
  appliedDate?: string;
  
  // Rejection Metadata
  rejectedReason?: string;
  rejectedNotes?: string;
  rejectedAt?: string;
}

export type ViewState = 
  | 'dashboard' 
  | 'jobs' 
  | 'candidates' 
  | 'employees' 
  | 'settings' 
  | 'ai_assistant' 
  | 'candidate_detail' 
  | 'external_jobs' 
  | 'external_auth'
  | 'external_profile'
  | 'application_form';

export interface GroupedJobs {
  [department: string]: Job[];
}
