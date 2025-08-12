const db = require('../db/mysql');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get current user profile and workspace settings
 * @route   GET /api/settings
 * @access  Private
 */
exports.getSettings = async (req, res) => {
    try {
        console.log("getSettings - User:", req.user);

        const userId = req.user.id;
        const tenantId = req.user.tenantId; // Assuming tenantId is in req.user

        // Fetch user profile from the users table
        const [users] = await db.query(
            'SELECT id, fullName AS name, email FROM users WHERE id = ? AND tenantId = ?', // Selecting only necessary fields
            [userId, tenantId]
        );

        if (!users || users.length === 0) {
            console.warn("User not found for ID:", userId, "and tenantId:", tenantId);
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = users[0];

        // Fetch workspace settings from the workspace_settings table, using tenantId
        const [workspace] = await db.query(
            'SELECT timezone FROM workspace_settings WHERE tenantId = ?',
            [tenantId]
        );

        const workspaceSettings = workspace && workspace.length > 0 ? workspace[0] : { timezone: 'UTC' }; // Correctly access the first element if it exists


        res.status(200).json({
            profile: {
                name: user.name,
                email: user.email,
            },
            workspace: {
                timezone: workspaceSettings.timezone,
            },
        });
    } catch (error) {
        console.error("Error in getSettings:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

/**
 * @desc    Update user profile (name)
 * @route   PUT /api/settings/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;
        const tenantId = req.user.tenantId; // Ensure tenantId is available

        if (!name) {
            return res.status(400).json({ message: 'Name is required.' });
        }

        // Update user's profile in the database
        const [result] = await db.query(
            'UPDATE users SET fullName = ? WHERE id = ? AND tenantId = ?',
            [name, userId, tenantId]
        );

        if (result.affectedRows === 0) {
            console.warn("User not found or no changes made for ID:", userId, "and tenantId:", tenantId);
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }

        // Fetch updated user data for response
        const [updatedUsers] = await db.query(
            'SELECT fullName AS name, email FROM users WHERE id = ? AND tenantId = ?',
            [userId, tenantId]
        );
        const updatedUser = updatedUsers[0];

        res.status(200).json({
            message: 'Profile updated successfully!',
            user: { name: updatedUser.name, email: updatedUser.email }
        });
    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

/**
 * @desc    Update workspace settings (timezone)
 * @route   PUT /api/settings/workspace
 * @access  Private
 */
exports.updateWorkspace = async (req, res) => {
    try {
        const { timezone } = req.body;
        const tenantId = req.user.tenantId; // Ensure tenantId is available

        if (!timezone) {
            return res.status(400).json({ message: 'Timezone is required.' });
        }

        // Update workspace settings in the database
        const [result] = await db.query(
            'UPDATE workspace_settings SET timezone = ? WHERE tenantId = ?',
            [timezone, tenantId]
        );

        // Check if the workspace settings were found and updated
        if (result.affectedRows === 0) {
            console.warn("Workspace settings not found for tenantId:", tenantId);
            return res.status(404).json({ message: 'Workspace settings not found.' });
        }

        // Fetch updated workspace settings for response
        const [updatedWorkspace] = await db.query(
            'SELECT timezone FROM workspace_settings WHERE tenantId = ?',
            [tenantId]
        );

        res.status(200).json({
            message: 'Workspace settings updated successfully!',
            workspace: updatedWorkspace[0],
        });
    } catch (error) {
        console.error("Error in updateWorkspace:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

/**
 * @desc    Update user password
 * @route   PUT /api/settings/password
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide both current and new passwords.' });
    }

    try {
        const users = await db.query("SELECT * FROM users WHERE id = ?", [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = users[0][0];

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash); // <-- Use passwordHash
        if (!isMatch) return res.status(401).json({ message: 'Incorrect current password.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query("UPDATE users SET passwordHash = ? WHERE id = ?", [hashedPassword, userId]);  // Use passwordHash

        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (error) {
        console.error("Error in updatePassword:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

/**
 * @desc    Update user email
 * @route   PUT /api/settings/email
 * @access  Private
 */
exports.updateEmail = async (req, res) => {
    const { newEmail, currentPassword } = req.body;
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    if (!newEmail || !currentPassword) {
        return res.status(400).json({ message: 'Please provide the new email and your current password.' });
    }

    try {
        const [existingEmails] = await db.query(
            'SELECT * FROM users WHERE email = ? AND tenantId = ?',
            [newEmail, tenantId]
        );

        if (existingEmails.length > 0) {
            return res.status(400).json({ message: 'This email is already in use.' });
        }

        const [users] = await db.query(
            'SELECT * FROM users WHERE id = ? AND tenantId = ?',
            [userId, tenantId]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash); // <-- Use passwordHash
        if (!isMatch) return res.status(401).json({ message: 'Incorrect password. Cannot change email.' });

        await db.query(
            'UPDATE users SET email = ? WHERE id = ? AND tenantId = ?',
            [newEmail, userId, tenantId]
        );

        res.status(200).json({ message: 'Email updated successfully!' });
    } catch (error) {
        console.error("Error in updateEmail:", error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};