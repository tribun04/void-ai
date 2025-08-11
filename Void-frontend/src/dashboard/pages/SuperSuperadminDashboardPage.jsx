import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthProvider';
import { FiUsers, FiClock, FiCheckCircle, FiRefreshCw, FiAlertCircle, FiInfo, FiSearch, FiLoader } from 'react-icons/fi';
import { ManageTenantModal } from '../components/modals/ManageTenantModal';

// Custom hook for debouncing input
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// --- Sub-components for a cleaner structure ---

// Component for Status Badges
const StatusBadge = ({ status }) => {
    const statusMap = useMemo(() => ({
        completed: { style: 'bg-green-900/30 text-green-400 border border-green-800', icon: <FiCheckCircle /> },
        pending: { style: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800', icon: <FiClock /> },
        suspended: { style: 'bg-red-900/30 text-red-400 border border-red-800', icon: <FiAlertCircle /> }
    }), []);
    const { style, icon } = statusMap[status] || { style: 'bg-zinc-800 text-zinc-400 border border-zinc-700', icon: <FiInfo /> };
    return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${style}`}>{icon} {status}</span>;
};

// Component for the User Table Row
const UserTableRow = ({ user, onActivate, onManage }) => (
    <tr className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors duration-150">
        <td className="px-6 py-4">
            <div className="font-medium text-white">{user.fullName}</div>
            <div className="text-sm text-zinc-400">{user.email}</div>
        </td>
        <td className="px-6 py-4">
            <div className="text-sm text-white">{user.companyName}</div>
            <div className="text-xs text-zinc-400">{user.planName || 'N/A'}</div>
        </td>
        <td className="px-6 py-4 text-sm text-zinc-400">{new Date(user.createdAt).toLocaleDateString()}</td>
        <td className="px-6 py-4"><StatusBadge status={user.paymentStatus} /></td>
        <td className="px-6 py-4 text-right space-x-2">
            {user.paymentStatus === 'pending' && (
                <button onClick={() => onActivate(user.id)} className="px-3 py-1.5 bg-[#16a085] hover:bg-teal-600 text-white rounded-lg text-xs font-semibold">
                    Activate
                </button>
            )}
            <button onClick={() => onManage(user.id)} className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-semibold">
                Manage
            </button>
        </td>
    </tr>
);

// --- Main Dashboard Component ---

export const SuperSuperadminDashboardPage = () => {
    const { token } = useAuth();

    // State Management
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'succeeded' | 'failed'
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState('');

    const [filter, setFilter] = useState('pending'); // Server-side filter
    const [searchTerm, setSearchTerm] = useState(''); // Client-side search
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search term

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);

    // Data Fetching
    const fetchUsers = useCallback(async () => {
        if (!token) return;
        setStatus('loading');
        setError(null);
        try {
            const response = await axios.get(`http://localhost:5000/api/superadmin/users?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
            setStatus('succeeded');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users.');
            setStatus('failed');
        }
    }, [token, filter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // User Actions
    const handleActivate = async (userId) => {
        setFeedback(`Activating user ${userId}...`);
        try {
            const response = await axios.patch(`http://localhost:5000/api/superadmin/users/${userId}/activate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeedback(`User activated successfully! API Key: ${response.data.apiKey}`);
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Activation failed.');
        }
    };

    const handleOpenManageModal = async (userId) => {
        setFeedback('Loading user details...');
        try {
            const response = await axios.get(`http://localhost:5000/api/superadmin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedTenant(response.data);
            setIsModalOpen(true);
            setFeedback('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch user details.');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTenant(null);
    };

    // Client-side filtering based on the debounced search term
    const filteredUsers = useMemo(() => users.filter(user =>
        (user.companyName?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
        (user.fullName?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase())
    ), [users, debouncedSearchTerm]);

    const isLoading = status === 'loading';

    return (
        <div className="min-h-screen bg-black text-gray-200 p-6 font-sans">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">User Activation Management</h1>
                <p className="text-zinc-400 mt-2">Activate new accounts after payment confirmation.</p>
            </header>

            {/* Controls */}
            <div className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        {['pending', 'completed', 'suspended'].map(filterType => (
                            <button key={filterType} onClick={() => setFilter(filterType)} className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${filter === filterType ? 'bg-[#16a085] text-white font-semibold' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                                {filterType === 'pending' && <FiClock />}
                                {filterType === 'completed' && <FiCheckCircle />}
                                {filterType === 'suspended' && <FiAlertCircle />}
                                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 bg-zinc-800 rounded-lg border border-transparent focus:border-teal-500 focus:ring-0" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={fetchUsers} disabled={isLoading} className="p-2.5 bg-zinc-800 rounded-lg hover:bg-zinc-700 disabled:opacity-50">
                            <FiRefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Feedback & Error Banners */}
            {feedback && <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-300">{feedback}</div>}
            {error && <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">{error}</div>}

            {/* User Table */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-zinc-900">
                            <tr className="border-b border-zinc-700">
                                {['User', 'Company / Plan', 'Registered', 'Payment Status'].map(header => <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wider">{header}</th>)}
                                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!isLoading && filteredUsers.map((user) => (
                                <UserTableRow key={user.id} user={user} onActivate={handleActivate} onManage={handleOpenManageModal} />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Loading and Empty States */}
                {isLoading && <div className="py-12 flex justify-center items-center gap-3 text-zinc-400"><FiLoader className="animate-spin" />Loading users...</div>}
                {!isLoading && status === 'failed' && <div className="py-12 text-center text-red-400">Error: {error}</div>}
                {!isLoading && filteredUsers.length === 0 && status !== 'failed' && <div className="py-12 text-center text-zinc-500">No users found for this filter.</div>}
            </div>

            {/* Modal */}
            <ManageTenantModal isOpen={isModalOpen} onClose={handleCloseModal} tenant={selectedTenant} onSave={fetchUsers} />
        </div>
    );
};