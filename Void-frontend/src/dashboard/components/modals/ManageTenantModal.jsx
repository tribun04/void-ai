import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthProvider';
import { FiX, FiCheck, FiCpu, FiKey, FiCloud } from 'react-icons/fi';

export const ManageTenantModal = ({ isOpen, onClose, tenant, onSave }) => {
    const { token } = useAuth();
    const [apiKey, setApiKey] = useState('');
    const [totalAllocated, setTotalAllocated] = useState(0);
    const [usedTokens, setUsedTokens] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // This effect runs whenever the 'tenant' prop changes (i.e., when the modal opens)
    useEffect(() => {
        if (tenant) {
            // Populate the form fields with the data fetched from the backend
            setApiKey(tenant.apiKey || 'Not generated yet.');
            setTotalAllocated(tenant.token_limit || 0); // Matches your 'tenants' table schema
            setUsedTokens(tenant.tokens_used || 0);   // Matches your 'tenants' table schema
            setFeedback(''); // Clear any previous feedback messages
        }
    }, [tenant]);

    /**
     * This is the new, fully functional save handler.
     * It sends the updated token values to the correct backend endpoint.
     */
    const handleSaveChanges = async () => {
        if (!tenant) return;
        setIsSaving(true);
        setFeedback('Saving...');

        try {
            // ✅ This is the correct, secure endpoint for this action
            const endpoint = `http://localhost:5000/api/superadmin/tenants/${tenant.id}/tokens`;

            // ✅ The payload keys now perfectly match what the backend controller expects
            const payload = {
                totalAllocated: parseInt(totalAllocated, 10),
                usedTokens: parseInt(usedTokens, 10)
            };
            
            await axios.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });

            setFeedback('Changes saved successfully!');
            
            // This calls the 'fetchUsers' function on the parent page to refresh the list
            if (onSave) onSave(); 
            
            // Close the modal after a short delay to show the success message
            setTimeout(() => {
                onClose(); 
            }, 1500);

        } catch (error) {
            setFeedback(error.response?.data?.message || 'Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 w-full max-w-md shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Manage Tenant</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800"><FiX /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2"><FiCpu /> Tenant</label>
                        <input type="text" readOnly value={tenant?.name || 'N/A'} className="mt-1 w-full p-2 bg-zinc-800 rounded-md text-zinc-300 cursor-not-allowed"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2"><FiKey /> API Key</label>
                        <input type="text" readOnly value={apiKey} className="mt-1 w-full p-2 bg-zinc-800 rounded-md font-mono cursor-not-allowed"/>
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
                    <button onClick={onClose} className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700" disabled={isSaving}>Cancel</button>
                    <button onClick={handleSaveChanges} className="px-4 py-2 bg-[#16a085] text-white rounded-lg hover:bg-teal-600 flex items-center gap-2" disabled={isSaving}>
                        {isSaving ? 'Saving...' : <><FiCheck /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
};