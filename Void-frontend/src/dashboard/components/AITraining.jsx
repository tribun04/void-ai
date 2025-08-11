import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthProvider';
import {
  FaSpinner, FaEdit, FaTrash, FaPlus, FaBrain,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

const useFeedback = () => {
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  useEffect(() => {
    if (!feedback.message) return;
    const timer = setTimeout(() => setFeedback({ message: '', type: '' }), 5000);
    return () => clearTimeout(timer);
  }, [feedback.message]);

  return [feedback, setFeedback];
};

export function AITraining() {
  const [entries, setEntries] = useState([]);
  const [intent, setIntent] = useState('');
  const [baseResponse, setBaseResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const { token } = useAuth();
  const topRef = useRef(null);

  const [feedback, setFeedback] = useFeedback();

  const enableLogging = process.env.NODE_ENV === 'development';

  // Function to handle API requests with error handling
  const apiRequest = useCallback(async (url, options, needsBody = true) => {
    if (enableLogging) console.log("API Request URL:", url);
    if (enableLogging) console.log("API Request Options:", options);
    if (enableLogging) console.log("Token Value:", token);
    if (enableLogging) console.log("Needs Body:", needsBody);
    if (enableLogging) console.log("Options Body:", options.body);
    if (enableLogging) console.log("Options Headers:", options.headers);

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}), // Merge any additional headers
    };

    const finalOptions = {
      ...options,
      headers,
    };

    if (needsBody && options.body) {
      finalOptions.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, finalOptions);

      if (!res.ok) {
        let errorMessage = `API request failed (HTTP ${res.status})`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.warn("Failed to parse error JSON:", jsonError);
        }
        console.error("API Error:", errorMessage);
        throw new Error(errorMessage);
      }

      return await res.json();
    } catch (error) {
      console.error("API Request Error:", error);
      setFeedback({ message: error.message, type: 'error' });
      throw error; // Re-throw to be caught in component functions
    }
  }, [token, setFeedback, enableLogging]);

  // Fetch entries from the API
  const fetchEntries = useCallback(async () => {
    if (!token) {
      if (enableLogging) console.warn("No token available. User might not be logged in.");
      setFeedback({ message: 'You must be logged in to view AI knowledge.', type: 'error' });
      return;
    }

    setIsFetching(true);
    try {
      const apiUrl = 'http://localhost:5000/api/ai/ai-entries';
      if (enableLogging) console.log("Fetching entries from:", apiUrl);
      const data = await apiRequest(apiUrl, { method: 'GET' }, false);
      setEntries(data);
    } catch (error) {
      // Error is already handled in apiRequest
    } finally {
      setIsFetching(false);
    }
  }, [token, setFeedback, apiRequest, enableLogging]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Handle form submission for adding/updating AI knowledge
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!intent || !baseResponse) {
      setFeedback({ message: 'Intent and response are required.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = 'http://localhost:5000/api/ai/train-ai';
      if (enableLogging) console.log("Training AI at:", apiUrl, { intent, prompt: baseResponse });
      // Add a console log to check that intent and baseResponse are set correctly, to address the problem: AITraining.jsx:69 API Error: Missing intent, prompt, or response.
      console.log("handleSubmit API data", { intent, prompt: baseResponse })
      const data = await apiRequest(apiUrl, {
        method: 'POST',
        body: { intent, prompt: baseResponse, response: baseResponse }, // added response as it may be required

      });

      setFeedback({ message: data.message, type: 'success' });
      handleCancelEdit();
      fetchEntries(); // Refresh entries
    } catch (error) {
      // Error is already handled in apiRequest
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing an existing entry
  const handleEdit = (entry) => {
    setEditMode(true);
    setIntent(entry.intent);
    setBaseResponse(entry.prompt);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle deleting an entry
  const handleDelete = useCallback(async (intentToDelete) => {
    if (!window.confirm(`Delete intent "${intentToDelete}"?`)) return;

    try {
      const apiUrl = `http://localhost:5000/api/ai/ai-entries/${encodeURIComponent(intentToDelete)}`;
      if (enableLogging) console.log("Deleting intent from:", apiUrl);

      const data = await apiRequest(apiUrl, {
        method: 'DELETE',
      }, false);

      setFeedback({ message: data.message, type: 'success' });
      fetchEntries(); // Refresh entries
    } catch (error) {
      // Error is already handled in apiRequest
    }
  }, [token, fetchEntries, setFeedback, apiRequest, enableLogging]);

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setIntent('');
    setBaseResponse('');
  };

  return (
    <div ref={topRef} className="space-y-8 p-4 max-w-4xl mx-auto">
      {feedback.message && (
        <div
          className={`fixed top-24 right-8 z-50 flex items-center gap-3 p-4 rounded-lg shadow-2xl ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}
        >
          {feedback.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <p className="font-semibold">{feedback.message}</p>
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#16a085] rounded-lg flex items-center justify-center">
            <FaBrain className="text-white text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editMode ? 'Update AI Knowledge' : 'Teach Your AI'}
            </h2>
            <p className="text-gray-400">Add or edit responses for your chatbot.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 block mb-2 font-semibold">Intent Name</label>
            <input
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              required
              disabled={editMode}
              placeholder="e.g., shipping_costs"
              className="w-full p-3 bg-zinc-800 text-white rounded-md border border-zinc-700"
            />
          </div>
          <div>
            <label className="text-gray-300 block mb-2 font-semibold">AI's Response</label>
            <textarea
              value={baseResponse}
              onChange={(e) => setBaseResponse(e.target.value)}
              required
              rows={5}
              placeholder="Exact answer the AI should give..."
              className="w-full p-3 bg-zinc-800 text-white rounded-md border border-zinc-700 resize-none"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#16a085] text-white font-bold px-6 py-3 rounded-md hover:bg-[#138f75] flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              {editMode ? 'Update Knowledge' : 'Add Knowledge'}
            </button>
            {editMode && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-zinc-600 text-white px-6 py-3 rounded-md hover:bg-zinc-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-md">
        <h2 className="text-2xl font-bold text-white mb-4">
          Your Knowledge Base ({entries.length})
        </h2>
        {isFetching ? (
          <p className="text-gray-400 text-center py-8">Loading your AI knowledge...</p>
        ) : entries.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <FaBrain className="text-4xl mx-auto mb-2" />
            <p>Your AI is a blank slate. Use the form above to teach it its first response.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-400 uppercase">Intent</th>
                <th className="px-6 py-3 text-left text-xs text-gray-400 uppercase">Response Preview</th>
                <th className="px-6 py-3 text-right text-xs text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {entries.map((e) => (
                <tr
                  key={e.id || e.intent}
                  className="hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm text-[#16a085] font-mono">{e.intent}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 truncate" title={e.prompt}>
                    {e.prompt}
                  </td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button
                      onClick={() => handleEdit(e)}
                      className="text-gray-400 hover:text-[#16a085]"
                      aria-label={`Edit ${e.intent}`}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(e.intent)}
                      className="text-gray-400 hover:text-red-500"
                      aria-label={`Delete ${e.intent}`}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}