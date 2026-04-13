import { useState, useCallback } from 'react';

let alertIdCounter = 0;

export const useCustomAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback(({ title, message, type = 'info', operation = null, duration = 4000 }) => {
    const id = ++alertIdCounter;
    
    const newAlert = {
      id,
      title,
      message,
      type,
      operation,
      duration,
      isOpen: true
    };

    setAlerts(prev => [...prev, newAlert]);

    // Auto-remove alert after duration
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }

    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isOpen: false } : alert
    ));

    // Remove from DOM after animation
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 300);
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isOpen: false })));
    setTimeout(() => {
      setAlerts([]);
    }, 300);
  }, []);

  // Convenience methods for different operations
  const showSuccess = useCallback((title, message, operation = null) => {
    return showAlert({ title, message, type: 'success', operation });
  }, [showAlert]);

  const showError = useCallback((title, message, operation = null) => {
    return showAlert({ title, message, type: 'error', operation });
  }, [showAlert]);

  const showWarning = useCallback((title, message, operation = null) => {
    return showAlert({ title, message, type: 'warning', operation });
  }, [showAlert]);

  const showInfo = useCallback((title, message, operation = null) => {
    return showAlert({ title, message, type: 'info', operation });
  }, [showAlert]);

  // Operation-specific convenience methods
  const showCreateSuccess = useCallback((entityName) => {
    return showSuccess(`${entityName} Created`, `${entityName} has been created successfully.`, 'create');
  }, [showSuccess]);

  const showUpdateSuccess = useCallback((entityName) => {
    return showSuccess(`${entityName} Updated`, `${entityName} has been updated successfully.`, 'update');
  }, [showSuccess]);

  const showDeleteSuccess = useCallback((entityName, customMessage = null) => {
    const message = customMessage || `${entityName} has been deleted successfully.`;
    return showSuccess(`${entityName} Deleted`, message, 'delete');
  }, [showSuccess]);

  const showCreateError = useCallback((entityName, errorMessage) => {
    return showError(`Failed to Create ${entityName}`, errorMessage || `An error occurred while creating ${entityName}.`, 'create');
  }, [showError]);

  const showUpdateError = useCallback((entityName, errorMessage) => {
    return showError(`Failed to Update ${entityName}`, errorMessage || `An error occurred while updating ${entityName}.`, 'update');
  }, [showError]);

  const showDeleteError = useCallback((entityName, errorMessage) => {
    return showError(`Failed to Delete ${entityName}`, errorMessage || `An error occurred while deleting ${entityName}.`, 'delete');
  }, [showError]);

  return {
    alerts,
    showAlert,
    removeAlert,
    clearAllAlerts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showCreateSuccess,
    showUpdateSuccess,
    showDeleteSuccess,
    showCreateError,
    showUpdateError,
    showDeleteError
  };
};
