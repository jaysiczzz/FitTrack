import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { hapticFeedback } from '@/utils/haptics';

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

  const targetEndTimeRef = useRef<number | null>(null);
  const pausedRemainingMsRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    targetEndTimeRef.current = Date.now() + duration * 1000;
    pausedRemainingMsRef.current = null;

    setTotalSeconds(duration);
    setSecondsLeft(duration);
    setExerciseName(name);
    setIsCompleted(false);
    setIsRunning(true);
    setIsMinimized(false);
    setVisible(true);
    // Increment sessionId so that even if timer was already running, the interval effect restarts
    setTimerSessionId((prev) => prev + 1);

    hapticFeedback.light();
  }, []);

  const stopRestTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setVisible(false);
    targetEndTimeRef.current = null;
    pausedRemainingMsRef.current = null;
    hapticFeedback.light();
  }, []);

  const togglePlayPause = useCallback(() => {
    hapticFeedback.light();
    if (isCompleted) {
      // Restart countdown
      setSecondsLeft(totalSeconds);
      setIsCompleted(false);
      setIsRunning(true);
      targetEndTimeRef.current = Date.now() + totalSeconds * 1000;
      pausedRemainingMsRef.current = null;
      setTimerSessionId((prev) => prev + 1);
      return;
    }

    if (isRunning) {
      // Pause
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
    } else {
      // Resume
      const remainingMs = pausedRemainingMsRef.current ?? (secondsLeft * 1000);
      targetEndTimeRef.current = Date.now() + remainingMs;
      pausedRemainingMsRef.current = null;
      setIsRunning(true);
    }
  }, [isCompleted, isRunning, secondsLeft, totalSeconds]);

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
