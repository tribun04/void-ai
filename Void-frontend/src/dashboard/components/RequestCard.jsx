import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaGlobe, FaFacebookMessenger } from 'react-icons/fa';

const ChannelIcon = ({ channel }) => {
  const baseClass = "text-base";
  if (channel === 'whatsapp') return <FaWhatsapp className={`${baseClass} text-green-500`} />;
  if (channel === 'messenger') return <FaFacebookMessenger className={`${baseClass} text-blue-500`} />;
  return <FaGlobe className={`${baseClass} text-gray-400`} />;
};

const useWaitTimer = (timestamp) => {
  const [waitTime, setWaitTime] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
      if (seconds < 60) {
        setWaitTime(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setWaitTime(`${minutes}m ago`);
      }
    };
    updateTimer();
    const intervalId = setInterval(updateTimer, 5000);
    return () => clearInterval(intervalId);
  }, [timestamp]);

  return waitTime;
};

const formatUserId = (id, channel) => {
  if (!id || typeof id !== 'string') return 'Unknown User';
  if (channel === 'whatsapp' && id.includes('@')) return id.split('@')[0];
  if (channel === 'messenger' && id.length > 10) return `User...${id.slice(-4)}`;
  return id.length > 15 ? `User...${id.slice(-4)}` : id;
};

export function RequestCard({ request, onAccept }) {
  const waitTime = useWaitTimer(request.timestamp);

  const handleAcceptClick = (e) => {
    e.stopPropagation();
    onAccept(request);
  };

  return (
    <div
      className="bg-[#20252E] hover:bg-[#2E3642] border border-[#3A3F4B] shadow-md p-4 rounded-xl mb-3 transition-all cursor-pointer group"
      onClick={() => onAccept(request)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ChannelIcon channel={request.channel} />
          <span className="text-sm font-semibold text-white tracking-tight">
            {formatUserId(request.userId, request.channel)}
          </span>
        </div>
        <span className="text-xs text-gray-500">{waitTime}</span>
      </div>

      <div className="text-gray-300 text-sm italic line-clamp-2 mb-3">
        “{request.message}”
      </div>

      <button
        onClick={handleAcceptClick}
        className="w-full py-2 text-sm font-bold text-black bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors group-hover:scale-[1.02]"
      >
        Accept
      </button>
    </div>
  );
}
