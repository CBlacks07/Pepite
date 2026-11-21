'use client';

import { createContext, useCallback, useContext, useRef, useState, type ComponentType, type ReactNode } from 'react';

import { CircleCheck } from './icons';

type IconType = ComponentType<{ strokeWidth?: number; 'aria-hidden'?: boolean }>;
type Toast = { message: string; Icon: IconType; key: number };

const Ctx = createContext<(message: string, Icon?: IconType) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [shown, setShown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((message: string, Icon: IconType = CircleCheck) => {
    setToast({ message, Icon, key: Date.now() });
    setShown(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShown(false), 3400);
  }, []);

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className={`toast${shown ? ' show' : ''}`} role="status" aria-live="polite">
        {toast && (
          <>
            <toast.Icon strokeWidth={1.9} aria-hidden />
            <span>{toast.message}</span>
          </>
        )}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
