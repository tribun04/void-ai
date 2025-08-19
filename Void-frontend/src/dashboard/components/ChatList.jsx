import React, { useMemo } from 'react';
import { useChat } from '../context/ChatProvider';
import { FaInbox } from 'react-icons/fa';

export function ChatList() {
  const { requests = [], selectChat, activeChat } = useChat();

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  const formatTime = (ts) => {
    if (!ts) return '--:--';
    // Normalize seconds → ms if needed
    const n = Number(ts);
    const ms = n < 1e12 ? n * 1000 : n; // naive but effective
    const d = new Date(isNaN(n) ? ts : ms); // accept ISO strings too
    return isNaN(d.getTime()) ? '--:--' : timeFmt.format(d);
  };

  const maskTail = (id) => {
    const s = String(id || '');
    const tail = s.slice(-6);
    return (tail || '').padStart(6, '•');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <FaInbox className="mr-3 text-gray-500" />
          Inbox
          <span className="ml-2 bg-blue-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
            {Array.isArray(requests) ? requests.length : 0}
          </span>
        </h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {(!requests || requests.length === 0) ? (
          <div className="p-6 text-center text-gray-500">
            <p>No new chat requests.</p>
            <p className="text-sm">You will be notified here.</p>
          </div>
        ) : (
          requests.map((req) => {
            const isActive = activeChat?.id
              ? activeChat.id === req.id
              : activeChat?.userId === req.userId;

            return (
              <button
                key={req.id ?? `${req.userId || 'u'}-${req.timestamp || 't'}`}
                onClick={() => selectChat?.(req)}
                className={`w-full text-left p-4 border-b border-gray-100 cursor-pointer transition-colors focus:outline-none
                  ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                aria-pressed={!!isActive}
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-900">
                    User ID: …{maskTail(req.userId)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTime(req.timestamp)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {req.message ?? ''}
                </p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
