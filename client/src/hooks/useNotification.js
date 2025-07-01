import { useState, useEffect } from 'react';

/**
 * Custom hook to handle browser notifications
 * @returns {Object} Notification methods and state
 */
export const useNotification = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Request permission for notifications
  const requestPermission = async () => {
    if (!supported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Show a notification
  const showNotification = (title, options = {}) => {
    if (!supported || permission !== 'granted') return null;
    
    try {
      const notification = new Notification(title, {
        icon: '/notification-icon.png',
        badge: '/notification-badge.png',
        ...options
      });
      
      // Handle notification click
      notification.onclick = options.onClick || (() => {
        window.focus();
        notification.close();
      });
      
      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  };

  return {
    supported,
    permission,
    requestPermission,
    showNotification
  };
};
