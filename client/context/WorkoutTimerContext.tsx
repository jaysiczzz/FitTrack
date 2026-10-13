import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
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
        hapticFeedback.success();
      }
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible, isRunning, isCompleted, timerSessionId]);

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

    hapticFeedback.light();
  }, [emitWorkoutTimerTick]);

  const stopRestTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setVisible(false);
    targetEndTimeRef.current = null;
    pausedRemainingMsRef.current = null;

    emitWorkoutTimerTick({ action: 'stop' });
    hapticFeedback.light();
  }, [emitWorkoutTimerTick]);

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
      emitWorkoutTimerTick({ action: 'pause', secondsLeft });
    } else {
      const remainingMs = pausedRemainingMsRef.current || (secondsLeft * 1000);
      const targetEnd = Date.now() + remainingMs;
      targetEndTimeRef.current = targetEnd;
      pausedRemainingMsRef.current = null;
      setIsRunning(true);
      setTimerSessionId((prev) => prev + 1);
    }
  }, [isCompleted, isRunning, totalSeconds, secondsLeft, emitWorkoutTimerTick]);

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
      return;
    }

    if (isRunning) {
      if (targetEndTimeRef.current) {
        targetEndTimeRef.current += addMs;
        const now = Date.now();
        const nextSecs = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
        setSecondsLeft(nextSecs);
        setTotalSeconds((prev) => Math.max(prev, nextSecs));
      }
    } else {
      const currentMs = pausedRemainingMsRef.current ?? (secondsLeft * 1000);
      const nextMs = currentMs + addMs;
      pausedRemainingMsRef.current = nextMs;
      const nextSecs = Math.max(0, Math.ceil(nextMs / 1000));
      setSecondsLeft(nextSecs);
      setTotalSeconds((prev) => Math.max(prev, nextSecs));
    }
  }, [isCompleted, isRunning, secondsLeft]);

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
          hapticFeedback.success();
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
      }
    }
  }, [isCompleted, isRunning, secondsLeft]);

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
