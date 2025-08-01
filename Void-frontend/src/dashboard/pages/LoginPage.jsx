import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useNavigate } from 'react-router-dom';

// The old VoidLogo component has been removed, as we'll use your actual image.

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      
      // The logic for 3 different roles
      if (loggedInUser.role === 'superadmin') {
        navigate('/superadmin'); // Go to the SuperAdmin page
      } else if (loggedInUser.role === 'admin') {
        navigate('/admin'); // Go to the regular Admin page
      } else { 
        navigate('/dashboard'); // Go to the agent page
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. Set the background to your brand's dark color.
    // Using arbitrary values in Tailwind CSS: bg-[#161616]
    <div className="flex items-center justify-center min-h-screen bg-[#161616] font-sans p-4">
      
      {/* Using a slightly lighter shade for the card to create contrast. */}
      {/* We've also updated the border color to match the new theme. */}
      <div className="p-8 bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm border border-zinc-800">
        
        <div className="text-center mb-8">
            {/* 2. Replaced the temporary logo with your actual logo image. */}
            {/* The src="/void.png" correctly points to the public folder. */}
            <img 
              src="/void.png" 
              alt="Void AI Logo" 
              className="mx-auto h-16 w-auto mb-4" 
            />
            
            <h1 className="text-2xl font-bold text-white">Void AI Platform</h1>
            <p className="text-gray-400">Sign in to your workspace</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="text-red-300 text-sm text-center bg-red-500/20 p-3 rounded-lg">
              {error}
            </p>
          )}
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              type="email" id="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              // 3. Updated input fields to match the darker theme and new accent color.
              className="w-full px-4 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a085]"
              placeholder="you@company.com" required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password" id="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a085]"
              placeholder="••••••••" required
            />
          </div>
          <button type="submit"
            // 4. Replaced the old accent color with your main brand color.
            // I also added a slightly darker shade for the hover effect.
            className="w-full bg-[#16a085] text-white py-3 rounded-lg font-bold hover:bg-[#138f75] transition-colors disabled:bg-zinc-700 disabled:cursor-not-allowed"
            disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}