// src/components/AgentManagement.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { FaPlus, FaTrash, FaUserShield, FaUserTie, FaSearch } from 'react-icons/fa';

// ✅ REAL MODAL INCLUDED BELOW
const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/api/admin/agents', {
        fullName,
        email,
        password,
      });

      onUserAdded(res.data);
      onClose();
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('Failed to create agent. Make sure email is unique.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-lg shadow-lg w-full max-w-md border border-zinc-700">
        <h2 className="text-xl font-bold text-white mb-4">Add Agent</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-between mt-4">
            <button
              type="button"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---
export function AgentManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    apiClient
      .get('/api/admin/my-agents')
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        setError('Failed to fetch your agents. Please try again.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUserAdded = (newUser) => {
    setUsers([newUser, ...users]);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiClient.delete(`/api/admin/agents/${userId}`);
        setUsers(users.filter((u) => u.id !== userId));
      } catch (err) {
        alert('Failed to delete user.');
        console.error(err);
      }
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="text-center p-12 text-gray-400">Loading agents...</div>;
  if (error) return <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-lg font-semibold">{error}</div>;

  return (
    <div className="bg-zinc-900 rounded-xl shadow-lg p-6 md:p-8 border border-zinc-800">
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUserAdded={handleUserAdded} />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Agent Management</h2>
        <button
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          onClick={() => setIsModalOpen(true)}
        >
          <FaPlus /> Add Agent
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            className="pl-10 pr-4 py-2 w-full rounded bg-zinc-800 text-white border border-zinc-700"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <table className="w-full text-left border border-zinc-800 text-white">
        <thead className="bg-zinc-800 text-sm uppercase text-gray-400">
          <tr>
            <th className="px-4 py-2">Full Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Role</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Last Seen</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id} className="border-t border-zinc-800">
              <td className="px-4 py-2">{user.fullName}</td>
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">
                {user.role === 'admin' ? (
                  <span className="flex items-center gap-1">
                    <FaUserShield /> Admin
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <FaUserTie /> Agent
                  </span>
                )}
              </td>
              <td className="px-4 py-2">{user.isOnline ? '🟢 Online' : '🔴 Offline'}</td>
              <td className="px-4 py-2">
                {user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'N/A'}
              </td>
              <td className="px-4 py-2">
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-400">
                No agents found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export default AgentManagement;
// ✅ This component is now ready to be used in your dashboard