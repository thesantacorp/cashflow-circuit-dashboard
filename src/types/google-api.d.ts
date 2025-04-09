
// Type definitions for Google API Client
interface GoogleAuth {
  then(callback: (auth: any) => void): void;
  signIn(options?: object): Promise<any>;
  signOut(): Promise<any>;
  isSignedIn: {
    get(): boolean;
    listen(callback: (isSignedIn: boolean) => void): void;
  };
  currentUser: {
    get(): {
      getBasicProfile(): any;
      getAuthResponse(): any;
    };
  };
}

interface GapiClient {
  init(options: object): Promise<void>;
  setToken(token: object | null): void;
  getToken(): {access_token: string};
  drive: {
    files: {
      list(options?: object): Promise<any>;
      get(options?: object): Promise<any>;
      create(options?: object): Promise<any>;
    };
    about: {
      get(options?: object): Promise<any>;
    };
  };
}

interface WindowWithGAPI extends Window {
  gapi: {
    load(api: string, callback: () => void): void;
    client: GapiClient;
  };
  google: {
    accounts: {
      id: {
        initialize(options: object): void;
        prompt(callback?: (notification: object) => void): void;
        renderButton(element: HTMLElement, options: object): void;
      };
      oauth2: {
        initTokenClient(options: object): {
          requestAccessToken(options?: object): void;
        };
        revoke(token: string, callback?: () => void): void;
      };
    };
  };
}

declare global {
  interface Window extends WindowWithGAPI {}
}

// Empty export to make this a module
export {};
