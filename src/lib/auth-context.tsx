// src/lib/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { app } from './firebase';
import { toast } from 'sonner';

const auth = getAuth(app);

// Mock User for Dev Mode
const MOCK_USER: Partial<User> = {
    uid: 'dev-user-123',
    displayName: 'Dev User',
    email: 'dev@example.com',
    photoURL: '',
    emailVerified: true
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isDevMode?: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // Check for dev mode flag in localStorage or env (environment variable is safer but not dynamic per user)
    // For this demo, let's allow a toggle or just detect localhost?
    // Actually, handling the auth/popup-closed issue implies we might WANT to fallback to mock auth if real auth fails.
    
    // Real Auth Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.warn("Sign-in popup closed.");
        
        // DEV MODE FALLBACK
        // If we are in a dev environment and auth fails (likely due to popup restrictions),
        // we can offer a "Dev Login" fallback.
        if (process.env.NODE_ENV === 'development') {
            const useDev = confirm("Google Sign-In was cancelled or blocked. Do you want to enable DEV MODE and sign in as a mock user?");
            if (useDev) {
                setIsDevMode(true);
                setUser(MOCK_USER as User);
                toast.success("Signed in (Dev Mode)");
                return;
            }
        }
        
        toast("Sign-in cancelled");
        return;
      }
      
      console.error("Error signing in with Google", error);
      toast.error("Failed to sign in. Please try again.");
    }
  };

  const signOut = async () => {
    if (isDevMode) {
        setIsDevMode(false);
        setUser(null);
        toast.success("Signed out (Dev Mode)");
        return;
    }

    try {
      await firebaseSignOut(auth);
      toast.success("Signed out");
    } catch (error) {
      console.error("Error signing out", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, isDevMode }}>
      {children}
    </AuthContext.Provider>
  );
};
