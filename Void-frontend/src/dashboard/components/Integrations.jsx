import React, {
  useState,
  useEffect,
  useRef,
  Fragment,
  useCallback,
} from "react";
import { useAuth } from "../context/AuthProvider";
import {
  FaWhatsapp,
  FaFacebookMessenger,
  FaGlobe,
  FaPowerOff,
  FaPlay,
  FaCircleNotch,
  FaCopy,
  FaEye,
  FaCode,
  FaCheckCircle,
  FaSpinner,
  FaUnlink,
  FaSave,
} from "react-icons/fa";
import QRCode from "react-qr-code";
import { Tab } from "@headlessui/react";
import WebsitePanel from "./WebsitePanel"; // Assuming it's in the same folder
import { WhatsAppPanel } from "./WhatsAppPanel"; // Assuming it's in the same folder
import { FacebookPanel } from "./FacebookPanel";
// --- Rebranded Dynamic Preview Component ---
function TechAiModalPreview({ isOpen, onClose, config }) {
  if (!isOpen) return null;

  const companyName = config?.companyName || "Your Company Name";
  const welcomeMessage =
    config?.welcomeMessage ||
    "Our virtual assistant is here to help. Ask a question to get started.";
  const brandColor = config?.brandColor || "#16a085"; // Default to your brand color
  const inputPlaceholder =
    config?.languages?.en?.inputPlaceholder || "Type your question here...";

  return (
    <div
      className={`fixed inset-0 flex items-end justify-end p-4 sm:p-6 z-[9999]`}
    >
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm`}
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-lg bg-zinc-900 rounded-2xl transform transition-all duration-300 ease-out border border-zinc-800 flex flex-col`}
        style={{ height: "calc(100vh - 4rem)", maxHeight: "700px" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg p-2 shadow-lg"
              style={{ backgroundColor: brandColor }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {companyName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <h3 className="text-xl font-semibold text-white mb-2">
              {companyName}
            </h3>
            <p className="text-gray-400 text-sm">{welcomeMessage}</p>
          </div>
        </div>
        <div className="p-4 border-t border-zinc-800 flex-shrink-0 relative">
          <textarea
            className="w-full p-4 pr-12 bg-zinc-800 text-white rounded-xl"
            placeholder={inputPlaceholder}
            rows={1}
            readOnly
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <button
              className="p-2 rounded-full text-white"
              style={{ backgroundColor: brandColor }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Rebranded Helper Functions & Components ---
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

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

const CodeSnippetDisplay = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative mt-2">
      <div className="p-4 pr-14 bg-zinc-950 rounded-lg border border-zinc-700 font-mono text-sm">
        <pre className="text-gray-300 whitespace-pre-wrap">
          <code>{code}</code>
        </pre>
      </div>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-zinc-700 hover:bg-zinc-600 rounded-md text-xs font-semibold flex items-center justify-center"
        aria-label={copied ? "Copied to clipboard" : "Copy code"}
      >
        {copied ? (
          <FaCheckCircle className="text-green-400 h-4 w-4" />
        ) : (
          <FaCopy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};

// --- Rebranded Main Integration Hub Component ---
export function Integrations() {
  const panels = [
    { name: "Website", icon: FaGlobe },
    { name: "WhatsApp", icon: FaWhatsapp },
    { name: "Facebook", icon: FaFacebookMessenger },
  ];
  return (
    <div className="bg-zinc-900 rounded-xl shadow-lg p-6 md:p-8 border border-zinc-800">
      <h2 className="text-2xl font-bold text-white mb-6">
        Multi-Channel Integrations
      </h2>
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-zinc-800 p-1 mb-6">
          {panels.map((panel) => (
            <Tab
              key={panel.name}
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
              <div className="flex items-center justify-center gap-2">
                <panel.icon /> {panel.name}
              </div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel>
            <WebsitePanel />
          </Tab.Panel>
          <Tab.Panel>
            <WhatsAppPanel />
          </Tab.Panel>
          <Tab.Panel>
            <FacebookPanel />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

// --- Rebranded Helper for Webhooks ---
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

// --- Rebranded Facebook Panel ---
