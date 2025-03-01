import { useState } from 'react';
import axios from 'axios';
import { useAuthContext } from './useAuthContext';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const { dispatch } = useAuthContext();
  const router = useRouter();

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    setIsVerified(true);

    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email,
        password
      }, {
        withCredentials: true
      });

      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        dispatch({ type: 'LOGIN', payload: response.data });

        setIsVerified(response.data.isverified !== false);

        if (response.data.role === 'DOCTOR') {
          if (response.data.doctorId && !response.data.accepted) {    
              router.push('/verification');
              return false;
          }else if (response.data.doctorId && !response.data.haveEducations){
            router.push('/doctor/aboutme');
              return true ; 
          }
        }

        router.push('/home');

        setIsLoading(false);
        return true; 
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      
      // Check if the error is specifically about unverified account
      if (errorMessage === 'Account not verified. A new verification email has been sent.') {
        setError(errorMessage);
        setIsVerified(false);
      }

      setIsLoading(false);
      return false; 
    }
  };

  return { login, error, isLoading, isVerified };
};