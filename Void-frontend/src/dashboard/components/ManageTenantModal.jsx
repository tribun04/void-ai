import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { useAuth } from '../context/AuthProvider';
import { FiX, FiCheckCircle, FiAlertCircle, FiInfo, FiDatabase, FiKey, FiSave } from 'react-icons/fi';


// Dark theme modal styles
const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#111827',
        border: '1px solid #1f2937',
        borderRadius: '0.75rem',
        padding: '0',
        color: '#f3f4f6',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000
    }
};

Modal.setAppElement('#root');

export const ManageTenantModal = ({ isOpen, onClose, tenant, onSave }) => {
    const { token } = useAuth();
    const [tokenData, setTokenData] = useState({ totalAllocated: 0, used: 0 });
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (tenant) {
            setTokenData({
                totalAllocated: tenant.totalAllocated || 0,
                used: tenant.used || 0
            });
            setFeedback({ message: '', type: '' });
        }
    }, [tenant]);

    const handleChange = (e) => {
        setTokenData({ ...tokenData, [e.target.name]: parseInt(e.target.value) || 0 });
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        setFeedback({ message: 'Saving changes...', type: 'info' });
        
        try {
            await axios.put(
                `http://localhost:5000/api/admin/tenants/${tenant.id}/tokens`,
                tokenData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFeedback({ message: 'Tokens updated successfully!', type: 'success' });
            onSave();
            setTimeout(onClose, 1500);
        } catch (err) {
            setFeedback({ 
                message: err.response?.data?.message || 'Failed to update tokens', 
                type: 'error' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!tenant) return null;

    const getFeedbackStyle = () => {
        switch (feedback.type) {
            case 'success': return 'bg-green-900/30 text-green-400 border-green-800';
            case 'error': return 'bg-red-900/30 text-red-400 border-red-800';
            case 'info': return 'bg-blue-900/30 text-blue-400 border-blue-800';
            default: return '';
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onClose} 
            style={customStyles}
            closeTimeoutMS={200}
        >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white">Manage Tenant</h2>
                <button 
                    onClick={onClose} 
                    className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                    <FiX size={24} />
                </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="p-2 bg-zinc-800 rounded-full">
                            <FiDatabase className="text-[#16a085]" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Tenant</p>
                            <p className="font-medium text-white">{tenant.companyName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="p-2 bg-zinc-800 rounded-full">
                            <FiKey className="text-[#16a085]" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">API Key</p>
                            <code className="font-mono text-sm text-white break-all">{tenant.apiKey}</code>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-zinc-300">Total Allocated Tokens</label>
                        <input 
                            type="number" 
                            name="totalAllocated" 
                            value={tokenData.totalAllocated} 
                            onChange={handleChange} 
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a085] text-white" 
                        />
                    </div>
                    
                    <div>
                        <label className="block mb-2 text-sm font-medium text-zinc-300">Used Tokens</label>
                        <input 
                            type="number" 
                            name="used" 
                            value={tokenData.used} 
                            onChange={handleChange} 
                            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a085] text-white" 
                        />
                    </div>
                </div>

                {feedback.message && (
                    <div className={`p-3 rounded-lg border ${getFeedbackStyle()} flex items-center gap-2`}>
                        {feedback.type === 'success' && <FiCheckCircle />}
                        {feedback.type === 'error' && <FiAlertCircle />}
                        {feedback.type === 'info' && <FiInfo />}
                        <span>{feedback.message}</span>
                    </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
                <button 
                    onClick={onClose} 
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <FiX /> Cancel
                </button>
                <button 
                    onClick={handleSave} 
                    disabled={isSubmitting}
                    className="px-4 py-2.5 bg-[#16a085] hover:bg-teal-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                    {isSubmitting ? (
                        <span className="animate-pulse">Saving...</span>
                    ) : (
                        <>
                            <FiSave /> Save Changes
                        </>
                    )}
                </button>
            </div>
        </Modal>
    );
};