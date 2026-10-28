import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from '../types';

interface NotificationContextType {
  sseConnected: boolean;
  browserPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  recentToasts: Array<{ id: string; title: string; message: string; severity: 'critical' | 'warning' | 'info'; timestamp: string }>;
  dismissToast: (id: string) => void;
  playAlertSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sseConnected, setSseConnected] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default';
  });
  const [recentToasts, setRecentToasts] = useState<Array<{ id: string; title: string; message: string; severity: 'critical' | 'warning' | 'info'; timestamp: string }>>([]);

  // Soft Web Audio API synthesizer chime (no external mp3 dependency required)
  const playAlertSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy handled gracefully
    }
  }, []);

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      return perm;
    }
    return 'denied';
  };

  const showBrowserNotification = useCallback((alert: Alert) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Municipal Alert: ${alert.binName || alert.binId}`, {
          body: alert.message,
          icon: '/favicon.svg',
          tag: alert.id
        });
      } catch (err) {
        console.warn('[Notification] Browser notification failed:', err);
      }
    }
  }, []);

  const addToast = useCallback((alert: Alert) => {
    const toast = {
      id: alert.id || `toast-${Date.now()}`,
      title: `${alert.type.replace('_', ' ')}: ${alert.binName || alert.binId}`,
      message: alert.message,
      severity: alert.severity,
      timestamp: new Date().toLocaleTimeString()
    };

    setRecentToasts(prev => [toast, ...prev.slice(0, 4)]);
    playAlertSound();
    showBrowserNotification(alert);

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      setRecentToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 6000);
  }, [playAlertSound, showBrowserNotification]);

  const dismissToast = (id: string) => {
    setRecentToasts(prev => prev.filter(t => t.id !== id));
  };

  // SSE Event Stream connection with auto-reconnect
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/v1/events');

        eventSource.onopen = () => {
          setSseConnected(true);
        };

        eventSource.onerror = () => {
          setSseConnected(false);
          eventSource?.close();
          // Exponential / retry reconnect after 4s
          reconnectTimeout = setTimeout(connectSSE, 4000);
        };

        eventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'ALERT_TRIGGERED') {
              addToast(parsed.data);
            }
          } catch {
            // ignore non-json messages
          }
        };
      } catch (err) {
        console.warn('[SSE] Connection error:', err);
        reconnectTimeout = setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [addToast]);

  return (
    <NotificationContext.Provider
      value={{
        sseConnected,
        browserPermission,
        requestNotificationPermission,
        recentToasts,
        dismissToast,
        playAlertSound
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
