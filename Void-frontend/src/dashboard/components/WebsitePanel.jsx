import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthProvider"; // Adjust if needed
import { FaSpinner } from "react-icons/fa";
import { Tab } from "@headlessui/react";
import axios from "axios";

// Utility function (moved to top level)
const classNames = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

// Placeholder components
const TechAiModalPreview = ({ isOpen, onClose, config }) => (
  <div className={`fixed inset-0 z-50 ${isOpen ? "block" : "hidden"}`}>
    <div
      className="absolute inset-0 bg-black bg-opacity-50"
      onClick={onClose}
    ></div>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg w-96">
      <h3 className="text-lg font-bold mb-2">Widget Preview</h3>
      <p>
        Brand Color:{" "}
        <span
          className="inline-block w-4 h-4"
          style={{ backgroundColor: config.brandColor }}
        ></span>
      </p>
      <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">
        Close
      </button>
    </div>
  </div>
);

const InstructionStep = ({ number, title, children }) => (
  <div className="mb-4">
    <h4 className="font-semibold text-white">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#16a085] text-white mr-2">
        {number}
      </span>
      {title}
    </h4>
    <p className="text-gray-400 ml-8">{children}</p>
  </div>
);

const CodeSnippetDisplay = ({ code }) => (
  <div className="bg-zinc-800 rounded-lg p-4 mb-6 overflow-x-auto">
    <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">
      {code}
    </pre>
  </div>
);

