// src/components/ChatHistoryViewer.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FaArchive, FaExclamationCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthProvider';

/**
 * Optional props:
 *  - selectedTenantId: string | null   (superadmin viewing another tenant)
 */
export function ChatHistoryViewer({ selectedTenantId = null }) {
    const { token, logout, isLoading: isLoadingAuth, user } = useAuth();

    // Role detection (optional; default non-superadmin)
    const role = String(user?.role || '').toUpperCase();
    const isSuperadmin = role === 'SUPERADMIN';

    // ----- State
    const [logs, setLogs] = useState([]);
    const [logsCursor, setLogsCursor] = useState(null);       // will be used only if backend returns nextCursor
    const [hasMoreLogs, setHasMoreLogs] = useState(true);

    const [selectedLog, setSelectedLog] = useState(null);
    const [messages, setMessages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');

    const logsAbortRef = useRef(null);
    const msgsAbortRef = useRef(null);

    // ----- Axios with token
    const api = useRef(null);
    if (!api.current) {
        api.current = axios.create();
        api.current.interceptors.request.use((config) => {
            if (token) config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
    }

    // ----- Helpers: route builders (multi-tenant aware)
    const buildListUrl = useCallback(
        ({ limit = 50 }) => {
            if (isSuperadmin && selectedTenantId) {
                const base = `/api/tenants/${encodeURIComponent(selectedTenantId)}/chat-history`;
                const qs = new URLSearchParams({ limit: String(limit) });
                if (logsCursor) qs.set('cursor', String(logsCursor)); // only if your backend supports it
                return `${base}?${qs.toString()}`;
            }
            const base = `/api/chat-history`;
            const qs = new URLSearchParams({ limit: String(limit) });
            if (logsCursor) qs.set('cursor', String(logsCursor));  // harmless if server ignores
            return `${base}?${qs.toString()}`;
        },
        [isSuperadmin, selectedTenantId, logsCursor]
    );

    const buildMsgsUrl = useCallback(
        ({ conversationId, limit = 1000 }) => {
            if (isSuperadmin && selectedTenantId) {
                return `/api/tenants/${encodeURIComponent(selectedTenantId)}/chat-history/${encodeURIComponent(
                    conversationId
                )}?limit=${limit}`;
            }
            return `/api/chat-history/${encodeURIComponent(conversationId)}?limit=${limit}`;
        },
        [isSuperadmin, selectedTenantId]
    );

    // ----- Error handler
    const handleAxiosError = useCallback(
        (err, fallbackMsg) => {
            if (axios.isCancel(err)) return;
            const status = err?.response?.status;
            if (status === 401) {
                setError('Your session expired. Please sign in again.');
                logout();
            } else if (status === 403) {
                setError("You don't have permission to access this resource.");
            } else {
                setError(fallbackMsg);
            }
        },
        [logout]
    );

    // ----- Normalizers (keep yours)
    const normalizeLogs = (rows) =>
        rows.map((r) => ({
            conversationId: r.conversationId ?? r.conversation_id,
            createdAt: r.createdAt ?? r.created_at,
            title: r.title ?? r.conversation_title ?? null,
            lastMessageAt: r.lastMessageAt ?? r.last_message_at ?? null,
            messageCount: r.messageCount ?? r.message_count ?? null,
        }));

    const normalizeMessages = (rows) =>
        rows.map((m) => ({
            type: m.type,
            from: m.from ?? m.sender ?? m.role,
            agentName: m.agentName ?? m.agent_name ?? null,
            text: m.text ?? m.content ?? '',
            timestamp: m.timestamp ?? m.created_at,
            event: m.event ?? null,
        }));

    // ----- Fetch logs (first page or "load more")
    const fetchLogs = useCallback(
        async (opts = { reset: false }) => {
            if (!token) return;

            if (logsAbortRef.current) logsAbortRef.current.abort();
            logsAbortRef.current = new AbortController();

            try {
                if (opts.reset) {
                    setLoading(true);
                    setError('');
                } else {
                    setLoadingMore(true);
                }

                const url = buildListUrl({ limit: 50 });
                const res = await api.current.get(url, { signal: logsAbortRef.current.signal });

                // Accept both array and { items, nextCursor }
                const payload = Array.isArray(res.data) ? { items: res.data, nextCursor: null } : res.data || {};
                const batch = normalizeLogs(Array.isArray(payload.items) ? payload.items : payload.items ?? []);
                const nextCursor = payload.nextCursor ?? null;

                if (opts.reset) {
                    setLogs(batch);
                } else {
                    setLogs((prev) => [...prev, ...batch]);
                }

                // If the server gave us nextCursor, use it; otherwise stop pagination.
                setHasMoreLogs(Boolean(nextCursor) && batch.length > 0);
                setLogsCursor(nextCursor);

            } catch (err) {
                handleAxiosError(err, 'Could not load chat archives. Please try again later.');
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [token, buildListUrl, handleAxiosError]
    );

    // Reset & load on auth/tenant changes
    useEffect(() => {
        if (!token) {
            setLoading(false);
            setLogs([]);
            setSelectedLog(null);
            setMessages([]);
            setHasMoreLogs(true);
            setLogsCursor(null);
            return;
        }
        setLogs([]);
        setHasMoreLogs(true);
        setLogsCursor(null);
        fetchLogs({ reset: true });
        return () => {
            if (logsAbortRef.current) logsAbortRef.current.abort();
        };
    }, [token, fetchLogs, selectedTenantId, isSuperadmin]);

    // ----- Fetch one conversation
    const fetchLogContent = async (conversationId) => {
        if (!token) return;

        if (msgsAbortRef.current) msgsAbortRef.current.abort();
        msgsAbortRef.current = new AbortController();

        setLoadingMessages(true);
        setSelectedLog(conversationId);
        setError('');

        try {
            const url = buildMsgsUrl({ conversationId, limit: 1000 });
            const res = await api.current.get(url, { signal: msgsAbortRef.current.signal });
            const rows = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
            setMessages(normalizeMessages(rows));
        } catch (err) {
            handleAxiosError(err, 'Could not load the selected conversation.');
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        return () => {
            if (msgsAbortRef.current) msgsAbortRef.current.abort();
        };
    }, []);

    // ----- Render
    if (isLoadingAuth) return <p>Loading...</p>;

    if (!token) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                Please sign in to view your chat history.
            </div>
        );
    }

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

                <div className="flex-1 overflow-y-auto" role="list" aria-label="Chat archives">
                    {loading ? (
                        <p className="p-4 text-gray-400">Loading archives...</p>
                    ) : logs.length > 0 ? (
                        <>
                            {logs.map((log) => {
                                const id = log.conversationId;
                                const label = log.title || `Chat: …${String(id).slice(-12)}`;
                                return (
                                    <button
                                        key={id}
                                        onClick={() => !loadingMessages && fetchLogContent(id)}
                                        disabled={loadingMessages}
                                        className={`w-full text-left p-4 border-b border-zinc-800 cursor-pointer transition-colors ${selectedLog === id ? 'bg-[#16a085]/20' : 'hover:bg-zinc-800'
                                            } ${loadingMessages ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        role="listitem"
                                        aria-current={selectedLog === id}
                                    >
                                        <p className={`font-semibold truncate ${selectedLog === id ? 'text-white' : 'text-gray-300'}`}>
                                            {label}
                                        </p>
                                        {log.lastMessageAt && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Updated {new Date(log.lastMessageAt).toLocaleString()}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}

                            {hasMoreLogs && (
                                <button
                                    onClick={() => fetchLogs({ reset: false })}
                                    disabled={loadingMore}
                                    className="w-full p-3 text-sm text-[#16a085] hover:bg-zinc-800 border-t border-zinc-800"
                                    aria-label="Load more archives"
                                >
                                    {loadingMore ? 'Loading…' : 'Load more'}
                                </button>
                            )}
                        </>
                    ) : (
                        <p className="p-4 text-gray-500 text-center mt-4">No chat history found for your account.</p>
                    )}
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 h-full flex flex-col bg-zinc-900">
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
                            if (msg.type === 'event') {
                                return (
                                    <div key={index} className="text-center my-4">
                                        <span className="text-xs text-gray-400 bg-zinc-800 px-3 py-1 rounded-full font-medium">
                                            Event: {msg.event} at {new Date(msg.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                );
                            }
                            const isAgent = msg.from === 'agent';
                            return (
                                <div
                                    key={index}
                                    className={`flex items-end gap-3 max-w-xl ${isAgent ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}
                                >
                                    <div
                                        className={`p-3 rounded-xl ${isAgent ? 'bg-[#16a085] text-white' : 'bg-zinc-800 text-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-baseline gap-2">
                                            <p className="font-bold text-sm">{isAgent ? msg.agentName || 'Agent' : 'User'}</p>
                                        </div>
                                        <p className="mt-1 text-sm whitespace-pre-wrap">{msg.text}</p>
                                        <p className="text-xs opacity-60 text-right mt-2">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
