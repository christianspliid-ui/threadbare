import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AnimateMountProps {
  show: boolean;
  animation: string;
  duration?: number;
  children: React.ReactNode;
}

export const AnimateMount = React.memo(function AnimateMount({
  show,
  animation,
  duration = 200,
  children,
}: AnimateMountProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [animClass, setAnimClass] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (show) {
      clearPendingTimeout();
      setShouldRender(true);
      requestAnimationFrame(() => {
        setAnimClass(`${animation}-enter`);
      });
    } else if (shouldRender) {
      setAnimClass(`${animation}-exit`);
      clearPendingTimeout();
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        setAnimClass('');
      }, duration);
    }
    return clearPendingTimeout;
  }, [show, animation, duration, shouldRender, clearPendingTimeout]);

  if (!shouldRender) return null;

  return <div className={animClass}>{children}</div>;
});
