import React from 'react';
import { Job } from '../types';
import JobCard from './JobCard';

interface JobGroupProps {
  department: string;
  jobs: Job[];
}

const JobGroup: React.FC<JobGroupProps> = ({ department, jobs }) => {
  return (
    <div className="mb-10 last:mb-0">
      <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
        <h2 className="text-lg font-bold text-gray-900">{department}</h2>
        <span className="ml-3 bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">
          {jobs.length}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
};

export default JobGroup;