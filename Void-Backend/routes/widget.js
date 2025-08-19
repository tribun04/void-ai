// routes/widget.js

const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const { randomBytes } = require("crypto");

// --- Configuration Management (Refactored for future multi-tenancy) ---

const WIDGET_CONFIG_PATH = path.join(__dirname, "../data/widgetConfig.json");

/**
 * Manages reading and writing widget configurations.
 * This is designed to be easily swappable with a database or multi-file system later.
 */
const configManager = {
  // Generates a secure, unique ID for an organization's widget
  _generateOrgId: () => `org_${randomBytes(16).toString("hex")}`,

  /**
   * Retrieves the configuration for a given organization.
   * @param {string} organizationId - The ID of the organization. (Currently ignored for single-tenant setup)
   * @returns {Promise<object>} The widget configuration object.
   */
  async getConfig(organizationId) {
    // TODO: For multi-tenancy, this function would find the correct file or DB entry
    // using the organizationId. For now, it reads the single shared config file.
    try {
      await fs.access(WIDGET_CONFIG_PATH);
      const data = await fs.readFile(WIDGET_CONFIG_PATH, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.log("No config file found, creating a default one.");
      const defaultConfig = {
        organizationId: this._generateOrgId(),
        companyName: "Your Company",
        brandColor: "#4F46E5",
        welcomeMessage: "Hello! How can I help you today?",
        allowedDomains: [], // IMPORTANT for security
        handoffTriggerKeywords: [
          "agent",
          "human",
          "speak to a person",
          "live chat",
        ],
        languages: {
          en: {
            welcomeMessage: "Hello! How can I help you today?",
            inputPlaceholder: "Type your message...",
            agentHandoffMessage: "Let me connect you with a live agent.",
            downloadTranscript: "Download Transcript",
          },
          sq: {
            welcomeMessage: "Përshëndetje! Si mund t'ju ndihmoj sot?",
            inputPlaceholder: "Shkruani mesazhin tuaj...",
            agentHandoffMessage: "Më lejoni t'ju lidh me një agjent.",
            downloadTranscript: "Shkarko Transkriptin",
          },
          sr: {
            welcomeMessage: "Zdravo! Kako mogu da vam pomognem danas?",
            inputPlaceholder: "Upišite vašu poruku...",
            agentHandoffMessage: "Dozvolite da vas povežem sa agentom.",
            downloadTranscript: "Preuzmi Transkript",
          },
        },
      };
      await this.saveConfig(defaultConfig.organizationId, defaultConfig);
      return defaultConfig;
    }
  },

  /**
   * Saves the configuration for a given organization.
   * @param {string} organizationId - The ID of the organization. (Currently ignored)
   * @param {object} configData - The configuration object to save.
   */
  async saveConfig(organizationId, configData) {
    // TODO: For multi-tenancy, this would save to a path like `data/${organizationId}.json`
    await fs.writeFile(WIDGET_CONFIG_PATH, JSON.stringify(configData, null, 2));
  },
};

// --- PROTECTED API ENDPOINTS (for your admin panel) ---

// GET /api/widget/config - Fetches the full config for the admin UI
router.get("/config", async (req, res) => {
  // NOTE: Add your auth middleware here to verify admin access.
  try {
    // In a single-tenant app, we can fetch the config without an ID.
    // In a multi-tenant app, the org ID would come from the authenticated user's session.
    const config = await configManager.getConfig();
    res.json(config);
  } catch (error) {
    console.error("Error reading widget config:", error);
    res.status(500).json({ message: "Error reading widget configuration." });
  }
});

// PUT /api/widget/config - Saves the updated config from the admin UI
router.put("/config", async (req, res) => {
  // NOTE: Add your auth middleware here.
  try {
    const currentConfig = await configManager.getConfig();
    // Merge new data, but ensure organizationId is never overwritten from the client
    const newConfig = {
      ...currentConfig,
      ...req.body,
      organizationId: currentConfig.organizationId,
    };

    await configManager.saveConfig(currentConfig.organizationId, newConfig);
    res.json({
      message: "Configuration saved successfully!",
      config: newConfig,
    });
  } catch (error) {
    console.error("Error saving widget config:", error);
    res.status(500).json({ message: "Error saving widget configuration." });
  }
});

// --- PUBLIC API ENDPOINT (for the widget script on customer websites) ---

// GET /api/widget/public-config/:organizationId
router.get("/public-config/:organizationId", async (req, res) => {
  const { organizationId } = req.params;

  try {
    const fullConfig = await configManager.getConfig(organizationId);

    // 1. Validate the Organization ID
    if (fullConfig.organizationId !== organizationId) {
      return res.status(404).json({ error: "Configuration not found." });
    }

    // 2. CRUCIAL: Security Check - Validate the requesting domain
    const requestOrigin = req.get("Origin") || req.get("Referer");
    const isAllowed = fullConfig.allowedDomains.some((domain) =>
      requestOrigin?.includes(domain)
    );

    // Allow requests from localhost for development, or if no domains are set yet.
    const isDev = requestOrigin?.includes("localhost");
    if (!isAllowed && !isDev && fullConfig.allowedDomains.length > 0) {
      console.warn(
        `[Widget Security] Blocked request from unauthorized origin: ${requestOrigin} for org: ${organizationId}`
      );
      return res
        .status(403)
        .json({ error: "This domain is not authorized to use this widget." });
    }

    // 3. Construct the public-safe configuration object for the client-side widget
    const widgetClientConfig = {
      companyName: fullConfig.companyName,
      brandColor: fullConfig.brandColor,
      welcomeMessage: fullConfig.welcomeMessage, // A global welcome message
      handoffTriggerKeywords: fullConfig.handoffTriggerKeywords,
      languages: fullConfig.languages,
    };

    // 4. Send the complete initialization payload
    res.json({
      organizationId: fullConfig.organizationId,
      widgetClientConfig: widgetClientConfig,
    });
  } catch (error) {
    console.error(
      `Error loading public config for org ${organizationId}:`,
      error
    );
    res.status(500).json({ error: "Could not load widget configuration." });
  }
});

module.exports = router;
