import React, { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ToastPortalProps {
  children: ReactNode;
  visible: boolean;
}

/**
 * Web portal to render toast directly into document.body,
 * bypassing any React Native Web root stacking contexts or modal overlays.
 */
export default function ToastPortal({ children, visible }: ToastPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !visible || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}
