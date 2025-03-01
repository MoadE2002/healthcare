import { useState } from "react";
import { useAuthContext } from './useAuthContext';

export const useSignup = () => { 
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { dispatch } = useAuthContext();

    const signup = async (formData) => { 
        setIsLoading(true); 
        setError(null); 

        try {
            const response = await fetch('http://localhost:8000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)  
            });

            const json = await response.json();

            if (!response.ok) { 
                setError(json.error);
                setIsLoading(false);
                return false;
            }

            // If signup is successful
            if (response.ok) { 
                // Optionally dispatch user to context or perform other actions
                dispatch({ type: 'LOGIN', payload: json });
                setIsLoading(false);
                return true;
            }
        } catch (err) {
            setError('Signup failed');
            setIsLoading(false);
            return false;
        }
    };

    return { signup, isLoading, error }; 
};