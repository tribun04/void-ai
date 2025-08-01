// src/components/modals/AddUserModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// This is the new, rebranded AddUserModal.
export const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('agent');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setName('');
      setPassword('');
      setRole('agent');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await axios.post('/api/superadmin/users', { email, name, password, role });
      onUserAdded(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Modal container with a smooth backdrop
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Platform User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-300 bg-red-500/20 p-3 rounded-lg font-semibold">{error}</p>}
          
          {/* Re-styled input fields for consistency */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Full Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Initial Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="pb-2">
            <label className="block text-sm font-semibold text-gray-400 mb-2">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {/* Re-styled action buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-700 mt-6">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed transition-colors font-bold">
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};