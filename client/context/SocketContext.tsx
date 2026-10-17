import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/config';
import { useAuth } from './AuthContext';
import { DeviceEventEmitter } from 'react-native';

export interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  emitWorkoutSync: (state: any) => void;
  emitWorkoutTimerTick: (tick: any) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  emitWorkoutSync: () => {},
  emitWorkoutTimerTick: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Avoid connecting while auth state is still hydrating from storage
    if (isLoading) return;

    // Initialize socket connection prioritizing direct WebSocket transport
    const socketInstance = io(API_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token || undefined,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      // In development, server reloads (nodemon) cause expected transient retries
      if (__DEV__) {
        console.debug('[Socket] Retrying connection:', error.message);
      }
    });

    // -------------------------------------------------------------
    // Tier 1 Events: In-App Notifications, Workout, Subscription
    // -------------------------------------------------------------
    socketInstance.on('notification:new', (payload) => {
      DeviceEventEmitter.emit('IN_APP_NOTIFICATIONS_UPDATED', payload);
    });

    socketInstance.on('notification:updated', (payload) => {
      DeviceEventEmitter.emit('IN_APP_NOTIFICATIONS_UPDATED', payload);
    });

    socketInstance.on('notification:read_all', (payload) => {
      DeviceEventEmitter.emit('IN_APP_NOTIFICATIONS_UPDATED', payload);
    });

    socketInstance.on('notification:deleted', (payload) => {
      DeviceEventEmitter.emit('IN_APP_NOTIFICATIONS_UPDATED', payload);
    });

    socketInstance.on('subscription:updated', (payload) => {
      DeviceEventEmitter.emit('SUBSCRIPTION_UPDATED', payload);
    });

    socketInstance.on('workout:state_updated', (payload) => {
      DeviceEventEmitter.emit('WORKOUT_CROSS_DEVICE_STATE', payload);
    });

    socketInstance.on('workout:timer_synced', (payload) => {
      DeviceEventEmitter.emit('WORKOUT_CROSS_DEVICE_TIMER', payload);
    });

    // -------------------------------------------------------------
    // Tier 2 Events: Support Tickets & Admin Real-Time Feed
    // -------------------------------------------------------------
    socketInstance.on('ticket:created', (payload) => {
      DeviceEventEmitter.emit('TICKET_CREATED_LIVE', payload);
    });

    socketInstance.on('ticket:updated', (payload) => {
      DeviceEventEmitter.emit('TICKET_UPDATED_LIVE', payload);
    });

    socketInstance.on('ticket:deleted', (payload) => {
      DeviceEventEmitter.emit('TICKET_DELETED_LIVE', payload);
    });

    socketInstance.on('admin:event', (payload) => {
      DeviceEventEmitter.emit('ADMIN_LIVE_EVENT', payload);
    });

    // -------------------------------------------------------------
    // Tier 3 Events: Daily Check-In, Food Log, Testimonials
    // -------------------------------------------------------------
    socketInstance.on('nutrition:updated', (payload) => {
      DeviceEventEmitter.emit('FOOD_LOG_UPDATED', payload);
    });

    socketInstance.on('checkin:updated', (payload) => {
      DeviceEventEmitter.emit('DAILY_CHECKIN_UPDATED', payload);
    });

    socketInstance.on('testimonial:new', (payload) => {
      DeviceEventEmitter.emit('testimonials:updated', payload);
    });

    socketInstance.on('testimonial:voted', (payload) => {
      DeviceEventEmitter.emit('testimonials:updated', payload);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [token, isLoading]);

  const emitWorkoutSync = useCallback((state: any) => {
    socketRef.current?.emit('workout:sync_state', state);
  }, []);

  const emitWorkoutTimerTick = useCallback((tick: any) => {
    socketRef.current?.emit('workout:timer_tick', tick);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        emitWorkoutSync,
        emitWorkoutTimerTick,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
