const fs = require('fs');
const path = require('path');

// --- Use path.resolve for an absolute path ---
// This guarantees we are always looking in the correct directory,
// regardless of how the Node process was started.
const CONFIG_FILE_PATH = path.resolve(__dirname, '../data/voip_configs.json');

// Helper function to read the config file
const readConfigs = () => {
    // Ensure the directory exists before trying to read/write
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(CONFIG_FILE_PATH)) {
        fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify({}, null, 2));
        return {};
    }
    try {
        const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
        return fileContent ? JSON.parse(fileContent) : {};
    } catch (error) {
        console.error(`❌ [${new Date().toISOString()}] CRITICAL: Error reading VOIP configs from ${CONFIG_FILE_PATH}:`, error);
        return {};
    }
};

// Helper function to write to the config file
const writeConfigs = (data) => {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        fs.writeFileSync(CONFIG_FILE_PATH, jsonString, 'utf-8');
        console.log(`✅ [${new Date().toISOString()}] Successfully wrote ${jsonString.length} bytes to ${CONFIG_FILE_PATH}`);
    } catch (error) {
        // This will catch any OS-level errors (permissions, etc.)
        console.error(`❌ [${new Date().toISOString()}] CRITICAL: FAILED to write VOIP configs to ${CONFIG_FILE_PATH}:`, error);
    }
};

// --- Controller Functions ---

// GET /api/voip-config/:providerKey
exports.getConfig = (req, res) => {
    const { providerKey } = req.params;
    const allConfigs = readConfigs();
    const providerConfig = allConfigs[providerKey] || {};
    const webhookPath = `incoming-${providerKey}`;

    res.status(200).json({
        status: providerConfig.apiKey || providerConfig.authId ? 'active' : 'inactive',
        config: {
            ...providerConfig,
            webhookPath: webhookPath
        }
    });
};

// POST /api/voip-config/:providerKey
exports.saveConfig = (req, res) => {
    const { providerKey } = req.params;
    const newConfigData = req.body;

    console.log(`[${new Date().toISOString()}] Received save request for provider: ${providerKey}`);
    console.log('Data from frontend:', newConfigData);
    
    const allConfigs = readConfigs();
    allConfigs[providerKey] = newConfigData;
    
    console.log('New state of all configs before writing:', allConfigs);
    
    writeConfigs(allConfigs);

    res.status(200).json({ message: `${providerKey} configuration saved successfully!` });
};

// POST /api/voip-config/deactivate/:providerKey
exports.deactivateConfig = (req, res) => {
    const { providerKey } = req.params;
    console.log(`[${new Date().toISOString()}] Received deactivate request for provider: ${providerKey}`);
    
    const allConfigs = readConfigs();

    if (allConfigs[providerKey]) {
        delete allConfigs[providerKey];
        writeConfigs(allConfigs);
        res.status(200).json({ message: `${providerKey} has been deactivated.` });
    } else {
        res.status(404).json({ message: 'Provider not found or already inactive.' });
    }
};