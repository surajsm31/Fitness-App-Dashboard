import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContainer = ({ toasts, onRemoveToast }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800';
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 sm:top-20 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            relative flex items-start gap-3 p-4 rounded-lg border shadow-lg
            backdrop-blur-sm max-w-sm w-full animate-in slide-in-from-right-full
            duration-300 ease-out transform transition-all
            ${getToastStyles(toast.type)}
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {toast.title}
              </h4>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => onRemoveToast(toast.id)}
            className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-gray-300 dark:bg-gray-600 rounded-b-lg animate-pulse">
            <div 
              className="h-full bg-current opacity-30 rounded-b-lg"
              style={{
                animation: 'shrink 4s linear forwards',
                backgroundColor: 'currentColor'
              }}
            />
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        @keyframes slide-in-from-right-full {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
