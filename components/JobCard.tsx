import React from 'react';
import { Job } from '../types';
import { UsersIcon, MapPinIcon, DollarSignIcon } from './Icons';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const statusStyles = {
    Open: 'bg-green-100 text-green-700 border-green-200',
    Draft: 'bg-gray-100 text-gray-600 border-gray-200',
    Closed: 'bg-red-100 text-red-700 border-red-200',
    Paused: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-bold text-gray-900 truncate pr-2" title={job.title}>{job.title}</h3>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusStyles[job.status] || statusStyles.Open}`}>
          {job.status}
        </span>
      </div>
      
      <p className="text-xs text-gray-500 mb-4">{job.department}</p>
      
      <div className="space-y-2 mb-6 flex-1">
        <div className="flex items-center text-xs text-gray-600">
          <UsersIcon className="w-3.5 h-3.5 mr-2 text-gray-400" />
          <span className="truncate">{job.hiringManager}</span>
        </div>
        <div className="flex items-center text-xs text-gray-600">
          <MapPinIcon className="w-3.5 h-3.5 mr-2 text-gray-400" />
          <span className="truncate">{job.location}</span>
        </div>
        {job.salaryRange && (
          <div className="flex items-center text-xs text-gray-600">
            <DollarSignIcon className="w-3.5 h-3.5 mr-2 text-gray-400" />
            <span className="truncate">{job.salaryRange}</span>
          </div>
        )}
      </div>

      <button className="w-full text-center px-3 py-2 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
        View Details
      </button>
    </div>
  );
};

export default JobCard;