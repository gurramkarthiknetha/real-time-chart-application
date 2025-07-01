import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

/**
 * Custom hook to access the chat context
 * @returns {Object} Chat context values and methods
 */
export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
};
