import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthProvider";
import { jwtDecode } from "jwt-decode"; // ✅ fixed import
import axios from "axios";
import io from "socket.io-client";
import { QRCodeSVG as QRCode } from "qrcode.react";
import {
  FaPlay,
  FaPowerOff,
  FaCircleNotch,
  FaCheckCircle,
} from "react-icons/fa";

// --- Configuration ---
const API_BASE_URL = "http://localhost:5000"; // Your backend URL

export function WhatsAppPanel() {
  const { token } = useAuth();
  const [status, setStatus] = useState("disconnected");
  const [statusMessage, setStatusMessage] = useState("Service is not running.");
  const [qrCode, setQrCode] = useState("");
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const logsEndRef = useRef(null);

  // --- Helper to add logs ---
  const addLog = useCallback((message) => {
    setLogs((prev) => [
      ...prev.slice(-100),
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  }, []);

  // --- Helper to get the tenant ID from the token ---
  const getTenantId = useCallback(() => {
    if (!token) return null;
    try {
      const decoded = jwtDecode(token);
      return decoded.tenantId;
    } catch (e) {
      console.error("Invalid token:", e);
      addLog("Authentication Error: Invalid Token.");
      return null;
    }
  }, [token, addLog]);

  // --- Effect for Socket.IO Connection and Listeners ---
  useEffect(() => {
    const tenantId = getTenantId();
    if (!token || !tenantId) {
      return;
    }

    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      addLog("Connected to real-time service...");
      socket.emit("join-tenant-room", { tenantId });
    });

    socket.on("whatsapp-status", ({ status: newStatus, message }) => {
      setIsLoading(false);
      setStatus(newStatus);
      setStatusMessage(message);
      if (newStatus !== "connecting") setQrCode("");
    });

    socket.on("qr_code", ({ qr }) => {
      addLog("QR Code received from bot.");
      setQrCode(qr);
    });

    socket.on("whatsapp_ready", () => {
      addLog("WhatsApp client is ready and connected!");
      setStatus("connected");
      setStatusMessage("Service is connected and running.");
      setQrCode("");
    });

    socket.on("whatsapp-log", ({ message }) => addLog(message));

    const checkInitialStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/whatsapp/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStatus(res.data.status);
        setStatusMessage(res.data.message);
      } catch (error) {
        addLog("Error fetching initial status.");
      }
    };
    checkInitialStatus();

    return () => {
      socket.disconnect();
    };
  }, [token, getTenantId, addLog]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // --- Action Handlers ---
  const handleAction = async (action) => {
    setIsLoading(true);
    if (action === "start") {
      setLogs([]);
      addLog("Sending start command...");
      setStatus("connecting");
      setStatusMessage("Initializing service... waiting for QR code.");
      setQrCode(""); // ✅ ensure old QR is cleared before new one
    } else {
      addLog("Sending stop command...");
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/whatsapp/${action}-service`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || `Failed to send ${action} command.`;
      addLog(`Error: ${errorMsg}`);
      setStatus("disconnected");
      setIsLoading(false);
    }
  };

  const statusColor = {
    disconnected: "text-red-500",
    connecting: "text-amber-400",
    connected: "text-green-400",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-3 h-3 rounded-full ${statusColor[status]?.replace(
              "text-",
              "bg-"
            )} ${status === "connected" ? "animate-pulse" : ""}`}
          ></div>
          <span
            className={`font-semibold text-lg capitalize ${statusColor[status]}`}
          >
            {status}
          </span>
        </div>
        <p className="text-gray-400 mb-6 min-h-[20px]">{statusMessage}</p>
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => handleAction("start")}
            disabled={
              isLoading || status === "connected" || status === "connecting"
            }
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors"
          >
            <FaPlay /> Start Service
          </button>
          <button
            onClick={() => handleAction("stop")}
            disabled={isLoading || status === "disconnected"}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors"
          >
            <FaPowerOff /> Stop Service
          </button>
        </div>
        <div className="w-full h-64 flex items-center justify-center bg-zinc-950 rounded-lg p-4 border border-zinc-800">
          {status === "connecting" && !qrCode && (
            <div className="text-center text-gray-400">
              <FaCircleNotch className="animate-spin text-4xl mx-auto mb-4 text-amber-400" />
              <p>Waiting for QR Code...</p>
            </div>
          )}
          {qrCode && (
            <div className="text-center">
              <h3 className="font-bold mb-2 text-white">Scan with WhatsApp</h3>
              <div className="bg-white p-3 rounded-lg shadow-inner">
                <QRCode value={qrCode} size={180} />
              </div>
            </div>
          )}
          {status === "connected" && (
            <div className="text-center">
              <FaCheckCircle className="text-green-400 text-5xl mx-auto mb-4" />
              <p className="text-gray-300 font-semibold">
                Service is connected and running.
              </p>
            </div>
          )}
          {status === "disconnected" && (
            <p className="text-gray-500">
              Service is stopped. Press "Start" to begin.
            </p>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-bold mb-2 text-white">Live Activity Logs</h3>
        <div className="h-[21.5rem] bg-black/70 text-gray-300 font-mono text-xs p-4 rounded-lg overflow-y-auto border border-zinc-800 shadow-inner">
          {logs.length > 0 ? (
            logs.map((log, i) => <p key={i}>{log}</p>)
          ) : (
            <p className="text-gray-500">Service logs will appear here...</p>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}
