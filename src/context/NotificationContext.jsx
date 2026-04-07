import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useWebSocketNotifications } from '../hooks/useWebSocketNotifications.js';

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isLoading: true,
  error: null,
  toasts: [],
};

// Action types
const actionTypes = {
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  CLEAR_ALL_TOASTS: 'CLEAR_ALL_TOASTS',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  CLEAR_ALL_NOTIFICATIONS: 'CLEAR_ALL_NOTIFICATIONS',
};

// Reducer function
const notificationReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.is_read).length,
      };

    case actionTypes.ADD_NOTIFICATION:
      const exists = state.notifications.some(n => n.id === action.payload.id);
      if (exists) return state;
      
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: !action.payload.is_read ? state.unreadCount + 1 : state.unreadCount,
      };

    case actionTypes.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload.id ? { ...n, ...action.payload } : n
        ),
        unreadCount: action.payload.is_read ? 
          Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };

    case actionTypes.REMOVE_NOTIFICATION:
      const notification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: notification && !notification.is_read ? 
          Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };

    case actionTypes.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload,
      };

    case actionTypes.SET_CONNECTION_STATUS:
      return {
        ...state,
        isConnected: action.payload,
        error: action.payload ? null : state.error,
      };

    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };

    case actionTypes.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload),
      };

    case actionTypes.CLEAR_ALL_TOASTS:
      return {
        ...state,
        toasts: [],
      };

    case actionTypes.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0,
      };

    case actionTypes.CLEAR_ALL_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    default:
      return state;
  }
};

// Create context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  
  // Use the WebSocket hook
  const {
    notifications: wsNotifications,
    unreadCount: wsUnreadCount,
    isConnected: wsIsConnected,
    isLoading: wsIsLoading,
    error: wsError,
    markAsRead: wsMarkAsRead,
    markAllAsRead: wsMarkAllAsRead,
    deleteNotification: wsDeleteNotification,
    clearAllNotifications: wsClearAllNotifications,
    refreshNotifications: wsRefreshNotifications,
  } = useWebSocketNotifications();

  // Sync WebSocket state with context state
  useEffect(() => {
    dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: wsNotifications });
  }, [wsNotifications]);

  useEffect(() => {
    dispatch({ type: actionTypes.SET_UNREAD_COUNT, payload: wsUnreadCount });
  }, [wsUnreadCount]);

  useEffect(() => {
    dispatch({ type: actionTypes.SET_CONNECTION_STATUS, payload: wsIsConnected });
  }, [wsIsConnected]);

  useEffect(() => {
    dispatch({ type: actionTypes.SET_LOADING, payload: wsIsLoading });
  }, [wsIsLoading]);

  useEffect(() => {
    dispatch({ type: actionTypes.SET_ERROR, payload: wsError });
  }, [wsError]);

  // Action creators
  const actions = {
    // Notification actions
    markAsRead: async (notificationId) => {
      try {
        await wsMarkAsRead(notificationId);
        dispatch({ 
          type: actionTypes.UPDATE_NOTIFICATION, 
          payload: { id: notificationId, is_read: true } 
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Still update UI optimistically
        dispatch({ 
          type: actionTypes.UPDATE_NOTIFICATION, 
          payload: { id: notificationId, is_read: true } 
        });
      }
    },

    markAllAsRead: async () => {
      try {
        await wsMarkAllAsRead();
        dispatch({ type: actionTypes.MARK_ALL_AS_READ });
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        // Still update UI optimistically
        dispatch({ type: actionTypes.MARK_ALL_AS_READ });
      }
    },

    deleteNotification: async (notificationId) => {
      try {
        await wsDeleteNotification(notificationId);
        dispatch({ type: actionTypes.REMOVE_NOTIFICATION, payload: notificationId });
      } catch (error) {
        console.error('Error deleting notification:', error);
        // Still update UI optimistically
        dispatch({ type: actionTypes.REMOVE_NOTIFICATION, payload: notificationId });
      }
    },

    clearAllNotifications: async () => {
      try {
        await wsClearAllNotifications();
        dispatch({ type: actionTypes.CLEAR_ALL_NOTIFICATIONS });
      } catch (error) {
        console.error('Error clearing all notifications:', error);
        // Still update UI optimistically
        dispatch({ type: actionTypes.CLEAR_ALL_NOTIFICATIONS });
      }
    },

    refreshNotifications: () => {
      wsRefreshNotifications();
    },

    // Toast actions
    addToast: (toast) => {
      const id = Date.now() + Math.random();
      const newToast = {
        id,
        timestamp: new Date().toISOString(),
        ...toast,
      };
      
      dispatch({ type: actionTypes.ADD_TOAST, payload: newToast });

      // Auto-remove toast after 4 seconds
      setTimeout(() => {
        dispatch({ type: actionTypes.REMOVE_TOAST, payload: id });
      }, 4000);

      return id;
    },

    removeToast: (id) => {
      dispatch({ type: actionTypes.REMOVE_TOAST, payload: id });
    },

    clearAllToasts: () => {
      dispatch({ type: actionTypes.CLEAR_ALL_TOASTS });
    },
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

// Export the context for testing
export { NotificationContext };
