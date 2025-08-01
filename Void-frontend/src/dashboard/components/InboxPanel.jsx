// src/components/InboxPanel.jsx

import React, { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatProvider';
import useSound from 'use-sound';
import { RequestCard } from './RequestCard';

export function InboxPanel() {
  const { pendingRequests, acceptChat } = useChat();
  
  // The sound hook remains the same, using the correct filename.
  const [playNotification] = useSound('/sounds/confirmation.wav', { volume: 0.7 });

  // --- NEW: A ref to track the previous number of requests ---
  // This allows us to detect when a *new* request arrives.
  const prevRequestCount = useRef(pendingRequests.length);

  // --- UPDATED: This logic is now more intelligent ---
  useEffect(() => {
    const currentRequestCount = pendingRequests.length;
    
    // Play the sound ONLY if the number of requests has increased.
    // This prevents the sound from playing on initial load and only triggers on new arrivals.
    if (currentRequestCount > prevRequestCount.current) {
      playNotification();
    }

    // After the check, update the ref to the current count for the next comparison.
    prevRequestCount.current = currentRequestCount;

  }, [pendingRequests, playNotification]); // Dependencies are correct.

  // The safety check for the acceptChat function is good practice.
  if (!acceptChat) {
      return (
        <div className="p-6 text-center text-zinc-500 mt-4">
            <p className="text-sm">Initializing chat...</p>
        </div>
      );
  }

  // The JSX for rendering the list remains the same.
  return (
    <div className="p-2">
      {pendingRequests && pendingRequests.length > 0 ? (
        pendingRequests.map((req) => (
          <RequestCard 
            key={req.userId} 
            request={req} 
            onAccept={acceptChat} 
          />
        ))
      ) : (
        <div className="p-6 text-center text-zinc-500 mt-4">
          <p className="text-sm">No new requests.</p>
        </div>
      )}
    </div>
  );
}