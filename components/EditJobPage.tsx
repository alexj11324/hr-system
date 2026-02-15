import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { ArrowLeftIcon, CheckIcon, UsersIcon, DollarSignIcon, MapPinIcon } from './Icons';

interface EditJobPageProps {
  job: Job;
  onSave: (updatedJob: Job) => void;
  onCancel: () => void;
}

const EditJobPage: React.FC<EditJobPageProps> = ({ job, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Job>(job);
  const [isDirty, setIsDirty] = useState(false);

  // Sync state if job prop changes (unlikely in this flow but good practice)
  useEffect(() => {
    setFormData(job);
  }, [job]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <button 
          onClick={onCancel}
          className="group flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
          Back to Dashboard
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Job Posting</h1>
            <p className="text-gray-500 mt-1">Update details for {job.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isDirty}
              className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isDirty ? 'bg-primary-600 hover:bg-primary-700' : 'bg-primary-400 cursor-not-allowed'}`}
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Main Info Section */}
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 border-b border-gray-100 pb-8">
            <div className="sm:col-span-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2.5"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2.5"
                >
                  <option value="Open">Open</option>
                  <option value="Draft">Draft</option>
                  <option value="Closed">Closed</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2.5"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">Brief description for your future applicants.</p>
            </div>
          </div>

          {/* Details Section */}
          <div>
            <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Role Details</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              
              <div className="sm:col-span-3">
                <label htmlFor="hiringManager" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-1">
                    <UsersIcon className="w-4 h-4 text-gray-400" />
                    Hiring Manager
                  </div>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="hiringManager"
                    id="hiringManager"
                    value={formData.hiringManager}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2.5"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="department"
                    id="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2.5"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="salaryRange" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-1">
                     <DollarSignIcon className="w-4 h-4 text-gray-400" />
                     Salary Range
                  </div>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="salaryRange"
                    id="salaryRange"
                    value={formData.salaryRange}
                    onChange={handleChange}
                    placeholder="e.g. $100k - $140k"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2.5"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-1">
                     <MapPinIcon className="w-4 h-4 text-gray-400" />
                     Location
                  </div>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2.5"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditJobPage;