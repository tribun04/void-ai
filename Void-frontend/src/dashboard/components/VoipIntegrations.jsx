import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useAuth } from '../context/AuthProvider';
import {
  FaPhoneAlt, FaCheckCircle, FaSpinner, FaUnlink, FaCopy, FaSave
} from 'react-icons/fa';
import { Tab } from '@headlessui/react';

// --- Rebranded HELPER FUNCTIONS & COMPONENTS ---
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

const CredentialDisplay = ({ value, label }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const displayValue = !value ? 'Loading...' : value.replace(/^https?:\/\//, '');
    return (
        <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">{label}</label>
            <div className="flex items-center bg-zinc-800 rounded-md border border-zinc-700">
                <span className="px-4 text-gray-400 font-mono text-sm truncate">{displayValue}</span>
                <button onClick={handleCopy} disabled={!value} className="ml-auto flex-shrink-0 px-4 py-2 bg-[#16a085] hover:bg-[#138f75] text-white font-semibold text-sm rounded-r-md flex items-center gap-2 disabled:bg-[#16a085]/40 disabled:cursor-not-allowed">
                    <FaCopy/> {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
        </div>
    );
};


// --- The Rebranded Reusable Panel for each Provider ---
function ProviderPanel({ provider }) {
    const { auth } = useAuth();
    const [status, setStatus] = useState('loading');
    const [isBusy, setIsBusy] = useState(false);
    const [feedback, setFeedback] = useState({ message: '', type: '' });
    const [webhookUrl, setWebhookUrl] = useState('');
    const [config, setConfig] = useState({
        apiKey: '', apiSecret: '', authId: '', authToken: '', spaceUrl: '', phoneNumber: '',
    });

    const loadConfig = useCallback(async () => {
        if (!auth.token) return;
        setStatus('loading');
        try {
            const res = await fetch(`/api/voip-config/${provider.key}`, { 
                headers: { 'Authorization': `Bearer ${auth.token}` } 
            });
            if (!res.ok) throw new Error('Could not load configuration.');
            const data = await res.json();
            
            setConfig(prev => ({ ...prev, ...data.config }));
            setStatus(data.status || 'inactive');

            if (data.config && data.config.webhookPath) {
                const backendHost = window.location.host.replace(/:\d+$/, ':5000');
                setWebhookUrl(`${window.location.protocol}//${backendHost}/api/voip/${data.config.webhookPath}`);
            } else {
                console.error("Webhook path not received from backend for provider:", provider.key);
                setWebhookUrl("Error: Path not found");
            }

        } catch (error) {
            setFeedback({ message: error.message, type: 'error' });
            setStatus('inactive');
        }
    }, [auth.token, provider.key]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleInputChange = (e) => setConfig({ ...config, [e.target.name]: e.target.value });

    const handleSave = async (e) => {
        e.preventDefault();
        setIsBusy(true);
        setFeedback({ message: '', type: '' });
        try {
            const res = await fetch(`/api/voip-config/${provider.key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Activation failed.');
            setStatus('active');
            setFeedback({ message: data.message, type: 'success' });
        } catch (error) {
            setFeedback({ message: `Error: ${error.message}`, type: 'error' });
        } finally {
            setIsBusy(false);
        }
    };
    
    const handleDeactivate = async () => {
        if (!window.confirm(`Are you sure you want to disconnect from ${provider.name}?`)) return;
        setIsBusy(true);
        await fetch(`/api/voip-config/deactivate/${provider.key}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        await loadConfig();
        setIsBusy(false);
    };

    if (status === 'loading') {
        return <div className="text-center p-12 text-gray-400"><FaSpinner className="animate-spin text-3xl mx-auto" /></div>;
    }

    if (status === 'active') {
        return (
            <div className="text-center p-12 bg-zinc-950 rounded-lg border border-zinc-800">
                <FaCheckCircle className="text-5xl text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white">{provider.name} is Active</h3>
                <p className="text-gray-400 mt-2 max-w-md mx-auto">
                    Your AI is connected and can receive calls on the number: <span className="font-mono text-[#16a085]">{config.phoneNumber}</span>
                </p>
                <button onClick={handleDeactivate} disabled={isBusy} className="mt-6 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-zinc-700">
                    {isBusy ? <FaSpinner className="animate-spin" /> : <FaUnlink />}
                    {isBusy ? 'Deactivating...' : 'Deactivate Integration'}
                </button>
            </div>
        );
    }
    
    return (
        <form onSubmit={handleSave} className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-white">Connect to {provider.name}</h3>
                <p className="text-gray-400 max-w-3xl mt-1">
                    Follow the setup guide below to connect your {provider.name} account to the VOID AI.
                </p>
            </div>
            
            <div className="p-6 bg-zinc-950 rounded-lg border border-zinc-800 space-y-6">
                {provider.instructions(webhookUrl)}
            </div>

            <div className="p-6 bg-zinc-950 rounded-lg border border-zinc-800 space-y-6">
                <InstructionStep number={provider.lastStepNumber} title="Enter Your Credentials">
                    Find these values in your {provider.name} dashboard and enter them here.
                </InstructionStep>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {provider.credentials.map(cred => (
                        <div key={cred.name} className={cred.fullWidth ? 'md:col-span-2' : ''}>
                            <label className="text-sm font-semibold text-gray-300 mb-2 block">{cred.label}</label>
                            <input type="password" name={cred.name} value={config[cred.name] || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085] font-mono" />
                        </div>
                    ))}
                </div>
                <div>
                     <label className="text-sm font-semibold text-gray-300 mb-2 block">{provider.name} Phone Number</label>
                     <input type="text" name="phoneNumber" placeholder="+15551234567" value={config.phoneNumber || ''} onChange={handleInputChange} required className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085] font-mono" />
                </div>
            </div>

            <div className="pt-4 flex flex-col items-start gap-4">
                {feedback.message && (
                    <p className={`text-sm font-semibold ${feedback.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {feedback.message}
                    </p>
                )}
                <button type="submit" disabled={isBusy} className="flex items-center justify-center px-6 py-3 bg-[#16a085] text-white font-bold rounded-md hover:bg-[#138f75] disabled:bg-[#16a085]/40 disabled:cursor-not-allowed">
                    {isBusy ? <><FaSpinner className="animate-spin mr-2" /> Activating...</> : <><FaSave className="mr-2"/> Save & Activate</>}
                </button>
            </div>
        </form>
    );
}

// --- Main Rebranded Exported Component ---
export function VoipIntegrations() {

    const providers = [
        {
            name: 'Twilio',
            key: 'twilio',
            icon: FaPhoneAlt,
            credentials: [{ name: 'authId', label: 'Account SID' }, { name: 'authToken', label: 'Auth Token' }],
            lastStepNumber: 2,
            instructions: (webhookUrl) => (
                <Fragment>
                    <InstructionStep number="1" title="Configure Your Twilio Number">
                        In your phone number's settings, under "Voice & Fax", set "A CALL COMES IN" to be a `Webhook` with the URL below and `HTTP POST` method.
                    </InstructionStep>
                    <CredentialDisplay value={webhookUrl} label="Your Unique Webhook URL" />
                </Fragment>
            )
        },
        {
            name: 'SignalWire',
            key: 'signalwire',
            icon: FaPhoneAlt,
            credentials: [
                { name: 'authId', label: 'Project ID' }, 
                { name: 'authToken', label: 'API Token' },
                { name: 'spaceUrl', label: 'Space URL (e.g., your-space.signalwire.com)', fullWidth: true },
            ],
            lastStepNumber: 2,
            instructions: (webhookUrl) => (
                <Fragment>
                    <InstructionStep number="1" title="Configure Your SignalWire Number">
                        Edit your phone number and under "Voice and Fax Settings", set "WHEN A CALL COMES IN" to `LAML Webhook`. Use the URL below and the `POST` method.
                    </InstructionStep>
                    <CredentialDisplay value={webhookUrl} label="Your Unique LAML Webhook URL" />
                </Fragment>
            )
        },
        {
            name: 'Vonage',
            key: 'vonage',
            icon: FaPhoneAlt,
            credentials: [{ name: 'apiKey', label: 'API Key' }, { name: 'apiSecret', label: 'API Secret' }],
            lastStepNumber: 3,
            instructions: (webhookUrl) => (
                 <Fragment>
                    <InstructionStep number="1" title="Create a Vonage Application">In the Vonage dashboard, go to "Voice"  "Applications" and create a new application.</InstructionStep>
                    <InstructionStep number="2" title="Set the Answer URL">Turn on the "Voice" capability and paste the URL below into the `Answer URL` field. Use the `HTTP GET` method.</InstructionStep>
                    <CredentialDisplay value={webhookUrl} label="Your Unique Answer URL" />
                    <InstructionStep number="3" title="Link Your Number">Go to "Your numbers" and link your Vonage number to the application you just created.</InstructionStep>
                </Fragment>
            )
        },
        {
            name: 'Plivo',
            key: 'plivo',
            icon: FaPhoneAlt,
            credentials: [{ name: 'authId', label: 'Auth ID' }, { name: 'authToken', label: 'Auth Token' }],
            lastStepNumber: 2,
            instructions: (webhookUrl) => (
                 <Fragment>
                    <InstructionStep number="1" title="Create a Plivo Application">In the Plivo dashboard, go to "XML"  "Applications" and create one. Set the `Answer URL` to the URL below.</InstructionStep>
                     <CredentialDisplay value={webhookUrl} label="Your Unique Answer URL" />
                    <InstructionStep number="2" title="Link Your Number">Assign your Plivo number to the application you just created.</InstructionStep>
                </Fragment>
            )
        },
        {
            name: 'Telnyx',
            key: 'telnyx',
            icon: FaPhoneAlt,
            credentials: [{ name: 'apiKey', label: 'API Key (V2)' }],
            lastStepNumber: 2,
            instructions: (webhookUrl) => (
                <Fragment>
                    <InstructionStep number="1" title="Create a Telnyx Call Control Application">
                        Create a "Call Control" application and set the "Webhook URL" to the URL below.
                    </InstructionStep>
                    <InstructionStep number="2" title="Assign Your Number">
                        Buy or select a Telnyx number and assign it to the Call Control application you created.
                    </InstructionStep>
                    <CredentialDisplay value={webhookUrl} label="Your Unique Webhook URL" />
                </Fragment>
            )
        },
    ];

    return (
        <div className="bg-zinc-900 rounded-xl shadow-lg p-6 md:p-8 border border-zinc-800">
            <h2 className="text-2xl font-bold text-white mb-6">VOIP Integrations</h2>
            <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-zinc-800 p-1 mb-6">
                     {providers.map((provider) => (
                        <Tab key={provider.key} className={({ selected }) => classNames('w-full rounded-lg py-2.5 text-sm font-medium leading-5', 'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-[#16a085] ring-white ring-opacity-60', selected ? 'bg-[#16a085] text-white shadow' : 'text-gray-300 hover:bg-zinc-700 hover:text-white')}>
                            <div className="flex items-center justify-center gap-2"><provider.icon /> {provider.name}</div>
                        </Tab>
                    ))}
                </Tab.List>
                <Tab.Panels className="mt-2">
                    {providers.map((provider) => (
                        <Tab.Panel key={provider.key}>
                            <ProviderPanel provider={provider} />
                        </Tab.Panel>
                    ))}
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
}