import styled from 'styled-components';
import { FaCircle, FaComments } from 'react-icons/fa';
import { formatRelativeTime } from '../utils/dateUtils';

const ConversationListContainer = styled.div`
  padding: 1rem;
`;

const ConversationListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  margin: 0;
`;

const ConversationCount = styled.span`
  font-size: 0.75rem;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
`;

const ConversationListItems = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ConversationItem = styled.div`
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: ${props => props.active ? '#e0f2fe' : 'transparent'};
  border: 1px solid ${props => props.active ? '#bae6fd' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? '#e0f2fe' : '#f1f5f9'};
  }
`;

const ConversationItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
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

const ConversationInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const RecipientName = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LastMessageTime = styled.span`
  font-size: 0.75rem;
  color: #64748b;
`;

const LastMessage = styled.p`
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadBadge = styled.div`
  background-color: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: #94a3b8;
`;

const EmptyStateIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
`;

const EmptyStateText = styled.p`
  font-size: 0.875rem;
  margin: 0;
`;

const ConversationList = ({ 
  conversations = [], 
  currentConversation, 
  onConversationSelect 
}) => {
  // Get initials for avatar placeholder
  const getInitials = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  };
  
  // Handle conversation click
  const handleConversationClick = (userId) => {
    onConversationSelect(userId);
  };
  
  // Format last message preview
  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet';
    
    if (message.file) {
      const fileType = message.file.mimetype.split('/')[0];
      switch (fileType) {
        case 'image':
          return '🖼️ Image';
        case 'video':
          return '🎬 Video';
        case 'audio':
          return '🎵 Audio';
        default:
          return '📎 File';
      }
    }
    
    return message.content;
  };
  
  return (
    <ConversationListContainer>
      <ConversationListHeader>
        <Title>Conversations</Title>
        <ConversationCount>{conversations.length}</ConversationCount>
      </ConversationListHeader>
      
      {conversations.length > 0 ? (
        <ConversationListItems>
          {conversations.map(conversation => (
            <ConversationItem 
              key={conversation._id} 
              active={currentConversation && 
                (currentConversation._id === conversation._id || 
                 currentConversation.recipient._id === conversation.recipient._id)}
              onClick={() => handleConversationClick(conversation.recipient._id)}
            >
              <ConversationItemHeader>
                <Avatar bg={!conversation.recipient.avatar ? 
                  `hsl(${conversation.recipient.username.charCodeAt(0) * 10}, 70%, 50%)` : undefined}>
                  {conversation.recipient.avatar ? (
                    <img src={conversation.recipient.avatar} alt={conversation.recipient.username} />
                  ) : (
                    getInitials(conversation.recipient.username)
                  )}
                  <StatusIndicator online={conversation.recipient.status === 'online'} />
                </Avatar>
                
                <ConversationInfo>
                  <RecipientName>{conversation.recipient.username}</RecipientName>
                  {conversation.lastMessage && (
                    <LastMessageTime>
                      {formatRelativeTime(conversation.lastMessage.createdAt)}
                    </LastMessageTime>
                  )}
                </ConversationInfo>
                
                {conversation.unreadCount > 0 && (
                  <UnreadBadge>{conversation.unreadCount}</UnreadBadge>
                )}
              </ConversationItemHeader>
              
              <LastMessage>
                {formatLastMessage(conversation.lastMessage)}
              </LastMessage>
            </ConversationItem>
          ))}
        </ConversationListItems>
      ) : (
        <EmptyState>
          <EmptyStateIcon>
            <FaComments />
          </EmptyStateIcon>
          <EmptyStateText>No conversations yet</EmptyStateText>
          <EmptyStateText>Start chatting with someone</EmptyStateText>
        </EmptyState>
      )}
    </ConversationListContainer>
  );
};

export default ConversationList;
