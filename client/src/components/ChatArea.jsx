import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { FaHashtag, FaLock, FaUser, FaCircle } from 'react-icons/fa';

const ChatAreaContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100% - 60px);
  margin-top: 60px; /* Account for fixed header */
  background-color: white;
  position: relative;
`;

const ChatHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ChatIcon = styled.div`
  color: ${props => props.isPrivate ? '#f59e0b' : '#3b82f6'};
  display: flex;
  align-items: center;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.bg || '#3b82f6'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const StatusIndicator = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.online ? '#10b981' : '#94a3b8'};
  border: 2px solid white;
`;

const ChatInfo = styled.div`
  flex: 1;
`;

const ChatName = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChatDescription = styled.p`
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
`;

const ChatContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
`;

const EmptyStateIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.5rem 0;
`;

const EmptyStateText = styled.p`
  font-size: 0.875rem;
  margin: 0;
  max-width: 400px;
`;

const ChatArea = ({ currentRoom, currentConversation }) => {
  const { user } = useAuth();
  const {
    messages,
    typingUsers,
    sendRoomMessage,
    sendDirectMessage,
    sendTypingStatus,
    markMessagesAsRead,
    addReaction
  } = useChat();

  // Mark messages as read when they are displayed
  useEffect(() => {
    if (messages.length > 0 && (currentRoom || currentConversation)) {
      const unreadMessages = messages
        .filter(msg => msg.sender._id !== user?._id && !msg.readBy?.some(r => r.user === user?._id))
        .map(msg => msg._id);

      if (unreadMessages.length > 0) {
        markMessagesAsRead(unreadMessages);
      }
    }
  }, [messages, currentRoom, currentConversation, user, markMessagesAsRead]);

  // Get initials for avatar placeholder
  const getInitials = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  };

  // Handle sending a message
  const handleSendMessage = (content, replyTo = null, file = null) => {
    if (currentRoom) {
      sendRoomMessage(content, replyTo, file);
    } else if (currentConversation) {
      sendDirectMessage(currentConversation.recipient._id, content, replyTo, file);
    }
  };

  // Handle typing indicator
  const handleTyping = (isTyping) => {
    if (currentRoom) {
      sendTypingStatus(isTyping, currentRoom._id);
    } else if (currentConversation) {
      sendTypingStatus(isTyping, null, currentConversation._id);
    }
  };

  // Handle message reaction
  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
  };

  // Render empty state when no chat is selected
  if (!currentRoom && !currentConversation) {
    return (
      <ChatAreaContainer>
        <EmptyState>
          <EmptyStateIcon>💬</EmptyStateIcon>
          <EmptyStateTitle>Welcome to chart application</EmptyStateTitle>
          <EmptyStateText>
            Select a room or conversation to start chatting
          </EmptyStateText>
        </EmptyState>
      </ChatAreaContainer>
    );
  }

  return (
    <ChatAreaContainer>
      <ChatHeader>
        {currentRoom ? (
          <>
            <ChatIcon isPrivate={currentRoom.isPrivate}>
              {currentRoom.isPrivate ? <FaLock size={16} /> : <FaHashtag size={16} />}
            </ChatIcon>
            <ChatInfo>
              <ChatName>
                {currentRoom.name}
              </ChatName>
              {currentRoom.description && (
                <ChatDescription>{currentRoom.description}</ChatDescription>
              )}
            </ChatInfo>
          </>
        ) : currentConversation ? (
          <>
            <Avatar bg={!currentConversation.recipient.avatar ?
              `hsl(${currentConversation.recipient.username.charCodeAt(0) * 10}, 70%, 50%)` : undefined}>
              {currentConversation.recipient.avatar ? (
                <img
                  src={currentConversation.recipient.avatar}
                  alt={currentConversation.recipient.username}
                />
              ) : (
                getInitials(currentConversation.recipient.username)
              )}
              <StatusIndicator
                online={currentConversation.recipient.status === 'online'}
              />
            </Avatar>
            <ChatInfo>
              <ChatName>
                {currentConversation.recipient.username}
                {currentConversation.recipient.status === 'online' && (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <FaCircle size={8} /> Online
                  </span>
                )}
              </ChatName>
            </ChatInfo>
          </>
        ) : null}
      </ChatHeader>

      <ChatContent>
        <MessageList
          messages={messages}
          currentUser={user}
          typingUsers={typingUsers}
          onReaction={handleReaction}
        />
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
        />
      </ChatContent>
    </ChatAreaContainer>
  );
};

export default ChatArea;
