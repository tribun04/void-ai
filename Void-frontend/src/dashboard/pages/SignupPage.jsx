// In src/pages/SignupPage.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- Configuration for Plans and Add-ons ---
const PLANS = {
    '1': { name: '6 Months Plan - 10M Tokens per Month', price: 594 },
    '2': { name: '12 Months Plan - 10M Tokens per Month', price: 948 },
};
const ADDONS = {
    training: { name: 'Personalized Training', price: 100 },
    integrations: { name: 'Custom Integrations', price: 100 },
};
// ---------------------------------------------

export const SignupPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ fullName: '', companyName: '', email: '', password: '' });
    const [companySize, setCompanySize] = useState('small-business');
    const [selectedPlanId, setSelectedPlanId] = useState('1');
    const [selectedAddons, setSelectedAddons] = useState({ training: false, integrations: false });
    const [totalPrice, setTotalPrice] = useState(0);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (companySize === 'small-business') {
            let total = PLANS[selectedPlanId].price;
            for (const addonKey in selectedAddons) {
                if (selectedAddons[addonKey]) {
                    total += ADDONS[addonKey].price;
                }
            }
            setTotalPrice(total);
        }
    }, [companySize, selectedPlanId, selectedAddons]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCompanySizeChange = (e) => {
        const newSize = e.target.value;
        setCompanySize(newSize);
        if (newSize === 'enterprise') {
            setTotalPrice(0);
            setSelectedAddons({ training: false, integrations: false });
        }
    };

    const handleAddonChange = (e) => {
        const { name, checked } = e.target;
        setSelectedAddons(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);

        const isEnterprise = companySize === 'enterprise';

        // THE FIX IS INSIDE THIS OBJECT
        const finalData = {
            ...formData,
            companySize,
            plan: isEnterprise 
                ? { name: 'Enterprise Inquiry', price: 'Custom' }
                : { 
                      id: selectedPlanId, 
                      name: PLANS[selectedPlanId].name,
                      price: PLANS[selectedPlanId].price // ✅ The corrected line
                  },
            addons: isEnterprise 
                ? [] 
                : Object.keys(selectedAddons)
                      .filter(key => selectedAddons[key])
                      .map(key => ({ name: ADDONS[key].name, price: ADDONS[key].price })),
            totalPrice: isEnterprise ? 'Custom' : totalPrice,
            role: 'admin',
        };

        try {
            const response = await axios.post('http://localhost:5000/api/auth/signup', finalData);
            setMessage(response.data.message || 'Request received! We will be in touch shortly.');
            setTimeout(() => navigate('/'), 4000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isEnterprise = companySize === 'enterprise';

    // ... your JSX return statement remains exactly the same ...
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="md:flex">
                    {/* Left side - Branding */}
                    <div className="hidden md:block md:w-1/3 bg-gray-900 p-8 flex flex-col justify-center">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white mb-2 text-left">Enterprise AI Solutions</h1>
                            <p className="text-gray-300 mb-6 text-left">Powerful AI tools for businesses of all sizes</p>
                            <div className="h-1 w-16 bg-teal-500 mb-6"></div>
                            <p className="text-gray-400 text-sm text-left">
                                Join thousands of businesses leveraging our AI platform to streamline operations and boost productivity.
                            </p>
                        </div>
                    </div>
                    
                    {/* Right side - Form */}
                    <div className="w-full md:w-2/3 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-800">Create Admin Account</h2>
                            <p className="text-gray-600 mt-2">Get started with your enterprise AI solution</p>
                        </div>
    
                        {message && ( // Simplified message display
                            <div className={`mb-6 p-4 rounded-lg ${message.includes('error') ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-700'}`}>
                                {message}
                            </div>
                        )}
    
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input 
                                        name="fullName" 
                                        type="text" 
                                        placeholder="John Doe" 
                                        onChange={handleChange} 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <input 
                                        name="companyName" 
                                        type="text" 
                                        placeholder="Acme Inc" 
                                        onChange={handleChange} 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" 
                                        required 
                                    />
                                </div>
                            </div>
    
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input 
                                    name="email" 
                                    type="email" 
                                    placeholder="you@company.com" 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" 
                                    required 
                                />
                            </div>
    
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input 
                                    name="password" 
                                    type="password" 
                                    placeholder="••••••••" 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition" 
                                    required 
                                />
                            </div>
    
                            <div className="border-t border-gray-200 pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">Company Size</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setCompanySize('small-business')}
                                        className={`py-2 px-4 rounded-lg border transition ${!isEnterprise ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        Small Business
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCompanySize('enterprise')}
                                        className={`py-2 px-4 rounded-lg border transition ${isEnterprise ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        Enterprise
                                    </button>
                                </div>
                            </div>
    
                            {!isEnterprise && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select a Plan</label>
                                        <div className="space-y-2">
                                            {Object.entries(PLANS).map(([id, { name, price }]) => (
                                                <div 
                                                    key={id} 
                                                    onClick={() => setSelectedPlanId(id)}
                                                    className={`p-4 border rounded-lg cursor-pointer transition ${selectedPlanId === id ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h3 className="font-medium text-gray-800">{name}</h3>
                                                        </div>
                                                        <div className="text-teal-600 font-semibold">€{price}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {Object.entries(ADDONS).map(([key, { name, price }]) => (
                                                <div 
                                                    key={key} 
                                                    className={`p-3 border rounded-lg cursor-pointer transition ${selectedAddons[key] ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:bg-gray-50'}`}
                                                    onClick={() => setSelectedAddons(prev => ({ ...prev, [key]: !prev[key] }))}
                                                >
                                                    <div className="flex items-center">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition ${selectedAddons[key] ? 'bg-teal-500 border-teal-500' : 'bg-white border-gray-400'}`}>
                                                            {selectedAddons[key] && (
                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-800">{name}</div>
                                                            <div className="text-sm text-gray-500">+ €{price}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
    
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-700">Total:</span>
                                            <span className="text-xl font-bold text-teal-600">€{totalPrice}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Monthly subscription, billed annually</p>
                                    </div>
                                </>
                            )}
    
                            {isEnterprise && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">Enterprise Solution</h3>
                                            <p className="text-sm text-blue-700 mt-1">Our team will contact you to discuss custom pricing and solutions tailored to your enterprise needs.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
    
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    isEnterprise ? 'Submit Enterprise Inquiry' : 'Create Account'
                                )}
                            </button>
    
                            <div className="text-center text-sm text-gray-600">
                                Already have an account?{' '}
                                <Link to="/" className="font-medium text-teal-600 hover:text-teal-500">
                                    Sign In
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};