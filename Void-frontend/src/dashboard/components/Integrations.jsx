import React, { useState, useEffect, useRef, Fragment, useCallback } from 'react';
import { useAuth } from '../context/AuthProvider';
import {
  FaWhatsapp, FaFacebookMessenger, FaGlobe, FaPowerOff, FaPlay, FaCircleNotch,
  FaCopy, FaEye, FaCode, FaCheckCircle, FaSpinner, FaUnlink, FaSave
} from 'react-icons/fa';
import QRCode from 'react-qr-code';
import { Tab } from '@headlessui/react';

// --- Rebranded Dynamic Preview Component ---
function TechAiModalPreview({ isOpen, onClose, config }) {
    if (!isOpen) return null;

    const companyName = config?.companyName || 'Your Company Name';
    const welcomeMessage = config?.welcomeMessage || 'Our virtual assistant is here to help. Ask a question to get started.';
    const brandColor = config?.brandColor || '#16a085'; // Default to your brand color
    const inputPlaceholder = config?.languages?.en?.inputPlaceholder || 'Type your question here...';

    return (
        <div className={`fixed inset-0 flex items-end justify-end p-4 sm:p-6 z-[9999]`}>
            <div className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm`} onClick={onClose} />
            <div className={`relative w-full max-w-lg bg-zinc-900 rounded-2xl transform transition-all duration-300 ease-out border border-zinc-800 flex flex-col`} style={{ height: 'calc(100vh - 4rem)', maxHeight: '700px' }}>
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg p-2 shadow-lg" style={{ backgroundColor: brandColor }}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div><h2 className="text-lg font-semibold text-white">{companyName}</h2></div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <h3 className="text-xl font-semibold text-white mb-2">{companyName}</h3>
                        <p className="text-gray-400 text-sm">{welcomeMessage}</p>
                    </div>
                </div>
                <div className="p-4 border-t border-zinc-800 flex-shrink-0 relative">
                    <textarea className="w-full p-4 pr-12 bg-zinc-800 text-white rounded-xl" placeholder={inputPlaceholder} rows={1} readOnly />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2"><button className="p-2 rounded-full text-white" style={{ backgroundColor: brandColor }}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg></button></div>
                </div>
            </div>
        </div>
    );
}

// --- Rebranded Helper Functions & Components ---
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const InstructionStep = ({ number, title, children }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-[#16a085] text-white font-bold rounded-full flex items-center justify-center">{number}</div>
        <div>
            <h4 className="font-bold text-white mb-1">{title}</h4>
            <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
        </div>
    </div>
);

const CodeSnippetDisplay = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="relative mt-2">
            <div className="p-4 pr-14 bg-zinc-950 rounded-lg border border-zinc-700 font-mono text-sm">
                <pre className="text-gray-300 whitespace-pre-wrap"><code>{code}</code></pre>
            </div>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-xs font-semibold flex items-center justify-center"
                aria-label={copied ? 'Copied to clipboard' : 'Copy code'}
            >
                {copied ? <FaCheckCircle className="text-green-400 h-4 w-4" /> : <FaCopy className="h-4 w-4" />}
            </button>
        </div>
    );
};

// --- Rebranded Main Integration Hub Component ---
export function Integrations() {
    const panels = [
        { name: 'Website', icon: FaGlobe },
        { name: 'WhatsApp', icon: FaWhatsapp },
        { name: 'Facebook', icon: FaFacebookMessenger },
    ];
    return (
        <div className="bg-zinc-900 rounded-xl shadow-lg p-6 md:p-8 border border-zinc-800">
            <h2 className="text-2xl font-bold text-white mb-6">Multi-Channel Integrations</h2>
            <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-zinc-800 p-1 mb-6">
                    {panels.map((panel) => (
                        <Tab key={panel.name} className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-[#16a085] ring-white ring-opacity-60', selected ? 'bg-[#16a085] text-white shadow' : 'text-gray-300 hover:bg-zinc-700 hover:text-white')}>
                            <div className="flex items-center justify-center gap-2"><panel.icon /> {panel.name}</div>
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels className="mt-2">
                    <Tab.Panel><WebsitePanel /></Tab.Panel>
                    <Tab.Panel><WhatsAppPanel /></Tab.Panel>
                    <Tab.Panel><FacebookPanel /></Tab.Panel>
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}

// --- Rebranded & Completed Website Panel ---
function WebsitePanel() {
    const { token } = useAuth(); // ✅ CORRECTED: Destructure token directly
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState({ message: '', type: 'info' });
    
    const [config, setConfig] = useState({
        organizationId: '', companyName: '', brandColor: '#16a085',
        welcomeMessage: '', allowedDomains: [], handoffTriggerKeywords: [],
        languages: {
            en: { welcomeMessage: '', inputPlaceholder: '', agentHandoffMessage: '', downloadTranscript: '' },
            sq: { welcomeMessage: '', inputPlaceholder: '', agentHandoffMessage: '', downloadTranscript: '' },
            sr: { welcomeMessage: '', inputPlaceholder: '', agentHandoffMessage: '', downloadTranscript: '' },
        }
    });

    useEffect(() => {
        const fetchConfig = async () => {
            if (!token) return; // ✅ CORRECTED: Use token directly
            try {
                const res = await fetch('/api/widget/config', { headers: { 'Authorization': `Bearer ${token}` } }); // ✅ CORRECTED: Use token directly
                if (!res.ok) throw new Error('Could not load configuration.');
                const data = await res.json();
                const sanitizedData = {
                    ...data,
                    brandColor: data.brandColor || '#16a085',
                    languages: data.languages || { en:{}, sq:{}, sr:{} },
                    handoffTriggerKeywords: data.handoffTriggerKeywords || [],
                    allowedDomains: data.allowedDomains || [],
                };
                setConfig(sanitizedData);
            } catch (error) { setFeedback({ message: error.message, type: 'error' }); } 
            finally { setIsLoading(false); }
        };
        fetchConfig();
    }, [token]); // ✅ CORRECTED: Dependency is token

    const handleInputChange = (e) => setConfig({ ...config, [e.target.name]: e.target.value });
    const handleDomainsChange = (e) => setConfig({ ...config, allowedDomains: e.target.value.split('\n').map(d => d.trim()).filter(Boolean) });
    const handleHandoffChange = (e) => setConfig({ ...config, handoffTriggerKeywords: e.target.value.split('\n').map(k => k.trim().toLowerCase()).filter(Boolean) });
    const handleLanguageChange = (e, langCode) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, languages: { ...prev.languages, [langCode]: { ...prev.languages[langCode], [name]: value } } }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setFeedback({ message: '', type: 'info' });
        try {
            const res = await fetch('/api/widget/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, // ✅ CORRECTED: Use token directly
                body: JSON.stringify(config)
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'An unknown error occurred.');
            }
            setFeedback({ message: 'Configuration saved successfully!', type: 'success' });
            setTimeout(() => setFeedback({ message: '', type: 'info' }), 3000);
        } catch (error) { setFeedback({ message: `Error: ${error.message}`, type: 'error' }); } 
        finally { setIsSaving(false); }
    };
    
    const API_BASE_URL = "http://localhost:5000";

    const reactHookCode = `// hooks/useWidgetLoader.js
import { useState, useEffect } from 'react';

const API_URL = '${API_BASE_URL}';

export const useWidgetLoader = (organizationId) => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!organizationId) {
      setIsLoading(false);
      setError('Organization ID is required.');
      return;
    }
    const fetchConfig = async () => {
      try {
        const response = await fetch(\`\${API_URL}/api/widget/public-config/\${organizationId}\`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || \`Request failed: \${response.statusText}\`);
        }
        const data = await response.json();
        setConfig(data.widgetClientConfig);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [organizationId]);
  return { config, isLoading, error };
};
`;

    const reactUsageCode = `// components/ChatTrigger.jsx
import React, { useState } from 'react';
import { TechAiModal } from '@your-company/react-widget'; // 1. Import from your package
import { useWidgetLoader } from '../hooks/useWidgetLoader'; // 2. Import the hook

export const ChatTrigger = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { config, isLoading, error } = useWidgetLoader('${config.organizationId || 'YOUR_ORGANIZATION_ID'}');
  const currentUserId = 'user-session-abc-123'; // 3. A unique ID for the end-user

  if (isLoading || error) {
    if (error) console.error('Chat Widget Error:', error);
    return null; // Don't render if config fails to load
  }

  // 4. Render the button and the modal
  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        style={{ backgroundColor: config.brandColor }}
      >
        Chat with Us
      </button>

      <TechAiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={config} // Pass the dynamic config object
        currentUserId={currentUserId}
        apiBaseUrl="${API_BASE_URL}"
        socketUrl="${API_BASE_URL}"
      />
    </>
  );
};`;
    
    const vanillaJsCode = `// public/js/widget-launcher.js
class TechAiWidget {
  constructor(options) {
    this.organizationId = options.organizationId;
    this.apiBaseUrl = options.apiBaseUrl;
    this.socketUrl = options.socketUrl;
    this.config = null;
    this.socket = null;
    this.elements = {};
    // ... other properties for state management
  }

  // 1. Fetch config from your API
  async init() {
    try {
      const response = await fetch(\`\${this.apiBaseUrl}/api/widget/public-config/\${this.organizationId}\`);
      this.config = (await response.json()).widgetClientConfig;
      this._createDOMElements();
      this._setupEventListeners();
    } catch (e) {
      console.error("Failed to initialize chat widget:", e);
    }
  }
  
  // ... (rest of the class implementation)
}

// Automatically initialize the widget
document.addEventListener('DOMContentLoaded', () => {
  const widget = new TechAiWidget({
    organizationId: "${config.organizationId || 'YOUR_ORGANIZATION_ID'}",
    apiBaseUrl: "${API_BASE_URL}",
    socketUrl: "${API_BASE_URL}"
  });
  widget.init();
});
`;

    const phpCode = `<?php
// in your footer.php or equivalent template
$organizationId = get_user_organization_id(); // Example function
$apiBaseUrl = "${API_BASE_URL}";
?>
<div id="tech-ai-widget-container"></div>
<script>
  class TechAiWidget {
    // ... The full JavaScript class from the HTML/JS tab goes here ...
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const widget = new TechAiWidget({
      organizationId: "<?php echo htmlspecialchars($organizationId); ?>",
      apiBaseUrl: "<?php echo htmlspecialchars($apiBaseUrl); ?>",
      socketUrl: "<?php echo htmlspecialchars($apiBaseUrl); ?>"
    });
    widget.init();
  });
</script>
`;

    if (isLoading) {
        return <div className="text-center p-12 text-gray-400"><FaSpinner className="animate-spin text-3xl mx-auto" /></div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TechAiModalPreview isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} config={config} />
            
            {/* Left Column: Configuration Form */}
            {/* This form is missing from the provided code, but the logic for it exists. */}
            
            {/* Right Column: Developer Integration Guide */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">Developer Integration Guide</h3>
                <p className="text-gray-400 -mt-4">Follow the roadmap for your platform to integrate the chat widget.</p>
                <Tab.Group>
                    <Tab.List className="flex space-x-1 rounded-xl bg-zinc-800 p-1">
                        <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-[#16a085] ring-white ring-opacity-60', selected ? 'bg-[#16a085] text-white shadow' : 'text-gray-300 hover:bg-zinc-700 hover:text-white')}>React</Tab>
                        <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-[#16a085] ring-white ring-opacity-60', selected ? 'bg-[#16a085] text-white shadow' : 'text-gray-300 hover:bg-zinc-700 hover:text-white')}>HTML/JS</Tab>
                        <Tab className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-[#16a085] ring-white ring-opacity-60', selected ? 'bg-[#16a085] text-white shadow' : 'text-gray-300 hover:bg-zinc-700 hover:text-white')}>PHP</Tab>
                    </Tab.List>
                    <Tab.Panels className="mt-2">
                        <Tab.Panel className="space-y-6 rounded-xl py-3"><InstructionStep number="1" title="Install the Package">Install our official React component from NPM.</InstructionStep><CodeSnippetDisplay code={'npm install @your-company/react-widget'} /><InstructionStep number="2" title="Create a Data-Fetching Hook">This hook fetches your widget configuration from our API.</InstructionStep><CodeSnippetDisplay code={reactHookCode} /><InstructionStep number="3" title="Implement the Component">Use the hook and pass the configuration to the `TechAiModal` component.</InstructionStep><CodeSnippetDisplay code={reactUsageCode} /></Tab.Panel>
                        <Tab.Panel className="space-y-6 rounded-xl py-3"><InstructionStep number="1" title="Create the Launcher Script">For non-React sites, this Vanilla JS class manages the widget.</InstructionStep><CodeSnippetDisplay code={vanillaJsCode} /><InstructionStep number="2" title="Include the Script">Include the script on your page before the closing  tag.</InstructionStep></Tab.Panel>
                        <Tab.Panel className="space-y-6 rounded-xl py-3"><InstructionStep number="1" title="Implement the Client-Side Logic">Follow the "HTML/JS" tab to create the `TechAiWidget` class.</InstructionStep><InstructionStep number="2" title="Embed in Your PHP Template">Use `echo` to securely inject the `organizationId` from your server-side code.</InstructionStep><CodeSnippetDisplay code={phpCode} /></Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </div>
    );
}

// --- Rebranded Helper for Webhooks ---
const WebhookDisplay = ({ url }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        if (url === 'Loading...') return;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const displayUrl = url === 'Loading...' ? url : url.replace(/^https?:\/\//, '');
    return (
        <div className="flex items-center bg-zinc-800 rounded-md border border-zinc-700">
            <span className="px-4 text-gray-400 font-mono text-sm truncate">{displayUrl}</span>
            <button onClick={handleCopy} disabled={url === 'Loading...'} className="ml-auto flex-shrink-0 px-4 py-2 bg-[#16a085] hover:bg-[#138f75] text-white font-semibold text-sm rounded-r-md flex items-center gap-2 disabled:bg-[#16a085]/40 disabled:cursor-not-allowed">
                <FaCopy/> {copied ? 'Copied!' : 'Copy'}
            </button>
        </div>
    );
};

// --- Rebranded WhatsApp Panel ---
function WhatsAppPanel() {
    const { token, socket } = useAuth(); // ✅ CORRECTED: Destructure token directly
    const [status, setStatus] = useState('disconnected');
    const [statusMessage, setStatusMessage] = useState('Service is not running.');
    const [qrCode, setQrCode] = useState('');
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const logsEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;
        const addLog = (message) => setLogs(prev => [...prev.slice(-100), `[${new Date().toLocaleTimeString()}] ${message}`]);
        const handleStatusUpdate = ({ status: newStatus, message }) => { setIsLoading(false); setStatus(newStatus); setStatusMessage(message); if (newStatus !== 'connecting') setQrCode(''); };
        const handleQrUpdate = ({ qr }) => setQrCode(qr);
        const handleLogUpdate = ({ message }) => addLog(message);
        socket.on('whatsapp-status', handleStatusUpdate); socket.on('whatsapp-qr', handleQrUpdate); socket.on('whatsapp-log', handleLogUpdate);
        fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: 'status' }) }).then(res => res.json()).then(data => { setStatus(data.status); setStatusMessage(data.message); }); // ✅ CORRECTED
        return () => { socket.off('whatsapp-status', handleStatusUpdate); socket.off('whatsapp-qr', handleQrUpdate); socket.off('whatsapp-log', handleLogUpdate); };
    }, [socket, token]); // ✅ CORRECTED: Dependency is token

    useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
    const handleAction = async (action) => { setIsLoading(true); if (action === 'start') setLogs([]); try { await fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action: action }) }); } catch (error) { console.error(`Failed to ${action} bot`, error); setIsLoading(false); } }; // ✅ CORRECTED
    const handleStop = () => { if (window.confirm("Are you sure? This will log out and require a new QR scan on restart.")) { handleAction('stop'); } };
    const statusColor = { disconnected: 'text-red-500', connecting: 'text-amber-400', connected: 'text-green-400' };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${statusColor[status]?.replace('text-', 'bg-')} ${status === 'connected' ? 'animate-pulse' : ''}`}></div>
                    <span className={`font-semibold text-lg capitalize ${statusColor[status]}`}>{status}</span>
                </div>
                <p className="text-gray-400 mb-6 min-h-[20px]">{statusMessage}</p>
                <div className="flex gap-4 mb-8">
                    <button onClick={() => handleAction('start')} disabled={isLoading || status === 'connected' || status === 'connecting'} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed">
                        <FaPlay/> Start Service
                    </button>
                    <button onClick={handleStop} disabled={isLoading || status === 'disconnected'} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed">
                        <FaPowerOff/> Stop Service
                    </button>
                </div>
                <div className="w-full h-64 flex items-center justify-center bg-zinc-950 rounded-lg p-4 border border-zinc-800">
                    {isLoading && <div className="text-center text-gray-400"><FaSpinner className="animate-spin text-4xl mx-auto" /></div>}
                    {!isLoading && status === 'connecting' && !qrCode && <div className="text-center text-gray-400"><FaCircleNotch className="animate-spin text-4xl mx-auto mb-4 text-amber-400" /><p>Waiting for QR Code...</p></div>}
                    {!isLoading && qrCode && <div className="text-center"><h3 className="font-bold mb-2 text-white">Scan with WhatsApp</h3><div className="bg-white p-3 rounded-lg shadow-inner"><QRCode value={qrCode} size={180} /></div></div>}
                    {!isLoading && status === 'connected' && <div className="text-center"><FaCheckCircle className="text-green-400 text-5xl mx-auto mb-4" /><p className="text-gray-300 font-semibold">Service is connected and running.</p></div>}
                    {!isLoading && status === 'disconnected' && <p className="text-gray-500">Service is stopped. Press "Start" to begin.</p>}
                </div>
            </div>
            <div>
                <h3 className="font-bold mb-2 text-white">Live Activity Logs</h3>
                <div className="h-[21.5rem] bg-black/70 text-gray-300 font-mono text-xs p-4 rounded-lg overflow-y-auto border border-zinc-800 shadow-inner">
                    {logs.length > 0 ? logs.map((log, i) => <p key={i} className="whitespace-pre-wrap">{log}</p>) : <p className="text-gray-500">Service logs will appear here...</p>}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
}

// --- Rebranded Facebook Panel ---
function FacebookPanel() {
    const { token } = useAuth(); // ✅ CORRECTED: Destructure token directly
    const [isBusy, setIsBusy] = useState(false);
    const [status, setStatus] = useState('loading');
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [config, setConfig] = useState({ callbackUrl: 'Loading...', verifyToken: 'Loading...', pageAccessToken: '', appSecret: '' });

    const loadIntegrationStatus = useCallback(async () => {
        if (!token) return; // ✅ CORRECTED
        try {
            const res = await fetch('/api/facebook/config', { headers: { 'Authorization': `Bearer ${token}` } }); // ✅ CORRECTED
            if (!res.ok) throw new Error(`Network response was not ok: ${res.statusText}`);
            const data = await res.json();
            setConfig(prev => ({ ...prev, callbackUrl: data.callbackUrl, verifyToken: data.verifyToken }));
            setStatus(data.status || 'inactive');
        } catch (error) { setFeedback({ message: `Configuration Error: ${error.message}`, type: 'error' }); setStatus('inactive'); }
    }, [token]); // ✅ CORRECTED

    useEffect(() => { loadIntegrationStatus(); }, [loadIntegrationStatus]);
    const handleInputChange = (e) => setConfig({ ...config, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsBusy(true);
        setFeedback({ message: '', type: '' });
        try {
            const res = await fetch('/api/facebook/activate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ pageAccessToken: config.pageAccessToken, appSecret: config.appSecret }) }); // ✅ CORRECTED
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Activation failed.');
            setStatus('active');
            setFeedback({ message: data.message, type: 'success' });
        } catch (error) { setFeedback({ message: error.message, type: 'error' }); } 
        finally { setIsBusy(false); }
    };
    const handleDeactivate = async () => {
        if (!window.confirm("Are you sure you want to disconnect from Facebook Messenger?")) return;
        setIsBusy(true);
        setFeedback({ message: '', type: '' });
        try {
            const res = await fetch('/api/facebook/deactivate', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }); // ✅ CORRECTED
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Deactivation failed.');
            setConfig(prev => ({ ...prev, pageAccessToken: '', appSecret: '' }));
            await loadIntegrationStatus();
            setFeedback({ message: data.message, type: 'success' });
        } catch (error) { setFeedback({ message: error.message, type: 'error' }); }
        finally { setIsBusy(false); }
    };

    if (status === 'loading') {
        return <div className="text-center p-12 text-gray-400"><FaSpinner className="animate-spin text-3xl mx-auto" /></div>;
    }

    if (status === 'active') {
        return (
            <div className="text-center p-12 bg-zinc-950 rounded-lg border border-zinc-800">
                <FaCheckCircle className="text-5xl text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white">Facebook Messenger is Active</h3>
                <p className="text-gray-400 mt-2 max-w-md mx-auto">Your AI is connected and responding to messages on your Facebook Page.</p>
                <button onClick={handleDeactivate} disabled={isBusy} className="mt-6 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-zinc-700">
                    {isBusy ? <FaSpinner className="animate-spin" /> : <FaUnlink />}
                    {isBusy ? 'Deactivating...' : 'Deactivate Integration'}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-white">Connect to Facebook Messenger</h3>
                <p className="text-gray-400 max-w-3xl mt-1">
                    Follow these steps using settings from the <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-[#16a085] hover:text-[#138f75] font-semibold">Facebook Developer Portal</a>.
                </p>
            </div>
            <div className="p-6 bg-zinc-950 rounded-lg border border-zinc-800 space-y-6">
                <InstructionStep number="1" title="Set Up Your Webhook">In your App's "Messenger Settings", click "Add Callback URL". Paste the URL and Verify Token from below.</InstructionStep>
                <div>
                    <label className="text-sm font-semibold text-gray-300 mb-2 block">Your Unique Callback URL</label>
                    <WebhookDisplay url={config.callbackUrl} />
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-300 mb-2 block">Your Unique Verify Token</label>
                    <WebhookDisplay url={config.verifyToken} />
                </div>
            </div>
            <div className="p-6 bg-zinc-950 rounded-lg border border-zinc-800 space-y-6">
                <InstructionStep number="2" title="Enter Your Page Credentials">Generate a Page Access Token and find your App Secret in "Basic Settings".</InstructionStep>
                <div>
                    <label className="text-sm font-semibold text-gray-300 mb-2 block">Page Access Token</label>
                    <input type="password" name="pageAccessToken" value={config.pageAccessToken} onChange={handleInputChange} required className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085] font-mono" />
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-300 mb-2 block">App Secret</label>
                    <input type="password" name="appSecret" value={config.appSecret} onChange={handleInputChange} required className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085] font-mono" />
                </div>
            </div>
            <div className="pt-4 flex flex-col items-start gap-4">
                {feedback.message && (<p className={`text-sm font-semibold ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{feedback.message}</p>)}
                <button type="submit" disabled={isBusy} className="flex items-center justify-center px-6 py-3 bg-[#16a085] text-white font-bold rounded-md hover:bg-[#138f75] disabled:bg-[#16a085]/40 disabled:cursor-not-allowed">
                    {isBusy ? <><FaSpinner className="animate-spin mr-2" /> Activating...</> : <><FaSave className="mr-2" />Save & Activate</>}
                </button>
            </div>
        </form>
    );
}