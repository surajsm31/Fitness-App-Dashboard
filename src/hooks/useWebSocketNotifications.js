import { useState, useEffect, useRef, useCallback } from 'react';
import { wsManager, notificationService } from '../services/notificationService.js';

// Format timestamp to relative time
const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  // For older dates, show actual date
  return time.toLocaleDateString();
};

// Map activity types to notification types
const getActivityType = (activityType) => {
  switch (activityType) {
    case 'USER_REGISTERED':
      return 'success';
    case 'PAYMENT_RECEIVED':
      return 'success';
    case 'SUBSCRIPTION_CANCELLED':
      return 'warning';
    case 'SYSTEM_UPDATE':
      return 'info';
    case 'SERVER_ERROR':
      return 'error';
    default:
      return 'info';
  }
};

// Toast notification hook
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      ...notification,
      timestamp: new Date().toISOString(),
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
  };
};

// WebSocket notification hook
export const useWebSocketNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();
  const reconnectTimeoutRef = useRef(null);

  // Process incoming notification data
  const processNotification = useCallback((notificationData) => {
    const processedNotification = {
      id: notificationData.id || Date.now() + Math.random(),
      title: notificationData.title || notificationData.activity_type || 'New Notification',
      message: notificationData.message || notificationData.description || '',
      type: notificationData.type || getActivityType(notificationData.activity_type) || 'info',
      username: notificationData.username || notificationData.user || 'System',
      timestamp: notificationData.timestamp || notificationData.created_at || new Date().toISOString(),
      is_read: notificationData.is_read || notificationData.read || false,
      time: formatRelativeTime(notificationData.timestamp || notificationData.created_at || new Date()),
    };

    return processedNotification;
  }, []);

  // Add new notification to the list
  const addNotification = useCallback((notificationData) => {
    const notification = processNotification(notificationData);
    
    setNotifications(prev => {
      // Check for duplicates
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      // Add to beginning of array
      return [notification, ...prev];
    });

    // Update unread count if notification is unread
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }

    // Show toast for real-time notifications
    addToast({
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });

    return notification;
  }, [processNotification, addToast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => {
        // Remove the notification from the list when marked as read
        const updated = prev.filter(n => n.id !== notificationId);
        return [...updated]; // Force new array reference
      });
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Emit WebSocket event for real-time sync
      console.log('Attempting to emit NOTIFICATION_READ event for ID:', notificationId);
      console.log('WebSocket state:', wsManager.ws?.readyState);
      console.log('WebSocket OPEN state:', WebSocket.OPEN);
      
      if (wsManager.ws && wsManager.ws.readyState === WebSocket.OPEN) {
        const event = {
          type: 'NOTIFICATION_READ',
          notification_id: notificationId,
          timestamp: new Date().toISOString()
        };
        console.log('Sending WebSocket event:', event);
        wsManager.ws.send(JSON.stringify(event));
        console.log('WebSocket event sent successfully');
      } else {
        console.warn('WebSocket not connected, cannot emit event');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still update UI optimistically
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== notificationId);
        return [...updated];
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Still emit WebSocket event for real-time sync
      if (wsManager.ws && wsManager.ws.readyState === WebSocket.OPEN) {
        wsManager.ws.send(JSON.stringify({
          type: 'NOTIFICATION_READ',
          notification_id: notificationId,
          timestamp: new Date().toISOString()
        }));
      }
    }
  }, []);

  // Mark all notifications as read (remove all from list)
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]); // Clear all notifications
      setUnreadCount(0);
      
      // Emit WebSocket event for real-time sync
      console.log('Attempting to emit ALL_NOTIFICATIONS_READ event');
      console.log('WebSocket state:', wsManager.ws?.readyState);
      
      if (wsManager.ws && wsManager.ws.readyState === WebSocket.OPEN) {
        const event = {
          type: 'ALL_NOTIFICATIONS_READ',
          timestamp: new Date().toISOString()
        };
        console.log('Sending ALL_NOTIFICATIONS_READ WebSocket event:', event);
        wsManager.ws.send(JSON.stringify(event));
        console.log('ALL_NOTIFICATIONS_READ event sent successfully');
      } else {
        console.warn('WebSocket not connected, cannot emit ALL_NOTIFICATIONS_READ event');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Still update UI optimistically
      setNotifications([]); // Clear all notifications
      setUnreadCount(0);
      
      // Still emit WebSocket event for real-time sync
      if (wsManager.ws && wsManager.ws.readyState === WebSocket.OPEN) {
        wsManager.ws.send(JSON.stringify({
          type: 'ALL_NOTIFICATIONS_READ',
          timestamp: new Date().toISOString()
        }));
      }
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        const updated = prev.filter(n => n.id !== notificationId);
        
        // Update unread count if deleted notification was unread
        if (notification && !notification.is_read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        
        return updated;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Still update UI optimistically
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        const updated = prev.filter(n => n.id !== notificationId);
        
        if (notification && !notification.is_read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        
        return updated;
      });
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      // Still update UI optimistically
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await notificationService.getNotifications(50);
      
      // Handle different response structures
      let notificationsArray = [];
      
      if (Array.isArray(response)) {
        // Response is directly an array
        notificationsArray = response;
      } else if (response && response.notifications && Array.isArray(response.notifications)) {
        // Response has notifications property
        notificationsArray = response.notifications;
      } else if (response && Array.isArray(response.data)) {
        // Response has data property that's an array
        notificationsArray = response.data;
      } else {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      if (notificationsArray.length > 0) {
        const processedNotifications = notificationsArray.map(processNotification);
        setNotifications(processedNotifications);
        
        const unread = processedNotifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Failed to fetch notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [processNotification]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    console.log("WS Event received:", data);
    console.log("Event type:", data?.event);
    
    // Handle different message formats
    if (data && typeof data === 'object') {
      // Check if it's a direct notification object
      if (data.id && (data.username || data.description)) {
        console.log('Processing direct notification object');
        addNotification(data);
      }
      // Check if it's wrapped in notification property
      else if (data.notification && data.notification.id) {
        console.log('Processing wrapped notification object');
        addNotification(data.notification);
      }
      // Check if it's a typed message
      else if (data.type === 'notification' && data.data) {
        console.log('Processing typed notification message');
        addNotification(data.data);
      }
      // Handle NEW_NOTIFICATION event
      else if (data.event === 'NEW_NOTIFICATION' && data.data) {
        console.log('Processing NEW_NOTIFICATION event');
        console.log('New notification data:', data.data);
        addNotification(data.data);
      }
      // Handle notification marked as read event (REAL-TIME SYNC)
      else if (data.event === 'NOTIFICATION_READ') {
        console.log('Processing NOTIFICATION_READ sync event');
        console.log('Notification data:', data.data);
        const notificationId = data.data?.id;
        console.log('Notification ID to remove (marked as read):', notificationId);
        
        if (notificationId) {
          setNotifications(prev => {
            console.log('Current notifications before sync:', prev);
            const updated = prev.filter(n => n.id !== notificationId);
            console.log('Notifications after sync (removed):', updated);
            return updated;
          });
          setUnreadCount(prev => {
            const newCount = Math.max(0, prev - 1);
            console.log('Unread count after sync:', prev, '->', newCount);
            return newCount;
          });
        } else {
          console.warn('No notification ID found in NOTIFICATION_READ event');
        }
      }
      // Handle all notifications marked as read event (REAL-TIME SYNC)
      else if (data.event === 'ALL_NOTIFICATIONS_READ') {
        console.log('Processing ALL_NOTIFICATIONS_READ sync event');
        setNotifications(prev => {
          console.log('Marking all notifications as read via sync');
          return prev.map(n => ({ ...n, is_read: true }));
        });
        setUnreadCount(0);
        console.log('Unread count reset to 0 via sync');
      }
      // Handle connection established
      else if (data.event === 'connection_established') {
        console.log('WebSocket connection established successfully');
      }
      // Handle echo events
      else if (data.event === 'echo') {
        console.log('Echo event received:', data.data);
      }
      // Check for notifications update
      else if (data.type === 'notifications_update') {
        console.log('Processing notifications_update event');
        fetchNotifications();
      }
      // Check if it's an array of notifications
      else if (Array.isArray(data)) {
        console.log('Processing array of notifications:', data.length);
        data.forEach(notification => addNotification(notification));
      }
      else {
        console.warn('Unknown WebSocket event type:', data);
      }
    } else {
      console.warn('Invalid WebSocket data format:', data);
    }
  }, [addNotification, fetchNotifications]);

  // WebSocket connection handlers
  const handleWebSocketOpen = useCallback(() => {
    console.log('WebSocket connected');
    setIsConnected(true);
    setError(null);
  }, []);

  const handleWebSocketClose = useCallback(() => {
    console.log('WebSocket disconnected');
    setIsConnected(false);
  }, []);

  const handleWebSocketError = useCallback((error) => {
    console.error('WebSocket error:', error);
    setError('Connection error');
    setIsConnected(false);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Add event listeners
    wsManager.addEventListener('open', handleWebSocketOpen);
    wsManager.addEventListener('message', handleWebSocketMessage);
    wsManager.addEventListener('close', handleWebSocketClose);
    wsManager.addEventListener('error', handleWebSocketError);

    // Connect to WebSocket
    wsManager.connect();

    // Fetch initial notifications
    fetchNotifications();

    // Cleanup
    return () => {
      wsManager.removeEventListener('open', handleWebSocketOpen);
      wsManager.removeEventListener('message', handleWebSocketMessage);
      wsManager.removeEventListener('close', handleWebSocketClose);
      wsManager.removeEventListener('error', handleWebSocketError);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [handleWebSocketOpen, handleWebSocketMessage, handleWebSocketClose, handleWebSocketError, fetchNotifications]);

  // Update notification times periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          time: formatRelativeTime(notification.timestamp)
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications: fetchNotifications,
  };
};
