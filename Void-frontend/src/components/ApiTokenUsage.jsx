// In src/components/ApiTokenUsage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
// CORRECT
import { useAuth } from '../dashboard/context/AuthProvider'; 
export const ApiTokenUsage = () => {
    const { token } = useAuth();
    const [apiDetails, setApiDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            if (!token) {
                setError('Authentication token not found.');
                setIsLoading(false);
                return;
            }
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                // This endpoint needs to exist on the backend for the admin user
                const { data } = await axios.get('http://localhost:5000/api/admin/api-details', config);
                setApiDetails(data);
            } catch (err) {
                setError('Failed to fetch API details. Your plan may not be active yet.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [token]);

    if (isLoading) return <div className="text-center p-6">Loading API Details...</div>;
    if (error) return <div className="p-6 bg-red-900/30 rounded-lg">{error}</div>;
    if (!apiDetails) return null;
    
    const { apiKey, tokens } = apiDetails;
    const usagePercentage = tokens ? (tokens.tokensUsed / tokens.tokenLimit) * 100 : 0;

    return (
        <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-5">API & Token Usage</h2>
            
            <div className="mb-6">
                <label className="text-sm font-medium text-zinc-400">Your Secret API Key</label>
                <div className="flex items-center gap-2 mt-2">
                    <input 
                        type="password"
                        readOnly
                        value={apiKey || 'Activation pending...'}
                        className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-300 font-mono"
                    />
                    <button 
                        onClick={() => navigator.clipboard.writeText(apiKey)} 
                        className="px-4 py-2 bg-[#16a085] text-white rounded-md hover:bg-teal-600 transition-colors"
                    >
                        Copy
                    </button>
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-zinc-400">Monthly Token Usage</label>
                {tokens ? (
                    <>
                        <div className="w-full bg-zinc-700 rounded-full h-4 mt-2">
                            <div 
                                className="bg-teal-500 h-4 rounded-full" 
                                style={{ width: `${usagePercentage}%` }}
                            ></div>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex justify-between">
                            <span>{tokens.tokensUsed.toLocaleString()} Used</span>
                            <span>{tokens.tokenLimit.toLocaleString()} Total</span>
                        </div>
                    </>
                ) : (
                    <p className="text-zinc-500 mt-2 text-sm">Token details will appear here once your account is activated.</p>
                )}
            </div>
        </div>
    );
};