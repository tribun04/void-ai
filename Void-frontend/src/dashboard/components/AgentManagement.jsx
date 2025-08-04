// src/components/AgentManagement.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaUserShield, FaUserTie, FaSearch } from 'react-icons/fa';

// --- COMPONENT 1: Rebranded Add User Modal ---
// The modal is now fully themed to match your brand's look and feel.
const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      {/* 1. Modal container updated to the new dark theme (zinc). */}
      <div className="bg-zinc-900 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md border border-zinc-800">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Platform User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-300 bg-red-500/20 p-3 rounded-lg font-semibold">{error}</p>}
          
          {/* 2. All input fields now use the branded focus color. */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Full Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Initial Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]"
            />
          </div>
          <div className="pb-2">
            <label className="block text-sm font-semibold text-gray-400 mb-2">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085] appearance-none"
            >
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          {/* 3. Action buttons now use the brand's colors. */}
          <div className="flex justify-end gap-4 pt-4 border-t border-zinc-700 mt-6">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 transition-colors font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={isLoading}
              className="px-6 py-2 bg-[#16a085] text-white rounded-md hover:bg-[#138f75] disabled:bg-[#16a085]/40 disabled:cursor-not-allowed transition-colors font-bold">
              {isLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- COMPONENT 2: Rebranded Main AgentManagement Component ---
export function AgentManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // No changes needed for the logic.
  useEffect(() => {
    setLoading(true);
    axios.get('/api/superadmin/users')
      .then(res => setUsers(res.data))
      .catch(err => {
        setError('Failed to fetch users. Please try again later.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUserAdded = (newUser) => {
    setUsers([newUser, ...users]);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/superadmin/users/${userId}`);
        setUsers(users.filter(u => u.id !== userId));
      } catch (err) {
        alert('Failed to delete user.');
        console.error(err);
      }
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-center p-12 text-gray-400">Loading users...</div>;
  if (error) return <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-lg font-semibold">{error}</div>;

  return (
    // 4. Main component container updated to the zinc theme.
    <div className="bg-zinc-900 rounded-xl shadow-lg p-6 md:p-8 border border-zinc-800">
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUserAdded={handleUserAdded} />
      
      {/* Header section with branded elements */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-auto">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // Search input is now branded
            className="pl-11 pr-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085] w-full sm:w-64"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          // 5. "Add User" button uses the brand's accent color.
          className="flex items-center justify-center w-full sm:w-auto px-5 py-2 bg-[#16a085] text-white rounded-md font-bold hover:bg-[#138f75] transition-colors flex-shrink-0 shadow-lg"
        >
          <FaPlus className="mr-2" />
          Add User
        </button>
      </div>

      {/* 6. Table styling is updated for the new theme. */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-950">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                          {/* 7. User avatar uses the brand's accent color. */}
                          <div className="w-10 h-10 rounded-full bg-[#16a085] flex items-center justify-center font-bold text-lg text-white mr-4 flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                              <div className="text-sm font-medium text-white">{user.name}</div>
                              <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                      </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* The role badges are great for status, their colors are kept for clarity. */}
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' 
                        ? 'bg-amber-500/20 text-amber-300' 
                        : 'bg-sky-500/20 text-sky-300'
                      }`}
                    >
                      {user.role === 'admin' ? <FaUserShield className="mr-1.5" /> : <FaUserTie className="mr-1.5" />}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {user.role !== 'superadmin' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-gray-500 hover:text-red-500 rounded-md transition-colors"
                        aria-label={`Delete ${user.name}`}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-12 text-gray-500">
                    <p className="font-semibold">No users found.</p>
                    <p className="text-sm">Try adjusting your search or adding a new user.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}