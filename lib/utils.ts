
import { Job, Employee } from '../types';

// --- Salary Parsing Helpers ---

export const parseSalaryRange = (range: string): { min: number, max: number } => {
  if (!range) return { min: 0, max: 0 };
  
  const clean = (s: string) => {
    s = s.toLowerCase().trim();
    let mult = 1;
    if (s.includes('k')) {
      mult = 1000;
      s = s.replace('k', '');
    }
    return (parseInt(s.replace(/[^0-9.]/g, '')) || 0) * mult;
  };

  const parts = range.split('-');
  const min = clean(parts[0]);
  const max = parts.length > 1 ? clean(parts[1]) : min;

  return { min, max };
};

export const formatSalaryRange = (min: number, max: number): string => {
  if (!min && !max) return 'TBD';
  const fmt = (n: number) => {
    if (n >= 1000) return `$${Math.round(n / 1000)}k`;
    return `$${n}`;
  };
  if (min === max) return fmt(min);
  return `${fmt(min)} - ${fmt(max)}`;
};

// --- PDF/Document Helpers ---

/**
 * Converts a Base64 string to a Blob URL
 */
export const base64ToBlobUrl = (base64Data: string): string => {
  try {
    let contentType = 'application/pdf';
    let data = base64Data;

    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(';base64,');
      contentType = parts[0].split(':')[1];
      data = parts[1];
    }

    const byteCharacters = atob(data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Failed to convert base64 to blob", e);
    return base64Data; // Fallback to raw data URI
  }
};

// --- Data Mapping Functions ---

export const mapDbJobToFrontend = (dbJob: any): Job => {
  return {
    id: dbJob.id,
    title: dbJob.title,
    department: dbJob.department,
    hiringManager: dbJob.hiring_manager,
    salaryRange: formatSalaryRange(dbJob.salary_min, dbJob.salary_max),
    description: dbJob.description || '',
    location: dbJob.location,
    status: dbJob.status,
    postedDate: new Date(dbJob.created_at).toISOString().split('T')[0],
  };
};

export const mapFrontendJobToDb = (job: Job) => {
  const { min, max } = parseSalaryRange(job.salaryRange);
  return {
    title: job.title,
    department: job.department,
    hiring_manager: job.hiringManager,
    location: job.location,
    salary_min: min,
    salary_max: max,
    status: job.status,
    description: job.description,
  };
};
