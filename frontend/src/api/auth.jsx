import { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, getToken } from "./client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) return setLoading(false);
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { access_token } = await api.login(email, password);
    setToken(access_token);
    setUser(await api.me());
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  const isOfficer = user && (user.role === "officer" || user.role === "admin");

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isOfficer }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
