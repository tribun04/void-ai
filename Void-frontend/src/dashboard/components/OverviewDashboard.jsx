import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { FaUsers, FaComments, FaBrain, FaShareAlt, FaPhoneAlt, FaGlobe, FaWhatsapp, FaUserPlus, FaBook, FaBolt } from 'react-icons/fa';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

// --- Reusable Components (Rebranded) ---

// 1. StatCards now use a complementary palette that works with your brand accent.
const StatCard = ({ icon, title, value, colorClass, isLoading }) => {
    console.log(`[StatCard] Title: ${title}, Value: ${value}, isLoading: ${isLoading}`);
    return (
        <div className="bg-zinc-900 p-6 rounded-xl flex items-center gap-5 border border-zinc-800 shadow-lg">
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-2xl ${colorClass}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                {isLoading
                    ? <div className="w-20 h-8 mt-1 bg-zinc-800 rounded-md animate-pulse"></div>
                    : <p className="text-3xl font-bold text-white">{value}</p>
                }
            </div>
        </div>
    );
}

// 2. IntegrationCard now uses your brand's accent color for the icon.
const IntegrationCard = ({ icon, name, description }) => (
    <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-zinc-800 text-[#16a085] text-xl rounded-lg">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-white">{name}</h4>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    </div>
);

// 3. ActivityItem borders updated to match the new dark theme.
const ActivityItem = ({ activity }) => (
    <div className="flex items-start gap-3 py-2 border-b border-zinc-800 last:border-b-0">
        <p className="text-xs text-gray-500 w-20 flex-shrink-0">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
        </p>
        <div className="flex-grow">
            <p className="text-sm text-gray-300 font-semibold">{activity.type}</p>
            <p className="text-xs text-gray-400 truncate">{activity.detail}</p>
        </div>
    </div>
);

// 4. QuickActionButton now features your brand's accent color.
const QuickActionButton = ({ icon, text, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 p-3 bg-zinc-800/70 rounded-lg hover:bg-zinc-800 transition-colors">
        <span className="text-[#16a085]">{icon}</span>
        <span className="font-semibold text-gray-300">{text}</span>
    </button>
);


// --- MAIN COMPONENT ---
export function OverviewDashboard({ setActiveView }) {
    const { auth } = useAuth();
    const [stats, setStats] = useState({ users: 0, newToday: 0, intents: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [timeRange, setTimeRange] = useState('7d');
    const [recentActivity, setRecentActivity] = useState([]);
    const [topIntents, setTopIntents] = useState([]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!auth?.token) return;
            setIsLoading(true);
            try {
                const headers = { headers: { 'Authorization': `Bearer ${auth.token}` } };
                const results = await Promise.allSettled([
                    axios.get('/api/superadmin/users', headers),
                    axios.get('/api/superadmin/conversations/count-today', headers),
                    axios.get('/api/superadmin/ai-entries', headers),
                    axios.get(`/api/superadmin/chat-volume?range=${timeRange}`, headers),
                    axios.get('/api/superadmin/recent-activity', headers),
                    axios.get('/api/superadmin/top-intents', headers),
                ]);
                // 8. Ensured status is fulfilled before extracting value to prevent errors.
                const [usersRes, newTodayRes, intentsRes, chartVolumeRes, activityRes, topIntentsRes] = results;

                // Log the results
                console.log("Users Result:", usersRes);
                console.log("New Today Result:", newTodayRes);
                console.log("Intents Result:", intentsRes);
                console.log("Chat Volume Result:", chartVolumeRes);
                console.log("Activity Result:", activityRes);
                console.log("Top Intents Result:", topIntentsRes);
                //Setting these to just return the values.
                setStats({
                    users: usersRes?.status === 'fulfilled' ? usersRes.value.data.length : 0,
                    newToday: newTodayRes?.status === 'fulfilled' ? newTodayRes.value.data.count : 0,
                    intents: intentsRes?.status === 'fulfilled' ? intentsRes.value.data.length : 0
                });
                if (chartVolumeRes?.status === 'fulfilled') setChartData(chartVolumeRes.value.data);
                if (activityRes?.status === 'fulfilled') setRecentActivity(activityRes.value.data);
                if (topIntentsRes?.status === 'fulfilled') setTopIntents(topIntentsRes.value.data);
            } catch (error) {
                console.error("Error fetching data:", error);
                // Optionally set some error state here
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [auth, timeRange]);

    // 5. TimeRange buttons are now branded.
    const TimeRangeButton = ({ range, label }) => (
        <button
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${timeRange === range
                ? 'bg-[#16a085] text-white'
                : 'bg-zinc-800 text-gray-300 hover:bg-zinc-700'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-8">
            {/* Row 1: Actionable Stat Cards with a new color palette */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<FaUsers />} title="Managed Users" value={stats.users} colorClass="bg-teal-600" isLoading={isLoading} />
                <StatCard icon={<FaComments />} title="New Conversations (Today)" value={stats.newToday} colorClass="bg-purple-600" isLoading={isLoading} />
                <StatCard icon={<FaBrain />} title="AI Knowledge Entries" value={stats.intents} colorClass="bg-pink-600" isLoading={isLoading} />
            </div>

            {/* Row 2: Chart and Live Activity - containers updated */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 6. All main containers use the new dark theme */}
                <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Conversation Volume</h2>
                        <div className="flex items-center gap-2">
                            <TimeRangeButton range="7d" label="7 Days" />
                            <TimeRangeButton range="30d" label="30 Days" />
                        </div>
                    </div>
                    <div className="w-full h-72">
                        <ResponsiveContainer>
                            {/* 7. Recharts chart is now fully rebranded */}
                            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16a085" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="#16a085" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                                <YAxis stroke="#9CA3AF" fontSize={12} allowDecimals={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" strokeOpacity={0.3} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '0.5rem' }} />
                                <Area type="monotone" dataKey="conversations" stroke="#16a085" strokeWidth={2} fillOpacity={1} fill="url(#chartGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="flex-grow space-y-2 pr-2 -mr-2 overflow-y-auto">
                        {isLoading
                            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-zinc-800 rounded-md animate-pulse"></div>)
                            : recentActivity.length > 0
                                ? recentActivity.map(item => <ActivityItem key={item.id} activity={item} />)
                                : <p className="text-sm text-gray-500 text-center pt-8">No recent activity.</p>
                        }
                    </div>
                </div>
            </div>

            {/* Row 3: Integrations and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Available Integrations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <IntegrationCard icon={<FaGlobe />} name="Website Widget" description="Deploy the chat agent on your site." />
                        <IntegrationCard icon={<FaPhoneAlt />} name="Voice Gateway" description="Enable real-time voice conversations." />
                        <IntegrationCard icon={<FaWhatsapp />} name="WhatsApp Business" description="Connect with customers on WhatsApp." />
                        <IntegrationCard icon={<FaShareAlt />} name="Facebook Messenger" description="Integrate with your Facebook pages." />
                    </div>
                </div>
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <QuickActionButton icon={<FaUserPlus />} text="Manage Users" onClick={() => setActiveView('agents')} />
                        <QuickActionButton icon={<FaBook />} text="Train AI Knowledge" onClick={() => setActiveView('ai_training')} />
                        <QuickActionButton icon={<FaBolt />} text="View All Integrations" onClick={() => setActiveView('integrations')} />
                    </div>
                </div>
            </div>
        </div>
    );
}
    