// src/context/SocketContext.jsx - Real-time Socket.io connection
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      // Connect to socket server
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

      // Join personal notification room
      socketRef.current.emit('join_notifications', { userId: user._id });

      // Listen for real-time notifications
      socketRef.current.on('notification_event', (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  const clearNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, notifications, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
