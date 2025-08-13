  import React, { useState, useEffect, useRef } from "react";
  import { io } from "socket.io-client";
  import { FaDownload, FaTimesCircle } from 'react-icons/fa';

  const SOCKET_SERVER_URL = "http://localhost:5000";
  const CHAT_API_ENDPOINT = "http://localhost:5000/api/chat/ask";

  // --- Multi-Lingual Configuration for Tech Company ---
  const languages = {
    en: {
      welcomeScreen: {
        title: "Tech Innovations Virtual Assistant",
        description: "I'm here to help with your technology questions. <br/><br/> You can ask about our products and services. To speak with a person, please type '<b>talk to an agent</b>'."
      },
      connecting: "👤 Connecting you to a technology specialist. Please wait a moment...",
      agentJoined: (name) => `Specialist ${name} has joined the chat. You are now speaking with a representative of Tech Innovations.`,
      chatEnded: "This chat session has ended.",
      chatEndedByAgent: "Our specialist has concluded this chat session.",
      placeholder: "Type your question here...",
      placeholderWaiting: "Please wait for a technology specialist to connect...",
      placeholderEnded: "This chat has ended. You may download the transcript.",
    },  
    sq: {
      welcomeScreen: {
        title: "Asistenti Virtual i Tech Innovations",
        description: "Unë jam këtu për t'ju ndihmuar me pyetjet tuaja teknologjike. <br/><br/> Mund të pyesni për produktet dhe shërbimet tona. Për të folur me një person, ju lutem shkruani '<b>fol me agjent</b>'."
      },
      connecting: "👤 Po ju lidhim me një specialist teknologjik. Ju lutem prisni një moment...",
      agentJoined: (name) => `Specialisti ${name} i është bashkuar bisedës. Tani po komunikoni drejtpërdrejt me një përfaqësues të Tech Innovations.`,
      chatEnded: "Kjo bisedë ka përfunduar.",
      chatEndedByAgent: "Specialisti ynë e ka përfunduar këtë bisedë.",
      placeholder: "Shkruani pyetjen tuaj këtu...",
      placeholderWaiting: "Ju lutem prisni të lidheni me një specialist...",
      placeholderEnded: "Kjo bisedë ka përfunduar. Mund ta shkarkoni transkriptin.",
    },
    sr: {
      welcomeScreen: {
        title: "Virtuelni Asistent Tech Innovations",
        description: "Ovde sam da vam pomognem sa vašim tehnološkim pitanjima. <br/><br/> Možete me pitati o našim proizvodima i uslugama. Da biste razgovarali sa osobom, ukucajte '<b>razgovor sa agentom</b>'."
      },
      connecting: "👤 Povezujemo vas sa tehnološkim savetnikom. Molimo sačekajte trenutak...",
      agentJoined: (name) => `Savetnik ${name} se pridružio razgovoru. Sada razgovarate direktno sa predstavnikom Tech Innovations.`,
      chatEnded: "Ovaj razgovor je završen.",
      chatEndedByAgent: "Naš savetnik je završio ovaj razgovor.",
      placeholder: "Upišite vaše pitanje ovde...",
      placeholderWaiting: "Molimo sačekajte da se povežete sa savetnikom...",
      placeholderEnded: "Ovaj razgovor je završen. Možete preuzeti transkript.",
    }
  };

  const handoffTriggerKeywords = [
    "real agent", "live agent", "human support", "speak to a person", "live support", "talk to someone", "advisor", "specialist", "talk to an agent",
    "agjent real", "fol me agjent", "njeri real", "dua te flas me dike", "suport direkt", "operator", "specialist",
    "pravi agent", "ljudska podrska", "razgovor sa osobom", "ljudski operater", "ziva podrska", "savetnik", "razgovor sa agentom",
  ];

  export function TechAiModal({ isOpen, onClose, currentUserId, lang = 'en' }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [chatState, setChatState] = useState('bot');
    const [currentLang, setCurrentLang] = useState(lang);
    
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    
    const langConfig = languages[currentLang] || languages['en'];

    useEffect(() => {
      if (isOpen && currentUserId) {
        setMessages([]);
        setChatState('bot');
        setInputText('');

        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        
        const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
        socketRef.current = socket;

        socket.on("connect", () => socket.emit('join-session', { sessionId: currentUserId, role: 'user' }));
        socket.on("agent-linked", ({ agent }) => {
          setMessages((prev) => [...prev, { type: "agent", text: langConfig.agentJoined(agent.name || 'Support') }]);
          setChatState('agent');
        });
        socket.on("agent-reply", ({ message }) => {
          setMessages((prev) => [...prev, { type: "agent", text: message }]);
        });
        socket.on("chat-ended-by-agent", () => {
          setMessages(prev => [...prev, { type: 'error', text: langConfig.chatEndedByAgent }]);
          setChatState('ended');
        });

        return () => {
          socket.disconnect();
        };
      }
    }, [isOpen, currentUserId, currentLang]);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleLangChange = (newLang) => {
      if (newLang !== currentLang) {
        setCurrentLang(newLang);
      }
    };

    const handleClose = () => onClose();

    const handleSend = async () => {
      if (!inputText.trim() || chatState === 'waiting' || chatState === 'ended') return;
      const currentInput = inputText;
      setMessages((prev) => [...prev, { type: "user", text: currentInput }]);
      setInputText("");

      if (chatState === 'agent') {
        socketRef.current?.emit("forward-to-agent", { userId: currentUserId, message: currentInput });
        return;
      }

      if (chatState === 'bot') {
        const wantsAgent = handoffTriggerKeywords.some(k => currentInput.toLowerCase().includes(k));
        if (wantsAgent) {
          setChatState('waiting');
          setMessages((prev) => [...prev, { type: "assistant", text: langConfig.connecting }]);
          socketRef.current?.emit("agent-request", {
            userId: currentUserId,
            message: currentInput,
            timestamp: new Date().toISOString(),
            channel: "web"
          });
        } else {
          try {
            const res = await fetch(CHAT_API_ENDPOINT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: currentInput, language: currentLang }),
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { type: "assistant", text: data.reply }]);
          } catch (err) {
            setMessages((prev) => [...prev, { type: "error", text: "Sorry, a connection issue occurred. Please try again later." }]);
          }
        }
      }
    };

    const handleEndChat = () => {
        setMessages(prev => [...prev, { type: 'error', text: langConfig.chatEnded }]);
        setChatState('ended');
        socketRef.current?.emit('user-ended-chat', { userId: currentUserId });
    };

    const handleDownloadTranscript = () => {
      const transcript = messages.map(msg => {
        const prefix = msg.type === 'user' ? 'You' : (msg.type === 'agent' ? 'Specialist' : 'System');
        return `${prefix}: ${msg.text}`;
      }).join('\n\n');
      
      const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Chat-Transcript-Tech-Innovations-${currentUserId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    if (!isOpen) return null;

    const isInputDisabled = chatState === 'waiting' || chatState === 'ended';
    let placeholderText = langConfig.placeholder;
    if (chatState === 'waiting') placeholderText = langConfig.placeholderWaiting;
    if (chatState === 'ended') placeholderText = langConfig.placeholderEnded;

    const langButtonClass = (langCode) => 
      `px-2 py-1 text-xs rounded-md transition-colors font-medium ${
        currentLang === langCode 
          ? 'bg-indigo-800 text-white' // Active language is indigo
          : 'bg-[#2A2F3B] text-gray-400 hover:bg-[#353B47] hover:text-white'
      } ${langCode === 'en' && currentLang === 'en' ? 'bg-indigo-800 text-white' : ''}`;

    return (
      <div className={`fixed inset-0 flex items-end justify-end p-4 sm:p-6 z-[9999]`}>
        <div className={`fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm`} onClick={handleClose} />
        <div className={`relative w-full max-w-lg bg-[#1A1D24] rounded-2xl transform transition-all duration-300 ease-out border border-[#2A2F3B] flex flex-col`} style={{ height: 'calc(100vh - 4rem)', maxHeight: '700px' }}>
          
          <div className="flex items-center justify-between p-4 border-b border-[#2A2F3B] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-800 rounded-lg p-2 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Tech Innovations</h2>
                <p className="text-[#6B7280] text-xs mt-1">Virtual Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 border border-[#2A2F3B] rounded-lg p-1">
                <button onClick={() => handleLangChange('en')} className={langButtonClass('en')}>EN</button>
                <button onClick={() => handleLangChange('sq')} className={langButtonClass('sq')}>SQ</button>
                <button onClick={() => handleLangChange('sr')} className={langButtonClass('sr')}>SR</button>
              </div>
              {chatState === 'ended' && (<button onClick={handleDownloadTranscript} title="Download Transcript" className="text-gray-400 hover:text-white transition-colors p-2"><FaDownload /></button>)}
              {chatState === 'agent' && (<button onClick={handleEndChat} title="End Chat" className="text-cyan-400 hover:text-cyan-300 transition-colors p-2"><FaTimesCircle /></button>)}
              <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors p-2"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="bg-indigo-800 rounded-lg p-3 shadow-lg mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{langConfig.welcomeScreen.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: langConfig.welcomeScreen.description }} />
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex items-end gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`w-fit max-w-[85%] px-4 py-3 rounded-2xl ${
                  message.type === "user" ? "bg-indigo-800 text-white rounded-br-lg" : 
                  message.type === "error" ? "bg-cyan-500/20 text-cyan-300 rounded-bl-lg" : 
                  message.type === "agent" ? "bg-cyan-800 text-white rounded-bl-lg" : 
                  "bg-[#2A2F3B] text-gray-200 rounded-bl-lg"
                }`}>
                  <p className="text-sm whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: message.text }}></p>
                </div>
              </div>
            ))}
            {chatState === 'waiting' && (
              <div className="flex justify-start">
                <div className="bg-[#2A2F3B] rounded-2xl rounded-bl-lg p-4 flex items-center gap-3">
                  <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse-dot"></div>
                  <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse-dot [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse-dot [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-[#2A2F3B] flex-shrink-0 relative">
            <textarea 
              value={inputText} 
              onChange={(e) => setInputText(e.target.value)} 
              onKeyDown={handleKeyPress} 
              className="w-full p-4 pr-12 bg-[#2A2F3B] text-white rounded-xl focus:ring-2 focus:ring-cyan-400 outline-none resize-none placeholder-[#6B7280] disabled:opacity-50" 
              placeholder={placeholderText} 
              rows={1} 
              style={{ maxHeight: "120px" }} 
              disabled={isInputDisabled} 
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center">
              <button 
                onClick={handleSend} 
                disabled={isInputDisabled || !inputText.trim()} 
                aria-label="Send message" 
                className={`p-2 rounded-full transition-all duration-300 ${
                  !isInputDisabled && inputText.trim() ? "bg-indigo-800 text-white" : "bg-transparent text-[#6B7280] cursor-not-allowed"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export default TechAiModal;