import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('oneclass_token');
    const role = localStorage.getItem('oneclass_role');
    const fullName = localStorage.getItem('oneclass_name');
    const email = localStorage.getItem('oneclass_email');
    const userId = localStorage.getItem('oneclass_userId');
    return token ? { token, role, fullName, email, userId } : null;
  });

  const login = (authResponse) => {
    localStorage.setItem('oneclass_token', authResponse.token);
    localStorage.setItem('oneclass_role', authResponse.role);
    localStorage.setItem('oneclass_name', authResponse.fullName);
    if (authResponse.email) localStorage.setItem('oneclass_email', authResponse.email);
    if (authResponse.userId) localStorage.setItem('oneclass_userId', authResponse.userId);
    setAuth({
      token: authResponse.token,
      role: authResponse.role,
      fullName: authResponse.fullName,
      email: authResponse.email,
      userId: authResponse.userId,
    });
  };

  const logout = () => {
    localStorage.removeItem('oneclass_token');
    localStorage.removeItem('oneclass_role');
    localStorage.removeItem('oneclass_name');
    localStorage.removeItem('oneclass_email');
    localStorage.removeItem('oneclass_userId');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
