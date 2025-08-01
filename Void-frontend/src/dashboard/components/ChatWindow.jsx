import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatProvider';
import { FaPaperPlane } from 'react-icons/fa';

export function ChatWindow() {
  const { activeConversation, sendMessage } = useChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  useEffect(() => {
      setInputText('');
  }, [activeConversation?.id]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  // --- Rebranded "No Conversation" State ---
  if (!activeConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#161616] text-zinc-600">
        <div className="text-center p-8">
            <svg className="mx-auto h-16 w-16 text-zinc-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-white">Agent Command Center</h2>
            <p className="mt-2 text-zinc-400">Select a conversation or accept a new request.</p>
        </div>
      </div>
    );
  }

  // --- Rebranded Active Chat State ---
  return (
    <div className="flex flex-col h-full bg-[#161616]">
      {/* Message Area */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
        {activeConversation.messages.map((msg, index) => {
            // System message bubble is now a neutral, on-theme color
            if(msg.sender === 'system') {
                return (
                    <div key={index} className="text-center my-4">
                        <span className="text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">{msg.text}</span>
                    </div>
                )
            }
            return (
              <div key={index} className={`flex items-end gap-2.5 max-w-xl ${msg.sender === 'agent' ? 'ml-auto' : 'mr-auto'}`}>
                {/* Chat bubbles are now fully branded for a signature look */}
                <div className={`px-4 py-2.5 rounded-xl ${
                    msg.sender === 'agent' 
                    ? 'bg-[#16a085] text-white rounded-br-lg' // Agent messages are the brand color
                    : 'bg-zinc-800 text-gray-200 rounded-bl-lg' // User messages are a neutral dark gray
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            )
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800 mt-auto">
        <form onSubmit={handleSend} className="flex items-center gap-4">
          {/* Input field is branded with new theme colors and focus ring */}
          <input
            type="text" value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-5 py-3 bg-zinc-800 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#16a085] placeholder-zinc-500" 
            autoFocus
          />
          {/* Send button is branded with the accent color */}
          <button type="submit"
            className="w-12 h-12 flex items-center justify-center bg-[#16a085] text-white rounded-full font-semibold hover:bg-[#138f75] focus:outline-none focus:ring-2 focus:ring-[#16a085] focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors"
            aria-label="Send Message"
          >
            <FaPaperPlane size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}