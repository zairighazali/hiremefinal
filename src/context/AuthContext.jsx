import { createContext, useEffect, useRef, useState } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { authFetch } from "../services/api";

const AuthContext = createContext();

export { AuthContext };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const syncedRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      syncedRef.current = false; // reset on auth change
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const syncUser = async () => {
      if (!user || syncedRef.current) return;

      try {
        await user.getIdToken(); 
        await authFetch("/users/me", { method: "POST" });
        syncedRef.current = true;
      } catch (err) {
        console.error("User sync failed:", err);
      }
    };

    syncUser();
  }, [user]);

  const logout = async () => {
    syncedRef.current = false;
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
