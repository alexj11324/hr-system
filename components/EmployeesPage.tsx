import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { UsersIcon, SearchIcon, PlusIcon, EditIcon, TrashIcon } from './Icons';
import { Modal } from './Modal';

interface EmployeesPageProps {
  employees: Employee[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

const EmployeesPage: React.FC<EmployeesPageProps> = ({ 
  employees, 
  onAddEmployee, 
  onUpdateEmployee, 
  onDeleteEmployee 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    department: string;
    role: string;
    status: 'Active' | 'On Leave' | 'Inactive';
    employmentType: 'Full-time' | 'Contract';
  }>({
    name: '',
    department: 'Web Development',
    role: '',
    status: 'Active',
    employmentType: 'Full-time'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      department: 'Web Development',
      role: '',
      status: 'Active',
      employmentType: 'Full-time'
    });
    setEditingEmployee(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      department: emp.department,
      role: emp.role,
      status: emp.status,
      employmentType: emp.employmentType || 'Full-time'
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingEmployeeId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deletingEmployeeId) {
      onDeleteEmployee(deletingEmployeeId);
      setIsDeleteModalOpen(false);
      setDeletingEmployeeId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmployee) {
      const updatedEmployee: Employee = {
        ...editingEmployee,
        name: formData.name,
        department: formData.department,
        role: formData.role || 'Team Member',
        status: formData.status,
        employmentType: formData.employmentType
      };
      onUpdateEmployee(updatedEmployee);
    } else {
      const newEmployee: Employee = {
        id: Date.now().toString(),
        name: formData.name,
        department: formData.department,
        role: formData.role || 'Team Member',
        status: formData.status,
        employmentType: formData.employmentType,
        joinDate: new Date().toISOString().split('T')[0]
      };
      onAddEmployee(newEmployee);
    }
    
    setIsModalOpen(false);
    resetForm();
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'All' || emp.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchTerm, departmentFilter]);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People Directory</h1>
          <p className="text-sm text-gray-500 mt-1">View all current team members and status.</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 shadow-sm flex items-center transition-colors"
             >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Employee
             </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-64">
           <select 
             className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
             value={departmentFilter}
             onChange={(e) => setDepartmentFilter(e.target.value)}
           >
              <option value="All">All Teams</option>
              <option value="Web Development">Web Development</option>
              <option value="Talent Management & Recruiting">Talent Management & Recruiting</option>
              <option value="Product Development">Product Development</option>
           </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold mr-3 border border-gray-200">
                                        {emp.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                                        <div className="text-xs text-gray-500">{emp.employmentType || 'Full-time'}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {emp.department}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{emp.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  emp.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 
                                  emp.status === 'Inactive' ? 'bg-red-50 text-red-700 border border-red-100' :
                                  'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      emp.status === 'Active' ? 'bg-green-500' : 
                                      emp.status === 'Inactive' ? 'bg-red-500' :
                                      'bg-yellow-500'
                                    }`}></span>
                                    {emp.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.joinDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handleOpenEdit(emp)}
                                    className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                    title="Edit"
                                  >
                                    <EditIcon className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleOpenDelete(emp.id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                    title="Delete"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                          No employees found.
                        </td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-500">
                Showing {filteredEmployees.length} result(s)
            </div>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? "Edit Employee" : "Add New Employee"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              required
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value})}
            >
              <option value="Web Development">Web Development</option>
              <option value="Talent Management & Recruiting">Talent Management & Recruiting</option>
              <option value="Product Development">Product Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <input 
              type="text" 
              placeholder="e.g. Senior Manager"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border p-2"
                value={formData.employmentType}
                onChange={e => setFormData({...formData, employmentType: e.target.value as any})}
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 shadow-sm"
            >
              {editingEmployee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
           <p className="text-sm text-gray-600">
             Are you sure you want to remove this employee? This action cannot be undone.
           </p>
           <div className="pt-2 flex justify-end gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 shadow-sm"
              >
                Delete Employee
              </button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeesPage;