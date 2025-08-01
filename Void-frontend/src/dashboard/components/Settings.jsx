import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// A list of common timezones for the dropdown.
const timezones = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 
  'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo',
];

// --- Reusable, Branded Settings Card ---
// This keeps the code clean and ensures all setting sections look identical.
const SettingsCard = ({ title, children }) => (
    <div className="bg-zinc-900 rounded-xl shadow-lg border border-zinc-800">
        <h2 className="text-xl font-bold text-white p-6 border-b border-zinc-700">
            {title}
        </h2>
        <div className="p-6">
            {children}
        </div>
    </div>
);

const Settings = () => {
    const [profileData, setProfileData] = useState({ name: '', email: '' });
    const [workspaceData, setWorkspaceData] = useState({ timezone: '' });
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '', newPassword: '', confirmNewPassword: ''
    });
    const [emailData, setEmailData] = useState({
        newEmail: '', currentPassword: ''
    });

    // --- Data Fetching and Handlers (No changes to logic) ---
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Assuming you have set up an Axios instance with the auth token
                const res = await axios.get('/api/settings');
                setProfileData(res.data.profile);
                setWorkspaceData(res.data.workspace);
            } catch (error) {
                console.error('Failed to fetch settings:', error);
                showFeedback('Failed to load settings.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback({ message: '', type: '' }), 4000);
    };

    const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
    const handleWorkspaceChange = (e) => setWorkspaceData({ ...workspaceData, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    const handleEmailChange = (e) => setEmailData({ ...emailData, [e.target.name]: e.target.value });

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/settings/profile', { name: profileData.name });
            showFeedback('Profile updated successfully!', 'success');
        } catch (error) {
            showFeedback(error.response?.data?.message || 'Failed to update profile.', 'error');
        }
    };
    
    const handleWorkspaceSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/settings/workspace', { timezone: workspaceData.timezone });
            showFeedback('Workspace settings updated!', 'success');
        } catch (error) {
            showFeedback(error.response?.data?.message || 'Failed to update workspace.', 'error');
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            showFeedback('New passwords do not match.', 'error');
            return;
        }
        try {
            await axios.put('/api/settings/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            showFeedback('Password updated successfully!', 'success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (error) {
            showFeedback(error.response?.data?.message || 'Failed to update password.', 'error');
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put('/api/settings/email', emailData);
            showFeedback(res.data.message, 'success');
            setEmailData({ newEmail: '', currentPassword: '' });
            setProfileData({...profileData, email: emailData.newEmail });
        } catch (error) {
            showFeedback(error.response?.data?.message || 'Failed to update email.', 'error');
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-gray-400">Loading Settings...</div>;
    }

    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-bold text-white">Settings</h1>

            {feedback.message && (
                <div className={`flex items-center gap-3 p-4 rounded-lg font-semibold ${
                    feedback.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                    {feedback.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                    {feedback.message}
                </div>
            )}
            
            {/* Using a responsive two-column grid for better layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: General Settings */}
                <div className="space-y-10">
                    <SettingsCard title="My Profile">
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Full Name</label>
                                <input type="text" name="name" value={profileData.name} onChange={handleProfileChange} className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Email Address</label>
                                <input type="email" name="email" value={profileData.email} disabled className="w-full px-4 py-2 bg-zinc-800/50 text-gray-400 rounded-md border border-zinc-700 cursor-not-allowed"/>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="px-6 py-2 bg-[#16a085] text-white font-bold rounded-md hover:bg-[#138f75] transition-colors">Save Profile</button>
                            </div>
                        </form>
                    </SettingsCard>

                    <SettingsCard title="Workspace">
                        <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Timezone</label>
                                <select name="timezone" value={workspaceData.timezone} onChange={handleWorkspaceChange} className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]">
                                    {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="px-6 py-2 bg-[#16a085] text-white font-bold rounded-md hover:bg-[#138f75] transition-colors">Save Workspace</button>
                            </div>
                        </form>
                    </SettingsCard>
                </div>

                {/* Right Column: Security Settings */}
                <div className="space-y-10">
                    <SettingsCard title="Change Password">
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Current Password</label>
                                <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">New Password</label>
                                <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Confirm New Password</label>
                                <input type="password" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={handlePasswordChange} className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]" required />
                            </div>
                             <div className="pt-2">
                                <button type="submit" className="px-6 py-2 bg-[#16a085] text-white font-bold rounded-md hover:bg-[#138f75] transition-colors">Update Password</button>
                            </div>
                        </form>
                    </SettingsCard>
                    
                    <SettingsCard title="Change Login Email">
                        <form onSubmit={handleEmailSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">New Email Address</label>
                                <input type="email" name="newEmail" value={emailData.newEmail} onChange={handleEmailChange} className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]" required />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-400 mb-2">Confirm with Current Password</label>
                                <input type="password" name="currentPassword" value={emailData.currentPassword} onChange={handleEmailChange} className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085]" required />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="px-6 py-2 bg-[#16a085] text-white font-bold rounded-md hover:bg-[#138f75] transition-colors">Update Email</button>
                            </div>
                        </form>
                    </SettingsCard>
                </div>
            </div>
        </div>
    );
};

export default Settings;