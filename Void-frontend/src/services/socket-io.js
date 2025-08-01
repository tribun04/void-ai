// frontend/services/socket-io.js

import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5000";

/**
 * Creates and returns a NEW socket connection.
 * The component that calls this is responsible for managing the connection lifecycle (e.g., disconnecting).
 */
export function connectSocket(userId) {
  // Always create a new socket instance
  const socket = io(SOCKET_SERVER_URL, { 
    transports: ["websocket"],
    // Automatically reconnect if the connection is lost
    reconnection: true,
    reconnectionAttempts: 5,
    // Add the userId to the query for easy identification on the backend if needed
    query: { userId }
  });

  return socket;
}