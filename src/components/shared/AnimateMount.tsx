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

  // THR-1858: an exiting surface stays mounted for `duration` ms while it fades.
  // It must not take clicks in that window — a closing dropdown ate the click
  // meant for the row beneath it (warm round 2).
  const exiting = animClass.endsWith('-exit');
  return (
    <div className={animClass} style={exiting ? { pointerEvents: 'none' } : undefined}>
      {children}
    </div>
  );
});
