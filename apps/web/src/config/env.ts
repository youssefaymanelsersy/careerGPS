export const env = {
  get VITE_SERVER_URL(): string {
    return window.__ENV__?.VITE_SERVER_URL || import.meta.env.VITE_SERVER_URL;
  },
  get VITE_VAPID_PUBLIC_KEY(): string {
    return window.__ENV__?.VITE_VAPID_PUBLIC_KEY || import.meta.env.VITE_VAPID_PUBLIC_KEY;
  },
};
