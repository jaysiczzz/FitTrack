import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { hapticFeedback } from '@/utils/haptics';
import { useSocket } from './SocketContext';

export interface WorkoutTimerState {
  visible: boolean;
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
  isMinimized: boolean;
  exerciseName?: string;
}

export interface WorkoutTimerContextType extends WorkoutTimerState {
  startRestTimer: (seconds?: number, exerciseName?: string) => void;
  stopRestTimer: () => void;
  togglePlayPause: () => void;
  addSeconds: (seconds?: number) => void;
  subtractSeconds: (seconds?: number) => void;
  setIsMinimized: (minimized: boolean) => void;
  toggleMinimize: () => void;
  resetTimer: () => void;
}

const WorkoutTimerContext = createContext<WorkoutTimerContextType | undefined>(undefined);

export const WorkoutTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [totalSeconds, setTotalSeconds] = useState(90);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [exerciseName, setExerciseName] = useState<string | undefined>(undefined);
  // Incrementing session counter ensures the countdown effect restarts cleanly even if
  // an existing rest timer was already running when a new set is completed.
  const [timerSessionId, setTimerSessionId] = useState(0);

  const { emitWorkoutTimerTick } = useSocket();
  const targetEndTimeRef = useRef<number | null>(null);
  const pausedRemainingMsRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scheduledNotifIdRef = useRef<string | null>(null);

  const cancelScheduledNotification = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      if (scheduledNotifIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(scheduledNotifIdRef.current);
        scheduledNotifIdRef.current = null;
      }
    } catch {}
  }, []);

  const syncScheduledNotification = useCallback(async (seconds: number, name?: string) => {
    if (Platform.OS === 'web') return;
    try {
      if (scheduledNotifIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(scheduledNotifIdRef.current);
        scheduledNotifIdRef.current = null;
      }
      if (seconds > 0) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Rest Time Complete! 💪',
            body: name ? `Time for your next set of ${name}!` : 'Ready for your next workout set!',
            sound: 'default',
            vibrate: [0, 250, 250, 250],
            data: {
              linkUrl: '/(screen)/workouts',
              type: 'REST_TIMER',
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(1, seconds),
          },
        });
        scheduledNotifIdRef.current = id;
      }
    } catch (err) {
      console.warn('[WorkoutTimerContext] Failed to schedule notification:', err);
    }
  }, []);

  // Cross-device incoming timer sync
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('WORKOUT_CROSS_DEVICE_TIMER', (payload) => {
      if (!payload) return;
      if (payload.action === 'start') {
        const remainingSecs = payload.targetEndTime
          ? Math.max(0, Math.ceil((payload.targetEndTime - Date.now()) / 1000))
          : payload.secondsLeft;
        targetEndTimeRef.current = payload.targetEndTime || (Date.now() + remainingSecs * 1000);
        pausedRemainingMsRef.current = null;
        setTotalSeconds(payload.totalSeconds);
        setSecondsLeft(remainingSecs);
        setExerciseName(payload.exerciseName);
        setIsCompleted(false);
        setIsRunning(true);
        setIsMinimized(false);
        setVisible(true);
        setTimerSessionId((prev) => prev + 1);
      } else if (payload.action === 'stop') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setVisible(false);
        targetEndTimeRef.current = null;
        pausedRemainingMsRef.current = null;
      } else if (payload.action === 'pause') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setSecondsLeft(payload.secondsLeft);
        setIsRunning(false);
      } else if (payload.action === 'resume') {
        targetEndTimeRef.current = Date.now() + (payload.secondsLeft || 60) * 1000;
        pausedRemainingMsRef.current = null;
        setIsRunning(true);
        setTimerSessionId((prev) => prev + 1);
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  // Main countdown effect syncing against Date.now() timestamp
  useEffect(() => {
    if (!visible || !isRunning || isCompleted) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      if (!targetEndTimeRef.current) return;
      const now = Date.now();
      const remainingMs = targetEndTimeRef.current - now;
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      setSecondsLeft(remainingSecs);

      if (remainingSecs <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRunning(false);
        setIsCompleted(true);
        cancelScheduledNotification();
        hapticFeedback.success();
      }
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible, isRunning, isCompleted, timerSessionId, cancelScheduledNotification]);

  const startRestTimer = useCallback((seconds: number = 90, name?: string) => {
    const duration = Math.max(1, seconds);
    const targetEnd = Date.now() + duration * 1000;
    targetEndTimeRef.current = targetEnd;
    pausedRemainingMsRef.current = null;

    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setExerciseName(name);
    setIsCompleted(false);
    setIsRunning(true);
    setIsMinimized(false);
    setVisible(true);
    setTimerSessionId((prev) => prev + 1);

    emitWorkoutTimerTick({
      action: 'start',
      totalSeconds: duration,
      secondsLeft: duration,
      exerciseName: name,
      targetEndTime: targetEnd,
    });

    syncScheduledNotification(duration, name);
    hapticFeedback.light();
  }, [emitWorkoutTimerTick, syncScheduledNotification]);

  const stopRestTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setVisible(false);
    targetEndTimeRef.current = null;
    pausedRemainingMsRef.current = null;

    cancelScheduledNotification();
    emitWorkoutTimerTick({ action: 'stop' });
    hapticFeedback.light();
  }, [emitWorkoutTimerTick, cancelScheduledNotification]);

  const togglePlayPause = useCallback(() => {
    hapticFeedback.light();
    if (isCompleted) {
      const targetEnd = Date.now() + totalSeconds * 1000;
      setSecondsLeft(totalSeconds);
      setIsCompleted(false);
      setIsRunning(true);
      targetEndTimeRef.current = targetEnd;
      pausedRemainingMsRef.current = null;
      setTimerSessionId((prev) => prev + 1);

      syncScheduledNotification(totalSeconds, exerciseName);
      emitWorkoutTimerTick({ action: 'start', totalSeconds, secondsLeft: totalSeconds, targetEndTime: targetEnd });
      return;
    }

    if (isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (targetEndTimeRef.current) {
        pausedRemainingMsRef.current = Math.max(0, targetEndTimeRef.current - Date.now());
      } else {
        pausedRemainingMsRef.current = secondsLeft * 1000;
      }
      setIsRunning(false);
      cancelScheduledNotification();
      emitWorkoutTimerTick({ action: 'pause', secondsLeft });
    } else {
      const remainingMs = pausedRemainingMsRef.current || (secondsLeft * 1000);
      const targetEnd = Date.now() + remainingMs;
      targetEndTimeRef.current = targetEnd;
      pausedRemainingMsRef.current = null;
      setIsRunning(true);
      setTimerSessionId((prev) => prev + 1);
      syncScheduledNotification(Math.max(1, Math.ceil(remainingMs / 1000)), exerciseName);
    }
  }, [isCompleted, isRunning, totalSeconds, secondsLeft, exerciseName, emitWorkoutTimerTick, syncScheduledNotification, cancelScheduledNotification]);

  const addSeconds = useCallback((secs: number = 30) => {
    hapticFeedback.light();
    const addMs = secs * 1000;

    if (isCompleted) {
      const nextSecs = secs;
      setTotalSeconds((prev) => Math.max(prev, nextSecs));
      setSecondsLeft(nextSecs);
      setIsCompleted(false);
      setIsRunning(true);
      targetEndTimeRef.current = Date.now() + addMs;
      pausedRemainingMsRef.current = null;
      setTimerSessionId((prev) => prev + 1);
      syncScheduledNotification(nextSecs, exerciseName);
      return;
    }

    if (isRunning) {
      if (targetEndTimeRef.current) {
        targetEndTimeRef.current += addMs;
        const now = Date.now();
        const nextSecs = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
        setSecondsLeft(nextSecs);
        setTotalSeconds((prev) => Math.max(prev, nextSecs));
        syncScheduledNotification(nextSecs, exerciseName);
      }
    } else {
      const currentMs = pausedRemainingMsRef.current ?? (secondsLeft * 1000);
      const nextMs = currentMs + addMs;
      pausedRemainingMsRef.current = nextMs;
      const nextSecs = Math.max(0, Math.ceil(nextMs / 1000));
      setSecondsLeft(nextSecs);
      setTotalSeconds((prev) => Math.max(prev, nextSecs));
    }
  }, [isCompleted, isRunning, secondsLeft, exerciseName, syncScheduledNotification]);

  const subtractSeconds = useCallback((secs: number = 15) => {
    hapticFeedback.light();
    if (isCompleted || secondsLeft <= 0) return;
    const subMs = secs * 1000;

    if (isRunning) {
      if (targetEndTimeRef.current) {
        targetEndTimeRef.current = Math.max(Date.now(), targetEndTimeRef.current - subMs);
        const now = Date.now();
        const nextSecs = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
        setSecondsLeft(nextSecs);
        if (nextSecs <= 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsRunning(false);
          setIsCompleted(true);
          cancelScheduledNotification();
          hapticFeedback.success();
        } else {
          syncScheduledNotification(nextSecs, exerciseName);
        }
      }
    } else {
      const currentMs = pausedRemainingMsRef.current ?? (secondsLeft * 1000);
      const nextMs = Math.max(0, currentMs - subMs);
      pausedRemainingMsRef.current = nextMs;
      const nextSecs = Math.max(0, Math.ceil(nextMs / 1000));
      setSecondsLeft(nextSecs);
      if (nextSecs <= 0) {
        setIsRunning(false);
        setIsCompleted(true);
        cancelScheduledNotification();
        hapticFeedback.success();
      }
    }
  }, [isCompleted, isRunning, secondsLeft, exerciseName, syncScheduledNotification, cancelScheduledNotification]);

  const toggleMinimize = useCallback(() => {
    hapticFeedback.light();
    setIsMinimized((prev) => !prev);
  }, []);

  const handleSetIsMinimized = useCallback((minimized: boolean) => {
    hapticFeedback.light();
    setIsMinimized(minimized);
  }, []);

  const resetTimer = useCallback(() => {
    setSecondsLeft(totalSeconds);
    setIsCompleted(false);
    setIsRunning(true);
    targetEndTimeRef.current = Date.now() + totalSeconds * 1000;
    pausedRemainingMsRef.current = null;
    setTimerSessionId((prev) => prev + 1);
    hapticFeedback.light();
  }, [totalSeconds]);

  return (
    <WorkoutTimerContext.Provider
      value={{
        visible,
        secondsLeft,
        totalSeconds,
        isRunning,
        isCompleted,
        isMinimized,
        exerciseName,
        startRestTimer,
        stopRestTimer,
        togglePlayPause,
        addSeconds,
        subtractSeconds,
        setIsMinimized: handleSetIsMinimized,
        toggleMinimize,
        resetTimer,
      }}
    >
      {children}
    </WorkoutTimerContext.Provider>
  );
};

export const useWorkoutTimer = (): WorkoutTimerContextType => {
  const context = useContext(WorkoutTimerContext);
  if (!context) {
    throw new Error('useWorkoutTimer must be used within a WorkoutTimerProvider');
  }
  return context;
};