const WebsitePanel = () => {
  const { token } = useAuth();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "info" });

  const [config, setConfig] = useState({
    organizationId: "",
    companyName: "",
    brandColor: "#16a085",
    welcomeMessage: "",
    allowedDomains: [],
    handoffTriggerKeywords: [],
    languages: {
      en: {
        welcomeMessage: "",
        inputPlaceholder: "",
        agentHandoffMessage: "",
        downloadTranscript: "",
      },
      sq: {
        welcomeMessage: "",
        inputPlaceholder: "",
        agentHandoffMessage: "",
        downloadTranscript: "",
      },
      sr: {
        welcomeMessage: "",
        inputPlaceholder: "",
        agentHandoffMessage: "",
        downloadTranscript: "",
      },
    },
  });

  useEffect(() => {
    const fetchConfig = async () => {
      if (!token) return;
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/integrations/settings?channel=website`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Could not load configuration.");
        const data = await res.json();
        const sanitizedData = {
          ...data,
          brandColor: data.brandColor || "#16a085",
          languages: data.languages || { en: {}, sq: {}, sr: {} },
          handoffTriggerKeywords: data.handoffTriggerKeywords || [],
          allowedDomains: data.allowedDomains || [],
        };
        setConfig(sanitizedData);
      } catch (error) {
        setFeedback({ message: error.message, type: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [token]);

  const handleInputChange = (e) =>
    setConfig({ ...config, [e.target.name]: e.target.value });

  const handleDomainsChange = (e) =>
    setConfig({
      ...config,
      allowedDomains: e.target.value
        .split("\n")
        .map((d) => d.trim())
        .filter(Boolean),
    });

  const handleHandoffChange = (e) =>
    setConfig({
      ...config,
      handoffTriggerKeywords: e.target.value
        .split("\n")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    });

  const handleLanguageChange = (e, langCode) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      languages: {
        ...prev.languages,
        [langCode]: { ...prev.languages[langCode], [name]: value },
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback({ message: "", type: "info" });
    try {
      const res = await fetch("/api/widget/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "An unknown error occurred.");
      }
      setFeedback({
        message: "Configuration saved successfully!",
        type: "success",
      });
      setTimeout(() => setFeedback({ message: "", type: "info" }), 3000);
    } catch (error) {
      setFeedback({ message: `Error: ${error.message}`, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const API_BASE_URL = "http://localhost:5000";

  const reactHookCode = `// hooks/useWidgetLoader.js
import { useState, useEffect } from 'react';

const API_URL = '${API_BASE_URL}';

export const useWidgetLoader = (organizationId) => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!organizationId) {
      setIsLoading(false);
      setError('Organization ID is required.');
      return;
    }
    const fetchConfig = async () => {
      try {
        const response = await fetch(\`\${API_URL}/api/widget/public-config/\${organizationId}\`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || \`Request failed: \${response.statusText}\`);
        }
        const data = await response.json();
        setConfig(data.widgetClientConfig);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [organizationId]);
  return { config, isLoading, error };
};
`;

  const reactUsageCode = `// components/ChatTrigger.jsx
import React, { useState } from 'react';
import { TechAiModal } from '@your-company/react-widget'; // 1. Import from your package
import { useWidgetLoader } from '../hooks/useWidgetLoader'; // 2. Import the hook

export const ChatTrigger = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { config, isLoading, error } = useWidgetLoader('${
    config.organizationId || "YOUR_ORGANIZATION_ID"
  }');
  const currentUserId = 'user-session-abc-123'; // 3. A unique ID for the end-user

  if (isLoading || error) {
    if (error) console.error('Chat Widget Error:', error);
    return null; // Don't render if config fails to load
  }

  // 4. Render the button and the modal
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{ backgroundColor: config.brandColor }}
      >
        Chat with Us
      </button>

      <TechAiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={config} // Pass the dynamic config object
        currentUserId={currentUserId}
        apiBaseUrl="${API_BASE_URL}"
        socketUrl="${API_BASE_URL}"
      />
    </>
  );
};`;

  const vanillaJsCode = `// public/js/widget-launcher.js
class TechAiWidget {
  constructor(options) {
    this.organizationId = options.organizationId;
    this.apiBaseUrl = options.apiBaseUrl;
    this.socketUrl = options.socketUrl;
    this.config = null;
    this.socket = null;
    this.elements = {};
    // ... other properties for state management
  }

  // 1. Fetch config from your API
  async init() {
    try {
      const response = await fetch(\`\${this.apiBaseUrl}/api/widget/public-config/\${this.organizationId}\`);
      this.config = (await response.json()).widgetClientConfig;
      this._createDOMElements();
      this._setupEventListeners();
    } catch (e) {
      console.error("Failed to initialize chat widget:", e);
    }
  }

  // ... (rest of the class implementation)
}

// Automatically initialize the widget
document.addEventListener('DOMContentLoaded', () => {
  const widget = new TechAiWidget({
    organizationId: "${config.organizationId || "YOUR_ORGANIZATION_ID"}",
    apiBaseUrl: "${API_BASE_URL}",
    socketUrl: "${API_BASE_URL}"
  });
  widget.init();
});`;

  const phpCode = `<?php
// in your footer.php or equivalent template
$organizationId = get_user_organization_id(); // Example function
$apiBaseUrl = "${API_BASE_URL}";
?>

<div id="tech-ai-widget-container"></div>
<script>
  class TechAiWidget {
    // ... The full JavaScript class from the HTML/JS tab goes here ...
  }

  document.addEventListener('DOMContentLoaded', () => {
    const widget = new TechAiWidget({
      organizationId: "<?php echo htmlspecialchars($organizationId); ?>",
      apiBaseUrl: "<?php echo htmlspecialchars($apiBaseUrl); ?>",
      socketUrl: "<?php echo htmlspecialchars($apiBaseUrl); ?>"
    });
    widget.init();
  });
</script>`;

  if (isLoading) {
    return (
      <div className="text-center p-12 text-gray-400">
        <FaSpinner className="animate-spin text-3xl mx-auto" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <TechAiModalPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        config={config}
      />

      {/* Left Column: Configuration Form */}
      {/* This form is missing from the provided code, but the logic for it exists. */}

      {/* Right Column: Developer Integration Guide */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white">
          Developer Integration Guide
        </h3>
        <p className="text-gray-400 -mt-4">
          Follow the roadmap for your platform to integrate the chat widget.
        </p>
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-zinc-800 p-1">
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-[#16a085] ring-white ring-opacity-60",
                  selected
                    ? "bg-[#16a085] text-white shadow"
                    : "text-gray-300 hover:bg-zinc-700 hover:text-white"
                )
              }
            >
              React
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-[#16a085] ring-white ring-opacity-60",
                  selected
                    ? "bg-[#16a085] text-white shadow"
                    : "text-gray-300 hover:bg-zinc-700 hover:text-white"
                )
              }
            >
              HTML/JS
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "w-full rounded-lg py-2.5 text-sm font-medium leading-5",
                  "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-[#16a085] ring-white ring-opacity-60",
                  selected
                    ? "bg-[#16a085] text-white shadow"
                    : "text-gray-300 hover:bg-zinc-700 hover:text-white"
                )
              }
            >
              PHP
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel className="space-y-6 rounded-xl py-3">
              <InstructionStep number="1" title="Install the Package">
                Install our official React component from NPM.
              </InstructionStep>
              <CodeSnippetDisplay
                code={"npm install @your-company/react-widget"}
              />
              <InstructionStep number="2" title="Create a Data-Fetching Hook">
                This hook fetches your widget configuration from our API.
              </InstructionStep>
              <CodeSnippetDisplay code={reactHookCode} />
              <InstructionStep number="3" title="Implement the Component">
                Use the hook and pass the configuration to the `TechAiModal`
                component.
              </InstructionStep>
              <CodeSnippetDisplay code={reactUsageCode} />
            </Tab.Panel>
            <Tab.Panel className="space-y-6 rounded-xl py-3">
              <InstructionStep number="1" title="Create the Launcher Script">
                For non-React sites, this Vanilla JS class manages the widget.
              </InstructionStep>
              <CodeSnippetDisplay code={vanillaJsCode} />
              <InstructionStep number="2" title="Include the Script">
                Include the script on your page before the closing tag.
              </InstructionStep>
            </Tab.Panel>
            <Tab.Panel className="space-y-6 rounded-xl py-3">
              <InstructionStep
                number="1"
                title="Implement the Client-Side Logic"
              >
                Follow the "HTML/JS" tab to create the `TechAiWidget` class.
              </InstructionStep>
              <InstructionStep number="2" title="Embed in Your PHP Template">
                Use `echo` to securely inject the `organizationId` from your
                server-side code.
              </InstructionStep>
              <CodeSnippetDisplay code={phpCode} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default WebsitePanel;
