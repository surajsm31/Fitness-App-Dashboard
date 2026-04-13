import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, UserPlus, UserCheck, Trash2, Edit, RefreshCw } from 'lucide-react';

const CustomAlert = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', 
  operation = null,
  autoClose = true,
  duration = 4000 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getOperationIcon = () => {
    switch (operation) {
      case 'create':
        return <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'update':
        return <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'edit':
        return <Edit className="w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return getDefaultIcon();
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return <Info className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const getAlertStyles = () => {
    const baseStyles = 'fixed top-2 right-2 sm:top-4 sm:right-4 z-50 max-w-[calc(100vw-1rem)] sm:max-w-md w-full transform transition-all duration-300 ease-out';
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    const typeStyles = {
      success: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700',
      error: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-700',
      warning: 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-700',
      info: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700'
    };

    const iconColors = {
      success: 'text-green-600 dark:text-green-400',
      error: 'text-red-600 dark:text-red-400',
      warning: 'text-amber-600 dark:text-amber-400',
      info: 'text-blue-600 dark:text-blue-400'
    };

    return `${baseStyles} translate-x-0 opacity-100 ${typeStyles[type]} border rounded-xl shadow-2xl backdrop-blur-sm`;
  };

  const getIconContainerStyles = () => {
    const typeColors = {
      success: 'bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400',
      error: 'bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-400',
      warning: 'bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-400',
      info: 'bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400'
    };

    return `flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${typeColors[type]}`;
  };

  const getTitleStyles = () => {
    const typeColors = {
      success: 'text-green-900 dark:text-green-100',
      error: 'text-red-900 dark:text-red-100',
      warning: 'text-amber-900 dark:text-amber-100',
      info: 'text-blue-900 dark:text-blue-100'
    };

    return `text-sm sm:text-lg font-semibold ${typeColors[type]}`;
  };

  const getMessageStyles = () => {
    const typeColors = {
      success: 'text-green-700 dark:text-green-300',
      error: 'text-red-700 dark:text-red-300',
      warning: 'text-amber-700 dark:text-amber-300',
      info: 'text-blue-700 dark:text-blue-300'
    };

    return `text-xs sm:text-sm mt-1 ${typeColors[type]} break-words`;
  };

  if (!isOpen) return null;

  return (
    <div className={getAlertStyles()}>
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Icon */}
          <div className={getIconContainerStyles()}>
            {getOperationIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={getTitleStyles()}>
              {title}
            </h3>
            {message && (
              <p className={getMessageStyles()}>
                {message}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200"
            aria-label="Close alert"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {autoClose && (
          <div className="mt-2 sm:mt-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600 h-1">
            <div 
              className="h-full bg-current opacity-60 rounded-full transition-all ease-linear"
              style={{
                animation: 'shrink linear forwards',
                animationDuration: `${duration}ms`,
                backgroundColor: type === 'success' ? '#10b981' : 
                               type === 'error' ? '#ef4444' : 
                               type === 'warning' ? '#f59e0b' : '#3b82f6'
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

// Alert helper functions for different operations
export const showAlert = ({ title, message, type = 'info', operation = null, duration = 4000 }) => {
  // This function will be used to show alerts programmatically
  // We'll implement this with a global alert manager later
  console.log('Show alert:', { title, message, type, operation, duration });
};

export default CustomAlert;
