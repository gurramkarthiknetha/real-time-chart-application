import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { formatTime, formatDate, formatMessageDate } from '../utils/dateUtils';
import { getFileType } from '../utils/fileUtils';
import { FaReply, FaSmile } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

const MessageListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
`;

const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  margin: 1rem 0;

  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e2e8f0;
  }
`;

const DateLabel = styled.span`
  font-size: 0.75rem;
  color: #64748b;
  padding: 0 0.75rem;
`;

const MessageGroup = styled.div`
  margin-bottom: 1rem;
`;

const MessageItem = styled.div`
  max-width: 70%;
  margin-bottom: 0.25rem;
  position: relative;

  ${({ isCurrentUser }) => isCurrentUser ? `
    align-self: flex-end;
    margin-left: auto;
  ` : `
    align-self: flex-start;
  `}
`;

const MessageContent = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  position: relative;

  ${({ isCurrentUser }) => isCurrentUser ? `
    background-color: #3b82f6;
    color: white;
    border-bottom-right-radius: 0.25rem;
  ` : `
    background-color: #f1f5f9;
    color: #1e293b;
    border-bottom-left-radius: 0.25rem;
  `}

  ${({ isSystem }) => isSystem && `
    background-color: #f8fafc;
    color: #64748b;
    border: 1px dashed #cbd5e1;
    font-style: italic;
    text-align: center;
    max-width: 100%;
    margin: 0 auto;
    border-radius: 0.5rem;
  `}
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const SenderName = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(255, 255, 255, 0.9)' : '#1e293b'};
`;

const MessageTime = styled.span`
  font-size: 0.75rem;
  color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : '#64748b'};
  margin-left: 0.5rem;
`;

const MessageText = styled.div`
  word-break: break-word;
  white-space: pre-wrap;
`;

const ReplyContainer = styled.div`
  padding: 0.5rem;
  border-left: 3px solid ${({ isCurrentUser }) => isCurrentUser ? 'rgba(255, 255, 255, 0.5)' : '#cbd5e1'};
  background-color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.5)'};
  border-radius: 0.25rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const ReplyHeader = styled.div`
  font-weight: 600;
  font-size: 0.75rem;
  color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(255, 255, 255, 0.9)' : '#64748b'};
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ReplyText = styled.div`
  color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(255, 255, 255, 0.9)' : '#475569'};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;

const FileContainer = styled.div`
  margin-top: 0.5rem;
  border-radius: 0.5rem;
  overflow: hidden;
  max-width: 300px;
`;

const ImageFile = styled.img`
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 0.5rem;
  cursor: pointer;
`;

const VideoFile = styled.video`
  width: 100%;
  max-height: 300px;
  border-radius: 0.5rem;
  cursor: pointer;
`;

const AudioFile = styled.audio`
  width: 100%;
  margin-top: 0.5rem;
`;

const DocumentFile = styled.a`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.5)'};
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;

  &:hover {
    background-color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.7)'};
  }
`;

const FileIcon = styled.div`
  font-size: 1.5rem;
`;

const FileInfo = styled.div`
  flex: 1;
  overflow: hidden;
`;

const FileName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 0.75rem;
  color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : '#64748b'};
`;

const ReactionsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

const ReactionBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  background-color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.7)'};
  color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(255, 255, 255, 0.9)' : '#475569'};
  cursor: pointer;

  &:hover {
    background-color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.9)'};
  }
`;

const ReactionEmoji = styled.span`
  font-size: 1rem;
`;

const ReactionCount = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
`;

const MessageActions = styled.div`
  position: absolute;
  top: 0.5rem;
  ${({ isCurrentUser }) => isCurrentUser ? 'left: -2.5rem;' : 'right: -2.5rem;'}
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;

  ${MessageItem}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f8fafc;
    color: #3b82f6;
  }
`;

const EmojiPickerContainer = styled.div`
  position: absolute;
  bottom: 2.5rem;
  ${({ isCurrentUser }) => isCurrentUser ? 'left: 0;' : 'right: 0;'}
  z-index: 10;
`;

const ReadReceipt = styled.div`
  font-size: 0.75rem;
  color: ${({ isCurrentUser }) => isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : '#64748b'};
  text-align: right;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
`;

const TypingIndicator = styled.div`
  align-self: flex-start;
  color: #64748b;
  font-style: italic;
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f8fafc;
  border-radius: 1rem;
  font-size: 0.875rem;
