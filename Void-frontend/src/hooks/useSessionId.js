import { useState, useEffect } from 'react';

const SESSION_KEY = 'bekonomike-chat-session-id';

// This function generates a simple unique ID.
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useSessionId() {
  const [sessionId, setSessionId] = useState(() => {
    // Try to get the ID from localStorage on initial load.
    try {
      const storedId = window.localStorage.getItem(SESSION_KEY);
      return storedId || null;
    } catch (error) {
      console.error("Could not access localStorage:", error);
      return null;
    }
  });

  useEffect(() => {
    if (!sessionId) {
      // If no ID exists, generate a new one and save it.
      const newId = generateId();
      try {
        window.localStorage.setItem(SESSION_KEY, newId);
        setSessionId(newId);
      } catch (error) {
        console.error("Could not set item in localStorage:", error);
      }
    }
  }, [sessionId]);

  return sessionId;
}