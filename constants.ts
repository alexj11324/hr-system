import { Job, Employee } from './types';

export const ALLOWED_USERS = [
  'Arthur Spirou',
  'Zhixuan Jiang',
  'Liufei Chen',
  'Daniella Habib'
];

export const MOCK_JOBS: Job[] = [
  // Web Development
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    department: 'Web Development',
    hiringManager: 'Erika Ramirez',
    salaryRange: '$140k - $180k',
    description: 'We are looking for a Senior Frontend Engineer to lead our React initiatives. You will be responsible for architecting and building scalable UI components, optimizing application performance, and mentoring junior developers.',
    location: 'Remote',
    status: 'Open',
    postedDate: '2023-10-15',
  },
  {
    id: '2',
    title: 'Backend Developer (Go)',
    department: 'Web Development',
    hiringManager: 'Enzo Tang',
    salaryRange: '$130k - $170k',
    description: 'Join our backend team to build scalable microservices using Go. You will work closely with the product team to design and implement robust APIs that power our core platform.',
    location: 'New York, NY',
    status: 'Open',
    postedDate: '2023-10-18',
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    department: 'Web Development',
    hiringManager: 'Yuning Yang',
    salaryRange: '$120k - $160k',
    description: 'We are seeking a DevOps Engineer to maintain and improve our CI/CD pipelines and cloud infrastructure. Experience with AWS and Terraform is a must.',
    location: 'Remote',
    status: 'Paused',
    postedDate: '2023-09-01',
  },

  // Product Development
  {
    id: '5',
    title: 'Product Designer',
    department: 'Product Development',
    hiringManager: 'Michael Orsted',
    salaryRange: '$110k - $150k',
    description: 'Shape the user experience of Cardio Guard. You will own the design process from concept to hand-off, working closely with PMs and engineers.',
    location: 'San Francisco, CA',
    status: 'Open',
    postedDate: '2023-10-20',
  },
  {
    id: '7',
    title: 'Marketing Specialist',
    department: 'Product Development',
    hiringManager: 'Rafael George',
    salaryRange: '$80k - $100k',
    description: 'Execute marketing campaigns across social media, email, and paid channels. Analyze performance metrics and optimize for conversion.',
    location: 'Remote',
    status: 'Open',
    postedDate: '2023-10-22',
  },
  {
    id: '10',
    title: 'Senior Product Manager',
    department: 'Product Development',
    hiringManager: 'Rafael George',
    salaryRange: '$150k - $190k',
    description: 'Lead the strategy for our core product. You will define the roadmap, prioritize features, and work with stakeholders to deliver value to our customers.',
    location: 'San Francisco, CA',
    status: 'Open',
    postedDate: '2023-10-05',
  },

  // Talent Management & Recruiting
  {
    id: '12',
    title: 'Technical Recruiter',
    department: 'Talent Management & Recruiting',
    hiringManager: 'Arthur Spirou',
    salaryRange: '$80k - $110k',
    description: 'Help us scale our engineering team. You will source, screen, and guide candidates through the interview process.',
    location: 'Remote',
    status: 'Open',
    postedDate: '2023-10-01',
  },
  {
    id: '13',
    title: 'HR Specialist',
    department: 'Talent Management & Recruiting',
    hiringManager: 'Zhixuan Jiang',
    salaryRange: '$70k - $90k',
    description: 'Support day-to-day HR operations, including onboarding, benefits administration, and employee relations.',
    location: 'New York, NY',
    status: 'Open',
    postedDate: '2023-10-08',
  }
];

export const MOCK_EMPLOYEES: Employee[] = [
  // Web Development
  { id: '1', name: 'Erika Ramirez', department: 'Web Development', role: 'Engineering Manager', status: 'Active', employmentType: 'Full-time', joinDate: '2023-01-15' },
  { id: '2', name: 'Xinyu Long', department: 'Web Development', role: 'Frontend Developer', status: 'Active', employmentType: 'Full-time', joinDate: '2023-02-20' },
  { id: '3', name: 'Enzo Tang', department: 'Web Development', role: 'Backend Developer', status: 'Active', employmentType: 'Full-time', joinDate: '2023-03-10' },
  { id: '4', name: 'Yuning Yang', department: 'Web Development', role: 'Fullstack Developer', status: 'Active', employmentType: 'Full-time', joinDate: '2023-04-05' },

  // Talent Management & Recruiting
  { id: '5', name: 'Arthur Spirou', department: 'Talent Management & Recruiting', role: 'Product Owner', status: 'Active', employmentType: 'Full-time', joinDate: '2023-01-10' },
  { id: '6', name: 'Zhixuan Jiang', department: 'Talent Management & Recruiting', role: 'Recruiter', status: 'Active', employmentType: 'Full-time', joinDate: '2022-11-15' },
  { id: '7', name: 'Liufei Chen', department: 'Talent Management & Recruiting', role: 'HR Analyst', status: 'Active', employmentType: 'Full-time', joinDate: '2023-05-12' },
  { id: '8', name: 'Daniella Habib', department: 'Talent Management & Recruiting', role: 'HR Specialist', status: 'Active', employmentType: 'Full-time', joinDate: '2023-06-01' },

  // Product Development
  { id: '9', name: 'Rafael George', department: 'Product Development', role: 'Product Manager', status: 'Active', employmentType: 'Full-time', joinDate: '2022-12-01' },
  { id: '10', name: 'Michael Orsted', department: 'Product Development', role: 'Product Designer', status: 'Active', employmentType: 'Full-time', joinDate: '2022-10-20' },
  { id: '11', name: 'Ridho', department: 'Product Development', role: 'Software Engineer', status: 'Active', employmentType: 'Full-time', joinDate: '2023-07-15' },
  { id: '12', name: 'Riley Wallace', department: 'Product Development', role: 'QA Engineer', status: 'Active', employmentType: 'Full-time', joinDate: '2023-08-01' },
];