`;

const MessageList = ({
  messages = [],
  currentUser,
  typingUsers = {},
  onReaction
}) => {
  const messagesEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.timestamp || message.createdAt || new Date());
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Get typing indicator text
  const getTypingText = () => {
    const typingUsernames = Object.values(typingUsers);
    if (typingUsernames.length === 0) return null;

    if (typingUsernames.length === 1) {
      return `${typingUsernames[0]} is typing...`;
    } else if (typingUsernames.length === 2) {
      return `${typingUsernames[0]} and ${typingUsernames[1]} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emojiData, messageId) => {
    if (onReaction) {
      onReaction(messageId, emojiData.emoji);
    }
    setShowEmojiPicker(null);
  };

  // Group reactions by emoji
  const groupReactions = (reactions) => {
    if (!reactions) return {};
    return reactions.reduce((groups, reaction) => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = [];
      }
      groups[reaction.emoji].push(reaction.user);
      return groups;
    }, {});
  };

  return (
    <MessageListContainer>
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <DateSeparator>
            <DateLabel>{formatDate(dateMessages[0].timestamp || dateMessages[0].createdAt || new Date())}</DateLabel>
          </DateSeparator>

          {dateMessages.map((message, index) => {
            const isCurrentUser = message.sender?._id === currentUser?._id ||
                                 message.id === currentUser?.id ||
                                 message.sender?.id === currentUser?.id;
            const isSystem = message.id === 'system';
            const showSender = index === 0 ||
              (dateMessages[index - 1].sender?._id !== message.sender?._id &&
               dateMessages[index - 1].id !== message.id);

            return (
              <MessageItem
                key={message._id || index}
                isCurrentUser={isCurrentUser}
              >
                <MessageContent
                  isCurrentUser={isCurrentUser}
                  isSystem={isSystem}
                >
                  {showSender && !isSystem && (
                    <MessageHeader>
                      <SenderName isCurrentUser={isCurrentUser}>
                        {isCurrentUser ? 'You' : message.sender?.username || message.username}
                      </SenderName>
                      <MessageTime isCurrentUser={isCurrentUser}>
                        {formatTime(message.timestamp || message.createdAt || new Date())}
                      </MessageTime>
                    </MessageHeader>
                  )}

                  {message.replyTo && (
                    <ReplyContainer isCurrentUser={isCurrentUser}>
                      <ReplyHeader isCurrentUser={isCurrentUser}>
                        <FaReply size={10} />
                        Reply to {message.replyTo.sender.username === currentUser?.username ? 'yourself' : message.replyTo.sender.username}
                      </ReplyHeader>
                      <ReplyText isCurrentUser={isCurrentUser}>
                        {message.replyTo.content}
                      </ReplyText>
                    </ReplyContainer>
                  )}

                  <MessageText>
                    {message.content || message.message}
                  </MessageText>

                  {message.file && (
                    <FileContainer>
                      {getFileType(message.file.mimetype) === 'image' && (
                        <ImageFile
                          src={message.file.url}
                          alt="Shared image"
                          onClick={() => window.open(message.file.url, '_blank')}
                        />
                      )}

                      {getFileType(message.file.mimetype) === 'video' && (
                        <VideoFile controls>
                          <source src={message.file.url} type={message.file.mimetype} />
                          Your browser does not support the video tag.
                        </VideoFile>
                      )}

                      {getFileType(message.file.mimetype) === 'audio' && (
                        <AudioFile controls>
                          <source src={message.file.url} type={message.file.mimetype} />
                          Your browser does not support the audio tag.
                        </AudioFile>
                      )}

                      {getFileType(message.file.mimetype) === 'document' && (
                        <DocumentFile
                          href={message.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          isCurrentUser={isCurrentUser}
                        >
                          <FileIcon>📄</FileIcon>
                          <FileInfo>
                            <FileName>{message.file.originalname}</FileName>
                            <FileSize isCurrentUser={isCurrentUser}>
                              {(message.file.size / 1024).toFixed(1)} KB
                            </FileSize>
                          </FileInfo>
                        </DocumentFile>
                      )}
                    </FileContainer>
                  )}

                  {message.reactions && message.reactions.length > 0 && (
                    <ReactionsContainer>
                      {Object.entries(groupReactions(message.reactions)).map(([emoji, users]) => (
                        <ReactionBadge
                          key={emoji}
                          isCurrentUser={isCurrentUser}
                          onClick={() => onReaction && onReaction(message._id, emoji)}
                        >
                          <ReactionEmoji>{emoji}</ReactionEmoji>
                          <ReactionCount>{users.length}</ReactionCount>
                        </ReactionBadge>
                      ))}
                    </ReactionsContainer>
                  )}
                </MessageContent>

                {message.readBy && message.readBy.length > 0 && isCurrentUser && (
                  <ReadReceipt isCurrentUser={isCurrentUser}>
                    ✓ Read
                  </ReadReceipt>
                )}

                {!isSystem && onReaction && (
                  <MessageActions isCurrentUser={isCurrentUser}>
                    <ActionButton
                      onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                    >
                      <FaSmile />
                    </ActionButton>

                    {showEmojiPicker === message._id && (
                      <EmojiPickerContainer isCurrentUser={isCurrentUser}>
                        <EmojiPicker
                          onEmojiClick={(emojiData) => handleEmojiSelect(emojiData, message._id)}
                          width={300}
                          height={400}
                        />
                      </EmojiPickerContainer>
                    )}
                  </MessageActions>
                )}
              </MessageItem>
            );
          })}
        </div>
      ))}

      {Object.keys(typingUsers).length > 0 && (
        <TypingIndicator>{getTypingText()}</TypingIndicator>
      )}

      <div ref={messagesEndRef} />
    </MessageListContainer>
  );
};

export default MessageList;
