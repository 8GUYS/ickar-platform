// Crashlytics wrapper — works with @react-native-firebase/crashlytics (EAS build only)
// In Expo Go, this silently no-ops so dev experience isn't broken
let crashlytics: any = null;
try {
  crashlytics = require('@react-native-firebase/crashlytics').default;
} catch {}

export function recordError(error: Error, context?: string) {
  if (crashlytics) {
    if (context) crashlytics().setAttributes({ context });
    crashlytics().recordError(error);
  } else {
    console.error('[Crashlytics stub]', context, error);
  }
}
export function setUserId(id: string) {
  crashlytics?.().setUserId(id);
}
export function log(message: string) {
  crashlytics?.().log(message);
}
