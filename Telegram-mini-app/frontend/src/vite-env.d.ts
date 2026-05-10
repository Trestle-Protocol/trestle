/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      ready: () => void;
      expand: () => void;
      close: () => void;
      MainButton: {
        text: string;
        show: () => void;
        hide: () => void;
        onClick: (cb: () => void) => void;
        setParams: (params: Record<string, string>) => void;
      };
      initDataUnsafe?: {
        user?: {
          id: number;
          first_name: string;
          last_name?: string;
          username?: string;
        };
      };
      colorScheme?: string;
      themeParams?: Record<string, string>;
    };
  };
}
