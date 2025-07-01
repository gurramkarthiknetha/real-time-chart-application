import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import styled from 'styled-components';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';

const SERVER_URL = 'http://localhost:5000';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
`;

const ChatHeader = styled.div`
  background-color: #4a5568;
  color: white;
  padding: 15px;
  border-radius: 10px 10px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatMain = styled.div`
  display: flex;
  height: calc(100vh - 180px);
  border: 1px solid #e2e8f0;
  border-top: none;
  border-bottom: none;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
`;

const SidePanel = styled.div`
  width: 250px;
  background-color: #edf2f7;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
`;

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    // Connection status
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');

      // Ask for username if not set
      if (!username) {
        const name = prompt('Enter your username:') || 'Anonymous';
        setUsername(name);
        socket.emit('join_chat', name);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    // Message handling
    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // User joined notification
    socket.on('user_joined', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'system',
          username: 'System',
          message: data.message,
          timestamp: new Date().toISOString()
        }
      ]);
    });

    // User left notification
    socket.on('user_left', (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: 'system',
          username: 'System',
          message: data.message,
          timestamp: new Date().toISOString()
        }
      ]);
    });

    // Update users list
    socket.on('users_list', (usersList) => {
      setUsers(usersList);
    });

    // Typing indicator
    socket.on('user_typing', (data) => {
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
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receive_message');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('users_list');
      socket.off('user_typing');
    };
  }, [socket, username]);

  // Send a message
  const sendMessage = (messageText) => {
    if (!socket || !messageText.trim()) return;

    socket.emit('send_message', { message: messageText });
  };

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (!socket) return;
    socket.emit('typing', isTyping);
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <h1>chart application</h1>
        <div>
          {isConnected ? (
            <span style={{ color: '#48bb78' }}>●</span>
          ) : (
            <span style={{ color: '#f56565' }}>●</span>
          )}
          {isConnected ? ' Connected' : ' Disconnected'}
        </div>
      </ChatHeader>
      <ChatMain>
        <SidePanel>
          <UserList users={users} currentUser={socket?.id} />
        </SidePanel>
        <MainContent>
          <MessageList
            messages={messages}
            currentUser={socket?.id}
            typingUsers={typingUsers}
          />
          <MessageInput
            sendMessage={sendMessage}
            onTyping={handleTyping}
          />
        </MainContent>
      </ChatMain>
    </ChatContainer>
  );
};

export default Chat;
