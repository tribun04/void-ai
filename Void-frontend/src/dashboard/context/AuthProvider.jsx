// src/context/AuthProvider.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        const decodedUser = jwtDecode(storedToken);
        setUser(decodedUser);
        setToken(storedToken);
      }
    } catch (error) {
      localStorage.removeItem('token');
      console.error('Invalid token, clearing.', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {  // Ensure correct URL
        email,
        password,
      });

      const { token: newToken, tenantId } = response.data;  // Extract token and tenantId
      // Validate tenantId

      localStorage.setItem('token', newToken);
      setToken(newToken);
      const decodedUser = jwtDecode(newToken);
      setUser({ ...decodedUser, tenantId: tenantId }); //Add tenantId to the user to be saved for AITraining
      return { ...decodedUser, tenantId: tenantId };  // Return tenantId so that AITraining can access it

    } catch (error) {
      logout();
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};