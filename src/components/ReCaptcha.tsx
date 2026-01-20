import { useEffect, useCallback } from 'react';

const RECAPTCHA_SITE_KEY = '6LfYGE8sAAAAANRG3sUKw7Pw8TUzMoNZnv8em5jy';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export function useReCaptcha() {
  useEffect(() => {
    // Load reCAPTCHA script if not already loaded
    if (!document.querySelector(`script[src*="recaptcha"]`)) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const executeReCaptcha = useCallback(async (action: string): Promise<string | null> => {
    try {
      if (!window.grecaptcha) {
        console.warn('reCAPTCHA not loaded');
        return null;
      }

      return new Promise((resolve) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
            resolve(token);
          } catch (error) {
            console.error('reCAPTCHA execute error:', error);
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      return null;
    }
  }, []);

  return { executeReCaptcha };
}
