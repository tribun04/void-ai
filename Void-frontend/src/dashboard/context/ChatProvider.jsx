// src/context/ChatProvider.jsx - FINAL & CORRECTED VERSION

import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { io } from 'socket.io-client';

const CHAT_STORAGE_KEY = 'agentActiveChats';

const ChatContext = createContext();

// Load initial state from localStorage
const initialConversations = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)) || {};
const initialState = {
  requests: [],
  conversations: initialConversations,
  activeConversationId: null,
};

// Reducer is correct, no changes needed.
function chatReducer(state, action) {
  let newState;
  switch (action.type) {
    case 'SET_INITIAL_REQUESTS':
      newState = { ...state, requests: action.payload };
      break;

    case 'ADD_REQUEST':
      if (state.requests.some(req => req.userId === action.payload.userId)) return state;
      newState = { ...state, requests: [action.payload, ...state.requests] };
      break;
    
    case 'REMOVE_REQUEST':
      newState = { ...state, requests: state.requests.filter(req => req.userId !== action.payload.userId) };
      break;

    case 'ADD_CONVERSATION': {
      const { userId, initialMessage, channel } = action.payload;
      if (state.conversations[userId]) {
        return { ...state, activeConversationId: userId };
      }
      const newConversation = { id: userId, channel, messages: [{ text: initialMessage, sender: 'user', timestamp: new Date().toISOString() }], unreadCount: 0 };
      newState = {
        ...state,
        conversations: { ...state.conversations, [userId]: newConversation },
        activeConversationId: userId,
      };
      break;
    }

    case 'ADD_MESSAGE': {
      const { userId, text, sender, channel } = action.payload;
      const targetConversation = state.conversations[userId];
      if (!targetConversation) return state;
      
      const newConversations = { ...state.conversations };
      newConversations[userId] = {
        ...targetConversation,
        channel: targetConversation.channel || channel,
        messages: [...targetConversation.messages, { text, sender, timestamp: new Date().toISOString() }],
        unreadCount: state.activeConversationId !== userId && sender === 'user' 
          ? (targetConversation.unreadCount || 0) + 1 
          : targetConversation.unreadCount,
      };
      newState = { ...state, conversations: newConversations };
      break;
    }
    
    case 'VIEW_CONVERSATION': {
      const conversationId = action.payload;
      if (!state.conversations[conversationId]) return state;
      
      const convo = state.conversations[conversationId];
      const updatedConvo = { ...convo, unreadCount: 0 };
      
      newState = { 
        ...state, 
        activeConversationId: conversationId, 
        conversations: { ...state.conversations, [conversationId]: updatedConvo } 
      };
      break;
    }

    case 'END_CONVERSATION': {
        const { [action.payload]: _, ...remainingConvos } = state.conversations;
        newState = {
            ...state,
            conversations: remainingConvos,
            activeConversationId: state.activeConversationId === action.payload ? null : state.activeConversationId
        };
        break;
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }

  if (newState.conversations) {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(newState.conversations));
  }
  return newState;
}

export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const socketRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token || socketRef.current) return;

    const socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:5000", { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Agent Dashboard connected to Socket.IO with ID:', socket.id);
      socket.emit('agent-listening');
      const existingIds = Object.keys(state.conversations);
      if(existingIds.length > 0) {
        socket.emit('agent-reconnected', { conversationIds: existingIds });
      }
    });
    
    // --- These listeners are now correctly set up ONCE ---
    socket.on('initial-requests', (requests) => dispatch({ type: 'SET_INITIAL_REQUESTS', payload: requests }));
    socket.on('agent-request', (req) => dispatch({ type: 'ADD_REQUEST', payload: req }));
    socket.on('request-claimed', ({ userId }) => dispatch({ type: 'REMOVE_REQUEST', payload: { userId } }));
    socket.on('chat-assigned', (convo) => dispatch({ type: 'ADD_CONVERSATION', payload: convo }));
    socket.on('user-message', ({ userId, message, channel }) => {
        dispatch({ type: 'ADD_MESSAGE', payload: { userId, text: message, sender: 'user', channel } })
    });
    socket.on('user-left-chat', ({ userId }) => {
        // This is a good practice: notify agent when user ends chat
        dispatch({ type: 'ADD_MESSAGE', payload: { userId, text: "User has left the chat.", sender: 'system' } });
    });


    return () => {
        if (socket) {
            console.log("Disconnecting agent socket on cleanup.");
            socket.disconnect();
            socketRef.current = null;
        }
    };
    // =================================================================
    // *** THE CRITICAL FIX IS HERE ***
    // The dependency array is changed from [state.conversations] to [].
    // This ensures the socket connects ONCE and stays connected,
    // preventing missed events due to unnecessary reconnections.
    // =================================================================
  }, []);

  const value = {
    socket: socketRef.current,
    requests: state.requests,
    pendingRequests: state.requests,
    conversations: Object.values(state.conversations).sort((a,b) => new Date(b.messages.at(-1)?.timestamp) - new Date(a.messages.at(-1)?.timestamp)),
    activeConversation: state.conversations[state.activeConversationId] || null,
    
    acceptChat: (request) => {
      const socket = socketRef.current;
      if (!socket || !request || !request.userId) {
        console.error("❌ Cannot accept chat. Socket not ready or request invalid.", { socket, request });
        return;
      }
      
      console.log(`✅ Emitting 'agent-linked' for user: ${request.userId}`);

      socket.emit('agent-linked', {
        userId: request.userId,
        agentSocketId: socket.id,
        initialMessage: request.message,
        channel: request.channel // Pass the channel through
      });

      dispatch({ type: 'REMOVE_REQUEST', payload: { userId: request.userId } });
    },
    
    viewConversation: (userId) => dispatch({ type: 'VIEW_CONVERSATION', payload: userId }),
    
    sendMessage: (text) => {
      if (!state.activeConversationId || !socketRef.current) return;
      const userId = state.activeConversationId;
      socketRef.current.emit('agent-reply', { userId, message: text });
      dispatch({ type: 'ADD_MESSAGE', payload: { userId, text, sender: 'agent' } });
    },

    endChat: (userId) => {
      if (!socketRef.current) return;
      socketRef.current.emit('end-chat', { userId });
      dispatch({ type: 'END_CONVERSATION', payload: userId });
    }
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);