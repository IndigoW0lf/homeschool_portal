'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

export function Turnstile({
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  size = 'normal',
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const callbacksRef = useRef({ onVerify, onExpire, onError });
  
  // Keep callbacks ref updated without causing re-renders
  callbacksRef.current = { onVerify, onExpire, onError };

  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load script once
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.warn('Turnstile site key not configured');
      return;
    }

    // Check if already loaded
    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="turnstile"]');
    if (existingScript) {
      // Wait for existing script to load
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          setScriptLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Load new script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Small delay to ensure turnstile is ready
      setTimeout(() => setScriptLoaded(true), 100);
    };
    document.head.appendChild(script);
  }, []);

  // Render widget once when script is loaded
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile || initializedRef.current) {
      return;
    }

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;

    // Prevent double initialization
    initializedRef.current = true;

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => callbacksRef.current.onVerify(token),
        'expired-callback': () => callbacksRef.current.onExpire?.(),
        'error-callback': () => callbacksRef.current.onError?.(),
        theme,
        size,
      });
    } catch (e) {
      console.error('Failed to render Turnstile:', e);
      initializedRef.current = false;
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore removal errors
        }
        widgetIdRef.current = null;
        initializedRef.current = false;
      }
    };
  }, [scriptLoaded, theme, size]);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center min-h-[65px]"
      aria-label="Security verification"
    />
  );
}

// Hook to manage Turnstile state in forms
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = useCallback((newToken: string) => {
    setToken(newToken);
    setIsVerified(true);
  }, []);

  const handleExpire = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  const reset = useCallback(() => {
    setToken(null);
    setIsVerified(false);
  }, []);

  return {
    token,
    isVerified,
    handleVerify,
    handleExpire,
    reset,
  };
}
