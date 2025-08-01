import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaArchive, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthProvider'; // ✅ 1. Import useAuth to get user credentials

export function ChatHistoryViewer() {
    const { auth } = useAuth(); // ✅ Get the authenticated user's data
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState(''); // ✅ State to show UI feedback on errors

    // ✅ Fetch the list of chat logs for the LOGGED-IN TENANT
    const fetchLogs = useCallback(() => {
        if (!auth?.token) return; // Don't fetch if not logged in

        setLoading(true);
        setError(''); // Clear previous errors

        axios.get('/api/tenant/chat-history', { // ✅ 2. Use the correct TENANT-specific URL
            headers: {
                Authorization: `Bearer ${auth.token}` // ✅ 3. Add the required authentication token
            }
        })
        .then(res => setLogs(res.data))
        .catch(err => {
            console.error("Failed to fetch chat logs list", err);
            setError('Could not load chat archives. Please try again later.'); // ✅ Set a user-friendly error
        })
        .finally(() => setLoading(false));
    }, [auth]); // ✅ Re-run if auth state changes

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const fetchLogContent = (conversationId) => {
        if (!auth?.token) return;

        setLoadingMessages(true);
        setSelectedLog(conversationId);
        setError('');

        axios.get(`/api/tenant/chat-history/${conversationId}`, { // ✅ Use the correct TENANT-specific URL
            headers: {
                Authorization: `Bearer ${auth.token}` // ✅ Add the required authentication token
            }
        })
        .then(res => setMessages(res.data))
        .catch(err => {
            console.error(`Failed to fetch content for ${conversationId}`, err);
            setError('Could not load the selected conversation.'); // ✅ Set a user-friendly error
        })
        .finally(() => setLoadingMessages(false));
    };

    return (
        <div className="flex h-[calc(100vh-11rem)] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
            {/* Sidebar */}
            <aside className="w-1/3 max-w-sm h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
                <div className="p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold flex items-center text-white">
                        <FaArchive className="mr-3 text-[#16a085]" />
                        Chat Archives
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <p className="p-4 text-gray-400">Loading archives...</p>
                    ) : logs.length > 0 ? ( // ✅ Check if logs exist before mapping
                        logs.map(log => (
                            <div key={log.conversationId} onClick={() => fetchLogContent(log.conversationId)}
                                className={`p-4 border-b border-zinc-800 cursor-pointer transition-colors ${
                                    selectedLog === log.conversationId ? 'bg-[#16a085]/20' : 'hover:bg-zinc-800'
                                }`}>
                                <p className={`font-semibold truncate ${
                                    selectedLog === log.conversationId ? 'text-white' : 'text-gray-300'
                                }`}>
                                    Chat: ...{log.conversationId.slice(-12)}
                                </p>
                            </div>
                        ))
                    ) : ( // ✅ 4. Show a helpful message if there are no logs
                        <p className="p-4 text-gray-500 text-center mt-4">No chat history found for your account.</p>
                    )}
                </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 h-full flex flex-col bg-zinc-900">
                {/* ✅ 5. Centralized display for all states: initial, loading, error, and content */}
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400">
                        <FaExclamationCircle className="text-4xl mb-3" />
                        <p>{error}</p>
                    </div>
                ) : !selectedLog ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Select a chat log to view.</div>
                ) : loadingMessages ? (
                    <div className="flex items-center justify-center h-full text-gray-500">Loading messages...</div>
                ) : (
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => {
                             if(msg.type === 'event') {
                                return (
                                    <div key={index} className="text-center my-4">
                                        <span className="text-xs text-gray-400 bg-zinc-800 px-3 py-1 rounded-full font-medium">
                                            Event: {msg.event} at {new Date(msg.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                )
                            }
                            return (
                                <div key={index} className={`flex items-end gap-3 max-w-xl ${msg.from === 'agent' ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}>
                                    <div className={`p-3 rounded-xl ${
                                        msg.from === 'agent' ? 'bg-[#16a085] text-white' : 'bg-zinc-800 text-gray-200'
                                    }`}>
                                        <div className="flex items-baseline gap-2">
                                            <p className="font-bold text-sm">{msg.from === 'agent' ? msg.agentName || 'Agent' : 'User'}</p>
                                        </div>
                                        <p className="mt-1 text-sm whitespace-pre-wrap">{msg.text}</p>
                                        <p className="text-xs opacity-60 text-right mt-2">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}