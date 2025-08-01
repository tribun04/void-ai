import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthProvider';
import { ManageTenantModal } from '../components/ManageTenantModal';
import { FiUsers, FiClock, FiCheckCircle, FiRefreshCw, FiAlertCircle, FiInfo, FiSearch } from 'react-icons/fi';

export const SuperSuperadminDashboardPage = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    // ✅ The filter state now correctly controls which data is fetched
    const [filter, setFilter] = useState('pending');
    const [feedback, setFeedback] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);

    const fetchUsers = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            // This API call now sends the filter status to the backend
            const response = await axios.get(`http://localhost:5000/api/superadmin/users?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (err) { 
            setError(err.response?.data?.message || 'Failed to fetch users.'); 
        } finally { 
            setIsLoading(false); 
        }
    }, [token, filter]); // The fetch action now depends on the 'filter' state

    // This useEffect will now re-run the fetchUsers function WHENEVER the 'filter' state changes
    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleActivate = async (userId) => {
        setFeedback(`Activating user ${userId}...`);
        try {
            await axios.patch(`http://localhost:5000/api/superadmin/users/${userId}/activate`, {}, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setFeedback(`User ${userId} activated successfully!`);
            await fetchUsers();
        } catch (err) { 
            setFeedback(err.response?.data?.message || 'Activation failed.'); 
        }
    };

    const handleOpenManageModal = async (tenantId) => {
        // This will now work because the backend sends the tenantId for each user
        if (!tenantId) {
            setFeedback('Could not open manage modal: Tenant ID is missing.');
            return;
        }
        try {
            const response = await axios.get(`http://localhost:5000/api/superadmin/tenants/${tenantId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedTenant(response.data);
            setIsModalOpen(true);
        } catch (err) { 
            setFeedback('Could not load tenant details.'); 
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTenant(null);
    };
    
    // ✅ This client-side filtering is now for the search bar only
    const filteredUsers = users.filter(user =>
        (user.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const statusMap = {
            completed: { style: 'bg-green-900/30 text-green-400 border border-green-800', icon: <FiCheckCircle /> },
            pending: { style: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800', icon: <FiClock /> },
            suspended: { style: 'bg-red-900/30 text-red-400 border border-red-800', icon: <FiAlertCircle /> }
        };
        const { style, icon } = statusMap[status] || { style: 'bg-zinc-800 text-zinc-400 border border-zinc-700', icon: <FiInfo /> };
        return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style}`}>{icon} {status}</span>;
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">User Activation Management</h1>
                <p className="text-zinc-400 mt-2">Activate new accounts after payment confirmation</p>
            </div>
            <div className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {/* ✅ These buttons now work by changing the 'filter' state, triggering a new API call */}
                        <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${filter === 'pending' ? 'bg-[#16a085] text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><FiClock /> Pending Activation</button>
                        <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${filter === 'completed' ? 'bg-[#16a085] text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><FiCheckCircle /> Active Users</button>
                        <button onClick={() => setFilter('suspended')} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${filter === 'suspended' ? 'bg-[#16a085] text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><FiAlertCircle /> Suspended</button>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <input type="text" placeholder="Search by name, company..." className="w-full pl-4 pr-4 py-2 bg-zinc-800 rounded-lg" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={fetchUsers} disabled={isLoading} className="p-2.5 bg-zinc-800 rounded-lg"><FiRefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
                    </div>
                </div>
            </div>
            {feedback && <div className="mb-6 p-4 bg-blue-900/30 rounded-lg">{feedback}</div>}
            {error && <div className="mb-6 p-4 bg-red-900/30 rounded-lg">{error}</div>}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <table className="min-w-full">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-300 uppercase">User</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-300 uppercase">Company / Plan</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-300 uppercase">Registered</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-300 uppercase">Payment Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-300 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!isLoading && filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-800/30">
                                <td className="px-6 py-4"><div className="font-medium text-white">{user.fullName}</div><div className="text-xs text-zinc-400">{user.email}</div></td>
                                <td className="px-6 py-4"><div className="text-sm text-white">{user.companyName}</div><div className="text-xs text-zinc-400">{user.planName || 'N/A'}</div></td>
                                <td className="px-6 py-4 text-sm text-zinc-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4">{getStatusBadge(user.paymentStatus)}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {user.paymentStatus === 'pending' && <button onClick={() => handleActivate(user.id)} className="px-3 py-1.5 bg-[#16a085] hover:bg-teal-600 text-white rounded-lg text-xs">Activate</button>}
                                    <button onClick={() => handleOpenManageModal(user.tenantId)} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs">Manage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {isLoading && <div className="py-8 text-center text-zinc-400">Loading...</div>}
                {!isLoading && filteredUsers.length === 0 && <div className="py-12 text-center text-zinc-500">No users found for this filter.</div>}
            </div>
            <ManageTenantModal isOpen={isModalOpen} onClose={handleCloseModal} tenant={selectedTenant} onSave={fetchUsers} />
        </div>
    );
};