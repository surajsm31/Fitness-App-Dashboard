import { api } from './api.js';

// Get WebSocket URL based on current API base URL
const getWebSocketUrl = () => {
  // const API_BASE_URL = 'http://localhost:8000';
  const API_BASE_URL = 'http://192.168.0.108:8000';
  // const API_BASE_URL = 'https://fitness-app-backend-5l3u.onrender.com';
  
  // Convert HTTP to WebSocket protocol
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws');
  return `${wsUrl}/ws/admin/notifications`;
};

// Notification API service
export const notificationService = {
  // Fetch existing notifications
  getNotifications: async (limit = 50) => {
    try {
      console.log('Fetching notifications...');
      const response = await api.get(`/api/admin/notifications?limit=${limit}`);
      console.log('Notifications API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error.response?.data || { message: 'Failed to fetch notifications' };
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      console.log('Marking notification as read:', notificationId);
      const response = await api.put(`/api/admin/notifications/${notificationId}/mark-read`);
      console.log('Mark as read response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error.response?.data || { message: 'Failed to mark notification as read' };
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      console.log('Marking all notifications as read');
      const response = await api.put('/api/admin/notifications/mark-all-read');
      console.log('Mark all as read response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error.response?.data || { message: 'Failed to mark all notifications as read' };
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      console.log('Deleting notification:', notificationId);
      const response = await api.delete(`/api/admin/notifications/${notificationId}`);
      console.log('Delete notification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error.response?.data || { message: 'Failed to delete notification' };
    }
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    try {
      console.log('Clearing all notifications');
      const response = await api.delete('/api/admin/notifications');
      console.log('Clear all notifications response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error.response?.data || { message: 'Failed to clear all notifications' };
    }
  }
};

// WebSocket connection manager
export class WebSocketManager {
  constructor() {
    this.ws = null;
    this.url = getWebSocketUrl();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000; // Start with 1 second
    this.maxReconnectInterval = 30000; // Max 30 seconds
    this.listeners = new Map();
    this.isConnecting = false;
    this.isManualClose = false;
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to all listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event listener:', error);
        }
      });
    }
  }

  // Connect to WebSocket
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.isManualClose = false;

    console.log('Connecting to WebSocket:', this.url);

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;
        this.emit('open');
      };

      this.ws.onmessage = (event) => {
        console.log('=== WEBSOCKET SERVICE MESSAGE ===');
        console.log('Raw event data:', event.data);
        console.log('Raw data type:', typeof event.data);
        
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket data:', data);
          console.log('Parsed data type:', typeof data);
          console.log('Data keys:', data ? Object.keys(data) : 'null');
          console.log('Emitting message to listeners...');
          
          this.emit('message', data);
          
          console.log('Message emitted successfully');
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          console.error('Raw message that failed to parse:', event.data);
        }
        
        console.log('=== WEBSOCKET SERVICE MESSAGE COMPLETE ===');
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.emit('close', { code: event.code, reason: event.reason });

        // Attempt to reconnect if not manually closed
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  // Schedule reconnection attempt
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectInterval);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isManualClose) {
        this.connect();
      }
    }, delay);
  }

  // Send message through WebSocket
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
        console.log('WebSocket message sent:', data);
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent:', data);
      return false;
    }
  }

  // Close WebSocket connection
  disconnect() {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Get connection state
  getReadyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  // Check if connected
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
export const wsManager = new WebSocketManager();
