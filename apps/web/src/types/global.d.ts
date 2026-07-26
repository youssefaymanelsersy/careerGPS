/// <reference types="vite/client" />

declare global {
  interface Window {
    __ENV__?: {
      VITE_SERVER_URL?: string;
      VITE_VAPID_PUBLIC_KEY?: string;
    };
  }
}

export {};
