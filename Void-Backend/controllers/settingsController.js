const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');

// --- Define paths to your JSON "database" files ---
const usersFilePath = path.join(__dirname, '..', 'data', 'users.json');
const workspaceFilePath = path.join(__dirname, '..', 'data', 'workspaceSettings.json');

// --- Helper function to read and parse a JSON file ---
const readJSONFile = async (filePath) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading or parsing file at ${filePath}:`, error);
        throw new Error('Could not read data file.');
    }
};

// --- Helper function to write data to a JSON file ---
const writeJSONFile = async (filePath, data) => {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error(`Error writing file at ${filePath}:`, error);
        throw new Error('Could not save data file.');
    }
};

/**
 * @desc    Get current user profile and workspace settings
 * @route   GET /api/settings
 * @access  Private
 */
exports.getSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users, workspaceSettings] = await Promise.all([
            readJSONFile(usersFilePath),
            readJSONFile(workspaceFilePath)
        ]);
        const user = users.find(u => u.id === userId || u._id === userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

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
        if (!name) {
            return res.status(400).json({ message: 'Name is required.' });
        }
        const users = await readJSONFile(usersFilePath);
        const userIndex = users.findIndex(u => u.id === userId || u._id === userId);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found.' });
        }
        users[userIndex].name = name;
        await writeJSONFile(usersFilePath, users);
        res.status(200).json({
            message: 'Profile updated successfully!',
            user: { name: users[userIndex].name, email: users[userIndex].email }
        });
    } catch (error) {
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
        if (!timezone) {
            return res.status(400).json({ message: 'Timezone is required.' });
        }
        const workspaceSettings = await readJSONFile(workspaceFilePath);
        workspaceSettings.timezone = timezone;
        await writeJSONFile(workspaceFilePath, workspaceSettings);
        res.status(200).json({
            message: 'Workspace settings updated successfully!',
            workspace: workspaceSettings,
        });
    } catch (error) {
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
        const users = await readJSONFile(usersFilePath);
        const userIndex = users.findIndex(u => u.id === userId || u._id === userId);
        if (userIndex === -1) return res.status(404).json({ message: 'User not found.' });
        
        const user = users[userIndex];
        
        // Use user.passwordHash to match the field in your users.json file
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash); // <-- CHANGED
        if (!isMatch) return res.status(401).json({ message: 'Incorrect current password.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Save the new hash to the correct field
        users[userIndex].passwordHash = hashedPassword; // <-- CHANGED
        await writeJSONFile(usersFilePath, users);

        res.status(200).json({ message: 'Password updated successfully!' });
    } catch (error) {
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

    if (!newEmail || !currentPassword) {
        return res.status(400).json({ message: 'Please provide the new email and your current password.' });
    }

    try {
        const users = await readJSONFile(usersFilePath);
        const emailExists = users.some(u => u.email === newEmail && (u.id !== userId && u._id !== userId));
        if (emailExists) return res.status(400).json({ message: 'This email is already in use.' });

        const userIndex = users.findIndex(u => u.id === userId || u._id === userId);
        if (userIndex === -1) return res.status(404).json({ message: 'User not found.' });

        const user = users[userIndex];

        // Use user.passwordHash to match the field in your users.json file
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash); // <-- CHANGED
        if (!isMatch) return res.status(401).json({ message: 'Incorrect password. Cannot change email.' });

        users[userIndex].email = newEmail;
        await writeJSONFile(usersFilePath, users);
        
        res.status(200).json({ message: 'Email updated successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};