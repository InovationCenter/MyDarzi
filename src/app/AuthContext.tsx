import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthCredentials, AuthService, AuthUser } from '../services/auth';
import type { AnalyticsService } from '../services/analytics';

type AuthContextValue = {
  user: AuthUser | null;
  bootstrapping: boolean;
  authError: string | null;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  authService,
  analytics,
  children,
}: {
  authService: AuthService;
  analytics: AnalyticsService;
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await authService.getCurrentUser();
        if (!cancelled) {
          setUser(current);
          if (current) {
            await analytics.setUserId(current.id);
          }
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authService, analytics]);

  const signIn = useCallback(
    async (credentials: AuthCredentials) => {
      setAuthError(null);
      try {
        const next = await authService.signIn(credentials);
        setUser(next);
        await analytics.setUserId(next.id);
        await analytics.logEvent('login', { method: authService.provider });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign in failed.';
        setAuthError(message);
        throw error;
      }
    },
    [authService, analytics],
  );

  const signUp = useCallback(
    async (credentials: AuthCredentials) => {
      setAuthError(null);
      try {
        const next = await authService.signUp(credentials);
        setUser(next);
        await analytics.setUserId(next.id);
        await analytics.logEvent('sign_up', { method: authService.provider });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign up failed.';
        setAuthError(message);
        throw error;
      }
    },
    [authService, analytics],
  );

  const signOut = useCallback(async () => {
    setAuthError(null);
    await authService.signOut();
    setUser(null);
    await analytics.setUserId(null);
    await analytics.logEvent('logout');
  }, [authService, analytics]);

  const value = useMemo(
    () => ({
      user,
      bootstrapping,
      authError,
      signIn,
      signUp,
      signOut,
      clearError: () => setAuthError(null),
    }),
    [user, bootstrapping, authError, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
