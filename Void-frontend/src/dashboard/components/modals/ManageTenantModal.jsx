import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthProvider'; // Corrected path
import { FiX, FiCheck, FiKey, FiCpu, FiCloud } from 'react-icons/fi';

export const ManageTenantModal = ({ isOpen, onClose, tenant, onSave }) => {
    const { token } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [totalAllocated, setTotalAllocated] = useState(0);
    const [usedTokens, setUsedTokens] = useState(0);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (tenant) {
            setApiKey(tenant.apiKey || '');
            setTotalAllocated(tenant.tokenDetails?.tokenLimit || 0); // Use the correct field name
            setUsedTokens(tenant.tokenDetails?.tokensUsed || 0);   // Use the correct field name
        }
    }, [tenant]);

    const handleSaveChanges = async () => {
        try {
            const endpoint = `http://localhost:5000/api/admin/tenants/${tenant.id}/tokens`;
            const payload = {
                totalAllocated: parseInt(totalAllocated, 10),
                used: parseInt(usedTokens, 10)
            };
            await axios.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
            setFeedback('Changes saved successfully!');
            if (onSave) onSave(); // Refresh the main list
            setTimeout(() => onClose(), 1500); // Close modal after success
        } catch (error) {
            setFeedback('Failed to save changes.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 w-full max-w-md shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Manage Tenant</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800"><FiX /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2"><FiCpu /> Tenant</label>
                        <input type="text" readOnly value={tenant?.companyName || 'N/A'} className="mt-1 w-full p-2 bg-zinc-800 rounded-md text-zinc-300"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2"><FiKey /> API Key</label>
                        <input type="text" readOnly value={apiKey} className="mt-1 w-full p-2 bg-zinc-800 rounded-md font-mono"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2"><FiCloud /> Total Allocated Tokens</label>
                        <input type="number" value={totalAllocated} onChange={(e) => setTotalAllocated(e.target.value)} className="mt-1 w-full p-2 bg-zinc-800 rounded-md"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2"><FiCloud /> Used Tokens</label>
                        <input type="number" value={usedTokens} onChange={(e) => setUsedTokens(e.target.value)} className="mt-1 w-full p-2 bg-zinc-800 rounded-md"/>
                    </div>
                </div>

                {feedback && <p className="text-center text-sm mt-4 text-teal-400">{feedback}</p>}

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">Cancel</button>
                    <button onClick={handleSaveChanges} className="px-4 py-2 bg-[#16a085] text-white rounded-lg hover:bg-teal-600 flex items-center gap-2"><FiCheck /> Save Changes</button>
                </div>
            </div>
        </div>
    );
};