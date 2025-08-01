// /middleware/checkUsage.js
const User = require('../db/models/user.model'); // Adjust path if needed

// Define your plan limits here
const PLAN_LIMITS = {
    entries: 500,
    premium: 4000,
    pro: 20000
};

const checkUsage = async (req, res, next) => {
    // We get the user ID from the token that was verified by authMiddleware
    const userId = req.user.id; 

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Optional: Reset logic for monthly subscriptions
        // This is advanced, can be added later. For now, we just check.

        const limit = PLAN_LIMITS[user.subscription_plan] || 0;

        if (user.message_count >= limit) {
            return res.status(429).json({ // 429 means "Too Many Requests"
                message: `You have reached your monthly limit of ${limit} messages for the ${user.subscription_plan} plan.`,
                upgrade_required: true
            });
        }

        // If the user is under their limit, allow the request to proceed
        next();

    } catch (error) {
        console.error("Error in checkUsage middleware:", error);
        res.status(500).send('Server error during usage check.');
    }
};

module.exports = checkUsage;