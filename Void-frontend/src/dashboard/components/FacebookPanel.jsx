// src/components/FacebookPanel.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthProvider"; // Make sure this path is correct for your project
import {
  FaCopy,
  FaCheckCircle,
  FaSpinner,
  FaUnlink,
  FaSave,
} from "react-icons/fa";

// --- Helper Components (Included in this file for simplicity) ---

const InstructionStep = ({ number, title, children }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 bg-[#16a085] text-white font-bold rounded-full flex items-center justify-center">
      {number}
    </div>
    <div>
      <h4 className="font-bold text-white mb-1">{title}</h4>
      <div className="text-gray-400 text-sm leading-relaxed">{children}</div>
    </div>
  </div>
);

const WebhookDisplay = ({ url }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (url === "Loading...") return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const displayUrl =
    url === "Loading..." ? url : url.replace(/^https?:\/\//, "");
  return (
    <div className="flex items-center bg-zinc-800 rounded-md border border-zinc-700">
      <span className="px-4 text-gray-400 font-mono text-sm truncate">
        {displayUrl}
      </span>
      <button
        onClick={handleCopy}
        disabled={url === "Loading..."}
        className="ml-auto flex-shrink-0 px-4 py-2 bg-[#16a085] hover:bg-[#138f75] text-white font-semibold text-sm rounded-r-md flex items-center gap-2 disabled:bg-[#16a085]/40 disabled:cursor-not-allowed"
      >
        <FaCopy /> {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
};

// --- Main Facebook Panel Component ---

export function FacebookPanel() {
  const { token } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState("loading");
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [config, setConfig] = useState({
    callbackUrl: "Loading...",
    verifyToken: "Loading...",
    pageAccessToken: "",
    appSecret: "",
  });

  const loadIntegrationStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/facebook/config", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error(`Network response was not ok: ${res.statusText}`);
      const data = await res.json();
      setConfig((prev) => ({
        ...prev,
        callbackUrl: data.callbackUrl,
        verifyToken: data.verifyToken,
      }));
      setStatus(data.status || "inactive");
    } catch (error) {
      setFeedback({
        message: `Configuration Error: ${error.message}`,
        type: "error",
      });
      setStatus("inactive");
    }
  }, [token]);

  useEffect(() => {
    loadIntegrationStatus();
  }, [loadIntegrationStatus]);

  const handleInputChange = (e) =>
    setConfig({ ...config, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsBusy(true);
    setFeedback({ message: "", type: "" });
    try {
      const res = await fetch("/api/facebook/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageAccessToken: config.pageAccessToken,
          appSecret: config.appSecret,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Activation failed.");
      setStatus("active");
      setFeedback({ message: data.message, type: "success" });
    } catch (error) {
      setFeedback({ message: error.message, type: "error" });
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeactivate = async () => {
    if (
      !window.confirm(
        "Are you sure you want to disconnect from Facebook Messenger?"
      )
    )
      return;
    setIsBusy(true);
    setFeedback({ message: "", type: "" });
    try {
      const res = await fetch("/api/facebook/deactivate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Deactivation failed.");
      setConfig((prev) => ({ ...prev, pageAccessToken: "", appSecret: "" }));
      await loadIntegrationStatus();
      setFeedback({ message: data.message, type: "success" });
    } catch (error) {
      setFeedback({ message: error.message, type: "error" });
    } finally {
      setIsBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="text-center p-12 text-gray-400">
        <FaSpinner className="animate-spin text-3xl mx-auto" />
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="text-center p-12 bg-zinc-950 rounded-lg border border-zinc-800">
        <FaCheckCircle className="text-5xl text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">
          Facebook Messenger is Active
        </h3>
        <p className="text-gray-400 mt-2 max-w-md mx-auto">
          Your AI is connected and responding to messages on your Facebook Page.
        </p>
        <button
          onClick={handleDeactivate}
          disabled={isBusy}
          className="mt-6 flex items-center justify-center gap-2 mx-auto px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-zinc-700"
        >
          {isBusy ? <FaSpinner className="animate-spin" /> : <FaUnlink />}
          {isBusy ? "Deactivating..." : "Deactivate Integration"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-white">
          Connect to Facebook Messenger
        </h3>
        <p className="text-gray-400 max-w-3xl mt-1">
          Follow these steps using settings from the{" "}
          <a
            href="https://developers.facebook.com/apps/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#16a085] hover:text-[#138f75] font-semibold"
          >
            Facebook Developer Portal
          </a>
          .
        </p>
      </div>
      <div className="p-6 bg-zinc-950 rounded-lg border border-zinc-800 space-y-6">
        <InstructionStep number="1" title="Set Up Your Webhook">
          In your App's "Messenger Settings", click "Add Callback URL". Paste
          the URL and Verify Token from below.
        </InstructionStep>
        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">
            Your Unique Callback URL
          </label>
          <WebhookDisplay url={config.callbackUrl} />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">
            Your Unique Verify Token
          </label>
          <WebhookDisplay url={config.verifyToken} />
        </div>
      </div>
      <div className="p-6 bg-zinc-950 rounded-lg border border-zinc-800 space-y-6">
        <InstructionStep number="2" title="Enter Your Page Credentials">
          Generate a Page Access Token and find your App Secret in "Basic
          Settings".
        </InstructionStep>
        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">
            Page Access Token
          </label>
          <input
            type="password"
            name="pageAccessToken"
            value={config.pageAccessToken}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085] font-mono"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">
            App Secret
          </label>
          <input
            type="password"
            name="appSecret"
            value={config.appSecret}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#16a085] font-mono"
          />
        </div>
      </div>
      <div className="pt-4 flex flex-col items-start gap-4">
        {feedback.message && (
          <p
            className={`text-sm font-semibold ${
              feedback.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {feedback.message}
          </p>
        )}
        <button
          type="submit"
          disabled={isBusy}
          className="flex items-center justify-center px-6 py-3 bg-[#16a085] text-white font-bold rounded-md hover:bg-[#138f75] disabled:bg-[#16a085]/40 disabled:cursor-not-allowed"
        >
          {isBusy ? (
            <>
              <FaSpinner className="animate-spin mr-2" /> Activating...
            </>
          ) : (
            <>
              <FaSave className="mr-2" />
              Save & Activate
            </>
          )}
        </button>
      </div>
    </form>
  );
}
