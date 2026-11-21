import { useEffect, useState } from 'react';
import { registerForPushNotifications } from '../services/notifications';

export function useAppStartup() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      // Register push notifications silently
      registerForPushNotifications().catch(() => {});
      setReady(true);
    })();
  }, []);
  return ready;
}
