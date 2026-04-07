import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import ToastContainer from './ToastContainer';

const AppWithNotifications = ({ children }) => {
  const { toasts, removeToast } = useNotifications();

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </>
  );
};

export default AppWithNotifications;
