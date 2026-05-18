"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { getUserProfile, UserProfile } from "@/lib/services/user-service";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Keep a ref to the profile listener so we can clean it up when the user changes
  const profileUnsubRef = useRef<(() => void) | null>(null);

  const refreshProfile = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const updated = await getUserProfile(currentUser.uid);
    setProfile(updated);
  }, []);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Tear down the previous real-time profile listener (if any)
      if (profileUnsubRef.current) {
        profileUnsubRef.current();
        profileUnsubRef.current = null;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        // Bootstrap: check/create the Firestore profile once
        await getUserProfile(firebaseUser.uid);

        // Then subscribe to the user doc for real-time updates
        // (admin edits, role changes, etc. will update the context immediately)
        const profileUnsub = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              setProfile(snap.data() as UserProfile);
            } else {
              setProfile(null);
            }
            setIsLoading(false);
          },
          () => {
            // On error fall back gracefully
            setIsLoading(false);
          }
        );
        profileUnsubRef.current = profileUnsub;
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsubRef.current) profileUnsubRef.current();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
