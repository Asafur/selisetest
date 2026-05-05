import { useEffect } from 'react';

export const getLocalhostRedirectUrl = () => {
  if (typeof window === 'undefined') return null;

  const currentUrl = new URL(window.location.href);

  if (currentUrl.protocol !== 'http:' || currentUrl.hostname !== '127.0.0.1') {
    return null;
  }

  currentUrl.hostname = 'localhost';
  return currentUrl.toString();
};

export const LocalhostRedirect = ({ to }: Readonly<{ to: string }>) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return null;
};
