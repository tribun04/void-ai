// src/components/ActiveConversationsPanel.jsx

import React from 'react';
import { useChat } from '../context/ChatProvider';
import { FaWhatsapp, FaGlobe, FaFacebookMessenger, FaTimes } from 'react-icons/fa';

// --- Rebranded ChannelIcon Helper ---
// We keep the platform-specific colors for good UX, but update the default icon.
const ChannelIcon = ({ channel, className }) => {
  const baseClass = `flex-shrink-0 ${className}`;
  if (channel === 'whatsapp') return <FaWhatsapp className={`${baseClass} text-green-400`} />;
  if (channel === 'messenger') return <FaFacebookMessenger className={`${baseClass} text-blue-400`} />;
  // 1. Default/Web chat icon updated to match the new theme.
  return <FaGlobe className={`${baseClass} text-zinc-400`} />;
};

// This helper function is well-written and requires no changes.
const formatUserId = (id, channel) => {
  if (!id || typeof id !== 'string') {
    return 'Unknown User';
  }
  if (channel === 'whatsapp' && id.includes('@')) {
    return id.split('@')[0];
  }
  if (channel === 'messenger' && id.length > 10) {
    return `User...${id.slice(-4)}`;
  }
  return id.length > 15 ? `User...${id.slice(-4)}` : id;
};


export function ActiveConversationsPanel() {
  const { conversations, activeConversation, viewConversation, endChat } = useChat();

  return (
    // 2. Main container is now themed to be consistent with the rest of the dashboard.
    <div className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800">
      <div className="flex lg:flex-row flex-col p-2 lg:overflow-x-auto">
        {conversations.length === 0 ? (
          // 3. "Empty" state text color updated.
          <div className="px-4 py-3 text-sm text-zinc-500">No active chats.</div>
        ) : (
          conversations.map((convo) => (
            <div
              key={convo.id || Math.random()}
              onClick={() => convo.id && viewConversation(convo.id)}
              // 4. Active and hover states are now fully rebranded.
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors flex-shrink-0 lg:border-b-2 mb-1 lg:mb-0 min-w-0 lg:w-48 ${
                activeConversation?.id === convo.id 
                  ? 'border-[#16a085] bg-zinc-800' // Branded highlight for the active chat
                  : 'border-transparent hover:bg-zinc-800'
              }`}
            >
              <ChannelIcon channel={convo.channel} className="text-lg" />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">
                  {formatUserId(convo.id, convo.channel)}
                </p>
                <p className="text-xs text-zinc-400 truncate lg:hidden">
                  {convo.messages && convo.messages.length > 0 
                    ? convo.messages[convo.messages.length - 1]?.text 
                    : 'Chat started'
                  }
                </p>
              </div>
              
              {/* 5. Unread count badge is now red for universal notification UX. */}
              {convo.unreadCount > 0 && (
                 <span className="ml-1 text-xs font-bold text-white bg-red-600 rounded-full w-5 h-5 flex items-center justify-center">
                    {convo.unreadCount}
                </span>
              )}

              {/* The close button UX is good, no changes needed. */}
              <button 
                onClick={(e) => { e.stopPropagation(); convo.id && endChat(convo.id); }}
                className="ml-2 text-zinc-500 hover:text-white rounded-full p-1.5 hover:bg-red-600/80 transition-colors"
                title="End this chat"
              >
                <FaTimes size={12}/>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}