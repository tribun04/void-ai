// /middleware/isAdmin.js
const isAdmin = (req, res, next) => {
    // Assumes your authMiddleware puts the user object on `req`
    if (req.user && req.user.is_admin) {
        return next(); // User is an admin, let them proceed
    }
    return res.status(403).json({ message: 'Forbidden: Admin access required.' });
};

module.exports = isAdmin;