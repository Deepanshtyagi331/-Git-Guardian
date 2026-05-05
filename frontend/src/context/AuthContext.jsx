import { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, verifyMfaLogin as apiVerifyMfaLogin } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (userData) => {
    const data = await apiLogin(userData);
    if (!data.mfaRequired) {
      setUser(data);
    }
    return data;
  };

  const verifyMfaLogin = async (mfaData) => {
    const data = await apiVerifyMfaLogin(mfaData);
    setUser(data);
    return data;
  };

  const register = async (userData) => {
    const data = await apiRegister(userData);
    return data;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, verifyMfaLogin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
