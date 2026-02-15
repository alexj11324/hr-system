
import React, { useState, useMemo } from 'react';
import { Job, GroupedJobs, Employee } from '../types';
import { SearchIcon, BriefcaseIcon, PlusIcon, FilterIcon, MapPinIcon, UsersIcon, DollarSignIcon, EditIcon, TrashIcon } from './Icons';
import { Modal } from './Modal';

interface JobsPageProps {
  jobs: Job[];
  employees: Employee[];
  onAddJob: (job: Job) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob?: (id: string) => void;
}

const JobsPage: React.FC<JobsPageProps> = ({ jobs, employees, onAddJob, onUpdateJob, onDeleteJob }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Open' | 'Paused' | 'Closed'>('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    hiringManager: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    description: '',
    status: 'Open'
  });

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      hiringManager: '',
      location: '',
      salaryMin: '',
      salaryMax: '',
      description: '',
      status: 'Open'
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setSelectedJob(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenView = (job: Job) => {
    setSelectedJob(job);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleSwitchToEdit = () => {
    if (!selectedJob) return;

    const salaryParts = selectedJob.salaryRange.replace(/\$/g, '').replace(/k/g, '000').split(' - ');
    
    setFormData({
      title: selectedJob.title,
      department: selectedJob.department,
      hiringManager: selectedJob.hiringManager,
      location: selectedJob.location,
      salaryMin: salaryParts[0] || '',
      salaryMax: salaryParts[1] || '',
      description: selectedJob.description || '',
      status: selectedJob.status as string
    });
    setModalMode('edit');
  };

  const handleDelete = () => {
    if (selectedJob && onDeleteJob) {
      if (confirm(`Are you sure you want to delete the "${selectedJob.title}" posting?`)) {
        onDeleteJob(selectedJob.id);
        setIsModalOpen(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const salaryRange = formData.salaryMin && formData.salaryMax 
      ? `$${parseInt(formData.salaryMin).toLocaleString()} - $${parseInt(formData.salaryMax).toLocaleString()}`
      : formData.salaryMin ? `$${formData.salaryMin}` : 'TBD';

    const jobData: Job = {
      id: selectedJob && modalMode === 'edit' ? selectedJob.id : Date.now().toString(),
      title: formData.title,
      department: formData.department || 'Web Development',
      hiringManager: formData.hiringManager || 'Unassigned',
      location: formData.location || 'Remote',
      salaryRange,
      description: formData.description,
      status: formData.status as 'Open' | 'Paused' | 'Closed',
      postedDate: selectedJob ? selectedJob.postedDate : new Date().toISOString().split('T')[0]
    };

    if (modalMode === 'edit') {
      onUpdateJob(jobData);
      setSelectedJob(jobData);
      setModalMode('view');
    } else {
      onAddJob(jobData);
      setIsModalOpen(false);
      resetForm();
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            job.hiringManager.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
      const matchesDepartment = departmentFilter === 'All' || job.department === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [jobs, searchTerm, statusFilter, departmentFilter]);

  const groupedJobs: GroupedJobs = useMemo(() => {
    return filteredJobs.reduce((acc, job) => {
      const dept = job.department;
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(job);
      return acc;
    }, {} as GroupedJobs);
  }, [filteredJobs]);

  const departments = Object.keys(groupedJobs).sort();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-700 border-green-200';
      case 'Closed': return 'bg-red-100 text-red-700 border-red-200';
      case 'Paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const hiringManagerOptions = useMemo(() => employees.filter(e => e.status === 'Active'), [employees]);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tighter">Job Board</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and view open roles across the organization.</p>
        </div>
        <div className="flex gap-3">
             <div className="relative">
                <select 
                  className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Paused">Paused</option>
                  <option value="Closed">Closed</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FilterIcon className="h-4 w-4 text-gray-400" />
                </div>
             </div>
             <button onClick={handleOpenCreate} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 shadow-sm flex items-center transition-colors">
                <PlusIcon className="w-4 h-4 mr-2" /> Create Posting
             </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <SearchIcon className="h-5 w-5" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search by job title or hiring manager..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-64">
             <select className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
               value={departmentFilter}
               onChange={(e) => setDepartmentFilter(e.target.value)}
             >
                <option value="All">All Departments</option>
                <option value="Web Development">Web Development</option>
                <option value="Talent Management & Recruiting">Talent Management & Recruiting</option>
                <option value="Product Development">Product Development</option>
             </select>
        </div>
      </div>

      {departments.length > 0 ? (
        <div className="space-y-8">
          {departments.map(dept => (
            <div key={dept} className="relative">
              <div className="mb-10 last:mb-0">
                <div className="flex items-center mb-4 border-b border-gray-200 pb-2">
                  <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tighter">{dept}</h2>
                  <span className="ml-3 bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">{groupedJobs[dept].length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupedJobs[dept].map((job) => (
                    <div key={job.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer group" onClick={() => handleOpenView(job)}>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-sm font-bold text-gray-900 truncate pr-2 group-hover:text-primary-600 transition-colors" title={job.title}>{job.title}</h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(job.status)}`}>{job.status}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">{job.department}</p>
                      <div className="space-y-2 mb-6 flex-1 text-xs text-gray-600">
                         <div><span className="font-semibold">Manager:</span> {job.hiringManager}</div>
                         <div><span className="font-semibold">Location:</span> {job.location}</div>
                         <div><span className="font-semibold">Salary:</span> {job.salaryRange}</div>
                      </div>
                      <button className="w-full text-center px-3 py-2 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">View Details</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl">
          <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>No jobs found matching your criteria.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Create New Job Posting' : modalMode === 'edit' ? 'Edit Job Posting' : selectedJob?.title || 'Job Details'}>
        {modalMode === 'view' && selectedJob && (
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(selectedJob.status)} mb-2`}>{selectedJob.status}</span>
                        <h2 className="text-sm text-gray-500">{selectedJob.department}</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSwitchToEdit} className="text-gray-400 hover:text-primary-600 transition-colors p-2 hover:bg-primary-50 rounded-full" title="Edit Job"><EditIcon className="w-5 h-5" /></button>
                        {onDeleteJob && <button onClick={handleDelete} className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full" title="Delete Job"><TrashIcon className="w-5 h-5" /></button>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Hiring Manager</p>
                        <div className="flex items-center mt-1 text-sm text-gray-900"><UsersIcon className="w-4 h-4 mr-2 text-gray-400" />{selectedJob.hiringManager}</div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Location</p>
                        <div className="flex items-center mt-1 text-sm text-gray-900"><MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />{selectedJob.location}</div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Salary Range</p>
                        <div className="flex items-center mt-1 text-sm text-gray-900"><DollarSignIcon className="w-4 h-4 mr-2 text-gray-400" />{selectedJob.salaryRange}</div>
                    </div>
                     <div><p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Posted Date</p><div className="flex items-center mt-1 text-sm text-gray-900">{selectedJob.postedDate}</div></div>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Job Description</h3>
                    <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto pr-2">{selectedJob.description || "No description provided."}</div>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                     <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
                     <button onClick={handleSwitchToEdit} className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 shadow-sm">Edit Details</button>
                </div>
            </div>
        )}
        {(modalMode === 'edit' || modalMode === 'create') && (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label className="block text-sm font-medium text-gray-700">Team</label>
                <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                    <option value="" disabled>Select Team...</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Talent Management & Recruiting">Talent Management & Recruiting</option>
                    <option value="Product Development">Product Development</option>
                </select>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Open">Open</option>
                    <option value="Paused">Paused</option>
                    <option value="Closed">Closed</option>
                </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Hiring Manager</label>
                <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" value={formData.hiringManager} onChange={e => setFormData({...formData, hiringManager: e.target.value})}>
                    <option value="" disabled>Select Manager...</option>
                    {hiringManagerOptions.map(emp => <option key={emp.id} value={emp.name}>{emp.name} ({emp.department})</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input required type="text" list="location-options" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Select or type a location..." />
                <datalist id="location-options"><option value="Remote" /><option value="Hybrid" /><option value="Onsite" /></datalist>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Min Salary</label><input type="number" placeholder="e.g. 100000" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" value={formData.salaryMin} onChange={e => setFormData({...formData, salaryMin: e.target.value})} /></div>
                <div><label className="block text-sm font-medium text-gray-700">Max Salary</label><input type="number" placeholder="e.g. 150000" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" value={formData.salaryMax} onChange={e => setFormData({...formData, salaryMax: e.target.value})} /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700">Job Description <span className="text-gray-400 font-normal">(Required)</span></label><textarea required rows={6} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2" placeholder="Enter full job description here..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => modalMode === 'edit' ? setModalMode('view') : setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 shadow-sm">{modalMode === 'edit' ? 'Save Changes' : 'Create Job'}</button>
            </div>
            </form>
        )}
      </Modal>
    </div>
  );
};

export default JobsPage;
