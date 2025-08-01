import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useChat } from '../context/ChatProvider';
import { ChatWindow } from '../components/ChatWindow';
import { InboxPanel } from '../components/InboxPanel';
import { ActiveConversationsPanel } from '../components/ActiveConversationsPanel';
import { FaSignOutAlt, FaInbox, FaBars } from 'react-icons/fa';
import { ApiTokenUsage } from '../../components/ApiTokenUsage';

function AgentSidebarContent({ user, logout, requests }) {
    return (
        <>
            {/* Header with user avatar and logout */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    {/* 1. User avatar is now branded with your accent color */}
                    <div className="w-10 h-10 bg-[#16a085] rounded-full text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
    <h2 className="...">{user?.fullName}</h2> {/* ✅ CHANGE name to fullName */}
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold truncate text-white">{user?.name}</h2>
                        {/* 2. "Online" status uses a standard green for better UX */}
                        <p className="text-xs text-green-400 font-semibold">Online</p>
                    </div>
                </div>
                <button onClick={logout} className="p-2 rounded-full text-gray-400 hover:text-red-500 flex-shrink-0" title="Log Out"><FaSignOutAlt /></button>
            </div>
            
            {/* Inbox header */}
            <div className="p-3 border-b border-zinc-800">
                <div className="w-full flex items-center gap-3 p-2 rounded-lg text-gray-200 font-semibold bg-zinc-800">
                    {/* 3. Inbox icon is now branded */}
                    <FaInbox className="text-[#16a085]" />
                    <span>Inbox</span>
                    {/* 4. Notification count remains red for standard UX (high-priority alert) */}
                    {requests.length > 0 && (
                        <span className="ml-auto text-xs font-bold text-white bg-red-600 rounded-full h-5 w-5 flex items-center justify-center">{requests.length}</span>
                    )}
                </div>  
            </div>
            
            {/* The InboxPanel component itself will be scrollable */}
            <div className="flex-1 overflow-y-auto">
                <InboxPanel />
            </div>
        </>
    );
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { requests } = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // 5. All backgrounds and borders are updated to the consistent "Void AI" zinc theme
    <div className="flex h-screen bg-[#161616] font-sans text-gray-200">
      
      {/* --- MOBILE OVERLAY & SIDEBAR --- */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 z-30 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <aside className={`fixed inset-y-0 left-0 z-40 w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col transform transition-transform lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <AgentSidebarContent user={user} logout={logout} requests={requests} />
      </aside>

      {/* --- DESKTOP SIDEBAR (Static) --- */}
      <aside className="w-80 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 hidden lg:flex flex-col">
        <AgentSidebarContent user={user} logout={logout} requests={requests} />
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar for Mobile */}
        <header className="p-2 border-b border-zinc-800 bg-zinc-900 flex items-center lg:hidden">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md text-gray-300 hover:bg-zinc-800" aria-label="Open Menu">
              <FaBars />
            </button>
        </header>
        
        {/* On mobile, ActiveChats is vertical. On desktop, it's horizontal. */}
        <div className="lg:hidden">
            <ActiveConversationsPanel />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
             <div className="hidden lg:block">
                <ActiveConversationsPanel />
            </div>
            <ChatWindow />
        </div>
      </div>
    </div>
  );
}