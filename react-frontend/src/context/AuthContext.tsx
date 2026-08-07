import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import * as api from "../api/client";

const TOKEN_KEY = "ald_token";
const EMAIL_KEY = "ald_email";

interface AuthContextValue {
  token: string | null;
  advocateEmail: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [advocateEmail, setAdvocateEmail] = useState<string | null>(() =>
    localStorage.getItem(EMAIL_KEY),
  );

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    localStorage.setItem(TOKEN_KEY, result.access_token);
    localStorage.setItem(EMAIL_KEY, email);
    setToken(result.access_token);
    setAdvocateEmail(email);
  }, []);

  const signup = useCallback(async (fullName: string, email: string, password: string) => {
    await api.signup(fullName, email, password);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setToken(null);
    setAdvocateEmail(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, advocateEmail, isAuthenticated: !!token, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
