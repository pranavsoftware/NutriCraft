declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
    getIdToken(forceRefresh?: boolean): Promise<string>;
    reload(): Promise<void>;
  }

  export interface ActionCodeSettings {
    url: string;
    handleCodeInApp?: boolean;
    iOS?: { bundleId: string };
    android?: { packageName: string; installApp?: boolean; minimumVersion?: string };
    dynamicLinkDomain?: string;
  }

  export interface UserCredential {
    user: User;
    providerId: string | null;
    operationType: string;
  }

  export interface Auth {
    currentUser: User | null;
  }

  export class GoogleAuthProvider {
    constructor();
    setCustomParameters(customOAuthParameters: Record<string, string>): void;
  }

  export function getAuth(app?: any): Auth;
  export function signInWithPopup(auth: Auth, provider: any): Promise<UserCredential>;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function sendEmailVerification(user: User, actionCodeSettings?: ActionCodeSettings | any): Promise<void>;
  export function sendPasswordResetEmail(auth: Auth, email: string, actionCodeSettings?: ActionCodeSettings | any): Promise<void>;
  export function verifyPasswordResetCode(auth: Auth, oobCode: string): Promise<string>;
  export function confirmPasswordReset(auth: Auth, oobCode: string, newPassword: string): Promise<void>;
  export function applyActionCode(auth: Auth, oobCode: string): Promise<void>;
  export function updateProfile(user: User, profile: { displayName?: string | null; photoURL?: string | null }): Promise<void>;
  export function signOut(auth: Auth): Promise<void>;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: (user: User | null) => void): () => void;
}
