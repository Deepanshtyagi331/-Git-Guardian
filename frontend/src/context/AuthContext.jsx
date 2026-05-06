import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabase';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);     // Combined user object (Supabase + MongoDB profile)
  const [loading, setLoading] = useState(true);

  /**
   * Given a Supabase session, fetch the MongoDB profile from the backend
   * and merge it with Supabase user data into one unified user object.
   */
  const loadProfile = async (supabaseUser) => {
    if (!supabaseUser) {
      setUser(null);
      return;
    }

    try {
      const profile = await getMe(); // calls GET /api/auth/me (token is auto-attached)
      setUser({
        // Core identity from Supabase
        id: supabaseUser.id,
        email: supabaseUser.email,
        // Profile from MongoDB
        _id: profile._id,
        name: profile.name || supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
        isAdmin: profile.isAdmin || false,
        mfaEnabled: profile.mfaEnabled || false,
        githubUsername: profile.githubUsername,
        autoScanEnabled: profile.autoScanEnabled,
        autoScanInterval: profile.autoScanInterval,
        createdAt: profile.createdAt,
      });
    } catch (err) {
      // Backend might be down or user not yet synced — use Supabase data as fallback
      console.warn('[AuthContext] Could not load profile from backend:', err.message);
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.name || supabaseUser.email.split('@')[0],
        isAdmin: false,
        mfaEnabled: false,
      });
    }
  };

  // Sync auth state with Supabase session on mount and across tabs
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for sign-in / sign-out / token-refresh events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials) => {
    const data = await apiLogin(credentials); // calls supabase.auth.signInWithPassword
    return data;
  };

  const register = async (userData) => {
    const data = await apiRegister(userData); // calls supabase.auth.signUp
    return data;
  };

  const logout = async () => {
    await apiLogout(); // calls supabase.auth.signOut
    setUser(null);
  };

  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
