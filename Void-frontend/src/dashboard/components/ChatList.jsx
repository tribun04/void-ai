import React from 'react';
import { useChat } from '../context/ChatProvider';
import { FaInbox } from 'react-icons/fa';

export function ChatList() {
  // We use our custom hook to get the state and functions we need.
  const { requests, selectChat, activeChat } = useChat();

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header of the sidebar */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <FaInbox className="mr-3 text-gray-500" />
          Inbox
          <span className="ml-2 bg-blue-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
            {requests.length}
          </span>
        </h2>
      </div>

      {/* List of incoming chats */}
      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No new chat requests.</p>
            <p className="text-sm">You will be notified here.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.userId}
              onClick={() => selectChat(req)}
              // We highlight the chat if it's the currently active one (though it will be removed on click)
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors
                ${activeChat?.userId === req.userId ? 'bg-blue-100' : 'hover:bg-gray-100'}`
              }
            >
              <div className="flex justify-between items-center">
                {/* For a bank, using a masked ID is better than a phone number */}
                <p className="font-semibold text-gray-900">User ID: ...{req.userId.slice(-6)}</p>
                <p className="text-xs text-gray-400">{new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <p className="text-sm text-gray-600 truncate mt-1">
                {req.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}