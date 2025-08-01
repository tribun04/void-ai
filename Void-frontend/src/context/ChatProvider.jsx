import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { io } from 'socket.io-client';

const CHAT_STORAGE_KEY = 'agentActiveChats';

const ChatContext = createContext();

const initialConversations = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)) || {};

const initialState = {
  requests: [],
  conversations: initialConversations,
  activeConversationId: null
};

function chatReducer(state, action) {
  let newState;
  switch (action.type) {
    case 'ADD_REQUEST':
      if (state.requests.some(req => req.userId === action.payload.userId)) return state;
      newState = { ...state, requests: [action.payload, ...state.requests] };
      break;
    
    case 'REMOVE_REQUEST':
      newState = { ...state, requests: state.requests.filter(req => req.userId !== action.payload.userId) };
      break;

    case 'ADD_CONVERSATION': {
      const { userId, initialMessage } = action.payload;
      if (state.conversations[userId]) return state;
      const newConversation = {
        id: userId,
        initialMessage: initialMessage,
        messages: [],
        unread: 0,
      };
      newState = {
        ...state,
        conversations: { ...state.conversations, [userId]: newConversation },
        activeConversationId: userId,
      };
      break;
    }

    // ✅ --- THE DEFINITIVE FIX IS HERE ---
    case 'ADD_MESSAGE': {
      const { userId, text, sender } = action.payload; // Destructure the payload directly
      const targetConversation = state.conversations[userId];
      
      if (!targetConversation) return state;

      const newConversations = { ...state.conversations };
      newConversations[userId] = {
        ...targetConversation,
        // Add the new message object to the array
        messages: [...targetConversation.messages, { text, sender }],
        unread: state.activeConversationId !== userId && sender === 'user' ? targetConversation.unread + 1 : 0,
      };

      newState = { ...state, conversations: newConversations };
      break;
    }
    
    case 'SET_ACTIVE_CONVERSATION': {
      const conversationId = action.payload;
      if (!state.conversations[conversationId]) return state;
      const convo = state.conversations[conversationId];
      const updatedConvo = { ...convo, unread: 0 };
      newState = { ...state, activeConversationId: conversationId, conversations: { ...state.conversations, [conversationId]: updatedConvo } };
      break;
    }

    case 'END_CONVERSATION': {
        const conversationId = action.payload;
        const { [conversationId]: _, ...remainingConvos } = state.conversations;
        newState = {
            ...state,
            conversations: remainingConvos,
            activeConversationId: state.activeConversationId === conversationId ? null : state.activeConversationId
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
    if (!token) return;

    socketRef.current = io("http://localhost:5000", { auth: { token } });

    socketRef.current.on('connect', () => {
      console.log('✅ Agent Dashboard connected.');
      socketRef.current.emit('agent-listening');
      const existingIds = Object.keys(state.conversations);
      if(existingIds.length > 0) {
        socketRef.current.emit('agent-reconnected', { conversationIds: existingIds });
      }
    });
    
    socketRef.current.on('agent-request', (req) => dispatch({ type: 'ADD_REQUEST', payload: req }));
    socketRef.current.on('request-claimed', ({ userId }) => dispatch({ type: 'REMOVE_REQUEST', payload: { userId } }));
    socketRef.current.on('chat-assigned', (convo) => dispatch({ type: 'ADD_CONVERSATION', payload: convo }));
    
    // ✅ --- THE LISTENER IS NOW CORRECT ---
    socketRef.current.on('user-message', ({ userId, message }) => {
      // The payload for ADD_MESSAGE now matches the destructured properties.
      dispatch({ type: 'ADD_MESSAGE', payload: { userId, text: message, sender: 'user' } });
    });

    return () => socketRef.current.disconnect();
  }, []);

  const value = {
    requests: state.requests,
    conversations: Object.values(state.conversations),
    activeConversationId: state.activeConversationId,
    activeConversation: state.conversations[state.activeConversationId] || null,

    acceptRequest: (request) => {
      socketRef.current.emit('agent-linked', {
        userId: request.userId,
        agentSocketId: socketRef.current.id,
        initialMessage: request.message
      });
    },
    selectConversation: (userId) => dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: userId }),
    
    // ✅ --- SEND MESSAGE IS NOW CORRECT ---
    sendMessage: (text) => {
      if (!state.activeConversationId) return;

      const userId = state.activeConversationId;
      socketRef.current.emit('agent-reply', { userId, message: text });
      
      // The payload for the agent's own message also matches the reducer.
      dispatch({ type: 'ADD_MESSAGE', payload: { userId, text, sender: 'agent' } });
    },
    endChat: (userId) => {
        socketRef.current.emit('end-chat', { userId });
        dispatch({ type: 'END_CONVERSATION', payload: userId });
    }
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChat = () => useContext(ChatContext);