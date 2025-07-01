import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaPaperPlane, FaSmile, FaPaperclip, FaTimes } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import { validateFile, formatFileSize } from '../utils/fileUtils';

const InputContainer = styled.div`
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #e2e8f0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background-color: #f1f5f9;
  border-radius: 1.5rem;
  padding: 0 0.75rem;
  transition: all 0.2s;

  &:focus-within {
    background-color: #f8fafc;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  outline: none;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: ${props => props.primary ? '#3b82f6' : 'transparent'};
  color: ${props => props.primary ? 'white' : '#64748b'};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.primary ? '#2563eb' : '#f1f5f9'};
    color: ${props => props.primary ? 'white' : '#3b82f6'};
  }

  &:disabled {
    background-color: ${props => props.primary ? '#93c5fd' : '#f1f5f9'};
    color: ${props => props.primary ? 'white' : '#cbd5e1'};
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const EmojiPickerContainer = styled.div`
  position: absolute;
  bottom: 3.5rem;
  right: 0;
  z-index: 10;
`;

const ReplyPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: #f8fafc;
  border-left: 3px solid #3b82f6;
  margin-bottom: 0.75rem;
  border-radius: 0.5rem;
`;

const ReplyInfo = styled.div`
  flex: 1;
  overflow: hidden;
`;

const ReplyTo = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #3b82f6;
  margin-bottom: 0.25rem;
`;

const ReplyText = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: 0.5rem;

  &:hover {
    color: #64748b;
  }
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: #f8fafc;
  margin-bottom: 0.75rem;
  border-radius: 0.5rem;
  border: 1px dashed #cbd5e1;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  overflow: hidden;
`;

const FileIcon = styled.div`
  font-size: 1.5rem;
  color: #3b82f6;
`;

const FileDetails = styled.div`
  flex: 1;
  overflow: hidden;
`;

const FileName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [file, setFile] = useState(null);

  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle typing indicator
  useEffect(() => {
    if (message && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 1000);

    // Cleanup
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() && !file) return;

    onSendMessage(message, replyTo, file);
    setMessage('');
    setReplyTo(null);
    setFile(null);
    setIsTyping(false);
    onTyping(false);
  };

  const handleEmojiSelect = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validation = validateFile(selectedFile);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <InputContainer>
      <Form onSubmit={handleSubmit}>
        {replyTo && (
          <ReplyPreview>
            <ReplyInfo>
              <ReplyTo>Replying to {replyTo.sender.username}</ReplyTo>
              <ReplyText>{replyTo.content}</ReplyText>
            </ReplyInfo>
            <CloseButton onClick={() => setReplyTo(null)}>
              <FaTimes />
            </CloseButton>
          </ReplyPreview>
        )}

        {file && (
          <FilePreview>
            <FileInfo>
              <FileIcon>
                {file.type.startsWith('image/') ? '🖼️' :
                 file.type.startsWith('video/') ? '🎬' :
                 file.type.startsWith('audio/') ? '🎵' : '📄'}
              </FileIcon>
              <FileDetails>
                <FileName>{file.name}</FileName>
                <FileSize>{formatFileSize(file.size)}</FileSize>
              </FileDetails>
            </FileInfo>
            <CloseButton onClick={() => setFile(null)}>
              <FaTimes />
            </CloseButton>
          </FilePreview>
        )}

        <InputRow>
          <InputWrapper>
            <Input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              autoFocus
            />

            <IconButton
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <FaSmile />
            </IconButton>

            {showEmojiPicker && (
              <EmojiPickerContainer>
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width={300}
                  height={400}
                />
              </EmojiPickerContainer>
            )}
          </InputWrapper>

          <ActionButtons>
            <IconButton
              type="button"
              onClick={handleFileButtonClick}
            >
              <FaPaperclip />
            </IconButton>

            <IconButton
              type="submit"
              primary
              disabled={!message.trim() && !file}
            >
              <FaPaperPlane />
            </IconButton>
          </ActionButtons>

          <FileInput
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
        </InputRow>
      </Form>
    </InputContainer>
  );
};

export default MessageInput;
