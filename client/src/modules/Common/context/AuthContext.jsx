// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axios/axios';
import { showToast } from '../toast/customToast';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get('/auth/user-info', {
          withCredentials: true,
        });
        if (response.data.user) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (credentials) => {
    const { email, phone, password } = credentials;
    const errors = {};

    if (!email && !phone) errors.identifier = 'Email or phone is required';
    if (!password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach((msg) => showToast('error', msg));
      throw new Error('Validation failed');
    }

    try {
      const payload = { password };
      if (email) payload.email = email;
      if (phone) payload.phone = phone;

      const response = await axiosInstance.post('/auth/login', payload, {
        withCredentials: true,
      });

      const user = response.data.user;
      setUser(user);

      const role = user.role.name;
      showToast('success', `${role.replace('_', ' ')} login successful`);
      navigate(`/${role.replace('_', '-')}-dashboard`, { replace: true });
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Login failed';
      showToast('error', errMsg);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout', {}, { withCredentials: true });
      setUser(null);
      showToast('success', 'Logged out successfully');
      navigate('/login');
    } catch (error) {
      showToast('error', 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };