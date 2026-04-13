import React from 'react';
import CustomAlert from './CustomAlert';

const AlertContainer = ({ alerts, onRemoveAlert }) => {
  return (
    <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 space-y-2 sm:space-y-3 pointer-events-none">
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto">
          <CustomAlert
            isOpen={alert.isOpen}
            onClose={() => onRemoveAlert(alert.id)}
            title={alert.title}
            message={alert.message}
            type={alert.type}
            operation={alert.operation}
            autoClose={alert.duration > 0}
            duration={alert.duration}
          />
        </div>
      ))}
    </div>
  );
};

export default AlertContainer;
