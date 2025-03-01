"use client"
import React, { createContext, useContext, useState, useCallback } from 'react';
import Erreur from '../components/Erreur/Erreur';

const ErreurContext = createContext();

export const ErreurProvider = ({ children }) => {
  const [error, setError] = useState(null);

  const showError = useCallback((type, message) => {
    setError({ type, message });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ErreurContext.Provider value={{ showError, clearError }}>
      {children}
      {error && <Erreur type={error.type} message={error.message} />}
    </ErreurContext.Provider>
  );
};

export const useErreur = () => useContext(ErreurContext);


//const { showError } = useErreur(); // Use showError from the context
// to show showError('erreur', loginError || 'Login failed');
