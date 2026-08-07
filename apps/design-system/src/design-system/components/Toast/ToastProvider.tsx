'use client';

import * as React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import ErrorRounded from '@mui/icons-material/ErrorRounded';
import WarningRounded from '@mui/icons-material/WarningRounded';
import InfoRounded from '@mui/icons-material/InfoRounded';
import { color, zIndex } from '../../tokens/tokens';

/**
 * Toast — transient feedback. A white card with a solid intent icon, the message,
 * a dismiss button, and a bottom progress bar that depletes over the auto-dismiss
 * duration (colored by intent). Driven imperatively via `useToast()`.
 *
 * Errors use role="alert" (assertive); others use role="status" (polite).
 */
export type ToastIntent = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  title?: string;
  intent?: ToastIntent;
  /** Auto-dismiss in ms. 0 = persistent (no timer/bar). @default 5000 */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, 'title'>> {
  id: number;
  title?: string;
}

export interface ToastApi {
  show: (o: ToastOptions) => void;
  success: (message: string, o?: Partial<ToastOptions>) => void;
  error: (message: string, o?: Partial<ToastOptions>) => void;
  warning: (message: string, o?: Partial<ToastOptions>) => void;
  info: (message: string, o?: Partial<ToastOptions>) => void;
}

const ToastContext = React.createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a <ToastProvider>.');
  return ctx;
}

const INTENT = {
  success: { Icon: CheckCircleRounded, ...color.status.success },
  error: { Icon: ErrorRounded, ...color.status.danger },
  warning: { Icon: WarningRounded, ...color.status.warning },
  info: { Icon: InfoRounded, ...color.status.info },
} as const;

function ToastCard({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  const { Icon, solid } = INTENT[item.intent];
  const [progress, setProgress] = React.useState(100);
  const persistent = !item.duration || item.duration <= 0;

  React.useEffect(() => {
    if (persistent) return;
    const raf = requestAnimationFrame(() => setProgress(0));
    const timer = setTimeout(() => onClose(item.id), item.duration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assertive = item.intent === 'error';

  return (
    <div
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
      className="pointer-events-auto relative flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-lg border border-border bg-surface px-4 py-3 shadow-lg"
    >
      <Icon sx={{ fontSize: 20, color: solid, marginTop: '1px', flexShrink: 0 }} />
      <div className="min-w-0 flex-1">
        {item.title && (
          <div className="text-body font-semibold leading-5 text-text-primary">{item.title}</div>
        )}
        <div className="text-body leading-5 text-text-primary">{item.message}</div>
      </div>
      <button
        type="button"
        onClick={() => onClose(item.id)}
        aria-label="Dismiss"
        className="-mr-1 -mt-0.5 shrink-0 rounded-sm p-1 text-icon hover:bg-surface-hover"
      >
        <CloseIcon sx={{ fontSize: 18 }} />
      </button>
      {!persistent && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-subtle">
          <div
            className="h-full"
            style={{ width: `${progress}%`, background: solid, transition: `width ${item.duration}ms linear` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({
  children,
  position = 'top-right',
}: {
  children: React.ReactNode;
  position?: 'top-right' | 'bottom-right' | 'top-center';
}) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const remove = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = React.useCallback((o: ToastOptions) => {
    const id = (idRef.current += 1);
    setToasts((prev) => [
      ...prev,
      { id, message: o.message, title: o.title, intent: o.intent ?? 'info', duration: o.duration ?? 5000 },
    ]);
  }, []);

  const api = React.useMemo<ToastApi>(
    () => ({
      show,
      success: (message, o) => show({ ...o, message, intent: 'success' }),
      error: (message, o) => show({ ...o, message, intent: 'error' }),
      warning: (message, o) => show({ ...o, message, intent: 'warning' }),
      info: (message, o) => show({ ...o, message, intent: 'info' }),
    }),
    [show],
  );

  const pos: React.CSSProperties =
    position === 'bottom-right'
      ? { bottom: 16, right: 16, alignItems: 'flex-end' }
      : position === 'top-center'
        ? { top: 16, left: '50%', transform: 'translateX(-50%)', alignItems: 'center' }
        : { top: 16, right: 16, alignItems: 'flex-end' };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed flex flex-col gap-2"
        style={{ ...pos, zIndex: zIndex.toast }}
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
