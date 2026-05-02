import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessToken: null,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('executive_access_token');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.token && parsed.expiresAt > Date.now()) {
          return parsed.token;
        }
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      import('firebase/auth').then(({ GoogleAuthProvider }) => {
         const credential = GoogleAuthProvider.credentialFromResult(result);
         if (credential && credential.accessToken) {
           setAccessToken(credential.accessToken);
           localStorage.setItem('executive_access_token', JSON.stringify({
             token: credential.accessToken,
             expiresAt: Date.now() + 3500 * 1000 // 58 minutes buffer
           }));
         }
      });
    } catch (error: any) {
      console.error('Error signing in:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        alert("Sign-in popup was closed before completing. Please try again.");
      } else if (error.code === 'auth/network-request-failed') {
        alert("A network error occurred. Please check your internet connection or try disabling any ad-blockers/privacy extensions that might be blocking the Google Sign-In popup. If you are in the editor preview, try opening the app in a new tab.");
      } else {
        alert("An error occurred during sign-in: " + error.message);
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setAccessToken(null);
    localStorage.removeItem('executive_access_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, accessToken, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
