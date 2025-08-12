// src/pages/SuperadminDashboardPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { AgentManagement } from '../components/AgentManagement';
import { ChatHistoryViewer } from '../components/ChatHistoryViewer';
import { AITraining } from '../components/AITraining';
import { Integrations } from '../components/Integrations';
import { VoipIntegrations } from '../components/VoipIntegrations';
import { OverviewDashboard } from '../components/OverviewDashboard';
import Settings from '../components/Settings';
import {
  FaPhoneAlt, FaUsers, FaSignOutAlt, FaHistory, FaBrain, FaShareAlt,
  FaTachometerAlt, FaBars, FaTimes, FaCog
} from 'react-icons/fa';

// --- COMPONENT 1: Rebranded "Void AI" Logo ---
// Now uses your actual logo image and new accent color.
const VoidBrandLogo = () => (
  <div className="flex items-center gap-3">
    {/* 1. Replaced the temporary "V" with your actual logo image. */}
    <img src="/void.png" alt="Void AI Logo" className="h-10 w-auto" />
    <div>
      <h1 className="font-bold text-white text-lg leading-tight">Void AI</h1>
      {/* 2. Used your new accent color for the sub-title. */}
      <p className="text-xs text-[#16a085] font-semibold">Superadmin Panel</p>
    </div>
  </div>
);

// --- COMPONENT 2: Rebranded Sidebar ---
// Updated with your brand's color palette.
const Sidebar = ({ user, activeView, setActiveView, onLogout, closeSidebar }) => {

  const navItems = [
    { view: 'overview', label: 'Overview', icon: <FaTachometerAlt /> },
    { view: 'agents', label: 'User Management', icon: <FaUsers /> },
    { view: 'history', label: 'Conversation History', icon: <FaHistory /> },
    { view: 'ai_training', label: 'AI Knowledge Base', icon: <FaBrain /> },
    { view: 'integrations', label: 'Integrations', icon: <FaShareAlt /> },
    { view: 'settings', label: 'Settings', icon: <FaCog /> },
  ];

  return (
    // 3. Using a complementary dark color for the sidebar against the main background.
    <div className="flex flex-col h-full bg-zinc-900 text-gray-300">
      {/* Header Section */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <VoidBrandLogo />
        <button onClick={closeSidebar} className="p-2 text-gray-400 hover:text-white lg:hidden">
          <FaTimes />
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navItems.map(item => (
          <a key={item.view} href="#"
            onClick={(e) => { e.preventDefault(); setActiveView(item.view); closeSidebar(); }}
            // 4. Updated the active item to use your brand's accent color.
            // The hover state is now a more fitting darker gray.
            className={`flex items-center p-3 rounded-lg transition-colors duration-200 font-semibold ${activeView === item.view
              ? 'bg-[#16a085] text-white shadow-md'
              : 'hover:bg-zinc-800'
              }`}>
            <span className="mr-4 w-5 text-center text-lg">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      {/* User Profile & Logout Section */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          {/* Display the admin's avatar with their initials */}
          <div className="w-10 h-10 rounded-full bg-[#16a085] flex items-center justify-center font-bold text-lg text-white">
            {user?.fullName?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <p className="font-semibold text-sm text-white">{user?.fullName || 'Admin'}</p>
          </div>
        </div>
        {/* Logout button */}
        <button onClick={onLogout} className="w-full flex items-center justify-center p-3 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-semibold transition-colors">
          <FaSignOutAlt className="mr-2" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

// --- COMPONENT 3: The Main Dashboard Page (The Controller) ---
export function SuperadminDashboardPage() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const viewTitles = {
    overview: 'Mission Control Overview',
    agents: 'User & Role Management',
    history: 'Global Conversation History',
    ai_training: 'AI Knowledge Base & Training',
    integrations: 'Channel Integrations (WhatsApp, Facebook)',
    settings: 'Platform Settings',
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview': return <OverviewDashboard setActiveView={setActiveView} />;
      case 'agents': return <AgentManagement />;
      case 'history': return <ChatHistoryViewer />;
      case 'ai_training': return <AITraining />;
      case 'integrations': return <Integrations />;
      case 'voipintegrations': return <VoipIntegrations />;
      case 'settings': return <Settings />;
      default: return <OverviewDashboard />;
    }
  };

  return (
    // 6. Set the main page background to your primary brand color.
    <div className="flex h-screen bg-[#161616] font-sans text-gray-200">
      {/* Mobile Overlay */}
      <div className={`fixed inset-0 bg-black bg-opacity-60 z-30 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* Sidebar for Mobile (sliding) and Desktop (fixed) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:w-72 lg:flex-shrink-0`}>
        <Sidebar
          user={user}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={logout}
          closeSidebar={() => setIsSidebarOpen(false)}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 7. Updated the header and borders to match the new dark theme. */}
        <header className="bg-zinc-900 shadow-md p-4 flex items-center sticky top-0 z-20 border-b border-zinc-800">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 mr-3 text-gray-300 rounded-md hover:bg-zinc-800 lg:hidden">
            <FaBars />
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-white">{viewTitles[activeView]}</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}