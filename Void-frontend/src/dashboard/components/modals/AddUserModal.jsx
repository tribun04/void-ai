const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subscriptionDuration, setSubscriptionDuration] = useState('12 Months');
  const [subscriptionPlan, setSubscriptionPlan] = useState('Plan - 10M Tokens per Month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/api/admin/agents', {
        firstName,
        lastName,
        email,
        password,
        role: 'agent', // ✅ Enforced by frontend
        subscriptionDuration,
        subscriptionPlan,
        paymentStatus: 'completed' // ✅ Enforced by frontend
      });

      onUserAdded(res.data);
      onClose();
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('Failed to create agent. Make sure email is unique.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-lg shadow-lg w-full max-w-md border border-zinc-700">
        <h2 className="text-xl font-bold text-white mb-4">Add Full Agent</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="First Name"
              className="w-1/2 px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              className="w-1/2 px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            value={subscriptionDuration}
            onChange={(e) => setSubscriptionDuration(e.target.value)}
            className="w-full px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
          >
            <option value="12 Months">12 Months</option>
            <option value="6 Months">6 Months</option>
            <option value="3 Months">3 Months</option>
          </select>

          <select
            value={subscriptionPlan}
            onChange={(e) => setSubscriptionPlan(e.target.value)}
            className="w-full px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
          >
            <option value="Plan - 10M Tokens per Month">10M Tokens</option>
            <option value="Plan - 5M Tokens per Month">5M Tokens</option>
            <option value="Plan - 1M Tokens per Month">1M Tokens</option>
          </select>

          <div className="flex justify-between mt-4">
            <button
              type="button"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
