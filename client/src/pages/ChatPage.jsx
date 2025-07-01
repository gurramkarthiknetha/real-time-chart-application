import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import { useNotification } from '../hooks/useNotification';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import RoomList from '../components/RoomList';
import ConversationList from '../components/ConversationList';
import CreateRoomModal from '../components/CreateRoomModal';
import { toast } from 'react-toastify';

const ChatPageContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
`;

const ChatPage = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    connected,
    socket,
    rooms,
    conversations,
    currentRoom,
    currentConversation,
    joinRoom,
    openConversation,
    fetchRooms,
    fetchConversations
  } = useChat();
  const { supported, permission, requestPermission } = useNotification();

  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' or 'conversations'

  // Request notification permission
  useEffect(() => {
    if (supported && permission !== 'granted' && permission !== 'denied') {
      requestPermission();
    }
  }, [supported, permission, requestPermission]);

  // Fetch rooms and conversations when authenticated - only once when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      // Use a small delay to ensure everything is properly initialized
      const timer = setTimeout(() => {
        fetchRooms();
        fetchConversations();
      }, 500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Intentionally omitting fetchRooms and fetchConversations to prevent infinite loops

  // Show connection status and handle reconnection
  useEffect(() => {
    if (connected) {
      toast.success('Connected to chat server');
    } else {
      toast.error('Disconnected from chat server. Trying to reconnect...');

      // Attempt to reconnect after a delay
      const reconnectTimer = setTimeout(() => {
        if (socket && !connected) {
          console.log('Attempting to reconnect to server...');
          socket.connect();
        }
      }, 5000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [connected, socket]);

  // Handle room selection
  const handleRoomSelect = (roomId) => {
    joinRoom(roomId);
    setActiveTab('rooms');
  };

  // Handle conversation selection
  const handleConversationSelect = (userId) => {
    openConversation(userId);
    setActiveTab('conversations');
  };

  // Handle create room
  const handleCreateRoom = () => {
    setShowCreateRoomModal(true);
  };

  // Handle room created
  const handleRoomCreated = (room) => {
    setShowCreateRoomModal(false);
    joinRoom(room._id);
    setActiveTab('rooms');
  };

  return (
    <ChatPageContainer>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCreateRoom={handleCreateRoom}
      >
        {activeTab === 'rooms' ? (
          <RoomList
            rooms={rooms}
            currentRoom={currentRoom}
            onRoomSelect={handleRoomSelect}
          />
        ) : (
          <ConversationList
            conversations={conversations}
            currentConversation={currentConversation}
            onConversationSelect={handleConversationSelect}
          />
        )}
      </Sidebar>

      <ChatArea
        currentRoom={currentRoom}
        currentConversation={currentConversation}
      />

      {showCreateRoomModal && (
        <CreateRoomModal
          onClose={() => setShowCreateRoomModal(false)}
          onRoomCreated={handleRoomCreated}
        />
      )}
    </ChatPageContainer>
  );
};

export default ChatPage;
