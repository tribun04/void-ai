import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthProvider';
import {
  FaSpinner, FaEdit, FaTrash, FaPlus, FaBrain,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

export function AITraining() {
  const [entries, setEntries] = useState([]);
  const [intent, setIntent] = useState('');
  const [baseResponse, setBaseResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [editMode, setEditMode] = useState(false);

  const { token } = useAuth();
  const topRef = useRef(null);

  // Fetch AI entries
  const fetchEntries = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    try {
      // ✅ CORRECTED: The router serves this on GET /api/ai
      const res = await fetch('/api/ai', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch entries');
      setEntries(data);
    } catch (err) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsFetching(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Handle training new AI intent
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!intent || !baseResponse) {
      setFeedback({ message: 'Intent and response required.', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // ✅ This URL is already correct: POST /api/ai/train
      const res = await fetch('/api/ai/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ intent, baseResponse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFeedback({ message: data.message, type: 'success' });
      handleCancelEdit();
      fetchEntries(); // Refresh the list
    } catch (err) {
      setFeedback({ message: err.message || 'Training failed.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setEditMode(true);
    setIntent(entry.intent);
    setBaseResponse(entry.response_en);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (intentToDelete) => {
    if (!window.confirm(`Delete intent "${intentToDelete}"?`)) return;
    try {
      // ✅ CORRECTED: The router defines this as DELETE /api/ai/:intent
      const res = await fetch(`/api/ai/${intentToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFeedback({ message: data.message, type: 'success' });
      fetchEntries(); // Refresh the list
    } catch (err) {
      setFeedback({ message: err.message || 'Delete failed.', type: 'error' });
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setIntent('');
    setBaseResponse('');
  };

  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(() => setFeedback({ message: '', type: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  return (
    <div ref={topRef} className="space-y-8">
      {/* ... The rest of your JSX remains the same ... */}
       {feedback.message && (
        <div className={`fixed top-24 right-8 z-50 flex items-center gap-3 p-4 rounded-lg shadow-2xl ${
            feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
          {feedback.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
          <p className="font-semibold">{feedback.message}</p>
        </div>
      )}

      {/* AI Trainer */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
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
            <input type="text" value={intent} onChange={e => setIntent(e.target.value)} required
              className="w-full p-3 bg-zinc-800 text-white rounded-md border border-zinc-700"
              disabled={editMode} placeholder="e.g., shipping_costs" />
          </div>
          <div>
            <label className="text-gray-300 block mb-2 font-semibold">AI's Response</label>
            <textarea value={baseResponse} onChange={e => setBaseResponse(e.target.value)} required
              rows="5" className="w-full p-3 bg-zinc-800 text-white rounded-md border border-zinc-700"
              placeholder="Exact answer the AI should give..." />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit"
              className="bg-[#16a085] text-white font-bold px-6 py-3 rounded-md hover:bg-[#138f75] flex items-center gap-2"
              disabled={isLoading}>
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaPlus />}
              {editMode ? 'Update Knowledge' : 'Add Knowledge'}
            </button>
            {editMode && (
              <button type="button"
                className="bg-zinc-600 text-white px-6 py-3 rounded-md hover:bg-zinc-500"
                onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Knowledge Table */}
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h2 className="text-2xl font-bold text-white mb-4">Your Knowledge Base ({entries.length})</h2>
        {isFetching ? (
          <p className="text-gray-400 text-center py-8">Loading your AI knowledge...</p>
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
              {entries.length ? entries.map(e => (
                <tr key={e.id || e.intent} className="hover:bg-zinc-800 transition-colors">
                  <td className="px-6 py-4 text-sm text-[#16a085] font-mono">{e.intent}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 truncate">{e.response_en}</td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => handleEdit(e)} className="text-gray-400 hover:text-[#16a085]"><FaEdit /></button>
                    <button onClick={() => handleDelete(e.intent)} className="text-gray-400 hover:text-red-500"><FaTrash /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="text-center text-gray-500 py-12">
                    <FaBrain className="text-4xl mx-auto mb-2" />
                    <p>Your AI is a blank slate. Use the form above to teach it its first response.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}