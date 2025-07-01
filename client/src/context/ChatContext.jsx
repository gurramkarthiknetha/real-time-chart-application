import { createContext, useState, useEffect, useRef, useContext, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from './AuthContext';

export const ChatContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.timeout = 30000; // 30 seconds default timeout

export const ChatProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);

  // Initialize socket connection with error handling
  useEffect(() => {
    try {
      console.log(`Connecting to socket server at: ${SOCKET_URL}`);

      // Add connection options with timeout and reconnection settings
      const newSocket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true
      });

      // Handle connection errors
      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        toast.error(`Connection error: ${err.message}. Retrying...`);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (error) {
      console.error('Error initializing socket:', error);
      toast.error('Failed to connect to chat server. Please refresh the page.');
    }

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Handle socket connection and authentication
  useEffect(() => {
    if (!socket) return;

    // Connection status
    const handleConnect = () => {
      setConnected(true);
      console.log('Connected to server');

      // Authenticate if user is logged in
      if (isAuthenticated && token) {
        socket.emit('authenticate', { token });
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
      console.log('Disconnected from server');
    };

    const handleAuthenticated = (data) => {
      console.log('Socket authenticated:', data.user.username);
    };

    const handleAuthError = (error) => {
      console.error('Socket authentication error:', error);
    };

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('authenticated', handleAuthenticated);
    socket.on('auth_error', handleAuthError);

    // If already connected, authenticate immediately
    if (socket.connected && isAuthenticated && token) {
      socket.emit('authenticate', { token });
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('authenticated', handleAuthenticated);
      socket.off('auth_error', handleAuthError);
    };
  }, [socket, isAuthenticated, token]);

  // Fetch rooms when authenticated - using a ref to prevent infinite loops
  const initialFetchDoneRef = useRef(false);
  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    // Only fetch data if authenticated and not already fetched
    if (isAuthenticated && !initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;

      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      // Stagger the API calls to prevent resource contention
      const fetchData = async () => {
        try {
          console.log('Starting initial data fetch...');
          await fetchRooms();
          // Wait a short delay before the next request
          await new Promise(resolve => setTimeout(resolve, 1000));
          await fetchConversations();
          console.log('Initial data fetch completed');
        } catch (error) {
          console.error('Error during initial data fetch:', error);
          // Reset the fetch flag if there was an error, but wait a bit
          fetchTimeoutRef.current = setTimeout(() => {
            initialFetchDoneRef.current = false;
          }, 10000); // Wait 10 seconds before allowing another fetch attempt
        }
      };

      // Add a small delay before initial fetch to ensure everything is initialized
      setTimeout(fetchData, 1000);
    }

    // Cleanup function
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Intentionally omitting fetchRooms and fetchConversations to prevent infinite loops

  // Track if a fetch is in progress to prevent multiple concurrent requests
  const fetchInProgressRef = useRef({
    rooms: false,
    conversations: false
  });

  // Track the last fetch time to prevent too frequent fetches
  const lastFetchTimeRef = useRef({
    rooms: 0,
    conversations: 0
  });

  // Minimum time between fetches in milliseconds (5 seconds)
  const MIN_FETCH_INTERVAL = 5000;

  // Fetch rooms with retry logic - memoized with useCallback to prevent infinite loops
  const fetchRooms = useCallback(async (retryCount = 0, maxRetries = 3) => {
    // Prevent concurrent requests
    if (fetchInProgressRef.current.rooms) {
      console.log('Fetch rooms already in progress, skipping...');
      return;
    }

    // Prevent too frequent fetches
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current.rooms;
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL && lastFetchTimeRef.current.rooms !== 0) {
      console.log(`Too soon to fetch rooms again. Last fetch was ${timeSinceLastFetch}ms ago.`);
      return;
    }

    // Update last fetch time
    lastFetchTimeRef.current.rooms = now;
    fetchInProgressRef.current.rooms = true;
    setLoading(true);

    // Create a unique identifier for this fetch operation
    const fetchId = now;
    console.log(`[${fetchId}] Fetching rooms from: ${API_URL}/rooms`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[${fetchId}] Fetch rooms timeout reached, aborting`);
        controller.abort();
      }, 15000); // 15 second timeout

      const res = await axios.get(`${API_URL}/rooms`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });

      clearTimeout(timeoutId);
      console.log(`[${fetchId}] Fetch rooms successful, got ${res.data.length} rooms`);
      setRooms(res.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error(`[${fetchId}] Error fetching rooms:`, err);

      // Only retry if this wasn't an abort
      if (err.name !== 'AbortError' && retryCount < maxRetries) {
        const delay = Math.min(3000 * Math.pow(2, retryCount), 30000); // Exponential backoff with max 30s
        console.log(`[${fetchId}] Retrying fetchRooms (${retryCount + 1}/${maxRetries}) after ${delay}ms...`);

        // Use a timeout for retry and make sure we clear it if component unmounts
        const retryTimeoutId = setTimeout(() => {
          fetchRooms(retryCount + 1, maxRetries);
        }, delay);

        // Store the timeout ID in a ref so we can clear it if needed
        fetchTimeoutRef.current = retryTimeoutId;
        return;
      }

      // If all retries failed
      const errorMessage = 'Failed to fetch rooms. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      fetchInProgressRef.current.rooms = false;
      console.log(`[${fetchId}] Fetch rooms operation completed`);
    }
  }, []);

  // Create a new room
  const createRoom = async (roomData) => {
    setLoading(true);
    try {
      console.log(`Creating room at: ${API_URL}/rooms`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const res = await axios.post(`${API_URL}/rooms`, roomData, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });

      clearTimeout(timeoutId);

      // Make sure we have a valid response
      if (res.data && res.data._id) {
        // Update rooms state with the new room
        setRooms(prevRooms => [...prevRooms, res.data]);
        toast.success('Room created successfully!');

        // Return the created room
        return res.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      let message = 'Failed to create room. Please try again.';

      if (err.name === 'AbortError') {
        message = 'Request timed out. Please try again.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Join a room
  const joinRoom = (roomId) => {
    if (!socket) return;

    // Leave current room if any
    if (currentRoom) {
      socket.emit('leave_room', { roomId: currentRoom._id });
    }

    // Join new room
    socket.emit('join_room', { roomId });

    // Find room in state
    const room = rooms.find(r => r._id === roomId);
    setCurrentRoom(room);

    // Fetch messages for this room
    fetchRoomMessages(roomId);
  };

  // Fetch messages for a room
  const fetchRoomMessages = async (roomId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/messages/room/${roomId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Error fetching room messages:', err);
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  // Send message to room
  const sendRoomMessage = (content, replyTo = null, file = null) => {
    if (!socket || !currentRoom) return;

    const messageData = {
      roomId: currentRoom._id,
      content,
      replyTo,
      file
    };

    socket.emit('send_room_message', messageData);
  };

  // Fetch conversations with retry logic - memoized with useCallback to prevent infinite loops
  const fetchConversations = useCallback(async (retryCount = 0, maxRetries = 3) => {
    // Prevent concurrent requests
    if (fetchInProgressRef.current.conversations) {
      console.log('Fetch conversations already in progress, skipping...');
      return;
    }

    // Prevent too frequent fetches
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current.conversations;
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL && lastFetchTimeRef.current.conversations !== 0) {
      console.log(`Too soon to fetch conversations again. Last fetch was ${timeSinceLastFetch}ms ago.`);
      return;
    }

    // Update last fetch time
    lastFetchTimeRef.current.conversations = now;
    fetchInProgressRef.current.conversations = true;
    setLoading(true);

    // Create a unique identifier for this fetch operation
    const fetchId = now;
    console.log(`[${fetchId}] Fetching conversations from: ${API_URL}/messages/conversations`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[${fetchId}] Fetch conversations timeout reached, aborting`);
        controller.abort();
      }, 15000); // 15 second timeout

      const res = await axios.get(`${API_URL}/messages/conversations`, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });

      clearTimeout(timeoutId);
      console.log(`[${fetchId}] Fetch conversations successful, got ${res.data.length} conversations`);
      setConversations(res.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error(`[${fetchId}] Error fetching conversations:`, err);

      // Only retry if this wasn't an abort
      if (err.name !== 'AbortError' && retryCount < maxRetries) {
        const delay = Math.min(3000 * Math.pow(2, retryCount), 30000); // Exponential backoff with max 30s
        console.log(`[${fetchId}] Retrying fetchConversations (${retryCount + 1}/${maxRetries}) after ${delay}ms...`);

        // Use a timeout for retry and make sure we clear it if component unmounts
        const retryTimeoutId = setTimeout(() => {
          fetchConversations(retryCount + 1, maxRetries);
        }, delay);

        // Store the timeout ID in a ref so we can clear it if needed
        fetchTimeoutRef.current = retryTimeoutId;
        return;
      }

      // If all retries failed
      const errorMessage = 'Failed to fetch conversations. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      fetchInProgressRef.current.conversations = false;
      console.log(`[${fetchId}] Fetch conversations operation completed`);
    }
  }, []);

  // Start or open a conversation
  const openConversation = async (userId) => {
    // Find if conversation already exists
    const existingConv = conversations.find(
      c => c.recipient._id === userId
    );

    if (existingConv) {
      setCurrentConversation(existingConv);
      fetchConversationMessages(userId);
      return;
    }

    // If not, we'll create it when sending the first message
    try {
      const userRes = await axios.get(`${API_URL}/users/${userId}`);
      setCurrentConversation({
        recipient: userRes.data,
        messages: []
      });
    } catch (err) {
      console.error('Error opening conversation:', err);
      toast.error('Failed to open conversation');
    }
  };

  // Fetch messages for a conversation
  const fetchConversationMessages = async (userId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/messages/conversation/${userId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  // Send direct message
  const sendDirectMessage = (recipientId, content, replyTo = null, file = null) => {
    if (!socket) return;

    const messageData = {
      recipientId,
      content,
      replyTo,
      file
    };

    socket.emit('send_direct_message', messageData);
  };

  // Add reaction to message
  const addReaction = (messageId, emoji) => {
    if (!socket) return;

    socket.emit('add_reaction', { messageId, emoji });
  };

  // Mark messages as read
  const markMessagesAsRead = (messageIds) => {
    if (!socket) return;

    socket.emit('mark_messages_read', { messageIds });
  };

  // Handle typing indicator
  const sendTypingStatus = (isTyping, roomId = null, conversationId = null) => {
    if (!socket) return;

    socket.emit('typing', { roomId, conversationId, isTyping });
  };

  // Listen for incoming messages and events
  useEffect(() => {
    if (!socket) return;

    // Room messages
    socket.on('receive_room_message', (message) => {
      if (currentRoom && message.roomId === currentRoom._id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Direct messages
    socket.on('receive_direct_message', (message) => {
      if (currentConversation &&
          (message.sender._id === currentConversation.recipient._id ||
           message.conversationId === currentConversation._id)) {
        setMessages((prev) => [...prev, message]);

        // Mark as read if it's from the other person
        if (message.sender._id !== user._id) {
          markMessagesAsRead([message._id]);
        }
      } else {
        // Show notification for messages not in current conversation
        if (message.sender._id !== user._id) {
          toast.info(`New message from ${message.sender.username}`);
        }
      }
    });

    // Typing indicators
    socket.on('user_typing', (data) => {
      if ((currentRoom && data.roomId === currentRoom._id) ||
          (currentConversation && data.conversationId === currentConversation._id)) {
        if (data.isTyping) {
          setTypingUsers((prev) => ({
            ...prev,
            [data.id]: data.username
          }));
        } else {
          setTypingUsers((prev) => {
            const newState = { ...prev };
            delete newState[data.id];
            return newState;
          });
        }
      }
    });

    // Message reactions
    socket.on('message_reaction_updated', (data) => {
      setMessages((prev) =>
        prev.map(msg =>
          msg._id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    });

    return () => {
      socket.off('receive_room_message');
      socket.off('receive_direct_message');
      socket.off('user_typing');
      socket.off('message_reaction_updated');
    };
  }, [socket, currentRoom, currentConversation, user]);

  return (
    <ChatContext.Provider
      value={{
        socket,
        connected,
        rooms,
        currentRoom,
        conversations,
        currentConversation,
        messages,
        users,
        typingUsers,
        loading,
        error,
        createRoom,
        joinRoom,
        sendRoomMessage,
        openConversation,
        sendDirectMessage,
        addReaction,
        markMessagesAsRead,
        sendTypingStatus,
        fetchRooms,
        fetchConversations
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
