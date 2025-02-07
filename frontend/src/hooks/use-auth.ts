import { type User, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../config/firebase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInAnonymousUser = async () => {
    try {
      setError(null);
      const result = await signInAnonymously(auth);
      setUser(result.user);
      return result.user;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during sign in");
      return null;
    }
  };

  const getIdToken = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }
    return await currentUser.getIdToken();
  };

  return {
    user,
    loading,
    error,
    signInAnonymousUser,
    getIdToken,
  };
};
